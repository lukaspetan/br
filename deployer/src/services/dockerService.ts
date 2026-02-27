import Docker from 'dockerode';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface BuildResult {
  success: boolean;
  logs: string;
  imageId?: string;
}

interface ContainerResult {
  success: boolean;
  logs: string;
  containerId?: string;
  port?: number;
}

interface FileStructure {
  [key: string]: string | FileStructure;
}

export class DockerService {
  private docker: Docker;
  private networkName = 'vortex44-apps';
  private basePort = 31000;

  constructor() {
    const dockerHost = process.env.DOCKER_HOST || process.env.DOCKER_HOST_IP || 'localhost';
    const dockerPort = parseInt(process.env.DOCKER_PORT || '2375');
    
    if (process.env.DOCKER_HOST || process.env.DOCKER_HOST_IP) {
      this.docker = new Docker({
        host: dockerHost,
        port: dockerPort,
      });
    } else {
      this.docker = new Docker();
    }
  }

  async ensureNetwork(): Promise<void> {
    try {
      const networks = await this.docker.listNetworks();
      const exists = networks.some(n => n.Name === this.networkName);
      
      if (!exists) {
        await this.docker.createNetwork({
          Name: this.networkName,
          Driver: 'bridge',
        });
        console.log(`Created network: ${this.networkName}`);
      }
    } catch (error: any) {
      console.error('Network creation error:', error.message);
    }
  }

  async buildContainer(
    deploymentId: string,
    files: FileStructure,
    subdomain: string
  ): Promise<BuildResult> {
    const workDir = path.join(os.tmpdir(), `vortex44-build-${deploymentId}`);
    
    try {
      await fs.promises.mkdir(workDir, { recursive: true });
      
      await this.writeFiles(files, workDir);

      const dockerfile = this.generateDockerfile(files);
      await fs.promises.writeFile(path.join(workDir, 'Dockerfile'), dockerfile);

      console.log(`Building container for ${subdomain}...`);
      
      const imageName = `vortex44/app-${deploymentId}:latest`;

      const buildLogs: string[] = [];

      await new Promise<void>((resolve, reject) => {
        this.docker.buildImage(
          {
            context: workDir,
            src: ['.'],
          },
          { t: imageName, rm: true },
          (err: any, stream: NodeJS.ReadableStream) => {
            if (err) {
              buildLogs.push(`Build error: ${err.message}`);
              reject(err);
              return;
            }

            if (stream) {
              stream.on('data', (chunk: Buffer) => {
                buildLogs.push(chunk.toString());
              });

              stream.on('end', () => {
                resolve();
              });
            } else {
              resolve();
            }
          }
        );
      });

      const images = await this.docker.listImages({ filters: { reference: [imageName] } });
      const imageId = images[0]?.Id;

      await fs.promises.rm(workDir, { recursive: true, force: true });

      return {
        success: true,
        logs: buildLogs.join('\n'),
        imageId,
      };
    } catch (error: any) {
      await this.cleanup(workDir);
      
      return {
        success: false,
        logs: `Build failed: ${error.message}`,
      };
    }
  }

  private async writeFiles(files: FileStructure, basePath: string): Promise<void> {
    for (const [name, content] of Object.entries(files)) {
      const filePath = path.join(basePath, name);

      if (typeof content === 'object') {
        await fs.promises.mkdir(filePath, { recursive: true });
        await this.writeFiles(content, filePath);
      } else {
        const dir = path.dirname(filePath);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(filePath, content);
      }
    }
  }

  private generateDockerfile(files: FileStructure): string {
    const hasReact = this.hasFile(files, 'package.json') && 
                     this.getFileContent(files, 'package.json')?.includes('react');
    const hasExpress = this.getFileContent(files, 'server/package.json')?.includes('express');

    if (hasExpress) {
      return `FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

COPY server/ .

EXPOSE 3000

CMD ["node", "index.js"]
`;
    }

    if (hasReact) {
      return `FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`;
    }

    return `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server/index.js"]
`;
  }

  private hasFile(files: FileStructure, path: string): boolean {
    const parts = path.split('/');
    let current: any = files;
    
    for (const part of parts) {
      if (!current[part]) return false;
      current = current[part];
    }
    
    return typeof current === 'string';
  }

  private getFileContent(files: FileStructure, path: string): string | null {
    const parts = path.split('/');
    let current: any = files;
    
    for (const part of parts) {
      if (!current[part]) return null;
      current = current[part];
    }
    
    return typeof current === 'string' ? current : null;
  }

  async runContainer(
    deploymentId: string,
    subdomain: string,
    imageId: string
  ): Promise<ContainerResult> {
    await this.ensureNetwork();

    const port = this.basePort + Math.floor(Math.random() * 1000);
    const containerName = `vortex44-${deploymentId}`;

    try {
      const existing = await this.docker.listContainers({
        all: true,
        filters: { name: [containerName] },
      });

      if (existing.length > 0) {
        const container = this.docker.getContainer(existing[0].Id);
        await container.remove({ force: true });
      }

      const container = await this.docker.createContainer({
        Image: imageId,
        name: containerName,
        Env: [
          `SUBDOMAIN=${subdomain}`,
          `PORT=80`,
        ],
        HostConfig: {
          PortBindings: {
            '80/tcp': [{ HostPort: port.toString() }],
          },
          NetworkMode: this.networkName,
          Memory: 512 * 1024 * 1024,
          CPUQuota: 50000,
        },
        Labels: {
          'vortex44.deployment': deploymentId,
          'vortex44.subdomain': subdomain,
        },
      });

      await container.start();

      console.log(`Container ${containerName} running on port ${port}`);

      return {
        success: true,
        logs: `Container started on port ${port}`,
        containerId: container.id,
        port,
      };
    } catch (error: any) {
      return {
        success: false,
        logs: `Failed to run container: ${error.message}`,
      };
    }
  }

  async stopContainer(deploymentId: string): Promise<void> {
    const containerName = `vortex44-${deploymentId}`;
    
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: { name: [containerName] },
      });

      if (containers.length > 0) {
        const container = this.docker.getContainer(containers[0].Id);
        
        if (containers[0].State === 'running') {
          await container.stop();
        }
        
        await container.remove({ force: true });
        console.log(`Container ${containerName} stopped and removed`);
      }
    } catch (error: any) {
      console.error('Stop container error:', error.message);
    }
  }

  async getContainerLogs(deploymentId: string): Promise<string> {
    const containerName = `vortex44-${deploymentId}`;
    
    try {
      const containers = await this.docker.listContainers({
        filters: { name: [containerName] },
      });

      if (containers.length === 0) {
        return 'No container found';
      }

      const container = this.docker.getContainer(containers[0].Id);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 100,
      });

      return logs.toString();
    } catch (error: any) {
      return `Error getting logs: ${error.message}`;
    }
  }

  private async cleanup(dir: string): Promise<void> {
    try {
      await fs.promises.rm(dir, { recursive: true, force: true });
    } catch (error: any) {
      console.error('Cleanup error:', error.message);
    }
  }
}

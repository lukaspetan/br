import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

interface Deployment {
  id: string;
  projectId: string;
  subdomain: string;
  status: string;
  imageId?: string;
}

interface FileStructure {
  [key: string]: string | FileStructure;
}

export class BuildService {
  private s3Client: S3Client;
  private bucketName: string;
  private deployments: Map<string, Deployment> = new Map();

  constructor() {
    this.s3Client = new S3Client({
      endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'vortex44',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'vortex44',
      },
      forcePathStyle: true,
    });

    this.bucketName = process.env.MINIO_BUCKET || 'vortex44-projects';
  }

  async getDeployment(deploymentId: string): Promise<Deployment | null> {
    return this.deployments.get(deploymentId) || null;
  }

  async getPreviousDeployment(projectId: string): Promise<Deployment | null> {
    for (const [, deployment] of this.deployments) {
      if (deployment.projectId === projectId && deployment.status === 'active') {
        return deployment;
      }
    }
    return null;
  }

  async updateStatus(
    deploymentId: string,
    status: string,
    logs: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    
    if (deployment) {
      deployment.status = status;
      if (metadata?.imageId) {
        deployment.imageId = metadata.imageId;
      }
    }

    console.log(`Deployment ${deploymentId}: ${status}`);
    
    if (status === 'failed') {
      console.error(`Build failed:\n${logs}`);
    }
  }

  async getProjectCode(projectId: string): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `projects/${projectId}/code.json`,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      const data = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
      return data.code || null;
    } catch (error: any) {
      console.error('Error getting project code:', error.message);
      return null;
    }
  }

  extractFiles(codeJson: string): FileStructure {
    try {
      const parsed = JSON.parse(codeJson);
      
      if (parsed.files && Array.isArray(parsed.files)) {
        const files: FileStructure = {};
        
        for (const file of parsed.files) {
          const pathParts = file.path.split('/');
          let current: any = files;
          
          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
          
          current[pathParts[pathParts.length - 1]] = file.content;
        }
        
        return files;
      }

      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as FileStructure;
      }

      return { 'index.html': codeJson };
    } catch (error: any) {
      console.error('Error parsing code:', error.message);
      return { 'index.html': codeJson };
    }
  }

  registerDeployment(deployment: Deployment): void {
    this.deployments.set(deployment.id, deployment);
  }
}

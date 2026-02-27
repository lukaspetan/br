import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Deployment, DeploymentStatus } from './entities/deployment.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeploymentsService {
  private readonly deployerUrl: string;

  constructor(
    @InjectRepository(Deployment)
    private readonly deploymentRepository: Repository<Deployment>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.deployerUrl = this.configService.get('DEPLOYER_URL') || 'http://localhost:3002';
  }

  async createDeployment(projectId: string, subdomain: string): Promise<Deployment> {
    const existingActiveDeployment = await this.deploymentRepository.findOne({
      where: { projectId, status: 'active' },
    });

    const version = existingActiveDeployment ? existingActiveDeployment.version + 1 : 1;

    const deployment = this.deploymentRepository.create({
      projectId,
      subdomain,
      version,
      status: 'pending',
    });

    const savedDeployment = await this.deploymentRepository.save(deployment);

    try {
      await this.triggerBuild(savedDeployment.id);
    } catch (error) {
      savedDeployment.status = 'failed';
      savedDeployment.buildLogs = `Failed to trigger build: ${error.message}`;
      await this.deploymentRepository.save(savedDeployment);
    }

    return savedDeployment;
  }

  async findByProject(projectId: string): Promise<Deployment[]> {
    return this.deploymentRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Deployment> {
    const deployment = await this.deploymentRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    
    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }
    
    return deployment;
  }

  async getDeploymentLogs(id: string): Promise<{ logs: string }> {
    const deployment = await this.findById(id);
    return { logs: deployment.buildLogs || '' };
  }

  async rollback(deploymentId: string): Promise<Deployment> {
    const currentDeployment = await this.findById(deploymentId);
    
    if (!currentDeployment.projectId) {
      throw new NotFoundException('Deployment not found');
    }

    const previousDeployment = await this.deploymentRepository.findOne({
      where: { 
        projectId: currentDeployment.projectId,
        status: 'active',
      },
      order: { version: 'DESC' },
    });

    if (!previousDeployment) {
      throw new NotFoundException('No previous deployment to rollback to');
    }

    previousDeployment.status = 'rolled_back';
    await this.deploymentRepository.save(previousDeployment);

    return previousDeployment;
  }

  async updateStatus(id: string, status: DeploymentStatus, logs?: string, metadata?: Record<string, any>): Promise<Deployment> {
    const deployment = await this.findById(id);
    
    deployment.status = status;
    if (logs) {
      deployment.buildLogs = logs;
    }
    if (metadata) {
      deployment.buildMetadata = metadata;
    }
    if (status === 'active' && metadata?.url) {
      deployment.url = metadata.url;
    }

    return this.deploymentRepository.save(deployment);
  }

  private async triggerBuild(deploymentId: string): Promise<void> {
    try {
      await this.httpService.axiosRef.post(`${this.deployerUrl}/deployments/${deploymentId}/build`);
    } catch (error) {
      console.error('Failed to trigger deployer:', error.message);
      throw error;
    }
  }
}

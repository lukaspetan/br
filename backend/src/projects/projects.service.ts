import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { AiService } from '../ai/ai.service';
import { StorageService } from '../storage/storage.service';
import { DeploymentsService } from '../deployments/deployments.service';
import { CreateProjectDto, UpdateProjectDto, GenerateCodeDto } from './dto/project.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly aiService: AiService,
    private readonly storageService: StorageService,
    private readonly deploymentsService: DeploymentsService,
  ) {}

  async create(ownerId: string, createProjectDto: CreateProjectDto): Promise<Project> {
    const subdomain = this.generateSubdomain(createProjectDto.name);
    
    const project = this.projectRepository.create({
      ...createProjectDto,
      ownerId,
      subdomain,
      status: 'draft',
    });

    return this.projectRepository.save(project);
  }

  async findAllByUser(ownerId: string): Promise<Project[]> {
    return this.projectRepository.find({
      where: { ownerId },
      relations: ['deployments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['owner', 'deployments'],
    });
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findById(id);
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async delete(id: string): Promise<void> {
    const project = await this.findById(id);
    await this.projectRepository.remove(project);
  }

  async generateCode(projectId: string, generateDto: GenerateCodeDto): Promise<Project> {
    const project = await this.findById(projectId);
    
    project.status = 'building';
    await this.projectRepository.save(project);

    try {
      const generatedCode = await this.aiService.generateCode(
        generateDto.prompt,
        project,
      );

      const storedPath = await this.storageService.storeProjectCode(
        projectId,
        generatedCode,
      );

      project.generatedCode = storedPath;
      project.metadata = {
        ...project.metadata,
        lastGenerationPrompt: generateDto.prompt,
        lastGeneratedAt: new Date().toISOString(),
      };
      project.status = 'draft';
      
      return this.projectRepository.save(project);
    } catch (error) {
      project.status = 'error';
      await this.projectRepository.save(project);
      throw new BadRequestException(`Code generation failed: ${error.message}`);
    }
  }

  async editCode(projectId: string, code: string): Promise<Project> {
    const project = await this.findById(projectId);
    
    const storedPath = await this.storageService.storeProjectCode(projectId, code);
    project.generatedCode = storedPath;
    
    return this.projectRepository.save(project);
  }

  async publish(projectId: string, userId: string): Promise<Project> {
    const project = await this.findById(projectId);
    
    if (project.ownerId !== userId) {
      throw new BadRequestException('You can only publish your own projects');
    }

    if (!project.generatedCode) {
      throw new BadRequestException('Project has no code to publish. Generate code first.');
    }

    project.status = 'building';
    await this.projectRepository.save(project);

    try {
      const deployment = await this.deploymentsService.createDeployment(
        projectId,
        project.subdomain,
      );

      project.status = 'deployed';
      project.publishedUrl = `https://${project.subdomain}.vortex44.com`;
      project.metadata = {
        ...project.metadata,
        lastDeploymentId: deployment.id,
        lastDeployedAt: new Date().toISOString(),
      };

      return this.projectRepository.save(project);
    } catch (error) {
      project.status = 'error';
      await this.projectRepository.save(project);
      throw new BadRequestException(`Deployment failed: ${error.message}`);
    }
  }

  async getCode(projectId: string): Promise<string> {
    const project = await this.findById(projectId);
    
    if (!project.generatedCode) {
      throw new NotFoundException('No code generated for this project');
    }

    return this.storageService.getProjectCode(project.generatedCode);
  }

  private generateSubdomain(name: string): string {
    const sanitized = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    const uniqueSuffix = uuidv4().substring(0, 8);
    return `${sanitized}-${uniqueSuffix}`;
  }
}

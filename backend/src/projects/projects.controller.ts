import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto, UpdateProjectDto, GenerateCodeDto, EditCodeDto } from './dto/project.dto';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async create(@Req() req: any, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user projects' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  async findAll(@Req() req: any) {
    return this.projectsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  async remove(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate code using AI' })
  @ApiResponse({ status: 200, description: 'Code generated successfully' })
  @ApiResponse({ status: 400, description: 'Generation failed' })
  async generateCode(@Param('id') id: string, @Body() generateDto: GenerateCodeDto) {
    return this.projectsService.generateCode(id, generateDto);
  }

  @Put(':id/code')
  @ApiOperation({ summary: 'Edit project code manually' })
  @ApiResponse({ status: 200, description: 'Code updated' })
  async editCode(@Param('id') id: string, @Body() editCodeDto: EditCodeDto) {
    return this.projectsService.editCode(id, editCodeDto.code);
  }

  @Get(':id/code')
  @ApiOperation({ summary: 'Get project code' })
  @ApiResponse({ status: 200, description: 'Project code' })
  async getCode(@Param('id') id: string) {
    const code = await this.projectsService.getCode(id);
    return { code };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish project to production' })
  @ApiResponse({ status: 200, description: 'Project published' })
  @ApiResponse({ status: 400, description: 'Publish failed' })
  async publish(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.publish(id, req.user.id);
  }
}

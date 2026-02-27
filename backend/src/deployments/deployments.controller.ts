import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeploymentsService } from './deployments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Deployments')
@Controller('deployments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all deployments for a project' })
  @ApiResponse({ status: 200, description: 'List of deployments' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.deploymentsService.findByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deployment by ID' })
  @ApiResponse({ status: 200, description: 'Deployment details' })
  async findOne(@Param('id') id: string) {
    return this.deploymentsService.findById(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get deployment logs' })
  @ApiResponse({ status: 200, description: 'Build logs' })
  async getLogs(@Param('id') id: string) {
    return this.deploymentsService.getDeploymentLogs(id);
  }

  @Post(':id/rollback')
  @ApiOperation({ summary: 'Rollback to previous deployment' })
  @ApiResponse({ status: 200, description: 'Rollback successful' })
  async rollback(@Param('id') id: string) {
    return this.deploymentsService.rollback(id);
  }
}

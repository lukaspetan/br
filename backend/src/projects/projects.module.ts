import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';
import { DeploymentsModule } from '../deployments/deployments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    AiModule,
    StorageModule,
    DeploymentsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

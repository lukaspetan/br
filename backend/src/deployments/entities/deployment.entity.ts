import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Project } from '../projects/entities/project.entity';

export type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'active' | 'failed' | 'rolled_back';

@Entity('deployments')
export class Deployment {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.deployments)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ApiProperty()
  @Column()
  subdomain: string;

  @ApiProperty({ enum: ['pending', 'building', 'deploying', 'active', 'failed', 'rolled_back'] })
  @Column({ default: 'pending' })
  status: DeploymentStatus;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  url: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  containerId: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  buildLogs: string;

  @ApiPropertyOptional()
  @Column({ type: 'jsonb', nullable: true })
  buildMetadata: Record<string, any>;

  @ApiPropertyOptional()
  @Column({ default: 1 })
  version: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { Deployment } from '../deployments/entities/deployment.entity';

export type ProjectStatus = 'draft' | 'building' | 'deployed' | 'error';
export type ProjectType = 'saas' | 'website' | 'api' | 'dashboard';

@Entity('projects')
export class Project {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  description: string;

  @ApiProperty({ enum: ['saas', 'website', 'api', 'dashboard'] })
  @Column({ default: 'saas' })
  type: ProjectType;

  @ApiProperty({ enum: ['draft', 'building', 'deployed', 'error'] })
  @Column({ default: 'draft' })
  status: ProjectStatus;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  generatedCode: string;

  @ApiProperty()
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  subdomain: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  customDomain: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  publishedUrl: string;

  @ApiProperty()
  @Column()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Deployment, (deployment) => deployment.project)
  deployments: Deployment[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

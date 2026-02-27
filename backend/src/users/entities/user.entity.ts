import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Project } from '../projects/entities/project.entity';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  password: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  avatar: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  googleId: string;

  @ApiProperty({ enum: ['free', 'pro', 'enterprise'] })
  @Column({ default: 'free' })
  plan: 'free' | 'pro' | 'enterprise';

  @ApiPropertyOptional()
  @Column({ nullable: true })
  stripeCustomerId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];
}

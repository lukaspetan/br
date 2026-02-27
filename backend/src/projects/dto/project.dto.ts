import { IsString, IsEnum, IsOptional, IsObject, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'My SaaS App' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'A SaaS platform for managing tasks' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: ['saas', 'website', 'api', 'dashboard'] })
  @IsOptional()
  @IsEnum(['saas', 'website', 'api', 'dashboard'])
  type?: 'saas' | 'website' | 'api' | 'dashboard';
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['saas', 'website', 'api', 'dashboard'] })
  @IsOptional()
  @IsEnum(['saas', 'website', 'api', 'dashboard'])
  type?: 'saas' | 'website' | 'api' | 'dashboard';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GenerateCodeDto {
  @ApiProperty({ 
    example: 'Create a SaaS for task management with user authentication, dashboard, and real-time updates',
    description: 'Natural language description of the desired application'
  })
  @IsString()
  @MinLength(10)
  prompt: string;

  @ApiPropertyOptional({ description: 'Additional configuration options' })
  @IsOptional()
  @IsObject()
  options?: {
    framework?: string;
    database?: string;
    styling?: string;
    features?: string[];
  };
}

export class EditCodeDto {
  @ApiProperty({ description: 'The complete code for the project' })
  @IsString()
  code: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProjectResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  status!: string;
  createdAt!: Date;

  static from(project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
  }) {
    const dto = new ProjectResponseDto();
    dto.id = project.id;
    dto.name = project.name;
    dto.description = project.description;
    dto.status = project.status;
    dto.createdAt = project.createdAt;
    return dto;
  }
}

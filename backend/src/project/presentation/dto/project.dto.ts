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
  keysCount!: number;
  languages!: { code: string; isDefault: boolean }[];

  static from(project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
    _count?: { translationKeys: number };
    languages?: { code: string; isDefault: boolean }[];
  }) {
    const dto = new ProjectResponseDto();
    dto.id = project.id;
    dto.name = project.name;
    dto.description = project.description;
    dto.status = project.status;
    dto.createdAt = project.createdAt;
    dto.keysCount = project._count?.translationKeys ?? 0;
    dto.languages = project.languages ?? [];
    return dto;
  }
}

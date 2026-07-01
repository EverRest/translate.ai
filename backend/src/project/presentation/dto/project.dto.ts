import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DomainProfile } from '../../../shared/domain/domain-profile.types';
import { parseDomainProfile } from '../../../shared/domain/domain-profile.utils';
import { DomainProfileDto } from './domain-profile.dto';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: DomainProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DomainProfileDto)
  domainProfile?: DomainProfileDto;
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

  @ApiPropertyOptional({ type: DomainProfileDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => DomainProfileDto)
  domainProfile?: DomainProfileDto | null;
}

const COPY_SETTINGS_INCLUDE = ['domainProfile', 'glossary'] as const;

export class CopyProjectSettingsDto {
  @ApiProperty()
  @IsUUID()
  sourceProjectId!: string;

  @ApiProperty({ enum: COPY_SETTINGS_INCLUDE, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(COPY_SETTINGS_INCLUDE, { each: true })
  include!: ('domainProfile' | 'glossary')[];
}

export class ProjectResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  domainProfile!: DomainProfile | null;
  status!: string;
  createdAt!: Date;
  keysCount!: number;
  languages!: { code: string; isDefault: boolean }[];

  static from(project: {
    id: string;
    name: string;
    description: string | null;
    domainProfile?: unknown;
    status: string;
    createdAt: Date;
    _count?: { translationKeys: number };
    languages?: { code: string; isDefault: boolean }[];
  }) {
    const dto = new ProjectResponseDto();
    dto.id = project.id;
    dto.name = project.name;
    dto.description = project.description;
    dto.domainProfile = parseDomainProfile(project.domainProfile);
    dto.status = project.status;
    dto.createdAt = project.createdAt;
    dto.keysCount = project._count?.translationKeys ?? 0;
    dto.languages = project.languages ?? [];
    return dto;
  }
}

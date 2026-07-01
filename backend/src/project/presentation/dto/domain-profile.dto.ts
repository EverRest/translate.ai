import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class DomainProfileDto {
  @ApiPropertyOptional({ example: 'sports' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  domain?: string;

  @ApiPropertyOptional({ example: 'FIFA World Cup 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  event?: string;

  @ApiPropertyOptional({ example: 'formal' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tone?: string;

  @ApiPropertyOptional({ example: 'accreditation' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  audience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    example: { fr: 'Use official FIFA French terminology' },
  })
  @IsOptional()
  @IsObject()
  localeNotes?: Record<string, string>;
}

export class UpdateDomainProfileDto {
  @ApiPropertyOptional({ type: DomainProfileDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => DomainProfileDto)
  domainProfile?: DomainProfileDto | null;
}

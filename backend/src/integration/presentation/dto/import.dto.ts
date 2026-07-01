import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ParseRulesDto } from './confluence.dto';

export class PasteImportDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  html!: string;

  @ApiPropertyOptional({ type: ParseRulesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ParseRulesDto)
  parseRules?: ParseRulesDto;
}

export class CreateImportFileDto {
  @ApiPropertyOptional({
    description: 'JSON string of ParseRules (columnMapping)',
  })
  @IsOptional()
  @IsString()
  parseRulesJson?: string;
}

export class ApplyImportSessionDto {
  @ApiPropertyOptional({ enum: ['skip', 'update'] })
  @IsOptional()
  @IsIn(['skip', 'update'])
  conflictStrategy?: 'skip' | 'update';
}

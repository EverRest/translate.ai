import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class PreviewExcelImportDto {
  @ApiPropertyOptional({
    description: 'JSON string of ExcelParseRules (preset, columnMapping)',
  })
  @IsOptional()
  @IsString()
  parseRulesJson?: string;
}

export class DeltaTranslateExcelDto {
  @ApiPropertyOptional({
    description: 'Target language codes to fill (default: all empty columns)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'AI provider override' })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class ExcelImportProfileDto {
  @ApiPropertyOptional({ enum: ['wiz_classic', 'custom'] })
  @IsIn(['wiz_classic', 'custom'])
  preset!: 'wiz_classic' | 'custom';

  @ApiPropertyOptional()
  @IsOptional()
  columnMapping?: {
    fieldId?: string;
    scope?: string;
    key?: string;
    sourceLang?: string;
    targetLangColumns?: Record<string, string>;
  };
}

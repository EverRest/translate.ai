import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ConfluenceOAuthCallbackDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  state!: string;
}

export class ColumnMappingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hints?: string;
}

export class ParseRulesDto {
  @ApiPropertyOptional({ type: ColumnMappingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ColumnMappingDto)
  columnMapping?: ColumnMappingDto;
}

export class UpdateConfluenceSyncConfigDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  pageIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  spaceKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  labelFilter?: string | null;

  @ApiPropertyOptional({ type: ParseRulesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ParseRulesDto)
  parseRulesJson?: ParseRulesDto | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Sync interval in minutes' })
  @IsOptional()
  @IsInt()
  @Min(15)
  syncIntervalMinutes?: number | null;
}

export class TriggerConfluenceSyncDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;
}

export class CompleteConfluenceConnectDto {
  @ApiProperty()
  @IsString()
  pendingToken!: string;

  @ApiProperty()
  @IsString()
  cloudId!: string;
}

export class UpsertTenantAtlassianOAuthDto {
  @ApiProperty()
  @IsString()
  clientId!: string;

  @ApiProperty()
  @IsString()
  clientSecret!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  redirectUri?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopes?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class ConfluenceOAuthCallbackDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  state!: string;
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
}

export class TriggerConfluenceSyncDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;
}

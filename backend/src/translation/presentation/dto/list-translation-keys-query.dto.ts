import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListTranslationKeysQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ example: 'checkout' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  localizationObjectId?: string;

  @ApiPropertyOptional({ example: 'cart.' })
  @IsOptional()
  @IsString()
  keyPrefix?: string;

  @ApiPropertyOptional({
    example: 'true',
    description:
      'When `true` or `1`, return only keys with at least one stale translation',
  })
  @IsOptional()
  @IsIn(['true', 'false', '1', '0'])
  staleOnly?: string;
}

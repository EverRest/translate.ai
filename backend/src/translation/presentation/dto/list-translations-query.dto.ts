import { ApiPropertyOptional } from '@nestjs/swagger';
import { TranslationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListTranslationsQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '100' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ enum: TranslationStatus })
  @IsOptional()
  @IsEnum(TranslationStatus)
  status?: TranslationStatus;

  @ApiPropertyOptional({
    example: 'cart.checkout,cart.total',
    description: 'Comma-separated key names',
  })
  @IsOptional()
  @IsString()
  keys?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  localizationObjectId?: string;

  @ApiPropertyOptional({ example: 'cart.' })
  @IsOptional()
  @IsString()
  keyPrefix?: string;
}

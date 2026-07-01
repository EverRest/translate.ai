import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { VALID_CONTENT_TYPES } from '../../application/utils/translation-context.utils';

export class CreateTranslationKeyDto {
  @ApiProperty({ example: 'cart.checkout' })
  @IsString()
  @MinLength(1)
  key!: string;

  @ApiProperty({ example: 'Checkout' })
  @IsString()
  @MinLength(1)
  sourceText!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ enum: VALID_CONTENT_TYPES, example: 'ui' })
  @IsOptional()
  @IsString()
  @IsIn(VALID_CONTENT_TYPES)
  contentType?: string;
}

export class BulkImportKeyItemDto {
  @ApiProperty({ example: 'field_123' })
  @IsString()
  @MinLength(1)
  key!: string;

  @ApiProperty({ example: 'First Name' })
  @IsString()
  @MinLength(1)
  sourceText!: string;
}

export class BulkImportKeysDto {
  @ApiProperty({ type: [BulkImportKeyItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportKeyItemDto)
  keys!: BulkImportKeyItemDto[];
}

export class UpdateTranslationKeyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ enum: VALID_CONTENT_TYPES, example: 'ui' })
  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @IsString()
  @IsIn(VALID_CONTENT_TYPES)
  contentType?: string | null;

  @ApiPropertyOptional({
    example: 'Given Name',
    description:
      'New source text. When changed (normalized), non-empty translations for this key move to review.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  sourceText?: string;
}

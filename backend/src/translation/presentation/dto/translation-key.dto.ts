import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
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
}

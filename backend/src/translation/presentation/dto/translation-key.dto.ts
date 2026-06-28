import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

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
}

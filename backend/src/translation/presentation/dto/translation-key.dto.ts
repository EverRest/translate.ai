import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

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

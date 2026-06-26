import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateGlossaryTermDto {
  @ApiProperty({ example: 'Checkout' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  sourceTerm!: string;

  @ApiPropertyOptional({ example: 'Kasse' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetTerm?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  doNotTranslate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateGlossaryTermDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  sourceTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  doNotTranslate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

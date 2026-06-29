import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
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

export class UpsertGlossaryTermDto {
  @ApiProperty({ example: 'Title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  sourceTerm!: string;

  @ApiPropertyOptional({ example: 'Заголовок' })
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

export class BulkUpsertGlossaryTermItemDto {
  @ApiProperty({ example: 'Title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  sourceTerm!: string;

  @ApiPropertyOptional({ example: 'Заголовок' })
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

export class BulkUpsertGlossaryTermsDto {
  @ApiProperty({ type: [BulkUpsertGlossaryTermItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => BulkUpsertGlossaryTermItemDto)
  terms!: BulkUpsertGlossaryTermItemDto[];
}

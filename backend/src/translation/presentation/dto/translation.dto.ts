import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TranslationStatus } from '@prisma/client';

export class LookupTranslationItemDto {
  @IsString()
  key!: string;

  @IsString()
  language!: string;
}

export class LookupTranslationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LookupTranslationItemDto)
  items!: LookupTranslationItemDto[];

  @IsOptional()
  @IsString()
  status?: TranslationStatus;
}

export class RecordTranslationQualityDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;

  @IsOptional()
  @IsString()
  referenceValue?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/;

export class CreateEntityCollectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateEntityCollectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class OpenApiImportDto {
  @IsString()
  @MinLength(2)
  spec!: string;

  @IsOptional()
  @IsString({ each: true })
  selectedTags?: string[];

  @IsOptional()
  @IsBoolean()
  materialize?: boolean;
}

export class OpenApiPreviewDto {
  @IsString()
  @MinLength(2)
  spec!: string;

  @IsOptional()
  @IsString({ each: true })
  selectedTags?: string[];
}

import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/;

const TEMPLATE_TYPES = [
  'form',
  'page',
  'modal',
  'email',
  'api',
  'custom',
] as const;

const NODE_TYPES = [
  'section',
  'field',
  'button',
  'label',
  'placeholder',
  'hint',
  'validation',
  'error',
  'success',
  'tooltip',
  'email_subject',
  'email_body',
  'notification',
  'text',
] as const;

export class CreateLocalizationObjectDto {
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

  @IsOptional()
  @IsIn(TEMPLATE_TYPES)
  templateType?: (typeof TEMPLATE_TYPES)[number];
}

export class UpdateLocalizationObjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsIn(TEMPLATE_TYPES)
  templateType?: (typeof TEMPLATE_TYPES)[number];
}

export class CreateLocalizationNodeDto {
  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;

  @IsIn(NODE_TYPES)
  nodeType!: (typeof NODE_TYPES)[number];

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsString()
  sourceText?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contentType?: string;
}

export class UpdateLocalizationNodeDto {
  @IsOptional()
  @IsIn(NODE_TYPES)
  nodeType?: (typeof NODE_TYPES)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string | null;

  @IsOptional()
  @IsString()
  sourceText?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  context?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contentType?: string | null;
}

export class TranslateLocalizationObjectDto {
  @IsString({ each: true })
  @MinLength(2, { each: true })
  languages!: string[];
}

export class ApplyLocalizationObjectTemplateDto {
  @IsString()
  @MinLength(1)
  templateId!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class JobKeyItemDto {
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

  @ApiPropertyOptional({ example: 'ui' })
  @IsOptional()
  @IsString()
  contentType?: string;
}

export class CreateJobDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Required for JWT sessions. Omitted when using a project API key (inferred from the key).',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ example: ['de', 'fr'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  languages!: string[];

  @ApiPropertyOptional({
    example: ['cart.checkout'],
    description: 'Existing project keys (manual / catalog flow)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keys?: string[];

  @ApiPropertyOptional({
    type: [JobKeyItemDto],
    description:
      'Inline keys with source text — auto-created on the project if missing (API flow)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobKeyItemDto)
  keyItems?: JobKeyItemDto[];

  @ApiPropertyOptional({ example: 'openai' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Idempotency key' })
  @IsOptional()
  @IsString()
  clientRequestId?: string;
}

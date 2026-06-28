import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnowledgeSourceType } from '@prisma/client';

export class CreateKnowledgeSourceDto {
  @ApiProperty({ example: 'Brand voice guide' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    enum: KnowledgeSourceType,
    example: KnowledgeSourceType.markdown,
  })
  @IsEnum(KnowledgeSourceType)
  sourceType!: KnowledgeSourceType;

  @ApiProperty({ description: 'Raw text or markdown content' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ example: 'brand-guide.md' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalFilename?: string;
}

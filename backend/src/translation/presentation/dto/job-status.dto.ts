import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, TranslationJobMode } from '@prisma/client';

export class JobProgressDto {
  @ApiProperty({ example: 6 })
  total!: number;

  @ApiProperty({ example: 6 })
  completed!: number;

  @ApiProperty({ example: 0 })
  failed!: number;
}

export class ObjectProgressDto {
  @ApiProperty({
    example: 12,
    description: 'Field nodes fully translated (object-batch jobs)',
  })
  objectsDone!: number;

  @ApiProperty({ example: 50 })
  objectsTotal!: number;
}

export class PlaceholderSummaryDto {
  @ApiProperty({ example: 134 })
  placeholdersTotal!: number;

  @ApiProperty({ example: 134 })
  placeholdersPreserved!: number;
}

export class TranslationJobCreatedResponseDto {
  @ApiProperty({ format: 'uuid' })
  jobId!: string;

  @ApiProperty({ enum: JobStatus, example: JobStatus.pending })
  status!: JobStatus;
}

export class TranslationJobStatusDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  projectId!: string;

  @ApiProperty({ enum: JobStatus })
  status!: JobStatus;

  @ApiProperty({ example: 'gemini' })
  provider!: string;

  @ApiProperty({
    enum: TranslationJobMode,
    example: TranslationJobMode.object_batch,
    description:
      '`object_batch` for field-level AI batching; `standard` otherwise',
  })
  mode!: TranslationJobMode;

  @ApiProperty({ type: JobProgressDto })
  progress!: JobProgressDto;

  @ApiPropertyOptional({ type: ObjectProgressDto })
  objectProgress?: ObjectProgressDto;

  @ApiPropertyOptional({ type: PlaceholderSummaryDto })
  placeholderSummary?: PlaceholderSummaryDto;

  @ApiProperty()
  createdAt!: Date;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CoverageMatrixQueryDto {
  @ApiPropertyOptional({
    example: 'BMA/Login,Forms',
    description: 'Comma-separated scope values (from import scope column)',
  })
  @IsOptional()
  @IsString()
  scopes?: string;

  @ApiPropertyOptional({
    example: 'fr,de,es',
    description: 'Comma-separated language codes',
  })
  @IsOptional()
  @IsString()
  languages?: string;
}

export class CoverageCellDto {
  @ApiProperty({ example: 'BMA/Login' })
  scope!: string;

  @ApiProperty({ example: 'fr' })
  language!: string;

  @ApiProperty({ example: 120 })
  total!: number;

  @ApiProperty({ example: 100 })
  translated!: number;

  @ApiProperty({ example: 95 })
  approved!: number;

  @ApiProperty({ example: 20 })
  missing!: number;

  @ApiProperty({ example: 5 })
  draft!: number;

  @ApiProperty({ example: 79 })
  approvedPct!: number;

  @ApiProperty({ enum: ['green', 'yellow', 'red'] })
  rag!: 'green' | 'yellow' | 'red';
}

export class LanguageCoverageSummaryDto {
  @ApiProperty({ example: 240 })
  total!: number;

  @ApiProperty({ example: 180 })
  approved!: number;

  @ApiProperty({ example: 200 })
  translated!: number;

  @ApiProperty({ example: 40 })
  missing!: number;

  @ApiProperty({ example: 75 })
  approvedPct!: number;
}

export class CoverageMatrixResponseDto {
  @ApiProperty({ type: [String], example: ['BMA/Login', 'Forms'] })
  scopes!: string[];

  @ApiProperty({ type: [String], example: ['de', 'fr'] })
  languages!: string[];

  @ApiProperty({ type: [CoverageCellDto] })
  cells!: CoverageCellDto[];

  @ApiProperty({
    example: {
      fr: {
        total: 240,
        approved: 180,
        translated: 200,
        missing: 40,
        approvedPct: 75,
      },
    },
    description: 'Aggregated approved % per language across all scopes',
  })
  byLanguage!: Record<string, LanguageCoverageSummaryDto>;

  @ApiProperty({
    type: [CoverageCellDto],
    description: 'Lowest approved % cells (default top 3)',
  })
  worstCells!: CoverageCellDto[];
}

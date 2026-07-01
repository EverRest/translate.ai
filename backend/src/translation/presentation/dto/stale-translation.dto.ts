import { ApiProperty } from '@nestjs/swagger';

export class StaleTranslationSummaryDto {
  @ApiProperty({
    example: 3,
    description:
      'Distinct translation keys with at least one stale translation',
  })
  totalStaleKeys!: number;

  @ApiProperty({
    example: 12,
    description: 'Total stale translation rows (key × language)',
  })
  totalStaleTranslations!: number;

  @ApiProperty({
    example: { fr: 4, de: 4, es: 4 },
    description: 'Stale translation count per language code',
  })
  byLanguage!: Record<string, number>;
}

export class StaleTranslationKeyHintsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    description:
      'Translation key IDs with at least one stale translation (for grid row hints)',
  })
  keyIds!: string[];
}

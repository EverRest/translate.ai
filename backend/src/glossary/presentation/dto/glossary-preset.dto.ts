import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApplyGlossaryPresetDto {
  @ApiProperty({ example: 'ui_common_en_ru' })
  @IsString()
  @IsNotEmpty()
  presetId!: string;

  @ApiPropertyOptional({ enum: ['merge', 'replace_all_in_preset'], default: 'merge' })
  @IsOptional()
  @IsIn(['merge', 'replace_all_in_preset'])
  mode?: 'merge' | 'replace_all_in_preset';
}

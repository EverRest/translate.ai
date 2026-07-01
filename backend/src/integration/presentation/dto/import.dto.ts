import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class PasteImportDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  html!: string;
}

export class ApplyImportSessionDto {
  @ApiPropertyOptional({ enum: ['skip', 'update'] })
  @IsOptional()
  @IsIn(['skip', 'update'])
  conflictStrategy?: 'skip' | 'update';
}

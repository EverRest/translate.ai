import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResolveTerminologyIssueDto {
  @ApiProperty({ example: 'Заголовок' })
  @IsString()
  @IsNotEmpty()
  canonicalValue!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  addToGlossary?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  retranslate?: boolean;
}

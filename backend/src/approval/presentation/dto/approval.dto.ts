import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class RejectTranslationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateTranslationValueDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  value!: string;
}

export class BulkApproveDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  translationIds!: string[];
}

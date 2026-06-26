import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'staging' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z0-9][a-z0-9-]*$/, {
    message: 'Branch name must be lowercase alphanumeric with hyphens',
  })
  name!: string;
}

export class UpdateBranchTranslationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  translationKeyId!: string;

  @ApiProperty({ example: 'de' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  language!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value!: string;
}

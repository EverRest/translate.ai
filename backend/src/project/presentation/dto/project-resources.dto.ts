import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'CI pipeline' })
  @IsString()
  @MinLength(2)
  name!: string;
}

export class AddProjectLanguageDto {
  @ApiProperty({ example: 'de' })
  @IsString()
  @MinLength(2)
  code!: string;
}

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://example.com/webhooks/translate' })
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ example: 'whsec_...' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  secret?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import { AiConfigService } from '../application/ai-config.service';

@ApiTags('config')
@ApiBearerAuth()
@AllowApiKey()
@Controller('config')
export class AiConfigController {
  constructor(private readonly aiConfig: AiConfigService) {}

  @Get('ai')
  @ApiOperation({
    summary: 'AI provider defaults (no secrets)',
  })
  getAiConfig() {
    return successResponse(this.aiConfig.getPublicConfig());
  }
}

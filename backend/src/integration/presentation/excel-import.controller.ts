import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import {
  DeltaTranslateExcelImportCommand,
  DownloadExcelImportQuery,
  GetExcelImportProfileQuery,
  GetExcelImportSessionQuery,
  PreviewExcelImportCommand,
  SaveExcelImportProfileCommand,
} from '../application/excel.commands';
import type { ExcelParseRules } from '../domain/excel.types';
import {
  DeltaTranslateExcelDto,
  ExcelImportProfileDto,
  PreviewExcelImportDto,
} from './dto/excel-import.dto';

function parseExcelRulesJson(raw?: string): ExcelParseRules | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  return JSON.parse(raw) as ExcelParseRules;
}

@ApiTags('import')
@ApiBearerAuth()
@AllowApiKey()
@Controller('projects/:projectId/import/excel')
export class ExcelImportController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('preview')
  @ApiOperation({
    summary: 'Upload Excel export, parse, and return empty-cell stats',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async preview(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
    @Body() body: PreviewExcelImportDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const data = await this.commandBus.execute(
      new PreviewExcelImportCommand(
        user.tenantId,
        projectId,
        user.userId,
        file.buffer,
        file.originalname,
        parseExcelRulesJson(body.parseRulesJson),
      ),
    );
    return successResponse(data);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get saved Excel import profile for project' })
  async getProfile(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetExcelImportProfileQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Save Excel import profile (Wiz Classic preset)' })
  async saveProfile(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: ExcelImportProfileDto,
  ) {
    const data = await this.commandBus.execute(
      new SaveExcelImportProfileCommand(user.tenantId, projectId, dto),
    );
    return successResponse(data);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get Excel import session status' })
  async getSession(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetExcelImportSessionQuery(user.tenantId, projectId, sessionId),
    );
    return successResponse(data);
  }

  @Post(':sessionId/delta-translate')
  @ApiOperation({
    summary: 'Translate empty cells only and enqueue composition',
  })
  async deltaTranslate(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: DeltaTranslateExcelDto,
  ) {
    const data = await this.commandBus.execute(
      new DeltaTranslateExcelImportCommand(
        user.tenantId,
        projectId,
        sessionId,
        user.userId,
        dto.languages,
        dto.provider,
      ),
    );
    return successResponse(data);
  }

  @Get(':sessionId/download')
  @ApiOperation({
    summary: 'Download composed Excel file (same layout as input)',
  })
  async download(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const data = await this.queryBus.execute(
      new DownloadExcelImportQuery(user.tenantId, projectId, sessionId),
    );

    return new StreamableFile(data.content, {
      type: data.contentType,
      disposition: `attachment; filename="${data.filename}"`,
    });
  }
}

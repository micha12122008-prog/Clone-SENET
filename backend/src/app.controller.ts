import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health & System')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Перевірка працездатності сервера (Health Check)' })
  @ApiResponse({
    status: 200,
    description: 'Сервер працює у штатному режимі',
    schema: {
      example: {
        status: 'ok',
        service: 'SENET Clone Backend API',
        version: '1.0.0',
        timestamp: '2026-10-24T19:40:00.000Z',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      service: 'SENET Clone Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}

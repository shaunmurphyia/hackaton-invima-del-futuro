import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Check API and System Status',
    description: 'Returns health status, uptime, and environment information.',
  })
  @ApiResponse({
    status: 200,
    description: 'System is operational and ready.',
  })
  check() {
    return {
      status: 'UP',
      service: 'Pharma Regulatory CTD Backend',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}

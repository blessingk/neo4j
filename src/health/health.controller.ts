import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('test')
  test() {
    return { message: 'Service is working!', timestamp: new Date().toISOString() };
  }
}

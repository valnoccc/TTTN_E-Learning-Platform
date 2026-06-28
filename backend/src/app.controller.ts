import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return `
      <div style="font-family: system-ui, sans-serif; text-align: center; padding-top: 100px;">
        <h1 style="color: #1dbf73;"> Backend đang hoạt động!</h1>
        <p style="color: #64748b; font-size: 16px;">Hệ thống API đã sẵn sàng để kết nối với Frontend.</p>
      </div>
    `;
  }
}

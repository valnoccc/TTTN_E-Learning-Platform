import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DashboardStatsDto } from './dto/admin-dashboard.dto';

// Import đầy đủ các file Guard và Decorator
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/dashboard')
// KÍCH HOẠT CẢ 2 LỚP BẢO VỆ TẠI ĐÂY
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  // BẮT BUỘC TÀI KHOẢN PHẢI CÓ VaiTro LÀ 'ADMIN'
  @Roles('ADMIN')
  async getStats(): Promise<DashboardStatsDto> {
    return this.adminService.getOverviewStats();
  }
}

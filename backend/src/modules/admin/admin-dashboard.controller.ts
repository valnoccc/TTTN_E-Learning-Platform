import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import {
  AdminInstructorDebtBoardDto,
  DashboardStatsDto,
} from './dto/admin-dashboard.dto';

// Import đầy đủ các file Guard và Decorator
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/dashboard')
// KÍCH HOẠT CẢ 2 LỚP BẢO VỆ TẠI ĐÂY
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDashboardController {
  constructor(private readonly adminService: AdminDashboardService) {}

  @Get('stats')
  // BẮT BUỘC TÀI KHOẢN PHẢI CÓ VaiTro LÀ 'ADMIN'
  @Roles('ADMIN')
  async getStats(
    @Query('days')  days?:  string,
    @Query('month') month?: string,
    @Query('year')  year?:  string,
  ): Promise<DashboardStatsDto> {
    if (month && year) {
      const m = Math.max(1, Math.min(Number(month) || 1, 12));
      const y = Math.max(2000, Math.min(Number(year) || new Date().getFullYear(), 3000));
      return this.adminService.getOverviewStats(30, { month: m, year: y });
    }
    const daysNum = days ? Math.max(1, Math.min(Number(days) || 30, 3650)) : 30;
    return this.adminService.getOverviewStats(daysNum);
  }

  @Get('debts')
  @Roles('ADMIN')
  async getInstructorDebts(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<AdminInstructorDebtBoardDto> {
    return this.adminService.getInstructorDebtBoard(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }
}

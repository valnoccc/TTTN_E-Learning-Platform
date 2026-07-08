import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReportsService, ReportReason, ResolveAction } from './reports.service';

// ─── DTO gửi báo cáo ─────────────────────────────────────────────────────────
interface CreateReportBody {
  discussionId?: number; // Mã bình luận bị báo cáo (nullable)
  reportedUserId: number; // Mã người bị báo cáo
  reason: ReportReason; // Lý do vi phạm
  details?: string; // Chi tiết bổ sung
}

// ─── DTO xử lý báo cáo ───────────────────────────────────────────────────────
interface ResolveReportBody {
  action: ResolveAction; // Hành động: HIDE_COMMENT | WARN_USER | BLOCK_USER | REJECT
  notes?: string; // Ghi chú của admin
}

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * POST /reports
   * USER hoặc INSTRUCTOR gửi báo cáo vi phạm
   */
  @Post('reports')
  @UseGuards(JwtAuthGuard)
  async createReport(
    @Req() req: Request & { user: { sub: number } },
    @Body() body: CreateReportBody,
  ) {
    const result = await this.reportsService.createReport(
      req.user.sub,
      body.discussionId ?? null,
      body.reportedUserId,
      body.reason,
      body.details,
    );

    return {
      message: result.message,
      data: { reportId: result.reportId },
    };
  }

  /**
   * GET /admin/reports
   * ADMIN lấy danh sách báo cáo với phân trang và filter theo trạng thái
   * Query params: ?status=PENDING&page=1&limit=10
   */
  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getReports(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page ?? '1', 10);
    const limitNum = parseInt(limit ?? '10', 10);

    const result = await this.reportsService.getReports(
      status,
      pageNum,
      limitNum,
    );

    return {
      message: 'Lấy danh sách báo cáo thành công',
      ...result,
    };
  }

  /**
   * PATCH /admin/reports/:id/resolve
   * ADMIN xử lý một báo cáo (ẩn bình luận, cảnh báo/khóa user, hoặc từ chối)
   */
  @Patch('admin/reports/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async resolveReport(
    @Param('id') reportId: string,
    @Body() body: ResolveReportBody,
  ) {
    const result = await this.reportsService.resolveReport(
      reportId,
      body.action,
      body.notes,
    );

    return {
      message: `Xử lý báo cáo thành công: ${body.action}`,
      data: result,
    };
  }
}

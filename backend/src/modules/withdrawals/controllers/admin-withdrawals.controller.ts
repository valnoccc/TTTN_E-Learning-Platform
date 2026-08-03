import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { WithdrawalsService } from '../services/withdrawals.service';

@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminWithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Get()
  getRequests(@Query('status') status?: string) {
    return this.withdrawalsService.getAdminRequests(status);
  }

  @Get(':id')
  getDetail(@Param('id', ParseIntPipe) id: number) { return this.withdrawalsService.getAdminRequestDetail(id); }

  @Patch(':id/processing')
  markProcessing(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { user: { sub?: number; maND?: number } }) {
    const adminId = req.user.sub ?? req.user.maND;
    if (!adminId) throw new Error('Missing admin identity');
    return this.withdrawalsService.markProcessing(adminId, id);
  }

  @Patch(':id/reject')
  reject(@Param('id', ParseIntPipe) id: number, @Body('lyDoTuChoi') reason: string, @Req() req: Request & { user: { sub?: number; maND?: number } }) {
    const adminId = req.user.sub ?? req.user.maND;
    if (!adminId) throw new Error('Missing admin identity');
    return this.withdrawalsService.rejectRequest(adminId, id, reason ?? '');
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number, @Body('maGiaoDichNgoaiHeThong') code: string, @Req() req: Request & { user: { sub?: number; maND?: number } }) {
    const adminId = req.user.sub ?? req.user.maND;
    if (!adminId) throw new Error('Missing admin identity');
    return this.withdrawalsService.completeRequest(adminId, id, code ?? '');
  }
}

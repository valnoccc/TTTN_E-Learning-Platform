import { Body, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateWithdrawalRequestDto } from '../dto/create-withdrawal-request.dto';
import { InstructorWalletService } from '../services/instructor-wallet.service';
import { WithdrawalsService } from '../services/withdrawals.service';

type AuthRequest = Request & { user: { sub?: number; maND?: number } };

@Controller('instructor/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class WithdrawalsController {
  constructor(
    private readonly withdrawalsService: WithdrawalsService,
    private readonly instructorWalletService: InstructorWalletService,
  ) {}

  @Get('wallet')
  getWallet(@Req() req: AuthRequest) {
    return this.instructorWalletService.getWallet(this.userId(req));
  }

  @Post()
  createRequest(
    @Req() req: AuthRequest,
    @Body() body: CreateWithdrawalRequestDto,
  ) {
    return this.withdrawalsService.createRequest(this.userId(req), body);
  }

  @Get()
  getMyRequests(@Req() req: AuthRequest) {
    return this.withdrawalsService.getMyRequests(this.userId(req));
  }

  private userId(req: AuthRequest): number {
    const userId = req.user.sub ?? req.user.maND;
    if (userId === undefined || userId === null) {
      throw new ForbiddenException('Access denied');
    }
    return userId;
  }
}

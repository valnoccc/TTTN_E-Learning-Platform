import { Body, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ApplyInstructorDto } from '../dto/apply-instructor.dto';
import { InstructorApplicationsService } from '../services/instructor-applications.service';
import { getRevenueShareConfig } from '../../../config/revenue-share.config';

type AuthRequest = Request & { user: { sub?: number; maND?: number } };

@Controller('instructor-applications')
@UseGuards(JwtAuthGuard)
export class InstructorApplicationsController {
  constructor(private readonly applicationsService: InstructorApplicationsService) {}

  @Get('policy')
  getPolicy() {
    const { instructorPercent, adminPercent } = getRevenueShareConfig();
    return { instructorPercent, adminPercent };
  }

  @Post('me')
  apply(@Body() dto: ApplyInstructorDto, @Req() req: AuthRequest) {
    const userId = req.user.sub ?? req.user.maND;
    if (userId === undefined || userId === null) {
      throw new ForbiddenException('Không xác định được tài khoản đăng ký.');
    }
    return this.applicationsService.apply(userId, dto);
  }
}

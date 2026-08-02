import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ApplyInstructorDto } from '../dto/apply-instructor.dto';
import { InstructorApplicationsService } from '../services/instructor-applications.service';

type AuthRequest = Request & { user: { sub?: number; maND?: number } };

@Controller('instructor-applications')
@UseGuards(JwtAuthGuard)
export class InstructorApplicationsController {
  constructor(private readonly applicationsService: InstructorApplicationsService) {}

  @Post('me')
  apply(@Body() dto: ApplyInstructorDto, @Req() req: AuthRequest) {
    const userId = req.user.sub ?? req.user.maND;
    if (userId === undefined || userId === null) {
      throw new ForbiddenException('Không xác định được tài khoản đăng ký.');
    }
    return this.applicationsService.apply(userId, dto);
  }
}

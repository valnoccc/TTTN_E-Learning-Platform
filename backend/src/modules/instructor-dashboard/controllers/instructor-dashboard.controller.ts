import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';

import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type {
  InstructorPrincipal,
  InstructorReportRange,
} from '../../instructors/services/instructors.service';
import { InstructorDashboardService } from '../services/instructor-dashboard.service';

@Controller('instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class InstructorDashboardController {
  constructor(
    private readonly instructorDashboardService: InstructorDashboardService,
  ) {}

  @Get('me/reports')
  getMyReports(
    @Req() req: { user: InstructorPrincipal },
    @Query('courseId') courseId?: string,
    @Query('range')
    range?: InstructorReportRange,
  ) {
    return this.instructorDashboardService.getMyReports(req.user, {
      courseId: courseId ? Number(courseId) : undefined,
      range,
    });
  }
}

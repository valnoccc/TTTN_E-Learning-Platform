import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InstructorsService } from './instructors.service';

@Controller('instructors')
@UseGuards(JwtAuthGuard)
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Get('me/courses')
  getMyCourses(@Req() req: any) {
    return this.instructorsService.getMyCourses(req.user);
  }

  @Get('me/students')
  getMyStudents(@Req() req: any, @Query('courseId') courseId?: string, @Query('search') search?: string) {
    return this.instructorsService.getMyStudents(req.user, {
      courseId: courseId ? Number(courseId) : undefined,
      search: search?.trim() || undefined,
    });
  }
}

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { StudentPaymentHistoryService } from '../services/student-payment-history.service';
import { StudentProgressService } from '../services/student-progress.service';
import { StudentProfileService } from '../services/student-profile.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(
    private readonly studentProfileService: StudentProfileService,
    private readonly studentPaymentHistoryService: StudentPaymentHistoryService,
    private readonly studentProgressService: StudentProgressService,
  ) {}

  private getUserId(
    request: Request & { user: { sub?: number; maND?: number } },
  ): number {
    const userId = request.user.sub ?? request.user.maND;
    if (userId === undefined || userId === null) {
      throw new ForbiddenException('Access denied');
    }
    return userId;
  }

  // /me/courses uses the JWT token, so no userId is needed in the URL.
  @Get('me/courses')
  getMyCoursesFromToken(
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    return this.studentProfileService.getMyCourses(userId);
  }

  @Get(':id/courses')
  getMyCourses(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.studentProfileService.getMyCourses(+id);
  }

  // Use the JWT token directly.
  @Get('me/payments')
  getMyPaymentsFromToken(
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    return this.studentPaymentHistoryService.getMyPayments(userId);
  }

  @Get(':id/payments')
  getMyPayments(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.studentPaymentHistoryService.getMyPayments(+id);
  }

  @Post('me/lessons/:lessonId/complete')
  markLessonCompleteFromToken(
    @Param('lessonId') lessonId: string,
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    return this.studentProgressService.markLessonComplete(userId, +lessonId);
  }

  @Post(':id/lessons/:lessonId/complete')
  markLessonComplete(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.studentProgressService.markLessonComplete(+id, +lessonId);
  }

  @Get('me/progress')
  getMyProgressFromToken(
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    return this.studentProgressService.getMyProgress(userId);
  }

  @Get(':id/progress')
  getMyProgress(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.studentProgressService.getMyProgress(+id);
  }

  // Save the most recently viewed lesson using the JWT token.
  @Patch('me/courses/:courseId/current-lesson')
  updateCurrentLesson(
    @Param('courseId') courseId: string,
    @Body() body: { lessonId: number },
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    return this.studentProfileService.updateCurrentLesson(
      userId,
      +courseId,
      body.lessonId,
    );
  }

  // Get the most recent lesson for the student in the course.
  @Get('me/courses/:courseId/current-lesson')
  getCourseLastLesson(
    @Param('courseId') courseId: string,
    @Req() req: Request & { user: { sub?: number; maND?: number } },
  ) {
    const userId = this.getUserId(req);
    return this.studentProfileService.getCourseLastLesson(userId, +courseId);
  }
}

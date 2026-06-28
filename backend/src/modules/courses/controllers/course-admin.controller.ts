import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CourseAdminService } from '../services/course-admin.service';
import { RejectCourseDto } from '../dto/reject-course.dto';

@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CourseAdminController {
  constructor(private readonly courseAdminService: CourseAdminService) {}

  private getAdminId(request: Request & { user: { sub: number } }) {
    return request.user.sub;
  }

  @Get()
  async getCourses(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.courseAdminService.getCourses({ status, search });
    return {
      message: 'Lấy danh sách khóa học thành công.',
      data,
    };
  }

  @Get('pending')
  async getPendingCourses() {
    const data = await this.courseAdminService.getCourses({
      status: 'PENDING',
    });
    return {
      message: 'Lấy danh sách khóa học chờ duyệt thành công.',
      data,
    };
  }

  @Get(':id')
  async getCourseDetail(@Param('id') id: string) {
    const data = await this.courseAdminService.getCourseDetail(Number(id));
    return {
      message: 'Lấy chi tiết khóa học thành công.',
      data,
    };
  }

  @Patch(':id/approve')
  approveCourse(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: number } },
  ) {
    return this.courseAdminService.approveCourse(
      Number(id),
      this.getAdminId(req),
    );
  }

  @Patch(':id/reject')
  rejectCourse(
    @Param('id') id: string,
    @Body() body: RejectCourseDto,
    @Req() req: Request & { user: { sub: number } },
  ) {
    return this.courseAdminService.rejectCourse(
      Number(id),
      this.getAdminId(req),
      body.lyDo,
    );
  }

  @Patch(':id/ban')
  banPublishedCourse(
    @Param('id') id: string,
    @Body() body: RejectCourseDto,
    @Req() req: Request & { user: { sub: number } },
  ) {
    return this.courseAdminService.banPublishedCourse(
      Number(id),
      this.getAdminId(req),
      body.lyDo,
    );
  }

  @Patch(':id/hide')
  hidePublishedCourse(
    @Param('id') id: string,
    @Body() body: RejectCourseDto,
    @Req() req: Request & { user: { sub: number } },
  ) {
    return this.courseAdminService.hidePublishedCourse(
      Number(id),
      this.getAdminId(req),
      body.lyDo,
    );
  }
}

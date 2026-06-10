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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminCoursesService } from './admin-courses.service';
import { RejectCourseDto } from './dto/reject-course.dto';

@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCoursesController {
  constructor(private readonly adminCoursesService: AdminCoursesService) {}

  private getAdminId(request: Request & { user: { sub: number } }) {
    return request.user.sub;
  }

  @Get()
  async getCourses(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.adminCoursesService.getCourses({ status, search });
    return {
      message: 'Lay danh sach khoa hoc thanh cong.',
      data,
    };
  }

  @Get('pending')
  async getPendingCourses() {
    const data = await this.adminCoursesService.getCourses({
      status: 'PENDING',
    });
    return {
      message: 'Lay danh sach khoa hoc cho duyet thanh cong.',
      data,
    };
  }

  @Get(':id')
  async getCourseDetail(@Param('id') id: string) {
    const data = await this.adminCoursesService.getCourseDetail(Number(id));
    return {
      message: 'Lay chi tiet khoa hoc thanh cong.',
      data,
    };
  }

  @Patch(':id/approve')
  approveCourse(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: number } },
  ) {
    return this.adminCoursesService.approveCourse(Number(id), this.getAdminId(req));
  }

  @Patch(':id/reject')
  rejectCourse(
    @Param('id') id: string,
    @Body() body: RejectCourseDto,
    @Req() req: Request & { user: { sub: number } },
  ) {
    return this.adminCoursesService.rejectCourse(
      Number(id),
      this.getAdminId(req),
      body.lyDo,
    );
  }
}

import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import {
  CourseStudentService,
  type PublicCourseFilters,
} from '../services/course-student.service';

@Controller('public/courses')
export class PublicCoursesController {
  constructor(private readonly courseStudentService: CourseStudentService) {}

  @Get()
  async getAllCourses(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('price') price?: string,
  ) {
    const filters: PublicCourseFilters = { search, categoryId, price };
    const data =
      await this.courseStudentService.getAllPublishedCourses(filters);

    return {
      message: 'Lấy danh sách khóa học thành công',
      data,
    };
  }

  @Get(':id/recommendations')
  async getRecommendations(
    @Param('id', ParseIntPipe) courseId: number,
    @Query('userId') userId?: string,
    @Query('courseIds') courseIds?: string,
  ) {
    const requestedCourseIds = (courseIds ?? '')
      .split(',')
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value) && value > 0);
    const recommendationCourseIds = Array.from(
      new Set([courseId, ...requestedCourseIds]),
    );

    const data = await this.courseStudentService.getCourseRecommendations(
      recommendationCourseIds,
      userId,
    );

    return data;
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string) {
    const courseId = Number.parseInt(id, 10);
    if (Number.isNaN(courseId)) {
      throw new BadRequestException(
        `Mã khóa học (courseId) không hợp lệ hoặc bị rỗng (NaN): "${id}"`,
      );
    }

    const data =
      await this.courseStudentService.getPublishedCourseById(courseId);

    return {
      message: 'Lấy chi tiết khóa học thành công',
      data,
    };
  }

  @Get(':id/curriculum')
  async getCourseCurriculum(@Param('id') id: string) {
    const courseId = Number.parseInt(id, 10);
    if (Number.isNaN(courseId)) {
      throw new BadRequestException(
        `Mã khóa học (courseId) không hợp lệ hoặc bị rỗng (NaN): "${id}"`,
      );
    }

    const data = await this.courseStudentService.getCourseCurriculum(courseId);

    return {
      message: 'Lấy chương trình học thành công',
      data,
    };
  }
}

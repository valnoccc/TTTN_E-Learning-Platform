import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

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
    @Query('rating') rating?: string,
    @Query('sort') sort?: string,
  ) {
    const filters: PublicCourseFilters = { search, categoryId, price, rating, sort };
    const data =
      await this.courseStudentService.getAllPublishedCourses(filters);

    return {
      message: 'Lấy danh sách khóa học thành công',
      data,
    };
  }

  @Get(':id/recommendations')
  async getRecommendations(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    const courseIds = id
      .split(',')
      .map((item) => Number.parseInt(item.trim(), 10))
      .filter((num) => !Number.isNaN(num));

    if (courseIds.length === 0) {
      throw new BadRequestException('Mã khóa học không hợp lệ');
    }

    const data = await this.courseStudentService.getCourseRecommendations(
      courseIds,
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

  @Get(':id/learning')
  @UseGuards(JwtAuthGuard)
  async getLearningCourse(
    @Param('id') id: string,
    @Req() req: { user: { sub: number } },
  ) {
    const courseId = Number.parseInt(id, 10);
    if (Number.isNaN(courseId)) {
      throw new BadRequestException('Mã khóa học không hợp lệ');
    }

    const data = await this.courseStudentService.getPublishedCourseById(
      courseId,
      req.user.sub,
    );

    return {
      message: 'Lấy khóa học đang học thành công',
      data,
    };
  }

  @Get(':id/learning/curriculum')
  @UseGuards(JwtAuthGuard)
  async getLearningCurriculum(
    @Param('id') id: string,
    @Req() req: { user: { sub: number } },
  ) {
    const courseId = Number.parseInt(id, 10);
    if (Number.isNaN(courseId)) {
      throw new BadRequestException('Mã khóa học không hợp lệ');
    }

    const data = await this.courseStudentService.getCourseCurriculum(
      courseId,
      req.user.sub,
    );

    return {
      message: 'Lấy chương trình học đang học thành công',
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

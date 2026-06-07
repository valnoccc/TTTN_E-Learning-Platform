import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CloudinaryService,
  type UploadedAsset,
} from '../../cloudinary/cloudinary.service';
import { CreateDiscussionReplyDto } from '../dto/create-discussion-reply.dto';
import { CreateReplyDto } from '../dto/create-reply.dto';
import { serializeCourse } from '../services/course-response.util';
import { CourseInstructorCurriculumService } from '../services/course-instructor-curriculum.service';
import { CourseInstructorDiscussionsService } from '../services/course-instructor-discussions.service';
import { CourseInstructorReviewsService } from '../services/course-instructor-reviews.service';
import { CoursesService } from '../services/course-instructor.service';



const COURSE_TITLE_MAX_LENGTH = 60;

const parseArrayData = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [data];
  }
};


@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly reviewsService: CourseInstructorReviewsService,
    private readonly discussionsService: CourseInstructorDiscussionsService,
    private readonly curriculumService: CourseInstructorCurriculumService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }


  @Get('my-courses')
  async getMyCourses(@Request() req) {
    const instructorId = req.user.sub;
    const courses =
      await this.coursesService.getCoursesByInstructor(instructorId);
    return {
      message: 'Láº¥y danh sÃ¡ch khÃ³a há»c thÃ nh cÃ´ng',
      data: courses.map(serializeCourse),
    };
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string, @Request() req) {
    // Thêm `as any` ở cuối dòng này để vượt qua kiểm duyệt của TypeScript
    const course = await this.coursesService.getCourseById(
      Number(id),
      req.user.sub,
    );

    return {
      message: 'Lấy thông tin khóa học thành công',
      data: {
        ...serializeCourse(course),
        muc_tieu: course.muc_tieu,
        yeu_cau: course.yeu_cau,
      },
    };
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createCourse(
    @Request() req,
    @Body() courseData: any,
    @UploadedFile() file: UploadedAsset,
  ) {
    const tenKhoaHoc = courseData.tenKhoaHoc ?? courseData.ten_khoa_hoc;
    if (typeof tenKhoaHoc !== 'string' || !tenKhoaHoc.trim()) {
      throw new BadRequestException('TÃªn khÃ³a há»c khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng');
    }
    if (tenKhoaHoc.trim().length > COURSE_TITLE_MAX_LENGTH) {
      throw new BadRequestException(
        `TÃªn khÃ³a há»c khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ ${COURSE_TITLE_MAX_LENGTH} kÃ½ tá»±`,
      );
    }

    let imageUrl = null;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        'image',
      );
      imageUrl = uploadResult.secure_url;
    }

    const payload = {
      maDM: Number(courseData.maDM ?? courseData.id_danh_muc ?? 0),
      maND_GiangVien: req.user.sub,
      tenKhoaHoc: tenKhoaHoc.trim(),
      moTa: courseData.moTa ?? courseData.mo_ta,
      giaBan: Number(courseData.giaBan ?? 0),
      trangThai: courseData.trangThai ?? 'DRAFT',
      hinhThuNho: imageUrl,
    };

    const mucTieu = parseArrayData(courseData.muc_tieu);
    const yeuCau = parseArrayData(courseData.yeu_cau);

    const newCourse = await this.coursesService.createCourse(payload, mucTieu, yeuCau);
    return {
      message: 'Táº¡o khÃ³a há»c thÃ nh cÃ´ng',
      data: serializeCourse(newCourse),
    };
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async updateCourse(
    @Param('id') courseId: string,
    @Request() req,
    @Body() courseData: any,
    @UploadedFile() file: UploadedAsset,
  ) {
    const tenKhoaHoc = courseData.tenKhoaHoc ?? courseData.ten_khoa_hoc;
    if (typeof tenKhoaHoc === 'string') {
      const trimmed = tenKhoaHoc.trim();
      if (!trimmed) {
        throw new BadRequestException('TÃªn khÃ³a há»c khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng');
      }
      if (trimmed.length > COURSE_TITLE_MAX_LENGTH) {
        throw new BadRequestException(
          `TÃªn khÃ³a há»c khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ ${COURSE_TITLE_MAX_LENGTH} kÃ½ tá»±`,
        );
      }
    }

    let imageUrl = courseData.hinhThuNho;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        'image',
      );
      imageUrl = uploadResult.secure_url;
    }

    const payload: any = {
      maDM: Number(courseData.maDM ?? courseData.id_danh_muc ?? 0),
      tenKhoaHoc:
        typeof tenKhoaHoc === 'string' ? tenKhoaHoc.trim() : tenKhoaHoc,
      moTa: courseData.moTa ?? courseData.mo_ta,
      giaBan: Number(courseData.giaBan ?? courseData.gia ?? 0),
      trangThai: courseData.trangThai ?? courseData.trang_thai,
      hinhThuNho: imageUrl,
    };

    const mucTieu = parseArrayData(courseData.muc_tieu);
    const yeuCau = parseArrayData(courseData.yeu_cau);

    const updatedCourse = await this.coursesService.updateCourse(
      Number(courseId),
      req.user.sub,
      payload,
      mucTieu,
      yeuCau
    );
    return {
      message: 'Cáº­p nháº­t khÃ³a há»c thÃ nh cÃ´ng',
      data: serializeCourse(updatedCourse),
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() statusData: any,
  ) {
    const updatedCourse = await this.coursesService.updateCourseStatus(
      Number(id),
      req.user.sub,
      statusData.trangThai ?? statusData.trang_thai,
    );
    return { message: 'Cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh cÃ´ng', data: updatedCourse };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.remove(Number(id), req.user.sub);
  }

  @Get(':id/reviews')
  async getCourseReviews(@Param('id') id: string, @Request() req) {
    const reviews = await this.reviewsService.getCourseReviews(
      Number(id),
      req.user.sub,
    );

    return {
      message: 'Láº¥y danh sÃ¡ch Ä‘Ã¡nh giÃ¡ thÃ nh cÃ´ng',
      data: reviews,
    };
  }

  @Post(':id/reviews')
  async replyToReview(
    @Param('id') id: string,
    @Request() req,
    @Body() body: CreateReplyDto,
  ) {
    const replyData = await this.reviewsService.replyToReview(
      Number(id),
      req.user.sub,
      body,
    );

    return {
      message: 'Gá»­i pháº£n há»“i Ä‘Ã¡nh giÃ¡ thÃ nh cÃ´ng',
      data: replyData,
    };
  }

  @Get(':id/discussions')
  async getCourseDiscussions(@Param('id') id: string, @Request() req) {
    const discussions = await this.discussionsService.getCourseDiscussions(
      Number(id),
      req.user.sub,
    );

    return {
      message: 'Láº¥y danh sÃ¡ch tháº£o luáº­n khÃ³a há»c thÃ nh cÃ´ng',
      data: discussions,
    };
  }

  @Post(':id/discussions')
  async replyToDiscussion(
    @Param('id') id: string,
    @Request() req,
    @Body() body: CreateDiscussionReplyDto,
  ) {
    const replyData = await this.discussionsService.replyToDiscussion(
      Number(id),
      req.user.sub,
      body,
    );

    return {
      message: 'Gá»­i pháº£n há»“i tháº£o luáº­n thÃ nh cÃ´ng',
      data: replyData,
    };
  }

  @Get(':id/curriculum')
  async getCourseCurriculum(@Param('id') id: string, @Request() req) {
    const data = await this.curriculumService.getCourseCurriculum(
      Number(id),
      req.user.sub,
    );

    return {
      message: 'Láº¥y chÆ°Æ¡ng trÃ¬nh há»c thÃ nh cÃ´ng',
      data,
    };
  }

  @Post(':id/chapters')
  async addChapter(@Param('id') id: string, @Request() req, @Body() body: any) {
    const data = await this.curriculumService.addChapter(
      Number(id),
      req.user.sub,
      body,
    );
    return { message: 'Táº¡o chÆ°Æ¡ng thÃ nh cÃ´ng', data };
  }

  @Post('chapters/:chapterId/lessons')
  async addLesson(@Param('chapterId') chapterId: string, @Body() body: any) {
    const data = await this.curriculumService.addLesson(Number(chapterId), body);
    return { message: 'Táº¡o bÃ i há»c thÃ nh cÃ´ng', data };
  }
}

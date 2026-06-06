import {
  Body,
  BadRequestException,
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
import {
  CloudinaryService,
  type UploadedAsset,
} from '../../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { serializeCourse } from '../services/course-response.util';
import { CoursesService } from '../services/course-instructor.service';
import { CreateReplyDto } from '../dto/create-reply.dto';
import { CreateDiscussionReplyDto } from '../dto/create-discussion-reply.dto';

const COURSE_TITLE_MAX_LENGTH = 60;



@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Get('my-courses')
  async getMyCourses(@Request() req) {
    const instructorId = req.user.sub;
    const courses =
      await this.coursesService.getCoursesByInstructor(instructorId);
    return {
      message: 'Lấy danh sách khóa học thành công',
      data: courses.map(serializeCourse),
    };
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string, @Request() req) {
    const course = await this.coursesService.getCourseById(
      Number(id),
      req.user.sub,
    );
    return {
      message: 'Lấy thông tin khóa học thành công',
      data: serializeCourse(course),
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
      throw new BadRequestException('Tên khóa học không được để trống');
    }
    if (tenKhoaHoc.trim().length > COURSE_TITLE_MAX_LENGTH) {
      throw new BadRequestException(
        `Tên khóa học không được vượt quá ${COURSE_TITLE_MAX_LENGTH} ký tự`,
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

    const newCourse = await this.coursesService.createCourse(payload);
    return {
      message: 'Tạo khóa học thành công',
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
        throw new BadRequestException('Tên khóa học không được để trống');
      }
      if (trimmed.length > COURSE_TITLE_MAX_LENGTH) {
        throw new BadRequestException(
          `Tên khóa học không được vượt quá ${COURSE_TITLE_MAX_LENGTH} ký tự`,
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
      tenKhoaHoc: typeof tenKhoaHoc === 'string' ? tenKhoaHoc.trim() : tenKhoaHoc,
      moTa: courseData.moTa ?? courseData.mo_ta,
      giaBan: Number(courseData.giaBan ?? courseData.gia ?? 0),
      trangThai: courseData.trangThai ?? courseData.trang_thai,
      hinhThuNho: imageUrl,
    };

    const updatedCourse = await this.coursesService.updateCourse(
      Number(courseId),
      req.user.sub,
      payload,
    );
    return {
      message: 'Cập nhật khóa học thành công',
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
    return { message: 'Cập nhật trạng thái thành công', data: updatedCourse };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.remove(Number(id), req.user.sub);
  }

  // Thêm đoạn này vào trong class CoursesController, file course-instructor.controller.ts

  @Get(':id/reviews')
  async getCourseReviews(@Param('id') id: string, @Request() req) {
    const reviews = await this.coursesService.getCourseReviews(
      Number(id),
      req.user.sub,
    );

    return {
      message: 'Lấy danh sách đánh giá thành công',
      data: reviews,
    };
  }

  // Thêm vào class CoursesController
  @Post(':id/reviews')
  async replyToReview(
    @Param('id') id: string,
    @Request() req,
    @Body() body: CreateReplyDto // Sử dụng DTO đã tạo
  ) {
    const replyData = await this.coursesService.replyToReview(
      Number(id),
      req.user.sub,
      body
    );

    return {
      message: 'Đã gửi phản hồi thành công',
      data: replyData
    };
  }

  @Get(':id/discussions')
  async getCourseDiscussions(@Param('id') id: string, @Request() req) {
    const discussions = await this.coursesService.getCourseDiscussions(
      Number(id),
      req.user.sub,
    );

    return {
      message: 'Lấy danh sách thảo luận khóa học thành công',
      data: discussions,
    };
  }

  @Post(':id/discussions')
  async replyToDiscussion(
    @Param('id') id: string,
    @Request() req,
    @Body() body: CreateDiscussionReplyDto
  ) {
    const replyData = await this.coursesService.replyToDiscussion(
      Number(id),
      req.user.sub,
      body
    );

    return {
      message: 'Gửi phản hồi thảo luận thành công',
      data: replyData,
    };
  }
}

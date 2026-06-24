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

import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  CloudinaryService,
  type UploadedAsset,
} from '../../cloudinary/cloudinary.service';
import { serializeCourse } from '../services/course-response.util';
import { CourseInstructorCurriculumService } from '../services/course-instructor-curriculum.service';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly curriculumService: CourseInstructorCurriculumService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

    const mucTieu = parseArrayData(courseData.muc_tieu);
    const yeuCau = parseArrayData(courseData.yeu_cau);

    const newCourse = await this.coursesService.createCourse(
      payload,
      mucTieu,
      yeuCau,
    );

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
      yeuCau,
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

    return {
      message: 'Cập nhật trạng thái thành công',
      data: updatedCourse,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.remove(Number(id), req.user.sub);
  }

  @Get(':id/curriculum')
  async getCourseCurriculum(@Param('id') id: string, @Request() req) {
    const data = await this.curriculumService.getCourseCurriculum(
      Number(id),
      req.user.sub,
    );

    return {
      message: 'Lấy chương trình học thành công',
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

    return { message: 'Tạo chương thành công', data };
  }

  @Patch('chapters/:chapterId')
  async updateChapter(
    @Param('chapterId') chapterId: string,
    @Request() req,
    @Body() body: any,
  ) {
    const data = await this.curriculumService.updateChapter(
      Number(chapterId),
      req.user.sub,
      body,
    );

    return { message: 'Cap nhat chuong thanh cong', data };
  }

  @Delete('chapters/:chapterId')
  async deleteChapter(@Param('chapterId') chapterId: string, @Request() req) {
    await this.curriculumService.deleteChapter(Number(chapterId), req.user.sub);
    return { message: 'Xoa chuong thanh cong' };
  }

  @Post('chapters/:chapterId/lessons')
  async addLesson(@Param('chapterId') chapterId: string, @Body() body: any) {
    const data = await this.curriculumService.addLesson(
      Number(chapterId),
      body,
    );

    return { message: 'Tạo bài học thành công', data };
  }
}

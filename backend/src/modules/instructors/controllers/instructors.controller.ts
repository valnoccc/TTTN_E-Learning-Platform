import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { InstructorsService } from '../services/instructors.service';
import { UpdateInstructorProfileDto } from '../dto/update-instructor-profile.dto';
import { Multer } from 'multer';

@Controller('instructors')
@UseGuards(JwtAuthGuard)
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Get('me/courses')
  getMyCourses(@Req() req: any) {
    return this.instructorsService.getMyCourses(req.user);
  }

  @Get('me/students')
  getMyStudents(
    @Req() req: any,
    @Query('courseId') courseId?: string,
    @Query('search') search?: string,
  ) {
    return this.instructorsService.getMyStudents(req.user, {
      courseId: courseId ? Number(courseId) : undefined,
      search: search?.trim() || undefined,
    });
  }

  @Get('me/profile')
  getProfile(@Req() req: any) {
    return this.instructorsService.getProfile(req.user);
  }

  // THAY ĐỔI Ở ĐÂY: Hỗ trợ nhận cả file gộp chung với DTO text
  @Patch('me/profile')
  @UseInterceptors(FileInterceptor('file'))
  updateProfile(
    @Req() req: any,
    @Body() updateDto: UpdateInstructorProfileDto,
    @UploadedFile() file?: Express.Multer.File, // Nhận file ảnh từ Frontend gửi lên nếu có
  ) {
    return this.instructorsService.updateProfile(req.user, updateDto, file);
  }
}

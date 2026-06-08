import { Controller, Get, Patch, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { InstructorsService } from '../services/instructors.service';

// Nhớ import DTO bạn vừa tạo nhé (đường dẫn có thể thay đổi tùy cấu trúc thư mục của bạn)
import { UpdateInstructorProfileDto } from '../dto/update-instructor-profile.dto';

@Controller('instructors')
@UseGuards(JwtAuthGuard)
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) { }

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

  // Thêm endpoint cập nhật hồ sơ
  @Patch('me/profile')
  updateProfile(
    @Req() req: any,
    @Body() updateDto: UpdateInstructorProfileDto,
  ) {
    // req.user được lấy từ JwtAuthGuard chứa thông tin principal
    return this.instructorsService.updateProfile(req.user, updateDto);
  }

  @Get('me/profile')
  getProfile(@Req() req: any) {
    return this.instructorsService.getProfile(req.user);
  }
}
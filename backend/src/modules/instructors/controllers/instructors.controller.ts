import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UpdateInstructorProfileDto } from '../dto/update-instructor-profile.dto';
import { InstructorsService } from '../services/instructors.service';

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

  @Get('me/reports')
  getMyReports(
    @Req() req: any,
    @Query('courseId') courseId?: string,
    @Query('range') range?:
      | '30days'
      | 'this_month'
      | 'last_month'
      | 'this_year'
      | 'all_time',
  ) {
    return this.instructorsService.getMyReports(req.user, {
      courseId: courseId ? Number(courseId) : undefined,
      range,
    });
  }

  @Get('me/profile')
  getProfile(@Req() req: any) {
    return this.instructorsService.getProfile(req.user);
  }

  @Patch('me/profile')
  @UseInterceptors(FileInterceptor('file'))
  updateProfile(
    @Req() req: any,
    @Body() updateDto: UpdateInstructorProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.instructorsService.updateProfile(req.user, updateDto, file);
  }
}

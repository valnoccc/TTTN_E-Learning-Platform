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

import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UpdateInstructorProfileDto } from '../dto/update-instructor-profile.dto';
import { InstructorsService } from '../services/instructors.service';

@Controller('instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
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

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  // ─── /me/courses dùng JWT token – không cần userId trong URL ───────────────
  @Get('me/courses')
  @UseGuards(JwtAuthGuard)
  getMyCoursesFromToken(@Request() req) {
    const userId = req.user.sub || req.user.maND;
    console.log('[users/me/courses] userId từ JWT:', userId);
    return this.usersService.getMyCourses(userId);
  }

  @Get(':id/courses')
  @UseGuards(JwtAuthGuard)
  getMyCourses(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.usersService.getMyCourses(+id);
  }

  @Get(':id/payments')
  @UseGuards(JwtAuthGuard)
  getMyPayments(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.usersService.getMyPayments(+id);
  }

  // ─── Dùng JWT token trực tiếp ──────────────────────────────────────────────
  @Get('me/payments')
  @UseGuards(JwtAuthGuard)
  getMyPaymentsFromToken(@Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.usersService.getMyPayments(userId);
  }

  @Post(':id/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  markLessonComplete(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.maND;
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.usersService.markLessonComplete(+id, +lessonId);
  }

  @Post('me/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  markLessonCompleteFromToken(
    @Param('lessonId') lessonId: string,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.maND;
    return this.usersService.markLessonComplete(userId, +lessonId);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  getMyProgress(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.usersService.getMyProgress(+id);
  }

  @Get('me/progress')
  @UseGuards(JwtAuthGuard)
  getMyProgressFromToken(@Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.usersService.getMyProgress(userId);
  }

  // ─── Lưu bài học gần nhất đang xem (dùng JWT, không cần :id) ──────────────
  @Patch('me/courses/:courseId/current-lesson')
  @UseGuards(JwtAuthGuard)
  updateCurrentLesson(
    @Param('courseId') courseId: string,
    @Body() body: { lessonId: number },
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.maND;
    console.log(
      `[Controller] updateCurrentLesson | userId=${userId} | courseId=${courseId} | lessonId=${body.lessonId}`,
    );
    return this.usersService.updateCurrentLesson(
      userId,
      +courseId,
      body.lessonId,
    );
  }

  // ─── Lấy bài học gần nhất của học viên trong khóa học ─────────────────────
  @Get('me/courses/:courseId/current-lesson')
  @UseGuards(JwtAuthGuard)
  getCourseLastLesson(@Param('courseId') courseId: string, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.usersService.getCourseLastLesson(userId, +courseId);
  }
}

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

  @Post(':id/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  markLessonComplete(@Param('id') id: string, @Param('lessonId') lessonId: string, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.usersService.markLessonComplete(+id, +lessonId);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  getMyProgress(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    if (userId !== +id) throw new ForbiddenException('Access denied');
    return this.usersService.getMyProgress(+id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateQuizQuestionDto } from '../dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from '../dto/update-quiz-question.dto';
import { QuizQuestionsService } from '../services/quiz-questions.service';

@Controller('courses/chapters')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class QuizQuestionsController {
  constructor(private readonly quizQuestionsService: QuizQuestionsService) {}

  @Get(':chapterId/questions')
  async list(@Param('chapterId') chapterId: string, @Request() req) {
    const data = await this.quizQuestionsService.listByChapter(
      Number(chapterId),
      req.user.sub,
    );

    return { message: 'Lấy danh sách câu hỏi thành công', data };
  }

  @Post(':chapterId/questions')
  async create(
    @Param('chapterId') chapterId: string,
    @Request() req,
    @Body() body: CreateQuizQuestionDto,
  ) {
    const data = await this.quizQuestionsService.create(
      Number(chapterId),
      req.user.sub,
      body,
    );

    return { message: 'Tạo câu hỏi thành công', data };
  }

  @Patch(':chapterId/questions/:questionId')
  async update(
    @Param('chapterId') chapterId: string,
    @Param('questionId') questionId: string,
    @Request() req,
    @Body() body: UpdateQuizQuestionDto,
  ) {
    const data = await this.quizQuestionsService.update(
      Number(chapterId),
      Number(questionId),
      req.user.sub,
      body,
    );

    return { message: 'Cập nhật câu hỏi thành công', data };
  }

  @Delete(':chapterId/questions/:questionId')
  async remove(
    @Param('chapterId') chapterId: string,
    @Param('questionId') questionId: string,
    @Request() req,
  ) {
    await this.quizQuestionsService.remove(
      Number(chapterId),
      Number(questionId),
      req.user.sub,
    );

    return { message: 'Xóa câu hỏi thành công' };
  }
}

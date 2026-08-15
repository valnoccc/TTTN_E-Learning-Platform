import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminQuizQuestionsService } from '../services/admin-quiz-questions.service';
import { QuizQuestionChapterRecord } from '../services/quiz-question.types';

@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminQuizQuestionsController {
  constructor(private readonly quizQuestionsService: AdminQuizQuestionsService) {}

  @Get(':courseId/quiz-questions')
  async listByCourse(
    @Param('courseId') courseId: string,
  ): Promise<{ message: string; data: QuizQuestionChapterRecord[] }> {
    const data = await this.quizQuestionsService.listByCourse(Number(courseId));

    return { message: 'Lấy danh sách câu hỏi của khóa học thành công', data };
  }
}

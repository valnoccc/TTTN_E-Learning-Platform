import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuizQuestionsController } from './controllers/quiz-questions.controller';
import { AdminQuizQuestionsController } from './controllers/admin-quiz-questions.controller';
import { QuizQuestion } from './entities/quiz-question.entity';
import { AdminQuizQuestionsService } from './services/admin-quiz-questions.service';
import { InstructorQuizQuestionsService } from './services/instructor-quiz-questions.service';
import { StudentQuizQuestionsService } from './services/student-quiz-questions.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuizQuestion])],
  controllers: [QuizQuestionsController, AdminQuizQuestionsController],
  providers: [AdminQuizQuestionsService, InstructorQuizQuestionsService, StudentQuizQuestionsService],
  exports: [AdminQuizQuestionsService, InstructorQuizQuestionsService, StudentQuizQuestionsService],
})
export class QuizQuestionsModule {}

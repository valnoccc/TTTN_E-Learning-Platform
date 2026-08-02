import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuizQuestionsController } from './controllers/quiz-questions.controller';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizQuestionsService } from './services/quiz-questions.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuizQuestion])],
  controllers: [QuizQuestionsController],
  providers: [QuizQuestionsService],
  exports: [QuizQuestionsService],
})
export class QuizQuestionsModule {}

import { Module } from '@nestjs/common';
import { QuizAttemptsController } from './controllers/quiz-attempts.controller';
import { QuizAttemptsService } from './services/quiz-attempts.service';
import { QuizQuestionsModule } from '../quiz-questions/quiz-questions.module';

@Module({
  imports: [QuizQuestionsModule],
  controllers: [QuizAttemptsController],
  providers: [QuizAttemptsService],
  exports: [QuizAttemptsService],
})
export class QuizAttemptsModule {}

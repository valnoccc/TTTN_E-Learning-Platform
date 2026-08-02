import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SubmitQuizAttemptDto } from '../dto/submit-quiz-attempt.dto';
import { QuizAttemptsService } from '../services/quiz-attempts.service';

type AuthRequest = Request & { user: { sub?: number; maND?: number } };

@Controller('student')
@UseGuards(JwtAuthGuard)
export class QuizAttemptsController {
  constructor(private readonly quizAttemptsService: QuizAttemptsService) {}

  private userId(req: AuthRequest) {
    const userId = req.user.sub ?? req.user.maND;
    if (userId === undefined || userId === null) throw new ForbiddenException('Access denied');
    return userId;
  }

  @Post('chapters/:chapterId/quiz-attempts')
  start(@Param('chapterId', ParseIntPipe) chapterId: number, @Req() req: AuthRequest) {
    return this.quizAttemptsService.startAttempt(this.userId(req), chapterId);
  }

  @Post('quiz-attempts/:attemptId/submit')
  submit(@Param('attemptId', ParseIntPipe) attemptId: number, @Body() body: SubmitQuizAttemptDto, @Req() req: AuthRequest) {
    return this.quizAttemptsService.submitAttempt(this.userId(req), attemptId, body.answers);
  }

  @Get('chapters/:chapterId/quiz-history')
  history(@Param('chapterId', ParseIntPipe) chapterId: number, @Req() req: AuthRequest) {
    return this.quizAttemptsService.getHistory(this.userId(req), chapterId);
  }

  @Get('chapters/:chapterId/access')
  access(@Param('chapterId', ParseIntPipe) chapterId: number, @Req() req: AuthRequest) {
    return this.quizAttemptsService.getChapterAccess(this.userId(req), chapterId);
  }
}

import { QuizAnswerKey } from '../entities/quiz-question.entity';

export interface QuizQuestionRecord {
  maCauHoi: number;
  maChuong: number;
  noiDung: string;
  dapAnA: string;
  dapAnB: string;
  dapAnC: string;
  dapAnD: string;
  dapAnDung: QuizAnswerKey;
  thuTu: number;
}

export interface QuizQuestionChapterRecord {
  maChuong: number;
  tenChuong: string;
  thuTuChuong: number;
  questions: QuizQuestionRecord[];
}

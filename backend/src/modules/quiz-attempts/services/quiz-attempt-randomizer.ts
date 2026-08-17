import { QuizAnswerKey } from '../../quiz-questions/entities/quiz-question.entity';
import { QuizQuestionRecord } from '../../quiz-questions/services/quiz-question.types';

export interface StudentQuizOption {
  key: QuizAnswerKey;
  text: string;
}

export interface StudentQuizAttemptQuestion {
  maCauHoi: number;
  maChuong: number;
  noiDung: string;
  thuTu: number;
  options: StudentQuizOption[];
}

const answerKeys: QuizAnswerKey[] = [
  QuizAnswerKey.A,
  QuizAnswerKey.B,
  QuizAnswerKey.C,
  QuizAnswerKey.D,
];

function createRandom(seed: number) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  const random = createRandom(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function randomizeQuizForAttempt(
  questions: QuizQuestionRecord[],
  attemptId: number,
): StudentQuizAttemptQuestion[] {
  return shuffle(questions, attemptId).map((question, index) => {
    const options = answerKeys.map((key) => ({
      key,
      text: question[`dapAn${key}` as 'dapAnA' | 'dapAnB' | 'dapAnC' | 'dapAnD'],
    }));

    return {
      maCauHoi: question.maCauHoi,
      maChuong: question.maChuong,
      noiDung: question.noiDung,
      thuTu: index + 1,
      options: shuffle(options, attemptId ^ question.maCauHoi),
    };
  });
}

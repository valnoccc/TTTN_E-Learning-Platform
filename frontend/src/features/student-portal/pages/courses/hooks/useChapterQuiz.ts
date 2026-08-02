import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import axiosClient from '../../../../../api/axios';

export interface ChapterQuizQuestion {
  maCauHoi: number;
  maChuong: number;
  noiDung: string;
  dapAnA: string;
  dapAnB: string;
  dapAnC: string;
  dapAnD: string;
  thuTu: number;
}

export interface ChapterQuizAttempt {
  attemptId: number;
  chapterId: number;
  lanThu: number;
  totalQuestions: number;
  questions: ChapterQuizQuestion[];
}

export interface ChapterQuizResult {
  attemptId: number;
  chapterId: number;
  tongSoCau: number;
  soCauDung: number;
  tyLeDung: number;
  dat: boolean;
}

export interface ChapterAccess {
  chapterId: number;
  previousChapterId: number | null;
  canAccess: boolean;
  quizPassed: boolean;
}

function unwrap<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

export function useChapterQuiz() {
  const [activeAttempt, setActiveAttempt] = useState<ChapterQuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [result, setResult] = useState<ChapterQuizResult | null>(null);
  const [accessByChapter, setAccessByChapter] = useState<Record<number, ChapterAccess>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getChapterAccess = useCallback(async (chapterId: number) => {
    const cached = accessByChapter[chapterId];
    if (cached) return cached;
    try {
      const access = unwrap<ChapterAccess>(await axiosClient.get(`/student/chapters/${chapterId}/access`));
      setAccessByChapter((current) => ({ ...current, [chapterId]: access }));
      return access;
    } catch {
      const denied = { chapterId, previousChapterId: null, canAccess: false, quizPassed: false };
      setAccessByChapter((current) => ({ ...current, [chapterId]: denied }));
      return denied;
    }
  }, [accessByChapter]);

  const startQuiz = useCallback(async (chapterId: number) => {
    setLoading(true);
    try {
      const access = await getChapterAccess(chapterId);
      if (!access.canAccess) {
        toast.error('Bạn cần vượt qua bài kiểm tra chương trước để tiếp tục.');
        return false;
      }
      const attempt = unwrap<ChapterQuizAttempt>(await axiosClient.post(`/student/chapters/${chapterId}/quiz-attempts`));
      setActiveAttempt(attempt);
      setAnswers({});
      setResult(null);
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Không thể mở bài kiểm tra chương.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [getChapterAccess]);

  const chooseAnswer = (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  };

  const submitQuiz = useCallback(async () => {
    if (!activeAttempt) return null;
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([maCauHoi, dapAnChon]) => ({
        maCauHoi: Number(maCauHoi),
        dapAnChon,
      }));
      const quizResult = unwrap<ChapterQuizResult>(await axiosClient.post(`/student/quiz-attempts/${activeAttempt.attemptId}/submit`, { answers: payload }));
      setResult(quizResult);
      if (quizResult.dat) {
        setAccessByChapter((current) => ({
          ...current,
          [quizResult.chapterId]: {
            ...current[quizResult.chapterId],
            chapterId: quizResult.chapterId,
            canAccess: true,
            quizPassed: true,
          },
        }));
        toast.success('Bạn đã vượt qua bài kiểm tra chương.');
      } else {
        toast.error('Bạn chưa đạt trên 50%. Hãy làm lại bài kiểm tra.');
      }
      return quizResult;
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Không thể nộp bài kiểm tra.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [activeAttempt, answers]);

  const closeQuiz = () => {
    if (!result) return false;
    setActiveAttempt(null);
    setAnswers({});
    setResult(null);
    return true;
  };

  return {
    activeAttempt,
    answers,
    result,
    accessByChapter,
    loading,
    submitting,
    getChapterAccess,
    startQuiz,
    chooseAnswer,
    submitQuiz,
    closeQuiz,
  };
}

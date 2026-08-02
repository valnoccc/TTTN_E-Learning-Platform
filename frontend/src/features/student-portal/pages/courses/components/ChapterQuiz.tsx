import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  RotateCcw,
  Send,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  ChapterQuizAttempt,
  ChapterQuizResult,
} from "../hooks/useChapterQuiz";

interface ChapterQuizProps {
  attempt: ChapterQuizAttempt;
  answers: Record<number, "A" | "B" | "C" | "D">;
  result: ChapterQuizResult | null;
  submitting: boolean;
  onChoose: (questionId: number, answer: "A" | "B" | "C" | "D") => void;
  onSubmit: () => void;
  onRetry: () => void;
  onClose: () => void;
}

const answerKeys = ["A", "B", "C", "D"] as const;

export default function ChapterQuiz({
  attempt,
  answers,
  result,
  submitting,
  onChoose,
  onSubmit,
  onRetry,
  onClose,
}: ChapterQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = attempt.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === attempt.questions.length - 1;

  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [attempt.attemptId]);

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-[#f4f7f9] text-slate-900">
      <div className="mx-auto min-h-full max-w-4xl px-4 py-5 sm:px-8 sm:py-7">
        {result ? (
          <section
            className={`mt-5 rounded-2xl border p-6 shadow-sm sm:p-8 ${result.dat ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
          >
            <div className="flex items-start gap-4">
              {result.dat ? (
                <CheckCircle2 className="mt-0.5 text-emerald-600" size={28} />
              ) : (
                <LockKeyhole className="mt-0.5 text-amber-600" size={28} />
              )}
              <div>
                <p className="text-lg font-bold text-slate-950">
                  {result.dat
                    ? "Bạn đã đạt bài kiểm tra"
                    : "Bạn chưa đạt bài kiểm tra"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Kết quả:{" "}
                  <strong>
                    {result.soCauDung}/{result.tongSoCau}
                  </strong>{" "}
                  câu đúng · <strong>{result.tyLeDung}%</strong>
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {result.dat
                    ? "Chương tiếp theo đã được mở."
                    : "Bạn có thể làm lại bài kiểm tra để đạt trên 50%."}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {!result.dat && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  <RotateCcw size={16} /> Làm lại bài
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {result.dat ? "Tiếp tục học" : "Quay lại bài học"}{" "}
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        ) : (
          <>
            {currentQuestion && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                    {currentQuestionIndex + 1}
                  </span>
                  <h3 className="pt-1 text-base font-bold leading-6 text-slate-950 sm:text-lg">
                    {currentQuestion.noiDung}
                  </h3>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {answerKeys.map((key) => {
                    const answer =
                      currentQuestion[
                        `dapAn${key}` as
                          | "dapAnA"
                          | "dapAnB"
                          | "dapAnC"
                          | "dapAnD"
                      ];
                    const selected = answers[currentQuestion.maCauHoi] === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onChoose(currentQuestion.maCauHoi, key)}
                        className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${selected ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40"}`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}
                        >
                          {key}
                        </span>
                        <span>{answer}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="sticky bottom-0 mt-5 flex items-center justify-between gap-4 border-t border-slate-200 bg-[#f4f7f9]/95 py-4 backdrop-blur">
              <p className="text-xs text-slate-500">
                Đã chọn {answeredCount}/{attempt.totalQuestions} câu
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!currentQuestion || !answers[currentQuestion.maCauHoi])
                    return;
                  if (isLastQuestion) {
                    onSubmit();
                    return;
                  }
                  setCurrentQuestionIndex((index) => index + 1);
                }}
                disabled={
                  submitting ||
                  !currentQuestion ||
                  !answers[currentQuestion.maCauHoi]
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />{" "}
                {submitting
                  ? "Đang chấm bài..."
                  : isLastQuestion
                    ? "Nộp bài kiểm tra"
                    : "Tiếp tục"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

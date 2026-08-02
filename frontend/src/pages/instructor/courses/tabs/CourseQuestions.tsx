import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Plus,
} from "lucide-react";
import React from "react";

import {
  CourseSectionCard,
  useInstructorCourseContext,
} from "../CourseDetailShell";
import { useCourseCurriculum } from "../hooks/useCourseCurriculum";
import {
  type QuizQuestionForm,
  useCourseQuestions,
} from "../hooks/useCourseQuestions";

function QuestionForm({
  form,
  selectedQuestionId,
  locked,
  saving,
  onChange,
  onSave,
  onDelete,
  onNew,
}: {
  form: QuizQuestionForm;
  selectedQuestionId: number | null;
  locked: boolean;
  saving: boolean;
  onChange: (field: keyof QuizQuestionForm, value: string | number) => void;
  onSave: () => void;
  onDelete: () => void;
  onNew: () => void;
}) {
  const answers = ["A", "B", "C", "D"] as const;
  const fields = {
    A: "dapAnA",
    B: "dapAnB",
    C: "dapAnC",
    D: "dapAnD",
  } as const;

  return (
    <form
      className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {selectedQuestionId ? `Câu hỏi ${form.thuTu}` : "Câu hỏi mới"}
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-800">
            Soạn câu hỏi trắc nghiệm
          </h3>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Nội dung câu hỏi <span className="text-rose-500">*</span>
          <textarea
            rows={4}
            value={form.noiDung}
            onChange={(event) => onChange("noiDung", event.target.value)}
            disabled={locked || saving}
            className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
            placeholder="Nhập nội dung câu hỏi..."
          />
        </label>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Các phương án trả lời <span className="text-rose-500">*</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Chọn một đáp án đúng.
          </p>
          <div className="mt-2 space-y-2">
            {answers.map((letter) => (
              <label
                key={letter}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  form.dapAnDung === letter
                    ? "border-emerald-300 bg-emerald-50/60"
                    : "border-slate-200"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 font-mono text-xs font-bold text-slate-500">
                  {letter}
                </span>
                <input
                  value={form[fields[letter]]}
                  onChange={(event) =>
                    onChange(fields[letter], event.target.value)
                  }
                  disabled={locked || saving}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
                  placeholder={`Nhập đáp án ${letter}`}
                />
                <input
                  type="radio"
                  name="quiz-correct-answer"
                  checked={form.dapAnDung === letter}
                  onChange={() => onChange("dapAnDung", letter)}
                  disabled={locked || saving}
                  className="h-4 w-4 accent-emerald-600"
                  aria-label={`Chọn đáp án ${letter} là đáp án đúng`}
                />
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between border-t border-slate-200 pt-5 text-xs font-bold text-slate-700">
          Thứ tự câu hỏi
          <input
            type="number"
            min={1}
            value={form.thuTu}
            onChange={(event) => onChange("thuTu", Number(event.target.value))}
            disabled={locked || saving}
            className="w-20 rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-normal outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      {!locked ? (
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {selectedQuestionId ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="text-xs font-bold text-rose-500 hover:text-rose-700"
            >
              Xóa câu hỏi
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onNew}
              disabled={saving}
              className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
            >
              Câu hỏi mới
            </button>
            <button
              type="submit"
              disabled={saving || !form.noiDung.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {saving ? "Đang lưu..." : "Lưu câu hỏi"}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

export default function InstructorCourseQuestions() {
  const { isLocked } = useInstructorCourseContext();
  const { loading, chapters, expandedChapterId, toggleChapter } =
    useCourseCurriculum();
  const {
    selectedChapterId,
    questions,
    selectedQuestionId,
    form,
    questionLoading,
    saving,
    selectChapter,
    selectQuestion,
    changeField,
    newQuestion,
    saveQuestion,
    deleteQuestion,
  } = useCourseQuestions({ chapters, expandedChapterId, toggleChapter });

  const selectedChapter = chapters.find(
    (chapter) => chapter.maChuong === selectedChapterId,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="h-fit min-w-0 border border-slate-300 bg-white p-5 xl:sticky xl:top-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Chương học</h2>
          <p className="mt-1 text-xs text-slate-500">
            Chọn chương để quản lý ngân hàng câu hỏi.
          </p>
        </div>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 rounded bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter) => {
              const expanded = expandedChapterId === chapter.maChuong;
              const active = selectedChapterId === chapter.maChuong;
              return (
                <div
                  key={chapter.maChuong}
                  className={`w-full rounded-md border text-left transition ${active ? "border-sky-400 bg-sky-50/60" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <button
                    type="button"
                    onClick={() => selectChapter(chapter.maChuong)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left"
                  >
                    {expanded ? (
                      <ChevronUp size={17} className="text-sky-600" />
                    ) : (
                      <ChevronDown size={17} className="text-slate-400" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">
                      {chapter.tenChuong}
                    </span>
                  </button>
                  {active ? (
                    <div className="border-t border-slate-200/70 bg-white">
                      {questionLoading ? (
                        <div className="space-y-2 p-3">
                          {[1, 2, 3].map((item) => (
                            <div
                              key={item}
                              className="h-8 animate-pulse rounded bg-slate-100"
                            />
                          ))}
                        </div>
                      ) : questions.length ? (
                        questions.map((question) => (
                          <button
                            key={question.maCauHoi}
                            type="button"
                            onClick={() => selectQuestion(question)}
                            className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm last:border-b-0 ${selectedQuestionId === question.maCauHoi ? "bg-sky-50 font-semibold text-sky-800" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            <span className="font-mono text-[10px] text-slate-400">
                              Q{question.thuTu}
                            </span>
                            <span className="min-w-0 truncate">
                              {question.noiDung}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-3 text-xs italic text-slate-400">
                          Chưa có câu hỏi trong chương này.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </aside>

      <main className="min-w-0">
        <CourseSectionCard title="Câu hỏi trắc nghiệm">
          {selectedChapter ? (
            <div className="space-y-6">
              <div className="flex items-end justify-between border-b border-slate-200 pb-5">
                <div>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                    {selectedChapter.tenChuong}
                  </h2>
                </div>
                {!isLocked ? (
                  <button
                    type="button"
                    onClick={newQuestion}
                    className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                  >
                    <Plus size={15} /> Câu hỏi mới
                  </button>
                ) : null}
              </div>
              <QuestionForm
                form={form}
                selectedQuestionId={selectedQuestionId}
                locked={isLocked}
                saving={saving}
                onChange={changeField}
                onSave={() => void saveQuestion()}
                onDelete={() => void deleteQuestion()}
                onNew={newQuestion}
              />
            </div>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center text-sm text-slate-500">
              Chọn một chương để xem ngân hàng câu hỏi.
            </div>
          )}
        </CourseSectionCard>
      </main>
    </div>
  );
}

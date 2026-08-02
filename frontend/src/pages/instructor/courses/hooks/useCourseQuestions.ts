import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import axiosClient from "../../../../api/axios";

export interface QuizQuestion {
  maCauHoi: number;
  maChuong: number;
  noiDung: string;
  dapAnA: string;
  dapAnB: string;
  dapAnC: string;
  dapAnD: string;
  dapAnDung: "A" | "B" | "C" | "D";
  thuTu: number;
}

export type QuizQuestionForm = Omit<QuizQuestion, "maCauHoi" | "maChuong">;

export const emptyQuestion: QuizQuestionForm = {
  noiDung: "",
  dapAnA: "",
  dapAnB: "",
  dapAnC: "",
  dapAnD: "",
  dapAnDung: "A",
  thuTu: 1,
};

interface ChapterSummary {
  maChuong: number;
}

function readApiData<T>(response: unknown): T | undefined {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data?: T }).data;
  }
  return response as T;
}

function readApiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object" || !("response" in error)) return fallback;
  const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
  const message = response?.data?.message;
  return Array.isArray(message) ? message.join(", ") : message || fallback;
}

export function useCourseQuestions({
  chapters,
  expandedChapterId,
  toggleChapter,
}: {
  chapters: ChapterSummary[];
  expandedChapterId: number | null;
  toggleChapter: (chapterId: number) => void;
}) {
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [form, setForm] = useState<QuizQuestionForm>(emptyQuestion);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedChapterId && chapters[0]) setSelectedChapterId(chapters[0].maChuong);
  }, [chapters, selectedChapterId]);

  useEffect(() => {
    if (!selectedChapterId) return;
    let active = true;
    setQuestionLoading(true);
    void axiosClient
      .get(`/courses/chapters/${selectedChapterId}/questions`)
      .then((response) => {
        if (!active) return;
        const nextQuestions = readApiData<QuizQuestion[]>(response) ?? [];
        setQuestions(nextQuestions);
        const first = nextQuestions[0];
        if (first) {
          selectQuestionData(first);
        } else {
          setSelectedQuestionId(null);
          setForm({ ...emptyQuestion });
        }
      })
      .catch((error) => {
        if (!active) return;
        setQuestions([]);
        setSelectedQuestionId(null);
        setForm({ ...emptyQuestion });
        toast.error(readApiErrorMessage(error, "Không thể tải danh sách câu hỏi"));
      })
      .finally(() => active && setQuestionLoading(false));
    return () => {
      active = false;
    };
  }, [selectedChapterId]);

  const selectQuestionData = (question: QuizQuestion) => {
    setSelectedQuestionId(question.maCauHoi);
    setForm({
      noiDung: question.noiDung,
      dapAnA: question.dapAnA,
      dapAnB: question.dapAnB,
      dapAnC: question.dapAnC,
      dapAnD: question.dapAnD,
      dapAnDung: question.dapAnDung,
      thuTu: question.thuTu,
    });
  };

  const selectChapter = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    setSelectedQuestionId(null);
    setForm({ ...emptyQuestion });
    if (expandedChapterId !== chapterId) toggleChapter(chapterId);
  };

  const changeField = (field: keyof QuizQuestionForm, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const newQuestion = () => {
    setSelectedQuestionId(null);
    setForm({ ...emptyQuestion, thuTu: questions.length + 1 });
  };

  const saveQuestion = async () => {
    if (!selectedChapterId || !form.noiDung.trim()) return;
    setSaving(true);
    try {
      const path = `/courses/chapters/${selectedChapterId}/questions`;
      const response = selectedQuestionId
        ? await axiosClient.patch(`${path}/${selectedQuestionId}`, form)
        : await axiosClient.post(path, form);
      const saved = readApiData<QuizQuestion>(response) ?? ({ ...form, maCauHoi: Date.now() } as QuizQuestion);
      const normalized = { ...form, maCauHoi: saved.maCauHoi ?? selectedQuestionId ?? Date.now(), maChuong: selectedChapterId };
      setQuestions((current) => selectedQuestionId
        ? current.map((question) => question.maCauHoi === selectedQuestionId ? normalized : question)
        : [...current, normalized]);
      if (selectedQuestionId) {
        setSelectedQuestionId(normalized.maCauHoi);
      } else {
        setSelectedQuestionId(null);
        setForm({ ...emptyQuestion, thuTu: questions.length + 2 });
      }
      toast.success(selectedQuestionId ? "Đã cập nhật câu hỏi" : "Đã tạo câu hỏi");
    } catch (error) {
      toast.error(readApiErrorMessage(error, "Không thể lưu câu hỏi. Vui lòng thử lại"));
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async () => {
    if (!selectedChapterId || !selectedQuestionId || !window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) return;
    setSaving(true);
    try {
      await axiosClient.delete(`/courses/chapters/${selectedChapterId}/questions/${selectedQuestionId}`);
      const next = questions.filter((question) => question.maCauHoi !== selectedQuestionId);
      setQuestions(next);
      if (next[0]) selectQuestionData(next[0]);
      else newQuestion();
      toast.success("Đã xóa câu hỏi");
    } catch (error) {
      toast.error(readApiErrorMessage(error, "Không thể xóa câu hỏi. Vui lòng thử lại"));
    } finally {
      setSaving(false);
    }
  };

  return {
    selectedChapterId,
    questions,
    selectedQuestionId,
    form,
    questionLoading,
    saving,
    selectChapter,
    selectQuestion: selectQuestionData,
    changeField,
    newQuestion,
    saveQuestion,
    deleteQuestion,
  };
}

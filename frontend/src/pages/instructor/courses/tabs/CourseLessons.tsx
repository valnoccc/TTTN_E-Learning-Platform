import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit3,
  FileText,
  FolderX,
  GripVertical,
  Link2,
  Loader2,
  PlayCircle,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import React, { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { useCourseCurriculum } from "../hooks/useCourseCurriculum";
import {
  CourseSectionCard,
  useInstructorCourseContext,
} from "../CourseDetailShell";
import type { LessonData } from "../types/curriculum";

// ─── Tooltip wrapper ─────────────────────────────────────────────────────────
function Tooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[200px] -translate-x-1/2 rounded-md bg-slate-800 px-2.5 py-1.5 text-center text-[11px] font-medium leading-tight text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </span>
    </span>
  );
}

// ─── Lesson item icon helper ──────────────────────────────────────────────────
function LessonIcon({ lesson }: { lesson: LessonData }) {
  if (lesson.videoSourceType === "YOUTUBE") {
    return <Link2 size={18} className="shrink-0 text-rose-400" />;
  }
  if (lesson.videoUrl) {
    return <PlayCircle size={18} className="shrink-0 text-emerald-500" />;
  }
  return <FileText size={18} className="shrink-0 text-slate-400" />;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InstructorCourseLessons() {
  const { isLocked } = useInstructorCourseContext();
  const {
    loading,
    chapters,
    expandedChapterId,
    activeAddLessonChapterId,
    newLessonTitle,
    showAddChapterForm,
    newChapterTitle,
    editingChapterId,
    editingChapterTitle,
    setNewLessonTitle,
    setActiveAddLessonChapterId,
    setShowAddChapterForm,
    setNewChapterTitle,
    setEditingChapterTitle,
    toggleChapter,
    handleAddChapter,
    handleAddLesson,
    handleUpdateLesson,
    handleStartEditChapter,
    handleCancelEditChapter,
    handleSaveChapter,
    handleDeleteChapter,
    handleDeleteLesson,
  } = useCourseCurriculum();

  const firstLesson = chapters[0]?.baiHocs?.[0]?.maBH ?? null;
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
    firstLesson,
  );

  useEffect(() => {
    if (!selectedLessonId && firstLesson) {
      setSelectedLessonId(firstLesson);
    }
  }, [firstLesson, selectedLessonId]);

  const selectedLesson = useMemo(
    () =>
      chapters
        .flatMap((chapter) => chapter.baiHocs)
        .find((lesson) => lesson.maBH === selectedLessonId),
    [chapters, selectedLessonId],
  );

  const selectedChapter = chapters.find((chapter) =>
    chapter.baiHocs.some((lesson) => lesson.maBH === selectedLessonId),
  );

  const [lessonForm, setLessonForm] = useState({
    tieu_de: "",
    noi_dung: "",
    thu_tu: 1,
    choPhepXemTruoc: false,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isLessonSaving, setIsLessonSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "lesson" | "chapter";
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedLesson) {
      return;
    }

    setLessonForm({
      tieu_de: selectedLesson.tenBaiHoc,
      noi_dung: selectedLesson.noiDung ?? "",
      thu_tu: selectedLesson.thuTu,
      choPhepXemTruoc: selectedLesson.choPhepXemTruoc ?? false,
    });
    setVideoFile(null);
    setVideoPreview(selectedLesson.videoUrl);
  }, [selectedLesson]);

  const handleLessonFieldChange = (
    field: keyof typeof lessonForm,
    value: string | number | boolean,
  ) => {
    setLessonForm((current) => ({ ...current, [field]: value }));
  };

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSaveLesson = async () => {
    if (!selectedLesson || !lessonForm.tieu_de.trim()) {
      return;
    }

    setIsLessonSaving(true);
    await handleUpdateLesson(selectedLesson.maBH, {
      ...lessonForm,
      tieu_de: lessonForm.tieu_de.trim(),
      video_file: videoFile,
    });
    setIsLessonSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === "lesson") {
      await handleDeleteLesson(deleteTarget.id);
    } else {
      await handleDeleteChapter(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="h-fit min-w-0 border border-slate-300 bg-white p-5 xl:sticky xl:top-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Chương học</h2>
          {!isLocked && !showAddChapterForm ? (
            <button
              type="button"
              onClick={() => setShowAddChapterForm(true)}
              className="inline-flex items-center gap-1 rounded-sm border border-slate-800 bg-white px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100"
            >
              <Plus size={16} /> Thêm chương
            </button>
          ) : null}
        </div>

        {showAddChapterForm ? (
          <div className="mb-4 border border-slate-300 bg-slate-50 p-3">
            <label className="mb-2 block text-xs font-bold text-slate-700">
              Tên chương mới
            </label>
            <input
              value={newChapterTitle}
              onChange={(event) => setNewChapterTitle(event.target.value)}
              placeholder="Ví dụ: Chương 1: Nhập môn"
              className="w-full rounded-sm border border-slate-400 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
              autoFocus
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddChapterForm(false)}
                className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleAddChapter()}
                className="rounded-sm bg-slate-900 px-3 py-2 text-xs font-bold text-white"
              >
                Xác nhận
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 rounded-sm bg-slate-100" />
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
              <FolderX size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              Chưa có chương trình học
            </h3>
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter) => {
              const isExpanded = expandedChapterId === chapter.maChuong;

              return (
                <div
                  key={chapter.maChuong}
                  className={`overflow-hidden rounded-sm border bg-white transition-all duration-200 ${
                    isExpanded
                      ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/20"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  <div
                    className={`flex flex-col gap-3 cursor-pointer select-none px-4 py-3 transition-colors ${
                      isExpanded
                        ? "bg-emerald-50/30"
                        : "bg-slate-50/80 hover:bg-slate-50"
                    }`}
                    onClick={() => toggleChapter(chapter.maChuong)}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className="cursor-grab py-1 text-slate-400 hover:text-slate-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical size={18} />
                        </div>
                        <button
                          className={`shrink-0 transition-colors ${
                            isExpanded ? "text-emerald-600" : "text-slate-500"
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h3
                            className={`break-words text-sm font-bold leading-5 ${
                              isExpanded ? "text-emerald-800" : "text-slate-800"
                            }`}
                          >
                            {chapter.tenChuong}
                          </h3>
                        </div>
                      </div>

                      {!isLocked && isExpanded ? (
                        <div
                          className="ml-3 flex shrink-0 items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              handleStartEditChapter(
                                chapter.maChuong,
                                chapter.tenChuong,
                              )
                            }
                            title="Sửa"
                            className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "chapter",
                              id: chapter.maChuong,
                              name: chapter.tenChuong,
                            })
                          }
                            title="Xóa chương"
                            aria-label="Xóa chương"
                            className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {!isLocked && isExpanded ? (
                      <div
                        className="flex w-full items-center gap-2 border-t border-slate-200/80 pt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            if (expandedChapterId !== chapter.maChuong) {
                              toggleChapter(chapter.maChuong);
                            }
                            setActiveAddLessonChapterId(
                              activeAddLessonChapterId === chapter.maChuong
                                ? null
                                : chapter.maChuong,
                            );
                            setNewLessonTitle("");
                          }}
                          className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                        >
                          <Plus size={16} /> Thêm bài
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {editingChapterId === chapter.maChuong ? (
                    <div className="animate-in slide-in-from-top-2 border-y border-emerald-200 bg-emerald-50/40 p-4 fade-in duration-200">
                      <h4 className="mb-3 text-sm font-bold text-slate-800">
                        Sửa chương
                      </h4>
                      <div className="flex min-w-0 flex-col gap-3">
                        <input
                          type="text"
                          value={editingChapterTitle}
                          onChange={(e) =>
                            setEditingChapterTitle(e.target.value)
                          }
                          placeholder="Ví dụ: Chương 1: Kiến thức nền tảng"
                          className="w-full min-w-0 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleCancelEditChapter}
                            className="rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => void handleSaveChapter()}
                            className="rounded-sm bg-[#1dbf73] px-4 py-2 text-sm font-bold text-white hover:bg-[#169b5c]"
                          >
                            Xác nhận
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      {activeAddLessonChapterId === chapter.maChuong ? (
                        <div className="flex min-w-0 flex-col gap-2 border-y border-slate-100 bg-slate-50/30 px-4 py-3">
                          <input
                            type="text"
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            placeholder="Nhập tên bài học mới..."
                            className="w-full min-w-0 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActiveAddLessonChapterId(null)}
                              className="rounded-sm px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() =>
                                void handleAddLesson(chapter.maChuong)
                              }
                              className="rounded-sm bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
                            >
                              Lưu bài
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="divide-y divide-slate-100 bg-white">
                        {chapter.baiHocs.length === 0 ? (
                          <p className="px-12 py-4 text-sm italic text-slate-400">
                            Hiện tại chưa có bài học nào!
                          </p>
                        ) : (
                          chapter.baiHocs.map((lesson) => {
                            const isRejected = lesson.aiStatus === "REJECTED";

                            return (
                              <div
                                key={lesson.maBH}
                                onClick={() => setSelectedLessonId(lesson.maBH)}
                                className={`group flex cursor-pointer items-center justify-between py-3 pl-12 pr-4 transition-colors ${
                                  selectedLessonId === lesson.maBH
                                    ? "bg-emerald-50/80 ring-1 ring-inset ring-emerald-200"
                                    : ""
                                } ${
                                  isRejected
                                    ? "bg-rose-50/40 hover:bg-rose-50/70"
                                    : "hover:bg-slate-50/70"
                                }`}
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <div className="cursor-grab text-slate-300 transition-colors group-hover:text-slate-400">
                                    <GripVertical size={16} />
                                  </div>

                                  <LessonIcon lesson={lesson} />

                                  {/* Tên bài học — đổi màu đỏ nếu REJECTED */}
                                  <span
                                    className={`min-w-0 flex-1 truncate text-sm font-medium leading-5 ${
                                      isRejected
                                        ? "text-rose-500"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {lesson.tenBaiHoc}
                                  </span>

                                  {/* Warning icon + tooltip nếu REJECTED */}
                                  {isRejected && (
                                    <Tooltip text="Video vi phạm chính sách, cần chỉnh sửa">
                                      <AlertTriangle
                                        size={15}
                                        className="shrink-0 text-rose-500"
                                      />
                                    </Tooltip>
                                  )}

                                  {lesson.thoiLuong > 0 ? (
                                    <span className="ml-auto shrink-0 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                      {Math.round(lesson.thoiLuong / 60)} phút
                                    </span>
                                  ) : null}
                                </div>

                                {!isLocked ? (
                                  <div className="ml-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLessonId(lesson.maBH);
                                      }}
                                      className={`rounded-sm p-1.5 transition-colors ${
                                        isRejected
                                          ? "text-rose-400 hover:bg-rose-100 hover:text-rose-600"
                                          : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                                      }`}
                                      title="Sửa bài học"
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteTarget({
                                          type: "lesson",
                                          id: lesson.maBH,
                                          name: lesson.tenBaiHoc,
                                        });
                                      }}
                                      className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
                                      title="Xóa bài học"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      <main className="min-w-0">
        <CourseSectionCard
          title="Thông tin bài học"
          action={
            selectedLesson ? (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                  selectedLesson.aiStatus === "REJECTED"
                    ? "bg-rose-50 text-rose-600"
                    : selectedLesson.aiStatus === "PROCESSING"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {selectedLesson.aiStatus === "REJECTED"
                  ? "AI từ chối"
                  : selectedLesson.aiStatus === "PROCESSING"
                    ? "Đang kiểm duyệt"
                    : "Sẵn sàng chỉnh sửa"}
              </span>
            ) : null
          }
        >
          {!selectedLesson ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50/60 px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <FileText size={25} />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Chưa chọn bài học
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Chọn bài học trong danh sách để xem thông tin, thay video hoặc
                cập nhật nội dung.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
              {selectedLesson.aiStatus === "REJECTED" &&
              selectedLesson.aiRejectReason ? (
                <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                  <span className="font-bold">Lý do AI từ chối:</span>{" "}
                  {selectedLesson.aiRejectReason}
                </div>
              ) : null}

              <section className="space-y-5 lg:col-span-2">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Tiêu đề bài học
                    </label>
                    <span className="text-xs text-slate-400">
                      {lessonForm.tieu_de.length}/60
                    </span>
                  </div>
                  <input
                    value={lessonForm.tieu_de}
                    maxLength={60}
                    onChange={(event) =>
                      handleLessonFieldChange("tieu_de", event.target.value)
                    }
                    disabled={isLocked || isLessonSaving}
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100"
                    placeholder="Nhập tiêu đề bài học"
                  />
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Thứ tự
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={lessonForm.thu_tu}
                      onChange={(event) =>
                        handleLessonFieldChange(
                          "thu_tu",
                          Number(event.target.value),
                        )
                      }
                      disabled={isLocked || isLessonSaving}
                      className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100"
                    />
                    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        checked={lessonForm.choPhepXemTruoc}
                        onChange={(event) =>
                          handleLessonFieldChange(
                            "choPhepXemTruoc",
                            event.target.checked,
                          )
                        }
                        disabled={isLocked || isLessonSaving}
                        className="mt-0.5 h-4 w-4 accent-emerald-600"
                      />
                      <span className="text-xs font-semibold leading-5 text-slate-600">
                        Cho phép xem trước
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-200 pt-6 lg:col-start-1 lg:order-1">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
                      <Video size={18} className="text-emerald-600" />
                      Video bài giảng
                    </h3>
                  </div>
                  <input
                    id="lesson-video-replace"
                    type="file"
                    accept=".mp4,.webm,video/mp4,video/webm"
                    hidden
                    onChange={handleVideoChange}
                    disabled={isLocked || isLessonSaving}
                  />
                  <label
                    htmlFor="lesson-video-replace"
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 ${
                      isLocked || isLessonSaving
                        ? "pointer-events-none opacity-50"
                        : ""
                    }`}
                  >
                    <Upload size={15} />
                    Thay video
                  </label>
                </div>

                {videoPreview ? (
                  <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-950">
                    <video
                      src={videoPreview}
                      controls
                      controlsList="nodownload"
                      className="max-h-[360px] w-full"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center">
                    <div>
                      <PlayCircle
                        size={28}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        Chưa có video bài giảng
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Chọn “Thay video” để tải nội dung lên.
                      </p>
                    </div>
                  </div>
                )}

                {videoFile ? (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Upload size={14} /> Đã chọn: {videoFile.name}
                  </p>
                ) : null}
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-2 lg:order-3">
                <button
                  type="button"
                  onClick={() => void handleSaveLesson()}
                  disabled={
                    isLocked || isLessonSaving || !lessonForm.tieu_de.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:ml-auto"
                >
                  {isLessonSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isLessonSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>

              <section className="border border-slate-200 bg-slate-50/60 p-4 lg:col-start-2 lg:order-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Label AI kiểm duyệt video
                    </h3>
                  </div>
                </div>

                {selectedLesson.aiLabels &&
                selectedLesson.aiLabels.length > 0 ? (
                  <div className="mt-12 flex flex-wrap gap-2">
                    {selectedLesson.aiLabels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-12 border border-dashed border-slate-300 bg-white px-3 py-3 text-xs text-slate-500">
                    Chưa có label. Video có thể chưa được AI phân tích hoặc chưa
                    phát hiện nhãn nào.
                  </p>
                )}
              </section>
            </div>
          )}
        </CourseSectionCard>
      </main>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
                  Xác nhận xóa {deleteTarget.type === "lesson" ? "bài học" : "chương học"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Bạn có chắc chắn muốn xóa “{deleteTarget.name}” không? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 active:scale-[0.98]"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

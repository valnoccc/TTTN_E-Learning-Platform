import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { ChevronDown, ChevronUp, Edit3, FileText, FolderX, GripVertical, PlayCircle, Plus, Trash2 } from 'lucide-react';

import { useCourseCurriculum } from '../hooks/useCourseCurriculum';
import { useInstructorCourseContext } from '../CourseDetailShell';

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
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(firstLesson);

    useEffect(() => {
        if (!selectedLessonId && firstLesson) {
            setSelectedLessonId(firstLesson);
        }
    }, [firstLesson, selectedLessonId]);

    const selectedLesson = useMemo(
        () => chapters.flatMap((chapter) => chapter.baiHocs).find((lesson) => lesson.maBH === selectedLessonId),
        [chapters, selectedLessonId],
    );

    const selectedChapter = chapters.find((chapter) =>
        chapter.baiHocs.some((lesson) => lesson.maBH === selectedLessonId),
    );

    const [lessonForm, setLessonForm] = useState({
        tieu_de: '',
        noi_dung: '',
        thu_tu: 1,
        choPhepXemTruoc: false,
    });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [isLessonSaving, setIsLessonSaving] = useState(false);

    useEffect(() => {
        if (!selectedLesson) {
            return;
        }

        setLessonForm({
            tieu_de: selectedLesson.tenBaiHoc,
            noi_dung: selectedLesson.noiDung ?? '',
            thu_tu: selectedLesson.thuTu,
            choPhepXemTruoc: selectedLesson.choPhepXemTruoc ?? false,
        });
        setVideoFile(null);
        setVideoPreview(selectedLesson.videoUrl);
    }, [selectedLesson]);

    const handleLessonFieldChange = (field: keyof typeof lessonForm, value: string | number | boolean) => {
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

    return (
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="h-fit border border-slate-300 bg-white p-4 xl:sticky xl:top-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-900">Chương học</h2>
                    {!isLocked && !showAddChapterForm ? (
                        <button
                            type="button"
                            onClick={() => setShowAddChapterForm(true)}
                            className="inline-flex items-center gap-1 rounded-sm border border-slate-800 bg-white px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100"
                        >
                            <Plus size={16} /> Chương
                        </button>
                    ) : null}
                </div>

                {showAddChapterForm ? (
                    <div className="mb-4 border border-slate-300 bg-slate-50 p-3">
                        <label className="mb-2 block text-xs font-bold text-slate-700">Tên chương mới</label>
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
                    <div className="space-y-2" aria-label="Đang tải chương học">
                        {[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse bg-slate-100" />)}
                    </div>
                ) : chapters.length === 0 ? (
                    <div className="border border-dashed border-slate-400 px-4 py-8 text-center">
                        <FolderX size={24} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-sm font-semibold text-slate-600">Chưa có chương học</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {chapters.map((chapter, chapterIndex) => {
                            const isExpanded = expandedChapterId === chapter.maChuong;
                            return (
                                <div key={chapter.maChuong} className="overflow-hidden border border-slate-400 bg-white">
                                    <div
                                        className={`flex items-center justify-between gap-2 px-3 py-3 ${isExpanded ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleChapter(chapter.maChuong)}
                                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                        >
                                            {isExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                                            <span className="truncate text-sm font-bold">{String(chapterIndex + 1).padStart(2, '0')}. {chapter.tenChuong}</span>
                                        </button>
                                        {!isLocked ? (
                                            <div className="flex shrink-0 items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEditChapter(chapter.maChuong, chapter.tenChuong)}
                                                    className="rounded-sm p-1 hover:bg-white/20"
                                                    title="Sửa chương"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDeleteChapter(chapter.maChuong)}
                                                    className="rounded-sm p-1 hover:bg-white/20"
                                                    title="Xóa chương"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    {editingChapterId === chapter.maChuong ? (
                                        <div className="border-t border-slate-300 bg-slate-50 p-3">
                                            <input
                                                value={editingChapterTitle}
                                                onChange={(event) => setEditingChapterTitle(event.target.value)}
                                                className="w-full rounded-sm border border-slate-400 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                                            />
                                            <div className="mt-2 flex justify-end gap-2">
                                                <button type="button" onClick={handleCancelEditChapter} className="px-2 py-1 text-xs font-semibold text-slate-600">Hủy</button>
                                                <button type="button" onClick={() => void handleSaveChapter()} className="rounded-sm bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Lưu</button>
                                            </div>
                                        </div>
                                    ) : null}

                                    {isExpanded ? (
                                        <div className="bg-white">
                                            {chapter.baiHocs.map((lesson) => (
                                                <button
                                                    type="button"
                                                    key={lesson.maBH}
                                                    onClick={() => setSelectedLessonId(lesson.maBH)}
                                                    className={`flex w-full items-center gap-2 border-t border-slate-200 px-3 py-3 text-left text-sm font-semibold ${selectedLessonId === lesson.maBH ? 'bg-slate-200 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                                                >
                                                    {lesson.videoUrl ? <PlayCircle size={16} /> : <FileText size={16} />}
                                                    <span className="truncate">{lesson.tenBaiHoc}</span>
                                                </button>
                                            ))}
                                            {chapter.baiHocs.length === 0 ? <p className="border-t border-slate-200 px-3 py-3 text-xs italic text-slate-500">Chưa có bài học.</p> : null}
                                            {!isLocked ? (
                                                activeAddLessonChapterId === chapter.maChuong ? (
                                                    <div className="border-t border-slate-200 bg-slate-50 p-3">
                                                        <input
                                                            value={newLessonTitle}
                                                            onChange={(event) => setNewLessonTitle(event.target.value)}
                                                            placeholder="Tên bài học mới"
                                                            className="w-full rounded-sm border border-slate-400 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                                                            autoFocus
                                                        />
                                                        <div className="mt-2 flex justify-end gap-2">
                                                            <button type="button" onClick={() => setActiveAddLessonChapterId(null)} className="px-2 py-1 text-xs font-semibold text-slate-600">Hủy</button>
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    const createdLesson = await handleAddLesson(chapter.maChuong);
                                                                    if (createdLesson) {
                                                                        setSelectedLessonId(createdLesson.maBH);
                                                                    }
                                                                }}
                                                                className="rounded-sm bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                                                            >
                                                                Lưu bài
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setActiveAddLessonChapterId(chapter.maChuong); setNewLessonTitle(''); }}
                                                        className="flex w-full items-center gap-2 border-t border-slate-200 px-3 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        <Plus size={15} /> Thêm bài học
                                                    </button>
                                                )
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </aside>

            <section className="min-w-0 border border-slate-300 bg-white p-6 lg:p-8">
                <div className="flex flex-col gap-4 border-b border-slate-300 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="mb-2 text-sm text-slate-500">{selectedChapter?.tenChuong || 'Chương học'} / {selectedLesson?.tenBaiHoc || 'Chưa chọn bài học'}</p>
                        <h2 className="text-2xl font-bold text-slate-900">Thông tin bài học</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {!isLocked && selectedLesson ? (
                            <button type="button" onClick={() => void handleDeleteLesson(selectedLesson.maBH)} className="rounded-sm border border-slate-800 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100">
                                Xóa bài học
                            </button>
                        ) : null}
                        {!isLocked && selectedLesson ? (
                            <button type="button" onClick={() => void handleSaveLesson()} disabled={isLessonSaving} className="rounded-sm bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                                {isLessonSaving ? 'Đang lưu...' : 'Lưu bài học'}
                            </button>
                        ) : null}
                    </div>
                </div>

                {selectedLesson ? (
                    <div className="mt-6 space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-900">Tên bài học *</label>
                            <input
                                value={lessonForm.tieu_de}
                                onChange={(event) => handleLessonFieldChange('tieu_de', event.target.value)}
                                disabled={isLocked}
                                maxLength={60}
                                className="w-full rounded-sm border border-slate-400 bg-white px-4 py-3 text-base text-slate-800 outline-none focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]/20 disabled:bg-slate-50"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-900">Nội dung bài học</label>
                            <textarea
                                value={lessonForm.noi_dung}
                                onChange={(event) => handleLessonFieldChange('noi_dung', event.target.value)}
                                disabled={isLocked}
                                rows={8}
                                placeholder="Nhập nội dung giảng dạy chi tiết..."
                                className="w-full resize-y rounded-sm border border-slate-400 bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]/20 disabled:bg-slate-50"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-900">Video bài giảng</label>
                            <input id="inline-video-upload" type="file" accept="video/*" hidden onChange={handleVideoChange} />
                            {videoPreview ? (
                                <div className="space-y-3 border border-slate-300 bg-slate-50 p-3">
                                    <video src={videoPreview} controls className="max-h-[360px] w-full bg-black" />
                                    {!isLocked ? <button type="button" onClick={() => document.getElementById('inline-video-upload')?.click()} className="rounded-sm border border-slate-700 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100">Thay video</button> : null}
                                </div>
                            ) : (
                                <button type="button" onClick={() => document.getElementById('inline-video-upload')?.click()} className="flex min-h-40 w-full flex-col items-center justify-center border border-dashed border-slate-500 bg-slate-50 px-5 text-center hover:bg-slate-100">
                                    <PlayCircle size={30} className="mb-2 text-slate-700" />
                                    <span className="font-bold text-slate-900">Upload video</span>
                                    <span className="mt-1 text-sm text-slate-500">Định dạng video bài giảng</span>
                                </button>
                            )}
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-900">Thứ tự bài học</label>
                                <input type="number" min="1" value={lessonForm.thu_tu} onChange={(event) => handleLessonFieldChange('thu_tu', event.target.value)} disabled={isLocked} className="w-full rounded-sm border border-slate-400 bg-white px-4 py-3 text-base outline-none focus:border-[#1dbf73] disabled:bg-slate-50" />
                            </div>
                            <label className="flex items-center gap-3 self-end border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                                <input type="checkbox" checked={lessonForm.choPhepXemTruoc} onChange={(event) => handleLessonFieldChange('choPhepXemTruoc', event.target.checked)} disabled={isLocked} className="h-4 w-4 accent-[#1dbf73]" />
                                Cho phép xem trước bài học
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 border border-dashed border-slate-400 bg-slate-50 px-6 py-16 text-center">
                        <FileText size={32} className="mx-auto mb-3 text-slate-400" />
                        <h3 className="font-bold text-slate-800">Chưa chọn bài học</h3>
                        <p className="mt-2 text-sm text-slate-500">Chọn một bài học ở cột bên trái hoặc tạo bài học mới.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

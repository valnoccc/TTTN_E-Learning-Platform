import { ChevronDown, ChevronUp, Plus, GripVertical, PlayCircle, FileText, Trash2, Edit3, FolderX } from 'lucide-react';

import { useCourseCurriculum } from '../hooks/useCourseCurriculum';
import { CourseSectionCard, useInstructorCourseContext } from '../CourseDetailShell';

export default function InstructorCourseLessons() {
    const { navigate, isLocked } = useInstructorCourseContext();
    const {
        loading,
        chapters,
        expandedChapterId,
        activeAddLessonChapterId,
        newLessonTitle,
        showAddChapterForm,
        newChapterTitle,
        setNewLessonTitle,
        setActiveAddLessonChapterId,
        setShowAddChapterForm,
        setNewChapterTitle,
        toggleChapter,
        handleAddChapter,
        handleAddLesson,
        handleDeleteLesson,
    } = useCourseCurriculum();

    return (
        <div className="space-y-6">
            <CourseSectionCard
                title="Chương trình học"
                description="Quản lý chương và bài học của khóa học."
                action={
                    !isLocked && !showAddChapterForm ? (
                        <button
                            onClick={() => setShowAddChapterForm(true)}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-[#1dbf73] px-4 py-2 text-sm font-bold text-white hover:bg-[#169b5c]"
                        >
                            Thêm chương mới
                        </button>
                    ) : null
                }
            >
                {showAddChapterForm ? (
                    <div className="animate-in slide-in-from-top-2 mb-5 rounded-sm border border-emerald-200 bg-emerald-50/40 p-4 fade-in duration-200">
                        <h4 className="mb-3 text-sm font-bold text-slate-800">Tao chuong hoc moi</h4>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="text"
                                value={newChapterTitle}
                                onChange={(e) => setNewChapterTitle(e.target.value)}
                                placeholder="Vi du: Chuong 1: Kien thuc nen tang va thiet lap moi truong"
                                className="flex-1 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowAddChapterForm(false)}
                                    className="rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Huy
                                </button>
                                <button
                                    onClick={() => void handleAddChapter()}
                                    className="rounded-sm bg-[#1dbf73] px-4 py-2 text-sm font-bold text-white hover:bg-[#169b5c]"
                                >
                                    Xac nhan tao
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-14 rounded-sm bg-slate-100" />
                        ))}
                    </div>
                ) : chapters.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-md bg-slate-50/50">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm text-slate-300 mb-3">
                            <FolderX size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">Chưa có chương trình học</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {chapters.map((chapter) => {
                            const isExpanded = expandedChapterId === chapter.maChuong;

                            return (
                                <div
                                    key={chapter.maChuong}
                                    className={`overflow-hidden rounded-sm border bg-white transition-all duration-200 ${isExpanded
                                        ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                                        : 'border-slate-200 shadow-sm'
                                        }`}
                                >
                                    <div
                                        className={`flex cursor-pointer select-none items-center justify-between px-4 py-3 transition-colors ${isExpanded ? 'bg-emerald-50/30' : 'bg-slate-50/80 hover:bg-slate-50'
                                            }`}
                                        onClick={() => toggleChapter(chapter.maChuong)}
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div
                                                className="cursor-grab py-1 text-slate-400 hover:text-slate-600"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <GripVertical size={18} />
                                            </div>
                                            <button
                                                className={`shrink-0 transition-colors ${isExpanded ? 'text-emerald-600' : 'text-slate-500'
                                                    }`}
                                            >
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            <div className="min-w-0">
                                                <h3
                                                    className={`truncate text-sm font-bold ${isExpanded ? 'text-emerald-800' : 'text-slate-800'
                                                        }`}
                                                >
                                                    {chapter.tenChuong}
                                                </h3>
                                                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                    {chapter.baiHocs.length} Bài học
                                                </p>
                                            </div>
                                        </div>

                                        {!isLocked ? (
                                            <div className="ml-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => {
                                                        if (expandedChapterId !== chapter.maChuong) {
                                                            toggleChapter(chapter.maChuong);
                                                        }
                                                        setActiveAddLessonChapterId(
                                                            activeAddLessonChapterId === chapter.maChuong ? null : chapter.maChuong,
                                                        );
                                                        setNewLessonTitle('');
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-100"
                                                >
                                                    <Plus size={16} /> Thêm bài
                                                </button>
                                                <button className="rounded-sm p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button className="rounded-sm p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            {activeAddLessonChapterId === chapter.maChuong ? (
                                                <div className="flex items-center gap-2 border-y border-slate-100 bg-slate-50/30 px-12 py-3">
                                                    <input
                                                        type="text"
                                                        value={newLessonTitle}
                                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                                        placeholder="Nhap ten bai hoc moi..."
                                                        className="flex-1 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => setActiveAddLessonChapterId(null)}
                                                        className="rounded-sm px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
                                                    >
                                                        Huy
                                                    </button>
                                                    <button
                                                        onClick={() => void handleAddLesson(chapter.maChuong)}
                                                        className="rounded-sm bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
                                                    >
                                                        Luu bai
                                                    </button>
                                                </div>
                                            ) : null}

                                            <div className="divide-y divide-slate-100 bg-white">
                                                {chapter.baiHocs.length === 0 ? (
                                                    <p className="px-12 py-4 text-sm italic text-slate-400">
                                                        Hiện tại chưa có bài học nào!
                                                    </p>
                                                ) : (
                                                    chapter.baiHocs.map((lesson) => (
                                                        <div
                                                            key={lesson.maBH}
                                                            className="group flex items-center justify-between py-3 pl-12 pr-4 transition-colors hover:bg-slate-50/70"
                                                        >
                                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                <div className="cursor-grab text-slate-300 transition-colors group-hover:text-slate-400">
                                                                    <GripVertical size={16} />
                                                                </div>
                                                                {lesson.videoUrl ? (
                                                                    <PlayCircle size={18} className="shrink-0 text-emerald-500" />
                                                                ) : (
                                                                    <FileText size={18} className="shrink-0 text-slate-400" />
                                                                )}
                                                                <span className="truncate text-sm font-medium text-slate-700">
                                                                    {lesson.tenBaiHoc}
                                                                </span>
                                                                {lesson.thoiLuong > 0 ? (
                                                                    <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                                                        {Math.round(lesson.thoiLuong / 60)} phut
                                                                    </span>
                                                                ) : null}
                                                            </div>

                                                            {!isLocked ? (
                                                                <div className="ml-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/instructor/lessons/${lesson.maBH}/edit`);
                                                                        }}
                                                                        className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                                                        title="Sua bai hoc"
                                                                    >
                                                                        <Edit3 size={15} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            void handleDeleteLesson(lesson.maBH);
                                                                        }}
                                                                        className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
                                                                        title="Xoa bai hoc"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CourseSectionCard>
        </div>
    );
}

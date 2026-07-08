import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';
import { useInstructorCourseContext } from '../CourseDetailShell';
import { ChapterData, LessonData } from '../types/curriculum';

interface CurriculumApiResponse<T> {
    data?: T;
}

function sortLessons(lessons: LessonData[]) {
    return [...lessons].sort((a, b) => a.thuTu - b.thuTu);
}

function normalizeChapter(chapter: ChapterData): ChapterData {
    return {
        ...chapter,
        baiHocs: Array.isArray(chapter.baiHocs) ? sortLessons(chapter.baiHocs) : [],
    };
}

function unwrapPayload<T>(payload: T | CurriculumApiResponse<T>): T {
    return typeof payload === 'object' && payload !== null && 'data' in payload
        ? (payload.data as T)
        : (payload as T);
}

export function useCourseCurriculum() {
    const { id, isNewCourse } = useInstructorCourseContext();
    const [chapters, setChapters] = useState<ChapterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedChapterId, setExpandedChapterId] = useState<number | null>(null);
    const [activeAddLessonChapterId, setActiveAddLessonChapterId] = useState<number | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [showAddChapterForm, setShowAddChapterForm] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
    const [editingChapterTitle, setEditingChapterTitle] = useState('');

    useEffect(() => {
        if (isNewCourse || !id) {
            setLoading(false);
            return;
        }

        const fetchCurriculum = async () => {
            try {
                const response = await axiosClient.get<ChapterData[] | CurriculumApiResponse<ChapterData[]>>(
                    `/courses/${id}/curriculum`,
                );
                const data = unwrapPayload(response) ?? [];

                const sortedData = [...data].sort((a, b) => a.thuTu - b.thuTu).map(normalizeChapter);

                setChapters(sortedData);

                if (sortedData.length > 0) {
                    const savedChapterId = sessionStorage.getItem('expandedChapterId');
                    if (savedChapterId && sortedData.some(c => c.maChuong.toString() === savedChapterId)) {
                        setExpandedChapterId(Number(savedChapterId));
                    } else {
                        setExpandedChapterId(sortedData[0].maChuong);
                    }
                }
            } catch (error) {
                console.error('Loi tai chuong trinh hoc:', error);
                toast.error('Khong the tai chuong trinh hoc cua khoa hoc nay.');
            } finally {
                setLoading(false);
            }
        };

        void fetchCurriculum();
    }, [id, isNewCourse]);

    const toggleChapter = (chapterId: number) => {
        setExpandedChapterId((prev) => {
            const next = prev === chapterId ? null : chapterId;
            if (next) {
                sessionStorage.setItem('expandedChapterId', next.toString());
            } else {
                sessionStorage.removeItem('expandedChapterId');
            }
            return next;
        });
    };

    const handleAddChapter = async () => {
        if (!newChapterTitle.trim()) {
            toast.error('Ten chuong khong duoc de trong!');
            return;
        }

        try {
            const nextOrder = chapters.length + 1;
            const response = await axiosClient.post<ChapterData | CurriculumApiResponse<ChapterData>>(
                `/courses/${id}/chapters`,
                { tenChuong: newChapterTitle, thuTu: nextOrder },
            );
            const createdChapter = normalizeChapter(unwrapPayload(response));

            setChapters((prev) => [...prev, createdChapter]);
            setNewChapterTitle('');
            setShowAddChapterForm(false);
            setExpandedChapterId(createdChapter.maChuong);
            sessionStorage.setItem('expandedChapterId', createdChapter.maChuong.toString());
            toast.success('Da them chuong hoc moi thanh cong!');
        } catch {
            toast.error('Loi khi them chuong hoc moi.');
        }
    };

    const handleAddLesson = async (chapterId: number) => {
        if (!newLessonTitle.trim()) {
            toast.error('Ten bai hoc khong duoc de trong!');
            return;
        }

        try {
            const currentChapter = chapters.find((chapter) => chapter.maChuong === chapterId);
            const nextOrder = currentChapter ? currentChapter.baiHocs.length + 1 : 1;
            const response = await axiosClient.post<LessonData | CurriculumApiResponse<LessonData>>(
                `/courses/chapters/${chapterId}/lessons`,
                { maKH: Number(id), tenBaiHoc: newLessonTitle, thuTu: nextOrder },
            );
            const createdLesson = unwrapPayload(response);

            setChapters((prev) =>
                prev.map((chapter) =>
                    chapter.maChuong === chapterId
                        ? {
                            ...chapter,
                            baiHocs: sortLessons([...chapter.baiHocs, createdLesson]),
                        }
                        : chapter,
                ),
            );

            setNewLessonTitle('');
            setActiveAddLessonChapterId(null);
            setExpandedChapterId(chapterId);
            sessionStorage.setItem('expandedChapterId', chapterId.toString());
            toast.success('Da them bai hoc moi!');
        } catch {
            toast.error('Loi khi tao bai hoc.');
        }
    };

    const handleDeleteLesson = async (lessonId: number) => {
        if (!window.confirm('Ban co chac chan muon xoa bai hoc nay?')) {
            return;
        }

        try {
            await axiosClient.delete(`/lessons/${lessonId}`);
            setChapters((prev) =>
                prev.map((chapter) => ({
                    ...chapter,
                    baiHocs: chapter.baiHocs.filter((lesson) => lesson.maBH !== lessonId),
                })),
            );
            toast.success('Da xoa bai hoc thanh cong!');
        } catch {
            toast.error('Loi khi xoa bai hoc.');
        }
    };

    const handleStartEditChapter = (chapterId: number, currentTitle: string) => {
        setEditingChapterId(chapterId);
        setEditingChapterTitle(currentTitle);
        setShowAddChapterForm(false);
    };

    const handleCancelEditChapter = () => {
        setEditingChapterId(null);
        setEditingChapterTitle('');
    };

    const handleSaveChapter = async () => {
        if (!editingChapterId) {
            return;
        }

        const nextTitle = editingChapterTitle.trim();
        if (!nextTitle) {
            toast.error('Ten chuong khong duoc de trong!');
            return;
        }

        try {
            const response = await axiosClient.patch<ChapterData | CurriculumApiResponse<ChapterData>>(
                `/courses/chapters/${editingChapterId}`,
                { tenChuong: nextTitle },
            );
            const updatedChapter = normalizeChapter(unwrapPayload(response));

            setChapters((prev) =>
                prev.map((chapter) =>
                    chapter.maChuong === editingChapterId ? updatedChapter : chapter,
                ),
            );
            handleCancelEditChapter();
            toast.success('Da cap nhat chuong hoc!');
        } catch {
            toast.error('Loi khi cap nhat chuong hoc.');
        }
    };

    const handleDeleteChapter = async (chapterId: number) => {
        if (!window.confirm('Ban co chac chan muon xoa chuong hoc nay?')) {
            return;
        }

        try {
            await axiosClient.delete(`/courses/chapters/${chapterId}`);
            const nextChapters = chapters.filter((chapter) => chapter.maChuong !== chapterId);

            setChapters(nextChapters);
            setActiveAddLessonChapterId((current) => (current === chapterId ? null : current));
            setEditingChapterId((current) => (current === chapterId ? null : current));
            if (editingChapterId === chapterId) {
                setEditingChapterTitle('');
            }
            setExpandedChapterId((current) => {
                if (current !== chapterId) {
                    return current;
                }

                return nextChapters[0]?.maChuong ?? null;
            });
            toast.success('Da xoa chuong hoc thanh cong!');
        } catch {
            toast.error('Loi khi xoa chuong hoc.');
        }
    };

    return {
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
        handleStartEditChapter,
        handleCancelEditChapter,
        handleSaveChapter,
        handleDeleteChapter,
        handleDeleteLesson,
    };
}

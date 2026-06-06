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
                    setExpandedChapterId(sortedData[0].maChuong);
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
        setExpandedChapterId((prev) => (prev === chapterId ? null : chapterId));
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

    return {
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
    };
}

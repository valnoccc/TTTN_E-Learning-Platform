import { useCallback, useEffect, useRef, useState } from 'react';
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
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Giữ bản sao mới nhất của chapters để so sánh mà không gây re-render
    const chaptersRef = useRef<ChapterData[]>([]);

    const hasProcessingLessons = (data: ChapterData[]) =>
        data.some(ch =>
            ch.baiHocs.some(
                (l) => l.aiStatus === 'PROCESSING' || l.aiStatus === 'PENDING',
            ),
        );

    const fetchCurriculum = useCallback(async (isInitial = false) => {
        try {
            const response = await axiosClient.get<ChapterData[] | CurriculumApiResponse<ChapterData[]>>(
                `/courses/${id}/curriculum`,
            );
            const data = unwrapPayload(response) ?? [];
            const sortedData = [...data].sort((a, b) => a.thuTu - b.thuTu).map(normalizeChapter);

            if (isInitial) {
                // Lần đầu: luôn cập nhật UI
                chaptersRef.current = sortedData;
                setChapters(sortedData);
                if (sortedData.length > 0) {
                    const savedChapterId = sessionStorage.getItem('expandedChapterId');
                    if (savedChapterId && sortedData.some(c => c.maChuong.toString() === savedChapterId)) {
                        setExpandedChapterId(Number(savedChapterId));
                    } else {
                        setExpandedChapterId(sortedData[0].maChuong);
                    }
                }
            } else {
                // Polling: chỉ cập nhật UI khi có trạng thái AI nào đó thay đổi
                const prev = chaptersRef.current;
                const hasChange = sortedData.some(newCh => {
                    const oldCh = prev.find(c => c.maChuong === newCh.maChuong);
                    if (!oldCh) return true;
                    return newCh.baiHocs.some(newL => {
                        const oldL = oldCh.baiHocs.find(l => l.maBH === newL.maBH);
                        return !oldL || oldL.aiStatus !== newL.aiStatus;
                    });
                });
                if (hasChange) {
                    chaptersRef.current = sortedData;
                    setChapters(sortedData);
                }
            }

            // Kiểm tra có bài đang chờ không để quyết định tiếp tục hay dừng polling
            if (hasProcessingLessons(sortedData)) {
                if (!pollingRef.current) {
                    pollingRef.current = setInterval(() => {
                        void fetchCurriculum(false);
                    }, 5000);
                }
            } else {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            }
        } catch (error) {
            console.error('Loi tai chuong trinh hoc:', error);
            if (isInitial) toast.error('Khong the tai chuong trinh hoc cua khoa hoc nay.');
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (isNewCourse || !id) {
            setLoading(false);
            return;
        }
        void fetchCurriculum(true);
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [id, isNewCourse, fetchCurriculum]);

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
            toast.success('Đã thêm chương học mới thành công!');
        } catch {
            toast.error('Lỗi khi thêm chương học mới.');
        }
    };

    const handleAddLesson = async (chapterId: number) => {
        if (!newLessonTitle.trim()) {
            toast.error('Tên bài học không được để trống!');
            return null;
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
            toast.success('Đã thêm bài học mới!');
            return createdLesson;
        } catch {
            toast.error('Lỗi khi tạo bài học.');
            return null;
        }
    };

    const handleUpdateLesson = async (
        lessonId: number,
        payload: {
            tieu_de: string;
            noi_dung: string;
            thu_tu: number | string;
            choPhepXemTruoc: boolean;
            video_file?: File | null;
        },
    ) => {
        const data = new FormData();
        data.append('tieu_de', payload.tieu_de);
        data.append('noi_dung', payload.noi_dung);
        data.append('thu_tu', String(payload.thu_tu));
        data.append('choPhepXemTruoc', String(payload.choPhepXemTruoc));
        if (payload.video_file) {
            data.append('video', payload.video_file);
        }

        try {
            await axiosClient.put(`/lessons/${lessonId}`, data);
            setChapters((prev) => prev.map((chapter) => ({
                ...chapter,
                baiHocs: chapter.baiHocs.map((lesson) => lesson.maBH === lessonId
                    ? {
                        ...lesson,
                        tenBaiHoc: payload.tieu_de,
                        noiDung: payload.noi_dung,
                        thuTu: Number(payload.thu_tu),
                        choPhepXemTruoc: payload.choPhepXemTruoc,
                        videoUrl: payload.video_file ? URL.createObjectURL(payload.video_file) : lesson.videoUrl,
                    }
                    : lesson),
            })));
            toast.success('Đã cập nhật nội dung bài học thành công!');
            return true;
        } catch (error: unknown) {
            console.error('[CourseCurriculum] Không thể cập nhật bài học:', error);
            const responseData = (error as {
                response?: { data?: { message?: string | string[] } };
            })?.response?.data;
            const responseMessage = responseData?.message;
            const message = Array.isArray(responseMessage)
                ? responseMessage.join(', ')
                : responseMessage || 'Lỗi khi cập nhật bài học.';
            toast.error(message);
            return false;
        }
    };

    const handleDeleteLesson = async (lessonId: number) => {
        try {
            await axiosClient.delete(`/lessons/${lessonId}`);
            setChapters((prev) =>
                prev.map((chapter) => ({
                    ...chapter,
                    baiHocs: chapter.baiHocs.filter((lesson) => lesson.maBH !== lessonId),
                })),
            );
            toast.success('Đã xóa bài học thành công!');
        } catch {
            toast.error('Lỗi khi xóa bài học.');
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
            toast.error('Tên chương không được để trống!');
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
            toast.success('Đã cập nhật chương học!');
        } catch {
            toast.error('Lỗi khi cập nhật chương học.');
        }
    };

    const handleDeleteChapter = async (chapterId: number) => {
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
            toast.success('Đã xóa chương học thành công!');
        } catch {
            toast.error('Lỗi khi xóa chương học.');
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
        handleUpdateLesson,
        handleStartEditChapter,
        handleCancelEditChapter,
        handleSaveChapter,
        handleDeleteChapter,
        handleDeleteLesson,
    };
}

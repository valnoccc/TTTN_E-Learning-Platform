import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export interface InstructorCourseDiscussion {
    discussionId: number;
    content: string;
    createdAt: string;
    parentId: number | null;
    userId: number;
    userName: string;
    userAvatar: string | null;
    userRole?: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
    courseId: number;
    courseTitle: string;
}

interface InstructorCourseOption {
    id: number;
    title: string;
}

interface InstructorCoursePayload {
    id?: number | string;
    maKH?: number | string;
    ten_khoa_hoc?: string;
    tenKhoaHoc?: string;
}

type ReplyStatusFilter = 'unreplied' | 'replied' | 'all';

const DISCUSSIONS_PER_PAGE = 10;

function unwrapDiscussions(response: unknown): InstructorCourseDiscussion[] {
    if (Array.isArray(response)) {
        return response as InstructorCourseDiscussion[];
    }

    if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        (response as { data?: unknown }).data &&
        typeof (response as { data?: unknown }).data === 'object' &&
        'data' in ((response as { data: object }).data) &&
        Array.isArray(((response as { data: { data?: unknown } }).data).data)
    ) {
        return (response as { data: { data: InstructorCourseDiscussion[] } }).data.data;
    }

    if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        Array.isArray((response as { data?: unknown }).data)
    ) {
        return (response as { data: InstructorCourseDiscussion[] }).data;
    }

    return [];
}

function unwrapDiscussion(response: unknown): InstructorCourseDiscussion | null {
    if (
        response &&
        typeof response === 'object' &&
        'discussionId' in response
    ) {
        return response as InstructorCourseDiscussion;
    }

    if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        (response as { data?: unknown }).data &&
        typeof (response as { data?: unknown }).data === 'object' &&
        'data' in ((response as { data: object }).data) &&
        ((response as { data: { data?: unknown } }).data).data &&
        typeof ((response as { data: { data?: unknown } }).data).data === 'object'
    ) {
        return (response as { data: { data: InstructorCourseDiscussion } }).data.data;
    }

    if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        (response as { data?: unknown }).data &&
        typeof (response as { data?: unknown }).data === 'object'
    ) {
        return (response as { data: InstructorCourseDiscussion }).data;
    }

    return null;
}

function unwrapCourses(response: unknown): InstructorCourseOption[] {
    const rawCourses = (() => {
        if (Array.isArray(response)) {
            return response as InstructorCoursePayload[];
        }

        if (
            response &&
            typeof response === 'object' &&
            'data' in response &&
            Array.isArray((response as { data?: unknown }).data)
        ) {
            return (response as { data: InstructorCoursePayload[] }).data;
        }

        return [];
    })();

    return rawCourses
        .map((course) => {
            const id = Number(course.id ?? course.maKH);
            const title = course.ten_khoa_hoc ?? course.tenKhoaHoc ?? '';

            if (!Number.isFinite(id) || !title) {
                return null;
            }

            return { id, title };
        })
        .filter((course): course is InstructorCourseOption => course !== null);
}

export function useInstructorCourseDiscussions() {
    const [discussions, setDiscussions] = useState<InstructorCourseDiscussion[]>([]);
    const [courses, setCourses] = useState<InstructorCourseOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [replyStatusFilter, setReplyStatusFilter] = useState<ReplyStatusFilter>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [discussionsResponse, coursesResponse] = await Promise.all([
                    axiosClient.get('/courses/discussions'),
                    axiosClient.get('/courses/my-courses'),
                ]);
                setDiscussions(unwrapDiscussions(discussionsResponse));
                setCourses(unwrapCourses(coursesResponse));
            } catch {
                toast.error('Không thể tải danh sách hỏi đáp khóa học');
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, []);

    const rootDiscussions = useMemo(
        () => discussions.filter((discussion) => discussion.parentId === null),
        [discussions],
    );

    const replyMap = useMemo(() => {
        const map = new Map<number, InstructorCourseDiscussion[]>();
        discussions
            .filter((discussion) => discussion.parentId !== null)
            .forEach((discussion) => {
                const parentId = Number(discussion.parentId);
                const current = map.get(parentId) ?? [];
                current.push(discussion);
                map.set(parentId, current);
            });

        map.forEach((items) => {
            items.sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
        });

        return map;
    }, [discussions]);

    const getReplies = (parentId: number) => replyMap.get(parentId) ?? [];

    const courseOptions = useMemo(() => {
        if (courses.length > 0) {
            return courses;
        }

        const map = new Map<number, string>();
        rootDiscussions.forEach((discussion) => {
            map.set(discussion.courseId, discussion.courseTitle);
        });
        return Array.from(map, ([id, title]) => ({ id, title }));
    }, [courses, rootDiscussions]);

    const filteredDiscussions = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return rootDiscussions.filter((discussion) => {
            const replies = replyMap.get(discussion.discussionId) ?? [];
            const matchesSearch =
                !normalizedSearch ||
                discussion.content?.toLowerCase().includes(normalizedSearch) ||
                discussion.userName?.toLowerCase().includes(normalizedSearch) ||
                discussion.courseTitle?.toLowerCase().includes(normalizedSearch);

            const matchesCourse =
                !selectedCourseId || String(discussion.courseId) === selectedCourseId;

            const matchesReplyStatus =
                replyStatusFilter === 'all' ||
                (replyStatusFilter === 'replied' && replies.length > 0) ||
                (replyStatusFilter === 'unreplied' && replies.length === 0);

            return matchesSearch && matchesCourse && matchesReplyStatus;
        });
    }, [replyMap, replyStatusFilter, rootDiscussions, searchTerm, selectedCourseId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [replyStatusFilter, searchTerm, selectedCourseId]);

    const totalPages = Math.max(1, Math.ceil(filteredDiscussions.length / DISCUSSIONS_PER_PAGE));
    const indexOfFirst = (currentPage - 1) * DISCUSSIONS_PER_PAGE;
    const indexOfLast = indexOfFirst + DISCUSSIONS_PER_PAGE;
    const currentDiscussions = filteredDiscussions.slice(indexOfFirst, indexOfLast);
    const unrepliedCount = rootDiscussions.filter(
        (discussion) => (replyMap.get(discussion.discussionId) ?? []).length === 0,
    ).length;

    const handleStartReply = (discussionId: number) => {
        setReplyingTo((current) => (current === discussionId ? null : discussionId));
        setReplyContent('');
    };

    const handleSubmitReply = async (discussion: InstructorCourseDiscussion) => {
        const trimmedContent = replyContent.trim();
        if (!trimmedContent) {
            toast.error('Vui lòng nhập nội dung phản hồi');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axiosClient.post(`/courses/${discussion.courseId}/discussions`, {
                noiDung: trimmedContent,
                parentId: discussion.discussionId,
            });
            const reply = unwrapDiscussion(response);

            if (!reply) {
                throw new Error('Invalid discussion reply response');
            }

            setDiscussions((current) => [
                ...current,
                {
                    ...reply,
                    courseId: reply.courseId ?? discussion.courseId,
                    courseTitle: reply.courseTitle ?? discussion.courseTitle,
                },
            ]);
            setReplyingTo(null);
            setReplyContent('');
            setExpandedReplies((current) => ({ ...current, [discussion.discussionId]: true }));
            toast.success('Đã gửi phản hồi hỏi đáp');
        } catch {
            toast.error('Lỗi khi gửi phản hồi hỏi đáp');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDiscussion = async (discussionId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
            return;
        }

        try {
            await axiosClient.delete(`/courses/discussions/${discussionId}`);
            setDiscussions((current) =>
                current.filter((discussion) => discussion.discussionId !== discussionId),
            );
            toast.success('Đã xóa bình luận');
        } catch {
            toast.error('Không thể xóa bình luận này');
        }
    };

    const toggleReplies = (discussionId: number) => {
        setExpandedReplies((current) => ({
            ...current,
            [discussionId]: !current[discussionId],
        }));
    };

    return {
        loading,
        searchTerm,
        selectedCourseId,
        replyStatusFilter,
        currentPage,
        totalPages,
        totalDiscussions: rootDiscussions.length,
        unrepliedCount,
        courseOptions,
        filteredDiscussions,
        currentDiscussions,
        indexOfFirst,
        indexOfLast,
        replyingTo,
        replyContent,
        isSubmitting,
        expandedReplies,
        setSearchTerm,
        setSelectedCourseId,
        setReplyStatusFilter,
        setCurrentPage,
        setReplyContent,
        handleStartReply,
        handleSubmitReply,
        handleDeleteDiscussion,
        getReplies,
        toggleReplies,
    };
}

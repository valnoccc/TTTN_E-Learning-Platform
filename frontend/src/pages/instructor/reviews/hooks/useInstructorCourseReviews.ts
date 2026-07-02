import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export interface InstructorCourseReview {
    reviewId: number;
    rating: number;
    content: string;
    createdAt: string;
    parentId: number | null;
    studentId: number;
    studentName: string;
    studentAvatar: string | null;
    courseId: number;
    courseTitle: string;
    isReported?: boolean;
    reportReason?: string | null;
}

type RatingFilter = '' | '5' | '4' | 'low';

const REVIEWS_PER_PAGE = 10;

function unwrapReviews(response: unknown): InstructorCourseReview[] {
    if (Array.isArray(response)) {
        return response as InstructorCourseReview[];
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
        return (response as { data: { data: InstructorCourseReview[] } }).data.data;
    }

    if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        Array.isArray((response as { data?: unknown }).data)
    ) {
        return (response as { data: InstructorCourseReview[] }).data;
    }

    return [];
}

function unwrapReview(response: unknown): InstructorCourseReview | null {
    if (
        response &&
        typeof response === 'object' &&
        'reviewId' in response
    ) {
        return response as InstructorCourseReview;
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
        return (response as { data: { data: InstructorCourseReview } }).data.data;
    }

    if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        (response as { data?: unknown }).data &&
        typeof (response as { data?: unknown }).data === 'object'
    ) {
        return (response as { data: InstructorCourseReview }).data;
    }

    return null;
}

export function useInstructorCourseReviews() {
    const [reviews, setReviews] = useState<InstructorCourseReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await axiosClient.get('/courses/reviews');
                setReviews(unwrapReviews(response));
            } catch {
                toast.error('Không thể tải danh sách đánh giá khóa học');
            } finally {
                setLoading(false);
            }
        };

        void fetchReviews();
    }, []);

    const rootReviews = useMemo(
        () => reviews.filter((review) => review.parentId === null),
        [reviews],
    );

    const getReplies = (parentId: number) =>
        reviews
            .filter((review) => review.parentId === parentId)
            .sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );

    const courseOptions = useMemo(() => {
        const map = new Map<number, string>();
        rootReviews.forEach((review) => {
            map.set(review.courseId, review.courseTitle);
        });
        return Array.from(map, ([id, title]) => ({ id, title }));
    }, [rootReviews]);

    const filteredReviews = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return rootReviews.filter((review) => {
            const matchesSearch =
                !normalizedSearch ||
                review.content?.toLowerCase().includes(normalizedSearch) ||
                review.studentName?.toLowerCase().includes(normalizedSearch) ||
                review.courseTitle?.toLowerCase().includes(normalizedSearch);

            const matchesCourse =
                !selectedCourseId || String(review.courseId) === selectedCourseId;

            const matchesRating =
                !ratingFilter ||
                (ratingFilter === 'low'
                    ? review.rating >= 1 && review.rating <= 3
                    : String(review.rating) === ratingFilter);

            return matchesSearch && matchesCourse && matchesRating;
        });
    }, [ratingFilter, rootReviews, searchTerm, selectedCourseId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [ratingFilter, searchTerm, selectedCourseId]);

    const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
    const indexOfFirst = (currentPage - 1) * REVIEWS_PER_PAGE;
    const indexOfLast = indexOfFirst + REVIEWS_PER_PAGE;
    const currentReviews = filteredReviews.slice(indexOfFirst, indexOfLast);

    const totalReviews = rootReviews.length;
    const averageRating =
        totalReviews > 0
            ? (
                rootReviews.reduce((sum, review) => sum + review.rating, 0) /
                totalReviews
            ).toFixed(1)
            : '0.0';
    const unrepliedCount = rootReviews.filter(
        (review) => getReplies(review.reviewId).length === 0,
    ).length;

    const handleStartReply = (reviewId: number) => {
        setReplyingTo((current) => (current === reviewId ? null : reviewId));
        setReplyContent('');
    };

    const handleSubmitReply = async (review: InstructorCourseReview) => {
        const trimmedContent = replyContent.trim();
        if (!trimmedContent) {
            toast.error('Vui lòng nhập nội dung phản hồi');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axiosClient.post(`/courses/${review.courseId}/reviews`, {
                noiDung: trimmedContent,
                parentId: review.reviewId,
            });
            const reply = unwrapReview(response);

            if (!reply) {
                throw new Error('Invalid reply response');
            }

            setReviews((current) => [
                ...current,
                {
                    ...reply,
                    courseId: reply.courseId ?? review.courseId,
                    courseTitle: reply.courseTitle ?? review.courseTitle,
                },
            ]);
            setReplyingTo(null);
            setReplyContent('');
            setExpandedReplies((current) => ({ ...current, [review.reviewId]: true }));
            toast.success('Đã gửi phản hồi đánh giá');
        } catch {
            toast.error('Lỗi khi gửi phản hồi đánh giá');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) {
            return;
        }

        try {
            await axiosClient.delete(`/courses/reviews/${reviewId}`);
            setReviews((current) =>
                current.filter((review) => review.reviewId !== reviewId),
            );
            toast.success('Đã xóa phản hồi đánh giá');
        } catch {
            toast.error('Không thể xóa phản hồi này');
        }
    };

    const toggleReplies = (reviewId: number) => {
        setExpandedReplies((current) => ({
            ...current,
            [reviewId]: !current[reviewId],
        }));
    };

    return {
        loading,
        searchTerm,
        selectedCourseId,
        ratingFilter,
        currentPage,
        totalPages,
        totalReviews,
        averageRating,
        unrepliedCount,
        courseOptions,
        filteredReviews,
        currentReviews,
        indexOfFirst,
        indexOfLast,
        replyingTo,
        replyContent,
        isSubmitting,
        expandedReplies,
        setSearchTerm,
        setSelectedCourseId,
        setRatingFilter,
        setCurrentPage,
        setReplyContent,
        handleStartReply,
        handleSubmitReply,
        handleDeleteReview,
        getReplies,
        toggleReplies,
    };
}

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';
import {
    fetchAdminCourseModerationDetail,
    type AdminCourseModerationDetail,
    type AdminModerationLesson,
} from './useAdminCourseModeration';

export type AdminCourseAction = 'reject' | 'ban' | 'hide';

export const REVIEW_PAGE_SIZE = 5;

export const actionConfig: Record<AdminCourseAction, {
    title: string;
    description: string;
    endpoint: (courseId: number) => string;
    successMessage: string;
    confirmLabel: string;
    placeholder: string;
}> = {
    reject: {
        title: 'Từ chối khóa học',
        description: 'Nhập lý do từ chối để giảng viên biết những nội dung cần chỉnh sửa.',
        endpoint: (courseId) => `/admin/courses/${courseId}/reject`,
        successMessage: 'Đã từ chối khóa học.',
        confirmLabel: 'Xác nhận từ chối',
        placeholder: 'Ví dụ: Cần bổ sung nội dung bài học, mô tả khóa học chưa rõ, video chưa phù hợp...',
    },
    ban: {
        title: 'Ban khóa học',
        description: 'Nhập lý do ban khóa học để giảng viên biết nội dung vi phạm.',
        endpoint: (courseId) => `/admin/courses/${courseId}/ban`,
        successMessage: 'Đã ban khóa học.',
        confirmLabel: 'Xác nhận ban',
        placeholder: 'Ví dụ: Nội dung khóa học vi phạm chính sách, thông tin sai lệch hoặc không đáp ứng yêu cầu hệ thống...',
    },
    hide: {
        title: 'Ẩn khóa học',
        description: 'Nhập lý do ẩn khóa học để giảng viên chỉnh sửa và gửi duyệt lại nếu cần.',
        endpoint: (courseId) => `/admin/courses/${courseId}/hide`,
        successMessage: 'Đã ẩn khóa học.',
        confirmLabel: 'Xác nhận ẩn',
        placeholder: 'Ví dụ: Khóa học cần tạm ẩn để cập nhật bài học, video hoặc nội dung mô tả...',
    },
};

export function useAdminCourseDetail(courseId: number) {
    const [course, setCourse] = useState<AdminCourseModerationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedChapterId, setExpandedChapterId] = useState<number | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<AdminModerationLesson | null>(null);
    const [activeAction, setActiveAction] = useState<AdminCourseAction | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [reviewPage, setReviewPage] = useState(1);
    const [expandedReplyIds, setExpandedReplyIds] = useState<Set<number>>(() => new Set());

    const rootReviews = useMemo(() => {
        return course?.reviews.filter((review) => review.parentId === null) ?? [];
    }, [course]);

    const replyMap = useMemo(() => {
        const map = new Map<number, NonNullable<typeof course>['reviews']>();
        for (const review of course?.reviews ?? []) {
            if (review.parentId == null) {
                continue;
            }
            const replies = map.get(review.parentId) ?? [];
            replies.push(review);
            map.set(review.parentId, replies);
        }
        return map;
    }, [course]);

    const reviewPageCount = Math.max(1, Math.ceil(rootReviews.length / REVIEW_PAGE_SIZE));

    const paginatedRootReviews = useMemo(() => {
        const start = (reviewPage - 1) * REVIEW_PAGE_SIZE;
        return rootReviews.slice(start, start + REVIEW_PAGE_SIZE);
    }, [rootReviews, reviewPage]);

    useEffect(() => {
        setReviewPage((currentPage) => Math.min(currentPage, reviewPageCount));
    }, [reviewPageCount]);

    useEffect(() => {
        const availableReviewIds = new Set(rootReviews.map((review) => review.reviewId));
        setExpandedReplyIds((currentIds) => {
            const nextIds = new Set<number>();
            currentIds.forEach((reviewId) => {
                if (availableReviewIds.has(reviewId)) {
                    nextIds.add(reviewId);
                }
            });
            return nextIds;
        });
    }, [rootReviews]);

    const toggleReplies = (reviewId: number) => {
        setExpandedReplyIds((currentIds) => {
            const nextIds = new Set(currentIds);
            if (nextIds.has(reviewId)) {
                nextIds.delete(reviewId);
            } else {
                nextIds.add(reviewId);
            }
            return nextIds;
        });
    };

    const loadDetail = async () => {
        if (!Number.isFinite(courseId) || courseId <= 0) {
            setLoading(false);
            toast.error('Mã khóa học không hợp lệ.');
            return;
        }

        setLoading(true);
        try {
            const detail = await fetchAdminCourseModerationDetail(courseId);
            setCourse(detail);
            const firstChapter = detail?.curriculum[0] ?? null;
            setExpandedChapterId(firstChapter?.maChuong ?? null);
            setSelectedLesson(firstChapter?.baiHocs[0] ?? null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể tải chi tiết khóa học.');
            setCourse(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDetail();
    }, [courseId]);

    const handleApprove = async () => {
        try {
            await axiosClient.patch(`/admin/courses/${courseId}/approve`);
            toast.success('Đã phê duyệt khóa học.');
            await loadDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể phê duyệt khóa học.');
        }
    };

    const handleAction = async () => {
        if (!activeAction) {
            return;
        }

        const config = actionConfig[activeAction];
        try {
            await axiosClient.patch(config.endpoint(courseId), { lyDo: actionReason });
            toast.success(config.successMessage);
            setActiveAction(null);
            setActionReason('');
            await loadDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể xử lý khóa học.');
        }
    };

    const canApproveOrReject = course?.trangThai === 'PENDING';
    const canBanOrHide = course?.trangThai === 'PUBLISHED';
    const action = activeAction ? actionConfig[activeAction] : null;

    return {
        action,
        actionReason,
        canApproveOrReject,
        canBanOrHide,
        course,
        expandedChapterId,
        expandedReplyIds,
        handleAction,
        handleApprove,
        loading,
        paginatedRootReviews,
        replyMap,
        reviewPage,
        reviewPageCount,
        rootReviews,
        selectedLesson,
        setActionReason,
        setActiveAction,
        setExpandedChapterId,
        setReviewPage,
        setSelectedLesson,
        toggleReplies,
    };
}

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosClient from '../../../../api/axios';
import { useInstructorCourseContext } from '../CourseDetailShell';

export interface Review {
    reviewId: number;
    rating: number;
    content: string;
    createdAt: string;
    parentId: number | null;
    studentId: number;
    studentName: string;
    studentAvatar: string | null;
}

export interface StarCount {
    star: number;
    count: number;
    percentage: number;
}

export interface UseCourseReviewsResult {
    id: string | undefined;
    isNewCourse: boolean;
    loading: boolean;
    currentTopLevelReviews: Review[];
    reviews: Review[];
    replyingTo: number | null;
    replyContent: string;
    isSubmitting: boolean;
    expandedReplies: Record<number, boolean>;
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    averageRating: string;
    starCounts: StarCount[];
    indexOfFirstReview: number;
    indexOfLastReview: number;
    setReplyingTo: (value: number | null) => void;
    setReplyContent: (value: string) => void;
    setCurrentPage: (value: number | ((prev: number) => number)) => void;
    getReplies: (parentId: number) => Review[];
    toggleReplies: (reviewId: number) => void;
    handleSubmitReply: (parentId: number) => Promise<void>;
}

export function useCourseReviews(): UseCourseReviewsResult {
    const { id, isNewCourse } = useInstructorCourseContext();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // State cho chức năng Reply
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State điều khiển Thu gọn / Mở rộng replies của từng đánh giá gốc
    const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

    // State phân trang cho Đánh giá gốc (Top-level reviews)
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsPerPage = 5;

    useEffect(() => {
        if (isNewCourse || !id) {
            setLoading(false);
            return;
        }

        const fetchReviews = async () => {
            try {
                const response = await axiosClient.get<{ message?: string; data: Review[] }>(
                    `/courses/${id}/reviews`
                );
                const payload = response.data || response;
                setReviews(Array.isArray(payload) ? payload : []);
            } catch (error) {
                console.error("Lỗi fetch reviews:", error);
                toast.error('Không thể tải danh sách đánh giá');
            } finally {
                setLoading(false);
            }
        };

        void fetchReviews();
    }, [id, isNewCourse]);

    // Phân tách đánh giá gốc và phản hồi
    const topLevelReviews = reviews.filter(r => r.parentId === null);

    const getReplies = (parentId: number) => {
        return reviews
            .filter(r => r.parentId === parentId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    // Logic Phân trang cho danh sách Đánh giá gốc
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentTopLevelReviews = topLevelReviews.slice(indexOfFirstReview, indexOfLastReview);
    const totalPages = Math.ceil(topLevelReviews.length / reviewsPerPage);

    // Tính toán thống kê (Chỉ tính số sao của đánh giá gốc)
    const totalReviews = topLevelReviews.length;
    const averageRating = totalReviews > 0
        ? (topLevelReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : '0.0';

    const starCounts = [5, 4, 3, 2, 1].map(star => {
        const count = topLevelReviews.filter(r => r.rating === star).length;
        const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
        return { star, count, percentage };
    });

    // Chuyển đổi trạng thái đóng/mở reply
    const toggleReplies = (reviewId: number) => {
        setExpandedReplies(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    };

    const handleSubmitReply = async (parentId: number) => {
        if (!replyContent.trim()) {
            toast.error('Vui lòng nhập nội dung phản hồi!');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Chỉ định rõ Generic trả về là một object chứa trường data có kiểu Review
            const response = await axiosClient.post<{ message?: string; data: Review }>(
                `/courses/${id}/reviews`,
                {
                    noiDung: replyContent,
                    parentId: parentId,
                },
            );

            // 2. Ép kiểu an toàn (Safe Casting) để xử lý triệt để lỗi TypeScript nhận diện sai Type
            const resData = response as unknown as { message?: string; data: Review };

            // 3. Lấy dữ liệu thực tế (Phù hợp với cả interceptor bóc tách dữ liệu)
            const newReply = resData.data || (resData as any);

            if (newReply) {
                setReviews((prev) => [...prev, newReply]);
            }

            toast.success('Đã gửi phản hồi!');
            setReplyingTo(null);
            setReplyContent('');

            // Tự động mở rộng phần phản hồi vừa gửi để xem lại
            setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
        } catch (error) {
            console.error("Lỗi gửi reply:", error);
            toast.error('Lỗi khi gửi phản hồi');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        id,
        isNewCourse,
        loading,
        currentTopLevelReviews,
        reviews,
        replyingTo,
        replyContent,
        isSubmitting,
        expandedReplies,
        currentPage,
        totalPages,
        totalReviews,
        averageRating,
        starCounts,
        indexOfFirstReview,
        indexOfLastReview,
        setReplyingTo,
        setReplyContent,
        setCurrentPage,
        getReplies,
        toggleReplies,
        handleSubmitReply
    };
}
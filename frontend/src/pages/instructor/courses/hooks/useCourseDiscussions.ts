import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosClient from '../../../../api/axios';
import { useInstructorCourseContext } from '../CourseDetailShell';

export interface Discussion {
    discussionId: number;
    content: string;
    createdAt: string;
    parentId: number | null;
    userId: number;
    userName: string;
    userAvatar: string | null;
}

export interface UseCourseDiscussionsResult {
    loading: boolean;
    currentTopLevelDiscussions: Discussion[];
    replyingTo: number | null;
    replyContent: string;
    isSubmitting: boolean;
    expandedReplies: Record<number, boolean>;
    currentPage: number;
    totalPages: number;
    totalDiscussions: number;
    indexOfFirstItem: number;
    indexOfLastItem: number;
    setReplyingTo: (value: number | null) => void;
    setReplyContent: (value: string) => void;
    setCurrentPage: (value: number | ((prev: number) => number)) => void;
    getReplies: (parentId: number) => Discussion[];
    toggleReplies: (discussionId: number) => void;
    handleSubmitReply: (parentId: number) => Promise<void>;
}

export function useCourseDiscussions(): UseCourseDiscussionsResult {
    const { id, isNewCourse } = useInstructorCourseContext();
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [loading, setLoading] = useState(true);

    // Trạng thái phản hồi câu hỏi (Reply Q&A)
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Kiểm soát thu gọn/mở rộng danh sách câu trả lời con
    const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

    // Phân trang danh sách câu hỏi gốc (Top-level discussions)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Hiển thị tối đa 5 cuộc thảo luận gốc trên một trang

    useEffect(() => {
        if (isNewCourse || !id) {
            setLoading(false);
            return;
        }

        const fetchDiscussions = async () => {
            try {
                const response = await axiosClient.get<{ message?: string; data: Discussion[] }>(
                    `/courses/${id}/discussions`
                );
                const payload = response.data || response;
                setDiscussions(Array.isArray(payload) ? payload : []);
            } catch (error) {
                console.error('Lỗi khi tải danh sách thảo luận:', error);
                toast.error('Không thể tải danh sách thảo luận');
            } finally {
                setLoading(false);
            }
        };

        void fetchDiscussions();
    }, [id, isNewCourse]);

    // Lọc danh sách câu hỏi gốc
    const topLevelDiscussions = discussions.filter(d => d.parentId === null);

    // Lấy câu trả lời con xếp theo thứ tự thời gian tăng dần
    const getReplies = (parentId: number) => {
        return discussions
            .filter(d => d.parentId === parentId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    // Tính toán các thông số phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTopLevelDiscussions = topLevelDiscussions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(topLevelDiscussions.length / itemsPerPage);

    const toggleReplies = (discussionId: number) => {
        setExpandedReplies(prev => ({
            ...prev,
            [discussionId]: !prev[discussionId],
        }));
    };

    const handleSubmitReply = async (parentId: number) => {
        if (!replyContent.trim()) {
            toast.error('Vui lòng nhập nội dung phản hồi!');
            return;
        }

        setIsSubmitting(true);
        try {
            // endpoint đồng bộ với cấu trúc backend instructor router-backed của bạn
            const response = await axiosClient.post<{ message?: string; data: Discussion }>(
                `/courses/${id}/discussions`, // Nếu bạn dùng chung bảng hoặc route riêng
                {
                    noiDung: replyContent,
                    parentId: parentId,
                }
            );

            // Double casting an toàn loại bỏ lỗi TS Type infer sai từ ApiClient
            const resData = response as unknown as { message?: string; data: Discussion };
            const newReply = resData.data || (resData as any);

            if (newReply) {
                setDiscussions(prev => [...prev, newReply]);
            }

            toast.success('Đã gửi phản hồi thảo luận!');
            setReplyingTo(null);
            setReplyContent('');
            setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
        } catch {
            toast.error('Lỗi khi gửi phản hồi thảo luận');
        } {
            setIsSubmitting(false);
        }
    };

    return {
        loading,
        currentTopLevelDiscussions,
        replyingTo,
        replyContent,
        isSubmitting,
        expandedReplies,
        currentPage,
        totalPages,
        totalDiscussions: topLevelDiscussions.length,
        indexOfFirstItem,
        indexOfLastItem,
        setReplyingTo,
        setReplyContent,
        setCurrentPage,
        getReplies,
        toggleReplies,
        handleSubmitReply,
    };
}
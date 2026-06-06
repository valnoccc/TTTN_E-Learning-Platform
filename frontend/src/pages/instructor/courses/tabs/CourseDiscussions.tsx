import { CornerDownRight, MessageSquare, Send, X, ChevronDown, ChevronUp, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCourseDiscussions } from '../hooks/useCourseDiscussions'; // Import Hook logic vừa viết

import {
    CourseSectionCard,
    CourseSidebarCard,
    useInstructorCourseContext,
} from '../CourseDetailShell';

export default function InstructorCourseDiscussions() {
    const { lessons, formData } = useInstructorCourseContext();
    // Gọi toàn bộ logic nghiệp vụ từ Hook tách riêng
    const {
        loading,
        currentTopLevelDiscussions,
        replyingTo,
        replyContent,
        isSubmitting,
        expandedReplies,
        currentPage,
        totalPages,
        totalDiscussions,
        indexOfFirstItem,
        indexOfLastItem,
        setReplyingTo,
        setReplyContent,
        setCurrentPage,
        getReplies,
        toggleReplies,
        handleSubmitReply,
    } = useCourseDiscussions();

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateString));
    };

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
            <CourseSectionCard
                title="Thảo luận"
            >
                {/* TRẠNG THÁI 1: ĐANG LOAD DỮ LIỆU SKELETON */}
                {loading ? (
                    <div className="animate-pulse space-y-6">
                        {[1, 2].map(i => (
                            <div key={i} className="flex gap-4">
                                <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                    <div className="h-14 bg-slate-100 rounded w-full mt-2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : currentTopLevelDiscussions.length > 0 ? (
                    /* TRẠNG THÁI 2: CÓ DỮ LIỆU - RENDER DANH SÁCH */
                    <div className="space-y-8 divide-y divide-slate-100">
                        {currentTopLevelDiscussions.map((discussion, index) => {
                            const replies = getReplies(discussion.discussionId);
                            const hasReplied = replies.length > 0;
                            const isRepliesOpen = expandedReplies[discussion.discussionId] || false;

                            return (
                                <div key={discussion.discussionId} className={`${index > 0 ? 'pt-8' : ''}`}>
                                    {/* Khung câu hỏi gốc từ Học viên */}
                                    <div className="flex items-start gap-4 relative">
                                        {discussion.userAvatar ? (
                                            <img
                                                src={discussion.userAvatar}
                                                alt={discussion.userName}
                                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-200">
                                                {discussion.userName.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold text-slate-800 truncate">
                                                        {discussion.userName}
                                                    </h4>
                                                    {hasReplied && (
                                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100 shadow-sm">
                                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                                            Đã trả lời
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-400">
                                                    {formatDate(discussion.createdAt)}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                                                {discussion.content}
                                            </p>

                                            {/* Bộ nút tương tác */}
                                            <div className="mt-3 flex items-center gap-4 flex-wrap">
                                                <button
                                                    onClick={() => {
                                                        setReplyingTo(replyingTo === discussion.discussionId ? null : discussion.discussionId);
                                                        setReplyContent('');
                                                    }}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
                                                >
                                                    <CornerDownRight size={14} />
                                                    {replyingTo === discussion.discussionId ? 'Hủy' : 'Trả lời Q&A'}
                                                </button>

                                                {hasReplied && (
                                                    <button
                                                        onClick={() => toggleReplies(discussion.discussionId)}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50/50 hover:bg-emerald-50 px-2 py-1 rounded"
                                                    >
                                                        {isRepliesOpen ? (
                                                            <><ChevronUp size={14} /> Thu gọn câu trả lời</>
                                                        ) : (
                                                            <><ChevronDown size={14} /> Xem {replies.length} phản hồi</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Khung Textarea gửi câu trả lời */}
                                            {replyingTo === discussion.discussionId && (
                                                <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex-1">
                                                        <textarea
                                                            value={replyContent}
                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                            placeholder={`Nhập nội dung tư vấn giải đáp cho ${discussion.userName}...`}
                                                            className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 resize-none"
                                                            rows={3}
                                                            autoFocus
                                                        />
                                                        <div className="mt-2 flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setReplyingTo(null)}
                                                                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded border border-transparent"
                                                            >
                                                                <X size={14} /> Hủy
                                                            </button>
                                                            <button
                                                                onClick={() => void handleSubmitReply(discussion.discussionId)}
                                                                disabled={isSubmitting || !replyContent.trim()}
                                                                className="px-3 py-1.5 text-xs font-bold text-white bg-[#1dbf73] hover:bg-[#169b5c] rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                                                            >
                                                                {isSubmitting ? 'Đang lưu...' : <><Send size={12} className="mr-1.5" /> Gửi trả lời</>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Danh sách các câu trả lời con (Replies) */}
                                            {hasReplied && isRepliesOpen && (
                                                <div className="mt-5 space-y-4 border-l-2 border-emerald-100 pl-4 sm:pl-5 ml-2 animate-in fade-in duration-200">
                                                    {replies.map(reply => (
                                                        <div key={reply.discussionId} className="flex items-start gap-3 relative">
                                                            <div className="absolute -left-5 top-4 w-4 h-px bg-emerald-100 sm:-left-6 sm:w-5"></div>

                                                            {reply.userAvatar ? (
                                                                <img src={reply.userAvatar} className="w-8 h-8 rounded-full border border-slate-200 shrink-0" alt="Avatar" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                                                                    {reply.userName.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}

                                                            <div className="flex-1 min-w-0 bg-white border border-slate-100 rounded-md p-3 shadow-sm">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    {/* Tìm đến đoạn map reply trong file CourseDiscussions.tsx và sửa thành: */}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-sm text-slate-800">{reply.userName}</span>

                                                                        {reply.userRole === 'INSTRUCTOR' ? (
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                                                Giảng viên
                                                                            </span>
                                                                        ) : (
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                                                                                Học viên
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[11px] text-slate-400">{formatDate(reply.createdAt)}</span>
                                                                </div>
                                                                <p className="text-sm text-slate-600 leading-relaxed">
                                                                    {reply.content}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Thanh chuyển trang phân trang dữ liệu */}
                        {totalPages > 1 && (
                            <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                                <p className="text-xs font-medium text-slate-500">
                                    Hiển thị từ <span className="font-semibold text-slate-700">{indexOfFirstItem + 1}</span> đến{' '}
                                    <span className="font-semibold text-slate-700">
                                        {indexOfLastItem > totalDiscussions ? totalDiscussions : indexOfLastItem}
                                    </span>{' '}
                                    trong tổng số <span className="font-semibold text-slate-700">{totalDiscussions}</span> câu hỏi
                                </p>
                                <div className="inline-flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentPage(index + 1)}
                                            className={`px-3 py-1 text-xs font-bold rounded border transition ${currentPage === index + 1
                                                ? 'bg-[#1dbf73] border-[#1dbf73] text-white shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* TRẠNG THÁI 3: GIỮ NGUYÊN CODE GIAO DIỆN TRỐNG CŨ CỦA BẠN ĐỂ CHỐNG NHIỄU */
                    <div className="rounded-sm border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-300">
                            <MessageSquare size={20} />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-900">
                            Chưa có chủ đề thảo luận nào
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Khi dữ liệu thảo luận được nối vào màn instructor, tab này đã có sẵn vùng hiển thị độc lập theo route mà không cần thay đổi cấu trúc chi tiết khóa học.
                        </p>
                    </div>
                )}
            </CourseSectionCard>

            {/* CỘT PHẢI SIDEBAR (GIỮ NGUYÊN HOÀN TOÀN TỪ FILE CŨ CỦA BẠN CHỐNG NHIỄU) */}
            <div className="space-y-5">
                <CourseSidebarCard title="Tình trạng sẵn sàng">
                    <MetricRow label="Bài học hiện có" value={String(lessons.length)} />
                    <MetricRow
                        label="Có thể mở thảo luận"
                        value={lessons.length > 0 ? 'Sẵn sàng' : 'Chưa'}
                    />
                </CourseSidebarCard>
            </div>
        </div>
    );
}

function MetricRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-sm border border-slate-200 bg-white px-3 py-2">
            <span className="text-sm text-slate-600">{label}</span>
            <span className="text-sm font-semibold text-slate-900">{value}</span>
        </div>
    );
}

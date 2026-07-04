import {
    AlertCircle,
    Filter,
    MessageSquare,
    Reply,
    Search,
    Send,
    Trash2,
    X,
} from 'lucide-react';
import { type ReactNode } from 'react';

import Pagination from '../../../components/Pagination';
import InstructorLayout from '../../../layouts/InstructorLayout';
import {
    type InstructorCourseDiscussion,
    useInstructorCourseDiscussions,
} from './hooks/useInstructorCourseDiscussions';

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
}

function Avatar({ discussion }: { discussion: InstructorCourseDiscussion }) {
    if (discussion.userAvatar) {
        return (
            <img
                src={discussion.userAvatar}
                alt={discussion.userName}
                className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
            />
        );
    }

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700">
            {(discussion.userName || 'H').charAt(0).toUpperCase()}
        </div>
    );
}

export default function InstructorCourseDiscussionsPage() {
    const {
        loading,
        searchTerm,
        selectedCourseId,
        replyStatusFilter,
        currentPage,
        totalPages,
        totalDiscussions,
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
        handleRejectReport,
        getReplies,
        toggleReplies,
    } = useInstructorCourseDiscussions();

    return (
        <InstructorLayout>
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                            Hỏi đáp & Thảo luận
                        </h1>                      
                    </div>

                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-[13px] font-medium text-slate-600">Chưa phản hồi:</span>
                            <span className="text-[14px] font-bold text-rose-600">
                                {unrepliedCount.toLocaleString('vi-VN')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên học viên hoặc nội dung câu hỏi..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-[13px] outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <select
                                value={selectedCourseId}
                                onChange={(event) => setSelectedCourseId(event.target.value)}
                                className="rounded border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[13px] font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white sm:w-[220px]"
                            >
                                <option value="">Tất cả khóa học</option>
                                {courseOptions.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={replyStatusFilter}
                                onChange={(event) =>
                                    setReplyStatusFilter(event.target.value as 'unreplied' | 'replied' | 'all')
                                }
                                className="rounded border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[13px] font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white sm:w-[180px]"
                            >
                                <option value="unreplied">Chưa phản hồi ({unrepliedCount})</option>
                                <option value="replied">Đã phản hồi</option>
                                <option value="all">Tất cả câu hỏi</option>
                            </select>

                            <button
                                type="button"
                                className="inline-flex items-center justify-center gap-2 rounded bg-[#10B981] px-6 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-600 active:bg-emerald-700"
                            >
                                <Filter size={16} />
                                Lọc
                            </button>
                        </div>
                    </div>
                </div>

<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <SummaryCard
                        label="Tổng câu hỏi"
                        value={totalDiscussions.toLocaleString('vi-VN')}
                        icon={<MessageSquare size={20} className="text-emerald-500" />}
                    />
                    <SummaryCard
                        label="Cần phản hồi"
                        value={unrepliedCount.toLocaleString('vi-VN')}
                        valueClassName="text-rose-600"
                        icon={<AlertCircle size={20} className="text-rose-500" />}
                    />
                </div>
                
                <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <h2 className="text-[14px] font-bold text-slate-800">
                            Hiển thị {filteredDiscussions.length.toLocaleString('vi-VN')} cuộc thảo luận
                        </h2>
                        <span className="text-[12px] font-medium text-slate-500">
                            Tổng số: {totalDiscussions.toLocaleString('vi-VN')}
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-5 p-6">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="flex animate-pulse gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-200" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-1/4 rounded bg-slate-200" />
                                        <div className="h-16 rounded bg-slate-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : currentDiscussions.length > 0 ? (
                        <>
                            <div className="divide-y divide-slate-100">
                                {currentDiscussions.map((discussion) => {
                                    const replies = getReplies(discussion.discussionId);
                                    const hasReplies = replies.length > 0;
                                    const isReplyOpen = replyingTo === discussion.discussionId;
                                    const areRepliesVisible = expandedReplies[discussion.discussionId] ?? false;

                                    return (
                                        <div
                                            key={discussion.discussionId}
                                            className="p-6 transition hover:bg-slate-50/30"
                                        >
                                            <div className="flex gap-4">
                                                <Avatar discussion={discussion} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h3 className="text-[14px] font-bold text-slate-900">
                                                                {discussion.userName}
                                                            </h3>
                                                            <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                                                                {formatDate(discussion.createdAt)}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                                            <span
                                                                className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${
                                                                    hasReplies
                                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                        : 'border-rose-200 bg-rose-50 text-rose-600'
                                                                }`}
                                                            >
                                                                {hasReplies ? 'Đã phản hồi' : 'Chưa phản hồi'}
                                                            </span>
                                                            {(discussion.reportCount ?? 0) > 0 && (
                                                                <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold border-amber-200 bg-amber-50 text-amber-600">
                                                                    <AlertCircle size={12} />
                                                                    Bị báo cáo ({discussion.reportCount})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
                                                        <span className="rounded bg-slate-800 px-2 py-1 font-medium text-white">
                                                            Khóa học: {discussion.courseTitle}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 text-[14px] font-normal text-slate-900 leading-relaxed">
                                                        {discussion.parsedTitle}
                                                    </div>
                                                    <div 
                                                        className="mt-1 text-[14px] leading-relaxed text-slate-700 prose prose-sm max-w-none prose-img:rounded-lg prose-img:shadow-sm"
                                                        dangerouslySetInnerHTML={{ __html: discussion.parsedBody || '' }} 
                                                    />

                                                    {hasReplies && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleReplies(discussion.discussionId)}
                                                            className="mt-2 text-[13px] font-medium text-emerald-600 transition hover:text-emerald-700 hover:underline focus:outline-none"
                                                        >
                                                            {areRepliesVisible
                                                                ? 'Thu gọn phản hồi'
                                                                : `Xem ${replies.length} phản hồi`}
                                                        </button>
                                                    )}

                                                    {hasReplies && areRepliesVisible && (
                                                        <div className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
                                                            {replies.map((reply) => (
                                                                <div
                                                                    key={reply.discussionId}
                                                                    className={`flex items-start gap-3 rounded p-4 ${
                                                                        reply.userRole === 'INSTRUCTOR'
                                                                            ? 'border border-emerald-100 bg-emerald-50/50'
                                                                            : 'bg-slate-50'
                                                                    }`}
                                                                >
                                                                    {reply.userAvatar ? (
                                                                        <img
                                                                            src={reply.userAvatar}
                                                                            alt={reply.userName}
                                                                            className="h-8 w-8 shrink-0 rounded-full border border-slate-200 object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                                                                            {reply.userRole === 'INSTRUCTOR'
                                                                                ? 'GV'
                                                                                : (reply.userName || 'H').charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="text-[13px] font-bold text-slate-900">
                                                                                {reply.userName}
                                                                            </span>
                                                                            {reply.userRole === 'INSTRUCTOR' && (
                                                                                <span className="rounded border border-emerald-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                                                    Giảng viên
                                                                                </span>
                                                                            )}
                                                                                <span className="text-[11px] text-slate-400">
                                                                                    {formatDate(reply.createdAt)}
                                                                                </span>
                                                                                {(reply.reportCount ?? 0) > 0 && (
                                                                                    <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold border-amber-200 bg-amber-50 text-amber-600">
                                                                                        <AlertCircle size={10} />
                                                                                        Bị báo cáo ({reply.reportCount})
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                {(reply.reportCount ?? 0) > 0 && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleRejectReport(reply.discussionId)}
                                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-amber-200 bg-amber-50 text-amber-600 transition hover:bg-amber-100"
                                                                                        title="Bỏ qua báo cáo sai"
                                                                                    >
                                                                                        <X size={14} />
                                                                                    </button>
                                                                                )}
                                                                                {reply.userRole === 'INSTRUCTOR' && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => void handleDeleteDiscussion(reply.discussionId)}
                                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-red-100 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                                                                        title="Xóa bình luận"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div 
                                                                            className="mt-1 text-[14px] text-slate-700 prose prose-sm max-w-none prose-img:rounded-lg prose-img:shadow-sm"
                                                                            dangerouslySetInnerHTML={{ __html: reply.parsedBody || '' }} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="mt-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartReply(discussion.discussionId)}
                                                            className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-600"
                                                        >
                                                            {isReplyOpen ? <X size={16} /> : <Reply size={16} />}
                                                            {isReplyOpen ? 'Hủy' : hasReplies ? 'Trả lời tiếp' : 'Trả lời Q&A'}
                                                        </button>
                                                        {(discussion.reportCount ?? 0) > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRejectReport(discussion.discussionId)}
                                                                className="inline-flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-[13px] font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100"
                                                            >
                                                                <X size={16} />
                                                                Bỏ qua báo cáo
                                                            </button>
                                                        )}
                                                    </div>

                                                    {isReplyOpen && (
                                                        <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-4">
                                                            <textarea
                                                                value={replyContent}
                                                                onChange={(event) => setReplyContent(event.target.value)}
                                                                placeholder="Nhập câu trả lời hướng dẫn học viên..."
                                                                className="w-full resize-none rounded border border-slate-200 bg-white p-3 text-[13px] outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                                                rows={3}
                                                                autoFocus
                                                            />

                                                            <div className="mt-3 flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartReply(discussion.discussionId)}
                                                                    className="rounded px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200"
                                                                >
                                                                    Hủy
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleSubmitReply(discussion)}
                                                                    disabled={isSubmitting || !replyContent.trim()}
                                                                    className="inline-flex items-center gap-2 rounded bg-[#10B981] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    <Send size={14} />
                                                                    Gửi phản hồi
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="px-6 pb-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={filteredDiscussions.length}
                                    indexOfFirst={indexOfFirst}
                                    indexOfLast={indexOfLast}
                                    variant="numbers"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="mt-4 text-sm font-bold text-slate-700">
                                Chưa có câu hỏi phù hợp
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                            </p>
                        </div>
                    )}
                </div>              
            </div>
        </InstructorLayout>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    valueClassName = 'text-slate-900',
}: {
    label: string;
    value: string;
    icon: ReactNode;
    valueClassName?: string;
}) {
    return (
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-500">{label}</p>
                {icon}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${valueClassName}`}>{value}</p>
            </div>
        </div>
    );
}

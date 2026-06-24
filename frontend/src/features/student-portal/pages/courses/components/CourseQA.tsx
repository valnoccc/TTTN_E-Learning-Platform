import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../../../../../api/axios';
import { User, MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseQA({ courseId }: { courseId: string }) {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const location = useLocation();

  // Lấy trạng thái đăng nhập tươi mỗi lần render
  const token = localStorage.getItem('access_token');
  const userStr = localStorage.getItem('user');
  const isAuthenticated = !!token;

  // Nếu đang ở trang học tập /student/learn/:id thì mặc định đã sở hữu
  const isOnLearningPage = location.pathname.startsWith('/student/learn');

  // Gọi endpoint PUBLIC (không cần quyền INSTRUCTOR)
  const fetchDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get(`/public/courses/${courseId}/discussions`);
      const data = Array.isArray(res) ? res : res?.data || [];
      // Sắp xếp mới nhất lên đầu
      setDiscussions([...data].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err: any) {
      console.error('[CourseQA] fetchDiscussions error:', err?.response?.status, err?.message);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchDiscussions();
    }
  }, [courseId, fetchDiscussions]);

  const handlePostQuestion = async () => {
    const content = newQuestion.trim();
    if (!content) {
      toast.error('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    const freshToken = localStorage.getItem('access_token');
    if (!freshToken) {
      toast.error('Vui lòng đăng nhập để đăng câu hỏi.');
      return;
    }

    setIsPosting(true);
    try {
      await axiosClient.post(
        `/public/courses/${courseId}/discussions`,
        { noiDung: content },
        { headers: { Authorization: `Bearer ${freshToken}` } },
      );
      toast.success('✅ Đã đăng câu hỏi thành công!');
      setNewQuestion('');
      // Refresh danh sách ngay lập tức
      await fetchDiscussions();
    } catch (err: any) {
      console.error('[CourseQA] post discussion error:', err?.response?.status, err?.response?.data);
      if (err?.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi đăng câu hỏi.');
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePostQuestion();
    }
  };

  // Chỉ hiện form nếu đã đăng nhập VÀ đang ở trang học
  const canAskQuestion = isAuthenticated && isOnLearningPage;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Form đặt câu hỏi - chỉ hiện khi đủ quyền */}
      {canAskQuestion ? (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <MessageCircle size={14} className="inline mr-1" />
            Đặt câu hỏi cho giảng viên
          </label>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bạn có thắc mắc gì về khóa học này? (Ctrl+Enter để gửi)"
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px] resize-none"
            style={{ color: '#1e293b', fontSize: '14px' }}
            disabled={isPosting}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-400">{newQuestion.length}/2000 ký tự</span>
            <button
              onClick={handlePostQuestion}
              disabled={isPosting || !newQuestion.trim()}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {isPosting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
              ) : (
                <Send size={14} />
              )}
              {isPosting ? 'Đang gửi...' : 'Đăng câu hỏi'}
            </button>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="text-center p-6 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-amber-700 font-medium mb-0">🔐 Vui lòng đăng nhập để đặt câu hỏi.</p>
        </div>
      ) : null}

      {/* Danh sách thảo luận */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
          <MessageCircle size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">Chưa có thảo luận nào.</p>
          <p className="text-slate-400 text-sm mt-1">Hãy là người đầu tiên đặt câu hỏi!</p>
        </div>
      ) : (
        <div className="space-y-1 bg-white rounded-xl border border-slate-100 overflow-hidden">
          {discussions.map((disc: any, idx: number) => (
            <div
              key={disc.discussionId || idx}
              className="flex gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
            >
              <div className="shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 overflow-hidden">
                {disc.userAvatar ? (
                  <img
                    src={disc.userAvatar.startsWith('http') ? disc.userAvatar : `/assets/images/${disc.userAvatar}`}
                    alt="avatar"
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {disc.userName || 'Học viên'}
                  </h4>
                  {disc.userRole === 'INSTRUCTOR' && (
                    <span className="text-[10px] font-semibold text-white bg-emerald-500 px-2 py-0.5 rounded-full">
                      Giảng viên
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(disc.createdAt || Date.now()).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{disc.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

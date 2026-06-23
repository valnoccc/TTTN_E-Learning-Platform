import React, { useState, useEffect } from 'react';
import axiosClient from '../../../../../api/axios';
import { User } from 'lucide-react';

export default function CourseQA({ courseId }: { courseId: string }) {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');

  // Lấy trạng thái đăng nhập
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('access_token');
  const isAuthenticated = !!userStr || !!token;

  useEffect(() => {
    fetchDiscussions();
  }, [courseId]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get(`/courses/${courseId}/discussions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      setDiscussions(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        if (!isAuthenticated) {
          setError('Vui lòng đăng nhập để tham gia thảo luận.');
        }
      } else {
        setError('Có lỗi xảy ra khi tải danh sách thảo luận.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostQuestion = async () => {
    if (!newQuestion.trim()) return;
    try {
      await axiosClient.post(`/courses/${courseId}/discussions`, { noiDung: newQuestion, maBHDaThaoLuan: null }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      setNewQuestion('');
      fetchDiscussions();
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Vui lòng đăng nhập để đăng câu hỏi.');
      } else {
        alert('Có lỗi khi đăng câu hỏi.');
      }
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Bạn có thắc mắc gì về khóa học này?"
          className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px] resize-none"
        />
        <div className="flex justify-end mt-3">
          <button 
            onClick={handlePostQuestion}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Đăng câu hỏi
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-slate-600 font-medium">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-slate-500">Chưa có thảo luận nào. Hãy là người đầu tiên đặt câu hỏi!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map((disc, idx) => (
            <div key={idx} className="flex gap-4 p-4 border-b border-slate-100 last:border-0">
              <div className="shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 overflow-hidden">
                {disc.nguoiDung?.avatar ? (
                  <img src={disc.nguoiDung.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <h4 className="font-bold text-slate-800">{disc.nguoiDung?.hoTen || 'Học viên'}</h4>
                  <span className="text-xs text-slate-500">{new Date(disc.ngayTao || Date.now()).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="text-slate-700 text-sm whitespace-pre-wrap mb-2">{disc.noiDung}</p>
                <button className="text-emerald-600 font-medium text-xs hover:underline">Trả lời</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

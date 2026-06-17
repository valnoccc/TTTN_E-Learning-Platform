import React, { useState, useEffect } from 'react';
import axiosClient from '../../../../../api/axios';
import { Star, User } from 'lucide-react';

export default function CourseReviews({ courseId }: { courseId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy trạng thái đăng nhập
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('access_token');
  const isAuthenticated = !!userStr || !!token;

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get(`/courses/${courseId}/reviews`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      setReviews(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        if (!isAuthenticated) {
          setError('Vui lòng đăng nhập để xem và tham gia thảo luận.');
        }
      } else {
        setError('Có lỗi xảy ra khi tải đánh giá.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (reviews.length === 0) return { avg: 0, counts: [0,0,0,0,0] };
    const counts = [0, 0, 0, 0, 0];
    let total = 0;
    reviews.forEach(r => {
      const s = r.soSao || 0;
      if (s >= 1 && s <= 5) counts[s - 1]++;
      total += s;
    });
    return { avg: (total / reviews.length).toFixed(1), counts };
  };

  const { avg, counts } = calculateStats();

  return (
    <div className="animate-fade-in space-y-8">
      {error ? (
        <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-slate-600 font-medium">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex flex-col items-center justify-center shrink-0 w-40">
              <span className="text-6xl font-bold text-slate-800">{avg}</span>
              <div className="flex items-center gap-1 my-2 text-yellow-400">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} fill={star <= Number(avg) ? 'currentColor' : 'none'} size={18} />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-500">Đánh giá khóa học</span>
            </div>
            
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = counts[star - 1];
                const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20 shrink-0 text-slate-600 font-medium text-sm">
                      <Star size={14} className="text-yellow-400" fill="currentColor" />
                      <span>{star} sao</span>
                    </div>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="w-10 text-right text-sm text-slate-500">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center p-8 border border-slate-100 rounded-xl">
              <p className="text-slate-500">Chưa có đánh giá nào cho khóa học này.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <div className="shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 overflow-hidden">
                    {rev.nguoiDung?.avatar ? (
                      <img src={rev.nguoiDung.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-800">{rev.nguoiDung?.hoTen || 'Học viên'}</h4>
                      <span className="text-xs text-slate-500">{new Date(rev.ngayTao || Date.now()).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2 text-yellow-400">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} fill={star <= (rev.soSao || 0) ? 'currentColor' : 'none'} size={14} />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{rev.noiDung}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

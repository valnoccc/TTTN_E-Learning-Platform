import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../../../../../api/axios';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseReviews({ courseId }: { courseId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Form đánh giá
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trạng thái đăng nhập — đọc tươi từ localStorage, không cache
  const isAuthenticated = !!localStorage.getItem('access_token');
  const isOnLearningPage = location.pathname.startsWith('/student/learn');
  const canReview = isAuthenticated && isOnLearningPage;

  // ─────────────────────────────────────────────────────────────────────────
  // fetchReviews: gọi endpoint PUBLIC, không cần quyền INSTRUCTOR
  // ─────────────────────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await axiosClient.get(`/public/courses/${courseId}/reviews`);
      const data: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      // Sắp xếp mới nhất lên đầu
      setReviews([...data].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      ));
    } catch (err: any) {
      console.error('[CourseReviews] fetchReviews error:', err?.response?.status, err?.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) fetchReviews();
  }, [courseId, fetchReviews]);

  // ─────────────────────────────────────────────────────────────────────────
  // handleSubmitReview
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    const freshToken = localStorage.getItem('access_token');
    if (!freshToken) { toast.error('Vui lòng đăng nhập để gửi đánh giá.'); return; }
    if (!reviewContent.trim()) { toast.error('Vui lòng nhập nội dung đánh giá.'); return; }

    setIsSubmitting(true);
    try {
      await axiosClient.post(
        `/courses/${courseId}/reviews/student`,
        { soSao: reviewRating, noiDung: reviewContent },
        { headers: { Authorization: `Bearer ${freshToken}` } },
      );
      toast.success('🎉 Gửi đánh giá thành công!');
      setReviewContent('');
      setReviewRating(5);
      // Cập nhật danh sách ngay lập tức
      await fetchReviews();
    } catch (err: any) {
      console.error('[CourseReviews] submit error:', err?.response?.status, err?.response?.data);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Tính thống kê
  // ─────────────────────────────────────────────────────────────────────────
  const calculateStats = () => {
    if (reviews.length === 0) return { avg: '0.0', counts: [0, 0, 0, 0, 0] };
    const counts = [0, 0, 0, 0, 0];
    let total = 0;
    reviews.forEach((r: any) => {
      // Backend trả 'rating', fallback 'soSao' cho các API cũ
      const s = Number(r.rating ?? r.soSao ?? 0);
      if (s >= 1 && s <= 5) counts[s - 1]++;
      total += s;
    });
    return { avg: (total / reviews.length).toFixed(1), counts };
  };

  const { avg, counts } = calculateStats();

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: resolve avatar URL cho từng review — TUYỆT ĐỐI không dùng
  // thông tin user đang đăng nhập, chỉ dùng dữ liệu của chính rev đó
  // ─────────────────────────────────────────────────────────────────────────
  const resolveAvatar = (rev: any): { src: string; fallback: string } => {
    const name = (rev.studentName || '').trim() || 'User';
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true&size=80`;
    const raw = rev.studentAvatar;
    if (!raw || raw === 'null' || raw.trim() === '') return { src: fallback, fallback };
    if (raw.startsWith('http')) return { src: raw, fallback };
    return { src: `/assets/images/${raw}`, fallback };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in space-y-8">
      {error && !canReview ? (
        <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-slate-600 font-medium">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <>
          {/* ── Thống kê đánh giá ── */}
          <div className="flex flex-col md:flex-row gap-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex flex-col items-center justify-center shrink-0 w-40">
              <span className="text-6xl font-bold text-slate-800">{avg}</span>
              <div className="flex items-center gap-1 my-2 text-yellow-400">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} fill={star <= Number(avg) ? 'currentColor' : 'none'} size={18} />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-500">Đánh giá khóa học</span>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = counts[star - 1];
                const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20 shrink-0 text-slate-600 font-medium text-sm">
                      <Star size={14} className="text-yellow-400" fill="currentColor" />
                      <span>{star} sao</span>
                    </div>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-10 text-right text-sm text-slate-500">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Form viết đánh giá (chỉ hiện khi đang trong trang học và đã login) ── */}
          {canReview ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h4 className="text-base font-bold text-slate-800 mb-4">✍️ Viết đánh giá của bạn</h4>

              {/* Chọn sao */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-2">Đánh giá của bạn</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="p-0.5 transition-transform hover:scale-110 border-0 bg-transparent cursor-pointer"
                    >
                      <Star
                        size={28}
                        fill={star <= (reviewHover || reviewRating) ? '#F59E0B' : 'none'}
                        className={star <= (reviewHover || reviewRating) ? 'text-amber-400' : 'text-slate-300'}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-sm font-semibold text-slate-700">
                    {reviewRating === 1 && 'Rất tệ'}
                    {reviewRating === 2 && 'Tệ'}
                    {reviewRating === 3 && 'Bình thường'}
                    {reviewRating === 4 && 'Tốt'}
                    {reviewRating === 5 && 'Xuất sắc'}
                  </span>
                </div>
              </div>

              {/* Nội dung đánh giá */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-2">Nhận xét</label>
                <textarea
                  value={reviewContent}
                  onChange={e => setReviewContent(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px] resize-none"
                  style={{ color: '#1e293b', fontSize: '14px' }}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                      Đang gửi...
                    </>
                  ) : '⭐ Gửi đánh giá'}
                </button>
              </div>
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center p-6 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-amber-700 font-medium mb-0">🔐 Vui lòng đăng nhập để viết đánh giá.</p>
            </div>
          ) : null}

          {/* ── Danh sách đánh giá ── */}
          {reviews.length === 0 ? (
            <div className="text-center p-8 border border-slate-100 rounded-xl">
              <p className="text-slate-500">Chưa có đánh giá nào cho khóa học này.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {reviews.map((rev: any, idx: number) => {
                /**
                 * ⚠️ QUAN TRỌNG: Mọi thông tin hiển thị đều đến từ chính object `rev`,
                 * là dữ liệu của TỪNG NGƯỜI ĐÃ ĐÁNH GIÁ từ DB (JOIN bảng NguoiDung).
                 * TUYỆT ĐỐI không sử dụng thông tin user đang đăng nhập vào đây.
                 *
                 * API public trả về:
                 *  rev.studentName   → u.HoTen   (tên người đánh giá)
                 *  rev.studentAvatar → u.AnhDaiDien (ảnh người đánh giá)
                 *  rev.rating        → dg.SoSao
                 *  rev.content       → dg.NoiDung
                 *  rev.createdAt     → dg.ThoiGian
                 */
                const reviewerName = (rev.studentName || '').trim() || 'Học viên ẩn danh';
                const starRating   = Number(rev.rating ?? rev.soSao ?? 0);
                const reviewText   = (rev.content || rev.noiDung || '').trim();
                const reviewDate   = rev.createdAt || rev.ngayTao || null;

                // Avatar: ảnh thật từ DB của người đó, fallback ui-avatars với tên của chính họ
                const { src: avatarSrc, fallback: avatarFallback } = resolveAvatar(rev);

                return (
                  <div
                    key={rev.reviewId ?? rev.maDanhGia ?? idx}
                    className="flex gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm w-full hover:shadow-md transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="shrink-0 h-11 w-11 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
                      <img
                        src={avatarSrc}
                        alt={reviewerName}
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          const img = e.target as HTMLImageElement;
                          if (img.src !== avatarFallback) img.src = avatarFallback;
                        }}
                      />
                    </div>

                    {/* Thông tin đánh giá */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                        <h4 className="font-bold text-slate-800 text-sm whitespace-normal break-words">
                          {reviewerName}
                        </h4>
                        <span className="text-xs text-slate-400 shrink-0">
                          {reviewDate
                            ? new Date(reviewDate).toLocaleDateString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={14}
                            fill={star <= starRating ? '#F59E0B' : 'none'}
                            className={star <= starRating ? 'text-amber-400' : 'text-slate-300'}
                            strokeWidth={1.5}
                          />
                        ))}
                        {starRating > 0 && (
                          <span className="ml-1 text-xs font-semibold text-amber-600">{starRating}/5</span>
                        )}
                      </div>

                      {reviewText ? (
                        <p className="text-slate-700 text-sm whitespace-normal break-words leading-relaxed">
                          {reviewText}
                        </p>
                      ) : (
                        <p className="text-slate-400 text-sm italic">Không có nội dung nhận xét.</p>
                      )}

                      {/* Hiển thị phản hồi từ Giảng viên (nếu có) */}
                      {rev.replies && rev.replies.length > 0 && (
                        <div className="mt-3">
                          {rev.replies.map((reply: any, rIdx: number) => {
                            const replyText = (reply.content || reply.noiDung || '').trim();
                            const replyDate = reply.createdAt || reply.ngayTao || null;
                            const instructorName = (reply.studentName || 'Giảng viên').trim();
                            const rawAvatar = reply.studentAvatar;
                            const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=04a557&color=fff&bold=true&size=80`;
                            
                            let avatarSrc = avatarFallback;
                            if (rawAvatar && rawAvatar !== 'null' && rawAvatar.trim() !== '') {
                                avatarSrc = rawAvatar.startsWith('http') ? rawAvatar : `/assets/images/${rawAvatar}`;
                            }

                            return (
                              <div 
                                key={reply.reviewId || reply.maDanhGia || rIdx} 
                                className="ml-12 mt-3 p-3 rounded-lg" 
                                style={{ backgroundColor: '#f0fbf5', border: '1px solid #d4edda' }}
                              >
                                <div className="d-flex align-items-center gap-2 mb-2 flex flex-row items-center">
                                  <img 
                                    src={avatarSrc} 
                                    alt="Giảng viên" 
                                    className="rounded-circle rounded-full"
                                    style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                                    onError={(e: any) => {
                                      if ((e.target as HTMLImageElement).src !== avatarFallback) {
                                        (e.target as HTMLImageElement).src = avatarFallback;
                                      }
                                    }}
                                  />
                                  <strong className="text-emerald-700" style={{ color: '#04a557', fontSize: '14px' }}>
                                    {instructorName}
                                  </strong>
                                  <span className="badge bg-success-subtle text-success border border-success-subtle ms-1" style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#d1e7dd', color: '#0f5132', borderColor: '#badbcc' }}>
                                    Giảng viên
                                  </span>
                                  <span className="text-muted text-slate-500 small ms-auto ml-auto text-xs">
                                    {replyDate
                                      ? new Date(replyDate).toLocaleDateString('vi-VN', {
                                          day: '2-digit', month: '2-digit', year: 'numeric'
                                        })
                                      : ''}
                                  </span>
                                </div>
                                <p className="mb-0 mt-1 text-slate-800 text-sm whitespace-normal break-words leading-relaxed">
                                  {replyText}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

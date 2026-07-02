import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../../../../../api/axios';
import { Star, Search, ThumbsUp, ThumbsDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseReviews({ courseId }: { courseId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]); // Dùng để tính toán thống kê tổng quan
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Tìm kiếm và bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Form đánh giá
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Báo cáo
  const [reportModal, setReportModal] = useState<{ isOpen: boolean, reviewId: number | null }>({ isOpen: false, reviewId: null });
  const [reportType, setReportType] = useState<string>('');
  const [reportReason, setReportReason] = useState('');
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const [reportedSet, setReportedSet] = useState<Set<number>>(new Set());

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) setCurrentUser(JSON.parse(userStr));
    } catch(e) {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isAuthenticated = !!localStorage.getItem('access_token');
  const isOnLearningPage = location.pathname.startsWith('/student/learn');
  const canReview = isAuthenticated && isOnLearningPage;

  // Lấy tất cả review để tính thống kê (không bị ảnh hưởng bởi filter)
  useEffect(() => {
    if (courseId) {
      axiosClient.get(`/public/courses/${courseId}/reviews`)
        .then((res: any) => {
           const data = Array.isArray(res) ? res : (res?.data ?? []);
           setAllReviews(data);
        })
        .catch(err => console.error('Lỗi tải tất cả đánh giá:', err));
    }
  }, [courseId]);

  // Lấy review hiển thị (áp dụng filter)
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/public/courses/${courseId}/reviews?`;
      if (debouncedSearch) url += `tuKhoa=${encodeURIComponent(debouncedSearch)}&`;
      if (ratingFilter !== 'all') url += `soSao=${ratingFilter}&`;
      
      // Đọc trực tiếp từ localStorage để tránh race condition khi page load
      const userStr = localStorage.getItem('user');
      let localUserId = null;
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          localUserId = parsed?.maND || parsed?.id;
        } catch(e) {}
      }
      
      if (localUserId) {
        url += `userId=${localUserId}&`;
      } else if (currentUser?.maND || currentUser?.id) {
        url += `userId=${currentUser.maND || currentUser.id}&`;
      }

      const res: any = await axiosClient.get(url);
      const data: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      setReviews(data);
    } catch (err: any) {
      console.error('[CourseReviews] fetchReviews error:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, debouncedSearch, ratingFilter, currentUser]);

  useEffect(() => {
    if (courseId) fetchReviews();
  }, [courseId, fetchReviews]);

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
      await fetchReviews();
      
      // Update stats as well
      const resStats: any = await axiosClient.get(`/public/courses/${courseId}/reviews`);
      const dataStats = Array.isArray(resStats) ? resStats : (resStats?.data ?? []);
      setAllReviews(dataStats);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (reviewId: number, currentVote: number, targetVote: number) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để bình chọn.');
      return;
    }
    
    // Optimistic update
    const newVote = currentVote === targetVote ? 0 : targetVote;
    setReviews(prev => prev.map(r => {
      if (r.reviewId === reviewId) {
        let helpfulCount = r.helpfulCount || 0;
        let notHelpfulCount = r.notHelpfulCount || 0;
        
        // Remove old vote
        if (currentVote === 1) helpfulCount = Math.max(0, helpfulCount - 1);
        if (currentVote === -1) notHelpfulCount = Math.max(0, notHelpfulCount - 1);
        
        // Add new vote
        if (newVote === 1) helpfulCount++;
        if (newVote === -1) notHelpfulCount++;

        return { ...r, userVote: newVote, helpfulCount, notHelpfulCount };
      }
      return r;
    }));

    try {
      const token = localStorage.getItem('access_token');
      await axiosClient.post(
        `/public/courses/${courseId}/reviews/${reviewId}/vote`,
        { trangThai: targetVote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err: any) {
      toast.error('Lỗi khi bình chọn.');
      fetchReviews(); // Revert on error
    }
  };

  const handleReport = async () => {
    const finalReason = reportType === 'Khác' ? reportReason.trim() : reportType;
    if (!finalReason || !reportModal.reviewId) return;

    setIsReportSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      await axiosClient.post(
        `/public/courses/${courseId}/reviews/${reportModal.reviewId}/report`,
        { lyDo: finalReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã gửi báo cáo vi phạm.');
      setReportedSet(prev => new Set(prev).add(reportModal.reviewId as number));
      setReportModal({ isOpen: false, reviewId: null });
      setReportType('');
      setReportReason('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bạn đã báo cáo đánh giá này rồi.');
    } finally {
      setIsReportSubmitting(false);
    }
  };

  // Tính thống kê dựa trên allReviews
  const calculateStats = () => {
    if (allReviews.length === 0) return { avg: '0.0', counts: [0, 0, 0, 0, 0] };
    const counts = [0, 0, 0, 0, 0];
    let total = 0;
    allReviews.forEach((r: any) => {
      const s = Number(r.rating ?? r.soSao ?? 0);
      if (s >= 1 && s <= 5) counts[s - 1]++;
      total += s;
    });
    return { avg: (total / allReviews.length).toFixed(1), counts };
  };

  const { avg, counts } = calculateStats();

  const resolveAvatar = (rev: any, isInstructor: boolean = false): { src: string; fallback: string } => {
    const name = (rev.studentName || '').trim() || (isInstructor ? 'Giảng viên' : 'Học viên');
    const bg = isInstructor ? '04a557' : '27272a';
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=80`;
    const raw = rev.studentAvatar;
    if (!raw || raw === 'null' || raw.trim() === '') return { src: fallback, fallback };
    if (raw.startsWith('http')) return { src: raw, fallback };
    return { src: `/assets/images/${raw}`, fallback };
  };

  return (
    <div className="max-w-4xl animate-fade-in text-slate-800 pb-16">
      
      {/* 1. KHỐI THỐNG KÊ TỔNG QUAN */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Phản hồi của học viên</h2>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Điểm số lớn bên trái */}
          <div className="flex flex-col items-center justify-center shrink-0 w-32 md:w-40 pt-2">
            <span className="text-7xl font-bold text-amber-600 mb-1">{avg}</span>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} fill={star <= Math.round(Number(avg)) ? '#D97706' : 'none'} size={18} className={star <= Math.round(Number(avg)) ? 'text-amber-600' : 'text-slate-300'} strokeWidth={0} />
              ))}
            </div>
            <span className="text-sm font-semibold text-amber-700">Xếp hạng khóa học</span>
          </div>

          {/* Thanh tiến trình bên phải */}
          <div className="flex-1 w-full space-y-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = counts[star - 1];
              const percent = allReviews.length > 0 ? Math.round((count / allReviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-4 group">
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden relative flex items-center">
                    <div className="h-full bg-slate-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex items-center gap-1 w-24 shrink-0 justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                         <Star key={s} size={13} fill={s <= star ? '#D97706' : 'none'} className={s <= star ? 'text-amber-600' : 'text-slate-300'} strokeWidth={0} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-purple-700 underline-offset-2 group-hover:underline cursor-pointer" onClick={() => setRatingFilter(star.toString())}>{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TẠO ĐÁNH GIÁ (NẾU CÓ QUYỀN) */}
      {canReview && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-10">
          <h4 className="text-base font-bold text-slate-800 mb-4">✍️ Viết đánh giá của bạn</h4>
          <div className="mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star} type="button"
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setReviewHover(star)}
                  onMouseLeave={() => setReviewHover(0)}
                  className="p-0.5 transition-transform hover:scale-110 border-0 bg-transparent cursor-pointer"
                >
                  <Star size={28} fill={star <= (reviewHover || reviewRating) ? '#F59E0B' : 'none'} className={star <= (reviewHover || reviewRating) ? 'text-amber-400' : 'text-slate-300'} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <textarea
              value={reviewContent}
              onChange={e => setReviewContent(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px] resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </div>
      )}

      {/* 2. THANH BỘ LỌC (SEARCH & FILTER BAR) */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="flex-1 max-w-xl flex relative h-[48px] mt-[20px]">
          <input 
            type="text" 
            placeholder="Tìm kiếm đánh giá"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-900 text-slate-900 rounded-l p-3 focus:outline-none focus:border-slate-900 text-[15px] font-medium placeholder-slate-500"
          />
          <button className="px-5 bg-purple-700 text-white hover:bg-purple-800 transition flex items-center justify-center rounded-r border border-purple-700">
             <Search size={18} />
          </button>
        </div>

        <div className="w-full md:w-[180px] shrink-0">
          <label className="block text-[13px] font-bold text-slate-900 mb-1">Lọc xếp hạng</label>
          <select 
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full border border-slate-900 text-slate-900 rounded p-3 font-medium text-[15px] focus:outline-none focus:border-slate-900 appearance-none bg-white h-[48px] cursor-pointer"
          >
            <option value="all">Tất cả xếp hạng</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>
      </div>

      {/* 3. DANH SÁCH ĐÁNH GIÁ (REVIEW LIST) */}
      <div className="space-y-0">
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div></div>
        ) : reviews.length === 0 ? (
          <p className="text-slate-500 py-8 text-center italic border-t border-slate-200">Không tìm thấy đánh giá nào phù hợp.</p>
        ) : (
          reviews.map((rev: any) => {
            const reviewerName = (rev.studentName || '').trim() || 'Học viên';
            const starRating   = Number(rev.rating ?? rev.soSao ?? 0);
            const reviewText   = (rev.content || rev.noiDung || '').trim();
            const reviewDate   = rev.createdAt || rev.ngayTao || null;
            const { src: avatarSrc, fallback: avatarFallback } = resolveAvatar(rev);

            const userVote = rev.userVote || 0; // 1 (up), -1 (down), 0 (none)

            return (
              <div key={rev.reviewId} className="border-t border-slate-200 py-8">
                {/* Dòng 1: User Info */}
                <div className="flex gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden bg-zinc-800 text-white flex items-center justify-center font-bold">
                    <img
                      src={avatarSrc}
                      alt={reviewerName}
                      className="w-full h-full object-cover"
                      onError={(e: any) => { if (e.target.src !== avatarFallback) e.target.src = avatarFallback; }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="font-bold text-gray-900 text-base">{reviewerName}</h4>
                    </div>

                    {/* Dòng 2: Số sao & Thời gian */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={14} fill={star <= starRating ? '#D97706' : 'none'} className={star <= starRating ? 'text-amber-600' : 'text-slate-300'} strokeWidth={0} />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500 font-medium">
                        {reviewDate ? (() => {
                           const days = Math.floor((new Date().getTime() - new Date(reviewDate).getTime()) / (1000 * 60 * 60 * 24));
                           if (days === 0) return 'Hôm nay';
                           if (days < 7) return `${days} ngày trước`;
                           if (days < 30) return `${Math.floor(days/7)} tuần trước`;
                           return `${Math.floor(days/30)} tháng trước`;
                        })() : ''}
                      </span>
                    </div>

                    {/* Dòng 3: Nội dung */}
                    <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap mb-4 font-medium">
                      {reviewText}
                    </p>

                    {/* Dòng 4: Tương tác */}
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[12px] text-slate-500 font-medium">Đánh giá này có hữu ích không?</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleVote(rev.reviewId, userVote, 1)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${userVote === 1 ? 'border-purple-600 bg-purple-600 text-white' : 'border-purple-600 text-purple-600 hover:bg-purple-50'}`}
                        >
                          <ThumbsUp size={18} className={userVote === 1 ? 'fill-white' : ''} />
                        </button>
                        <button 
                          onClick={() => handleVote(rev.reviewId, userVote, -1)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${userVote === -1 ? 'border-purple-600 bg-purple-600 text-white' : 'border-purple-600 text-purple-600 hover:bg-purple-50'}`}
                        >
                          <ThumbsDown size={18} className={userVote === -1 ? 'fill-white' : ''} />
                        </button>
                        <button 
                          onClick={() => !reportedSet.has(rev.reviewId) && setReportModal({ isOpen: true, reviewId: rev.reviewId })}
                          disabled={reportedSet.has(rev.reviewId)}
                          className={`text-sm underline cursor-pointer font-bold ml-4 underline-offset-4 transition-colors ${reportedSet.has(rev.reviewId) ? 'text-slate-400 cursor-not-allowed' : 'text-slate-900 hover:text-purple-700'}`}
                        >
                          {reportedSet.has(rev.reviewId) ? 'Đã báo cáo' : 'Báo cáo'}
                        </button>
                      </div>
                    </div>

                    {/* 4. KHỐI PHẢN HỒI GIẢNG VIÊN */}
                    {rev.replies && rev.replies.length > 0 && (
                      <div className="mt-6">
                        {rev.replies.map((reply: any) => {
                          const replyName = (reply.studentName || 'Giảng viên').trim();
                          const replyDate = reply.createdAt;
                          const { src: repSrc, fallback: repFallback } = resolveAvatar(reply, true);

                          return (
                            <div key={reply.reviewId} className="ml-12 mt-4 p-4 border-l-2 border-slate-300">
                               <div className="flex items-center gap-3 mb-3">
                                  <div className="shrink-0 h-10 w-10 rounded-full overflow-hidden bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                                    <img
                                      src={repSrc}
                                      alt={replyName}
                                      className="w-full h-full object-cover"
                                      onError={(e: any) => { if (e.target.src !== repFallback) e.target.src = repFallback; }}
                                    />
                                  </div>
                                  <div>
                                     <h5 className="font-bold text-slate-900 text-[15px]">{replyName}</h5>
                                     <span className="text-[13px] text-slate-500 font-medium">Phản hồi của giảng viên • {(() => {
                                        if(!replyDate) return '';
                                        const days = Math.floor((new Date().getTime() - new Date(replyDate).getTime()) / (1000 * 60 * 60 * 24));
                                        if (days === 0) return 'Hôm nay';
                                        if (days < 7) return `${days} ngày trước`;
                                        if (days < 30) return `${Math.floor(days/7)} tuần trước`;
                                        return `${Math.floor(days/30)} tháng trước`;
                                     })()}</span>
                                  </div>
                               </div>
                               <p className="text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap">{reply.content || reply.noiDung}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Báo cáo */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Báo cáo vi phạm đánh giá</h3>
              </div>
              <div className="p-6">
                <p className="text-[15px] text-slate-600 mb-5">Vui lòng chọn lý do báo cáo đánh giá này. Thông tin của bạn sẽ được giữ kín.</p>
                <div className="space-y-3 mb-5">
                  {['Nội dung thô tục/xúc phạm', 'Spam/Quảng cáo thương mại', 'Thông tin sai sự thật', 'Khác'].map(reason => (
                    <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${reportType === reason ? 'border-purple-600' : 'border-slate-300 group-hover:border-purple-400'}`}>
                         {reportType === reason && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                      </div>
                      <input 
                        type="radio" 
                        name="reportType" 
                        value={reason}
                        checked={reportType === reason}
                        onChange={(e) => setReportType(e.target.value)}
                        className="hidden" 
                      />
                      <span className="text-[15px] text-slate-800 font-medium">{reason === 'Khác' ? 'Lý do khác' : reason}</span>
                    </label>
                  ))}
                </div>
                {reportType === 'Khác' && (
                  <textarea 
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 text-[15px] focus:outline-none focus:border-purple-600 min-h-[100px] resize-none transition-colors"
                    placeholder="Vui lòng mô tả chi tiết lý do..."
                  />
                )}
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                 <button 
                   onClick={() => {
                     setReportModal({isOpen: false, reviewId: null});
                     setReportType('');
                     setReportReason('');
                   }} 
                   className="px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                 >
                   Hủy
                 </button>
                 <button 
                   onClick={handleReport} 
                   disabled={!reportType || (reportType === 'Khác' && !reportReason.trim()) || isReportSubmitting} 
                   className="px-5 py-2.5 font-bold bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                 >
                   {isReportSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                   Gửi báo cáo
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

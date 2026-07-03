import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../../../../../api/axios';
import { User, MessageCircle, Send, Search, ArrowLeft, ThumbsUp, Plus, X, ChevronLeft, ChevronRight, ImageIcon, MoreVertical, EyeOff, Trash2, Flag, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import ReportModal from './ReportModal';

// Helper component for avatar
const UserAvatar = ({ src, name, size = 'md' }: { src?: string, name?: string, size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-lg',
  };
  
  if (src && src.trim() !== '') {
    const imgSrc = src.startsWith('http') ? src : `/assets/images/${src}`;
    return (
      <div className={`shrink-0 rounded-full overflow-hidden bg-slate-200 border border-slate-200 ${sizeClasses[size]}`}>
        <img src={imgSrc} alt={name} className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        <div className="w-full h-full hidden items-center justify-center font-bold text-slate-700 uppercase bg-slate-200">
          {name ? name.charAt(0) : 'U'}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`shrink-0 rounded-full flex items-center justify-center font-bold text-white uppercase bg-slate-800 ${sizeClasses[size]}`}>
      {name ? name.charAt(0) : 'U'}
    </div>
  );
};

function getDisplayName(user: any) {
  if (!user) return 'Tôi';
  const rawName = user?.fullName || user?.name || user?.email || 'Học viên';
  return rawName.split(' ').filter(Boolean).pop() || 'Tôi';
}

function getAvatarUrl(user: any) {
  return user?.avatarUrl || user?.avatar || user?.photoUrl || user?.imageUrl || '';
}

export default function CourseQA({ courseId, currentLesson }: { courseId: string, currentLesson?: any }) {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý View: 'list' | 'detail' | 'new'
  const [viewState, setViewState] = useState<'list' | 'detail' | 'new'>('list');
  const [selectedThread, setSelectedThread] = useState<any>(null);

  // States cho form câu hỏi mới
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // States cho form trả lời
  const [replyContent, setReplyContent] = useState('');

  // States cho bộ lọc & phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLecture, setFilterLecture] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Image Modal
  const [modalImage, setModalImage] = useState<string | null>(null);

  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const isAuthenticated = !!token;
  const isOnLearningPage = location.pathname.startsWith('/student/learn');
  const canAskQuestion = isAuthenticated && isOnLearningPage;
  
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Refs for file input
  const fileInputNewRef = useRef<HTMLInputElement>(null);
  const fileInputReplyRef = useRef<HTMLInputElement>(null);

  // State cho modal báo cáo vi phạm
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    discussionId: number;
    reportedUserId: number;
    reportedUserName: string;
  } | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        setCurrentUser(JSON.parse(userString));
      } catch (e) {}
    }
  }, []);

  const uploadImageToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Lưu ý: axiosClient đã cấu hình interceptor trả về thẳng response.data
    const res: any = await axiosClient.post('/cloudinary/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res?.url || res?.data?.url;
  };

  const handlePasteImage = async (e: React.ClipboardEvent, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const toastId = toast.loading('Đang tải ảnh lên...');
            try {
              const url = await uploadImageToCloudinary(file);
              if (url) {
                const imgHtml = `\n<br/><img src="${url}" alt="attachment" class="mt-3 max-w-full rounded-lg max-h-64 object-contain shadow-sm border border-slate-200" />\n`;
                setter(prev => prev + imgHtml);
                toast.success('Tải ảnh thành công', { id: toastId });
              } else {
                toast.error('Không lấy được URL ảnh', { id: toastId });
              }
            } catch (err) {
              toast.error('Lỗi khi tải ảnh', { id: toastId });
            }
          }
        }
      }
    }
  };

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      const url = await uploadImageToCloudinary(file);
      if (url) {
        const imgHtml = `\n<br/><img src="${url}" alt="attachment" class="mt-3 max-w-full rounded-lg max-h-64 object-contain shadow-sm border border-slate-200" />\n`;
        setter(prev => prev + imgHtml);
        toast.success('Tải ảnh thành công', { id: toastId });
      } else {
        toast.error('Không lấy được URL ảnh', { id: toastId });
      }
    } catch (err) {
      toast.error('Lỗi khi tải ảnh', { id: toastId });
    }
    e.target.value = '';
  };

  // Lấy danh sách thảo luận
  const fetchDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get(`/public/courses/${courseId}/discussions`);
      const data = Array.isArray(res) ? res : res?.data || [];
      
      const parsedData = data.map((d: any) => {
        let title = '';
        let body = d.content;
        let lessonName = '';

        try {
          const parsed = JSON.parse(d.content);
          if (parsed && typeof parsed === 'object' && parsed.title) {
            title = parsed.title;
            body = parsed.content;
            lessonName = parsed.lessonName || '';
          }
        } catch {
          const lines = body.split('\n');
          if (lines.length > 1) {
             title = lines[0];
             body = lines.slice(1).join('\n');
          } else {
             title = body;
             body = '';
          }
        }
        return { ...d, parsedTitle: title, parsedBody: body, lessonName };
      });
      
      setDiscussions(parsedData);
      
      if (selectedThread) {
         const updatedThread = parsedData.find((t: any) => t.discussionId === selectedThread.discussionId);
         if (updatedThread) setSelectedThread(updatedThread);
      }
    } catch (err: any) {
      console.error('[CourseQA] fetchDiscussions error:', err?.response?.status, err?.message);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, selectedThread]);

  useEffect(() => {
    if (courseId) {
      fetchDiscussions();
    }
  }, [courseId]);

  const handlePostQuestion = async () => {
    if (!newTitle.trim() || !newQuestion.trim()) {
      toast.error('Vui lòng nhập cả tiêu đề và nội dung.');
      return;
    }

    const freshToken = localStorage.getItem('access_token');
    if (!freshToken) {
      toast.error('Vui lòng đăng nhập để đặt câu hỏi.');
      return;
    }

    const lessonNameToSave = currentLesson?.tenBaiHoc || "Bài giảng hiện tại"; 

    const payloadContent = JSON.stringify({
      title: newTitle.trim(),
      content: newQuestion.trim(),
      lessonName: lessonNameToSave,
      upvotes: 0
    });

    setIsPosting(true);
    try {
      await axiosClient.post(
        `/public/courses/${courseId}/discussions`,
        { noiDung: payloadContent },
        { headers: { Authorization: `Bearer ${freshToken}` } },
      );
      toast.success('Đã đăng câu hỏi thành công!');
      setNewTitle('');
      setNewQuestion('');
      setViewState('list');
      await fetchDiscussions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng câu hỏi');
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, discussionId: number) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích bình luận');
      return;
    }
    try {
      const res: any = await axiosClient.post(`/public/courses/${courseId}/discussions/${discussionId}/toggle-like`);
      const userId = currentUser?.maND || currentUser?.id || currentUser?.sub;
      
      const updateThread = (thread: any) => {
         const newLikedUserIds = res.data.isLiked 
             ? [...(thread.likedUserIds || []), userId]
             : (thread.likedUserIds || []).filter((id: number) => id !== userId);
         return { ...thread, upvotes: res.data.upvotes, likedUserIds: newLikedUserIds };
      };

      setDiscussions(prev => prev.map(d => d.discussionId === discussionId ? updateThread(d) : d));
      if (selectedThread && selectedThread.discussionId === discussionId) {
         setSelectedThread((prev: any) => updateThread(prev));
      }
    } catch (err) {
      toast.error('Lỗi khi thao tác');
    }
  };

  const handleHtmlClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'img') {
      setModalImage((target as HTMLImageElement).src);
    }
  }, []);

  // ─── Ẩn bình luận (INSTRUCTOR/ADMIN) ────────────────────────────────────────
  const handleHideDiscussion = async (courseId: string, discussionId: number) => {
    try {
      await axiosClient.patch(`/public/courses/${courseId}/discussions/${discussionId}/hide`);
      toast.success('Đã xử lý bình luận!');
      // Xóa khỏi danh sách hiện tại (optimistic)
      setDiscussions(prev => prev.filter(d => d.discussionId !== discussionId));
      if (selectedThread?.discussionId === discussionId) {
        setViewState('list');
        setSelectedThread(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể ẩn bình luận');
    }
  };

  // ─── Xóa mềm bình luận (USER=own, INSTRUCTOR=own course, ADMIN=all) ─────────
  const handleDeleteDiscussion = async (courseId: string, discussionId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await axiosClient.delete(`/public/courses/${courseId}/discussions/${discussionId}`);
      toast.success('Đã xử lý bình luận!');
      setDiscussions(prev => prev.filter(d => d.discussionId !== discussionId));
      if (selectedThread?.discussionId === discussionId) {
        setViewState('list');
        setSelectedThread(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa bình luận');
    }
  };

  /**
   * Menu 3 chấm cho mỗi bình luận — Conditional rendering theo role:
   * - Tác giả bình luận: Xóa
   * - USER khác: Báo cáo vi phạm
   * - INSTRUCTOR (khóa học): Ẩn + Xóa
   * - ADMIN: Ẩn + Xóa + Cảnh báo/Khóa
   */
  const DiscussionMenu = ({ disc, courseIdStr }: { disc: any; courseIdStr: string }) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const currentUserId = currentUser?.maND || currentUser?.id || currentUser?.sub;
    const currentRole = (currentUser?.vaiTro || currentUser?.role || '').toUpperCase();
    const isAuthor = disc.userId === currentUserId;
    const isAdmin = currentRole === 'ADMIN';
    const isInstructor = currentRole === 'INSTRUCTOR';

    // Đóng menu khi click ra ngoài
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isAuthenticated) return null;

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          title="Tùy chọn"
        >
          <MoreVertical size={15} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            {/* Tác giả: Xóa bình luận của chính mình */}
            {isAuthor && (
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); handleDeleteDiscussion(courseIdStr, disc.discussionId); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Xóa bình luận của tôi
              </button>
            )}

            {/* USER khác: Báo cáo vi phạm */}
            {!isAuthor && !isAdmin && !isInstructor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  setReportModal({ isOpen: true, discussionId: disc.discussionId, reportedUserId: disc.userId, reportedUserName: disc.userName });
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <Flag size={14} />
                Báo cáo vi phạm
              </button>
            )}

            {/* INSTRUCTOR: Ẩn + Xóa (trong khóa học mình dạy) */}
            {isInstructor && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); handleHideDiscussion(courseIdStr, disc.discussionId); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <EyeOff size={14} />
                  Ẩn bình luận
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); handleDeleteDiscussion(courseIdStr, disc.discussionId); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Xóa bình luận
                </button>
              </>
            )}

            {/* ADMIN: Ẩn + Xóa + Cảnh báo/Khóa */}
            {isAdmin && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); handleHideDiscussion(courseIdStr, disc.discussionId); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <EyeOff size={14} />
                  Ẩn bình luận
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); handleDeleteDiscussion(courseIdStr, disc.discussionId); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Xóa bình luận
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    setReportModal({ isOpen: true, discussionId: disc.discussionId, reportedUserId: disc.userId, reportedUserName: disc.userName });
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors font-semibold"
                >
                  <ShieldAlert size={14} />
                  Cảnh báo / Khóa user
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const handlePostReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời.');
      return;
    }

    const freshToken = localStorage.getItem('access_token');
    if (!freshToken) {
      toast.error('Vui lòng đăng nhập.');
      return;
    }

    setIsPosting(true);
    try {
      await axiosClient.post(
        `/public/courses/${courseId}/discussions`, 
        { noiDung: replyContent.trim(), parentId: selectedThread.discussionId },
        { headers: { Authorization: `Bearer ${freshToken}` } },
      );
      toast.success('Đã gửi phản hồi!');
      setReplyContent('');
      await fetchDiscussions();
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Hiện tại chỉ giảng viên mới có thể trả lời câu hỏi.');
      } else {
         toast.error('Có lỗi xảy ra khi gửi phản hồi.');
      }
    } finally {
      setIsPosting(false);
    }
  };


  const filteredDiscussions = useMemo(() => {
    let result = [...discussions];
    
    // Áp dụng bộ lọc bài giảng hiện tại
    if (filterLecture === 'current' && currentLesson?.tenBaiHoc) {
      result = result.filter(d => d.lessonName === currentLesson.tenBaiHoc);
    }
    
    if (searchTerm) {
      result = result.filter(d => 
        (d.parsedTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (d.parsedBody || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortOrder === 'recent') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortOrder === 'popular') {
      result.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'least_replied') {
      result.sort((a, b) => (a.replies?.length || 0) - (b.replies?.length || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'most_liked') {
      result.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'least_liked') {
      result.sort((a, b) => (a.upvotes || 0) - (b.upvotes || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [discussions, searchTerm, sortOrder]);

  const totalPages = Math.ceil(filteredDiscussions.length / ITEMS_PER_PAGE);
  const paginatedDiscussions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDiscussions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDiscussions, currentPage]);

  // Đổi trang
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder, filterLecture]);

  if (loading && discussions.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // ============== VIEW: TẠO CÂU HỎI MỚI ==============
  if (viewState === 'new') {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto space-y-6 text-slate-800">
        <button 
          onClick={() => setViewState('list')} 
          className="flex items-center text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Quay lại tất cả các câu hỏi
        </button>

        <div>
          <h2 className="text-2xl font-bold mb-6">Đặt câu hỏi mới</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tiêu đề (bắt buộc)</label>
              <input 
                type="text"
                placeholder="VD: Không sử dụng Claude code ở free plan được?"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Chi tiết câu hỏi (bắt buộc)</label>
              <div className="relative">
                <textarea 
                  placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải... (Có thể Paste ảnh vào đây)"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  onPaste={e => handlePasteImage(e, setNewQuestion)}
                  rows={6}
                  className="w-full border border-slate-300 rounded-md p-3 pb-12 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none text-slate-800"
                />
                <div className="absolute bottom-3 left-3 flex items-center">
                   <button 
                     onClick={() => fileInputNewRef.current?.click()}
                     className="text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full"
                     title="Tải ảnh lên"
                   >
                     <ImageIcon size={16} /> Thêm ảnh
                   </button>
                   <input 
                     type="file" 
                     accept="image/*" 
                     className="hidden" 
                     ref={fileInputNewRef}
                     onChange={e => handleSelectImage(e, setNewQuestion)}
                   />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePostQuestion}
                disabled={isPosting || !newTitle.trim() || !newQuestion.trim()}
                className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isPosting ? 'Đang đăng...' : 'Đăng câu hỏi'}
              </button>
              <button
                onClick={() => setViewState('list')}
                className="text-slate-700 font-bold px-6 py-2.5 rounded hover:bg-slate-100 transition-colors border border-transparent"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============== VIEW: CHI TIẾT ==============
  if (viewState === 'detail' && selectedThread) {
    const timeAgo = (dateStr: string) => {
      const d = new Date(dateStr);
      const diffDays = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 0) return 'Hôm nay';
      if (diffDays < 30) return `${diffDays} ngày trước`;
      return `${Math.floor(diffDays / 30)} tháng trước`;
    };

    return (
      <div className="animate-fade-in max-w-4xl mx-auto space-y-8 pb-12">
        <button 
          onClick={() => { setViewState('list'); setSelectedThread(null); }} 
          className="border border-purple-600 text-purple-700 font-semibold px-4 py-2 rounded-md hover:bg-purple-50 transition-colors text-sm"
        >
          Quay lại tất cả các câu hỏi
        </button>

        {/* Câu hỏi gốc */}
        <div className="mt-8">
          <div className="flex gap-5">
            <div className="shrink-0 pt-1">
              <UserAvatar src={selectedThread.userAvatar} name={selectedThread.userName} size="lg" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {selectedThread.parsedTitle}
                </h2>
              <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                  <span className="font-semibold text-sm">{selectedThread.upvotes || 0}</span>
                  <button 
                    onClick={(e) => handleToggleLike(e, selectedThread.discussionId)}
                    className={`p-1.5 rounded-full transition-colors ${selectedThread.likedUserIds?.includes(currentUser?.maND || currentUser?.id || currentUser?.sub) ? 'bg-purple-100 text-purple-700' : 'hover:bg-slate-100'}`}
                  >
                    <ThumbsUp size={16} className={selectedThread.likedUserIds?.includes(currentUser?.maND || currentUser?.id || currentUser?.sub) ? 'fill-current' : ''} />
                  </button>
                  {/* Menu 3 chấm cho câu hỏi gốc */}
                  <DiscussionMenu disc={selectedThread} courseIdStr={courseId} />
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-1.5 text-sm mb-6">
                <span className="text-purple-700 font-semibold hover:underline cursor-pointer">
                  {selectedThread.userName || 'Học viên'}
                </span>
                {selectedThread.lessonName && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="text-purple-700 font-semibold hover:underline cursor-pointer">
                      {selectedThread.lessonName}
                    </span>
                  </>
                )}
                <span className="text-slate-500">• {timeAgo(selectedThread.createdAt)}</span>
              </div>
              
              {/* Nội dung dạng HTML, giới hạn kích thước ảnh & click to view */}
              <div 
                className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[15px] prose max-w-none prose-img:max-h-80 prose-img:object-contain prose-img:rounded-lg prose-img:border prose-img:border-slate-200 prose-img:cursor-pointer"
                onClick={handleHtmlClick}
                dangerouslySetInnerHTML={{ __html: selectedThread.parsedBody }}
              />
            </div>
          </div>
        </div>

        {/* Khu vực Trả lời kiểu Facebook: Giật lùi vào trong, background màu xám nhạt */}
        <div className="pl-6 md:pl-16 border-l-2 border-slate-100 space-y-6">
          <h3 className="font-bold text-slate-800 text-md">
            {selectedThread.replies?.length || 0} câu trả lời
          </h3>

          <div className="space-y-4">
            {selectedThread.replies?.map((reply: any) => (
               <div key={reply.discussionId} className="flex gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <UserAvatar src={reply.userAvatar} name={reply.userName} size="sm" />
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                     <div className="flex items-center gap-2 flex-wrap">
                       <span className="font-bold text-slate-800 text-[14px]">{reply.userName || 'Người dùng'}</span>
                       {reply.userRole === 'INSTRUCTOR' && (
                         <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                           Giảng viên
                         </span>
                       )}
                       <span className="text-slate-500 text-xs">• {timeAgo(reply.createdAt)}</span>
                     </div>
                     {/* Menu 3 chấm cho reply */}
                     <DiscussionMenu disc={reply} courseIdStr={courseId} />
                   </div>
                   
                   <div 
                      className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[14px] prose max-w-none prose-img:max-h-64 prose-img:object-contain prose-img:rounded-lg prose-img:border prose-img:border-slate-200 prose-img:cursor-pointer prose-p:my-1"
                      onClick={handleHtmlClick}
                      dangerouslySetInnerHTML={{ __html: reply.content }}
                   />
                 </div>
               </div>
            ))}
          </div>

          {/* Form trả lời */}
          {canAskQuestion ? (
            <div className="mt-4 flex gap-3">
               <UserAvatar src={getAvatarUrl(currentUser)} name={getDisplayName(currentUser)} size="sm" />
               <div className="flex-1 relative">
                 <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onPaste={e => handlePasteImage(e, setReplyContent)}
                    placeholder="Viết câu trả lời của bạn... (Có thể Paste ảnh vào đây)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 pr-10 focus:outline-none focus:border-emerald-500 focus:bg-white min-h-[50px] resize-none text-sm transition-colors text-slate-800 font-medium"
                    rows={replyContent.trim() ? 3 : 1}
                 />
                 <div className="absolute right-3 top-3 flex gap-2">
                   <button
                     onClick={() => fileInputReplyRef.current?.click()}
                     className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                     title="Tải ảnh lên"
                   >
                     <ImageIcon size={18} />
                   </button>
                   <input 
                     type="file" 
                     accept="image/*" 
                     className="hidden" 
                     ref={fileInputReplyRef}
                     onChange={e => handleSelectImage(e, setReplyContent)}
                   />
                 </div>
                 {replyContent.trim() && (
                   <div className="mt-2 flex justify-end">
                      <button
                        onClick={handlePostReply}
                        disabled={isPosting}
                        className="bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
                      >
                        {isPosting ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" /> : <Send size={14} />}
                        Gửi trả lời
                      </button>
                   </div>
                 )}
               </div>
            </div>
          ) : (
            <div className="mt-4 text-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm">
               Đăng nhập để tham gia trả lời câu hỏi.
            </div>
          )}
        </div>
        
        {/* Modal Xem ảnh phóng to */}
        {modalImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4"
            onClick={() => setModalImage(null)}
          >
            <button className="absolute top-4 right-4 text-white hover:text-emerald-400 p-2">
              <X size={32} />
            </button>
            <img 
              src={modalImage} 
              alt="Zoomed attachment" 
              className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        )}

        {/* Modal Báo cáo vi phạm */}
        {reportModal?.isOpen && (
          <ReportModal
            isOpen={reportModal.isOpen}
            onClose={() => setReportModal(null)}
            discussionId={reportModal.discussionId}
            reportedUserId={reportModal.reportedUserId}
            reportedUserName={reportModal.reportedUserName}
          />
        )}
      </div>
    );
  }

  // ============== VIEW: DANH SÁCH MẶC ĐỊNH ==============
  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      
      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Tìm kiếm tất cả các câu hỏi trong khóa học" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-slate-300 rounded p-3 pl-4 pr-12 focus:outline-none focus:border-emerald-500 text-slate-800 text-sm"
          />
          <button className="absolute right-0 top-0 bottom-0 px-4 bg-emerald-600 text-white rounded-r flex items-center justify-center hover:bg-emerald-700 transition">
            <Search size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Bộ lọc:</label>
            <select 
              className="border border-slate-300 rounded py-2 px-3 text-sm focus:outline-none text-slate-700 min-w-[200px]"
              value={filterLecture}
              onChange={e => setFilterLecture(e.target.value)}
            >
              <option value="all">Tất cả các bài giảng</option>
              <option value="current">Bài giảng hiện tại</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Sắp xếp theo:</label>
            <select 
              className="border border-slate-300 rounded py-2 px-3 text-sm focus:outline-none text-slate-700 min-w-[200px]"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="recent">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="popular">Nhiều phản hồi nhất</option>
              <option value="least_replied">Ít phản hồi nhất</option>
              <option value="most_liked">Nhiều like nhất</option>
              <option value="least_liked">Ít like nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Header Danh sách */}
      <h3 className="font-bold text-slate-800 text-lg mt-8 mb-2">
        Tất cả các câu hỏi trong khóa học này ({filteredDiscussions.length})
      </h3>

      {/* Danh sách Câu hỏi */}
      <div className="space-y-0 border-t border-slate-200">
        {paginatedDiscussions.length === 0 ? (
           <div className="py-10 text-center text-slate-500">
             Không tìm thấy câu hỏi nào.
           </div>
        ) : (
          paginatedDiscussions.map((disc: any) => {
            const timeAgoStr = (() => {
              const d = new Date(disc.createdAt);
              const diffDays = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 3600 * 24));
              if (diffDays === 0) return 'Hôm nay';
              if (diffDays < 30) return `${diffDays} ngày trước`;
              return `${Math.floor(diffDays / 30)} tháng trước`;
            })();

            return (
              <div 
                key={disc.discussionId} 
                onClick={() => { setSelectedThread(disc); setViewState('detail'); }}
                className="flex gap-4 py-5 border-b border-slate-200 cursor-pointer hover:bg-slate-50 group transition-colors"
              >
                {/* Dùng component UserAvatar với viền bao nhẹ */}
                <UserAvatar src={disc.userAvatar} name={disc.userName} size="md" />
                
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-bold text-slate-800 text-[15px] mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                    {disc.parsedTitle || 'Không có tiêu đề'}
                  </h4>
                  {/* Loại bỏ HTML tags để render text thuần trong danh sách tóm tắt */}
                  <p className="text-slate-500 text-xs mb-2 line-clamp-1 truncate">
                    {disc.parsedBody?.replace(/<[^>]+>/g, '') || '...'}
                  </p>
                  
                  <div className="flex items-center flex-wrap gap-1 text-[11px] text-emerald-600">
                    <span className="text-slate-500 font-medium">{disc.userName || 'Học viên'}</span>
                    {disc.lessonName && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span>{disc.lessonName}</span>
                      </>
                    )}
                    <span className="text-slate-400">• {timeAgoStr}</span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2 text-slate-500">
                  <button 
                    onClick={(e) => handleToggleLike(e, disc.discussionId)}
                    className={`flex items-center gap-1.5 text-xs p-1.5 rounded transition-colors ${disc.likedUserIds?.includes(currentUser?.maND || currentUser?.id || currentUser?.sub) ? 'bg-purple-50 text-purple-700' : 'hover:bg-slate-100 hover:text-slate-700'}`}
                  >
                    <span className="font-semibold">{disc.upvotes || 0}</span>
                    <ThumbsUp size={15} className={disc.likedUserIds?.includes(currentUser?.maND || currentUser?.id || currentUser?.sub) ? 'fill-current' : ''} />
                  </button>
                  <div className="flex items-center gap-1.5 text-xs pr-1.5">
                    <span className="font-semibold text-slate-700">{disc.replies?.length || 0}</span>
                    <MessageCircle size={15} />
                  </div>
                  {/* Menu 3 chấm trong danh sách */}
                  <div onClick={e => e.stopPropagation()}>
                    <DiscussionMenu disc={disc} courseIdStr={courseId} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button 
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-2 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-700" />
          </button>
          
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            // Thu gọn phân trang nếu quá nhiều trang
            if (
              totalPages > 7 && 
              pageNum !== 1 && 
              pageNum !== totalPages && 
              (pageNum < currentPage - 1 || pageNum > currentPage + 1)
            ) {
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="text-slate-400 px-1">...</span>;
              }
              return null;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-9 h-9 flex items-center justify-center rounded font-semibold text-sm transition-colors ${
                  currentPage === pageNum 
                    ? 'bg-emerald-600 text-white border-transparent' 
                    : 'text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-2 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronRight size={18} className="text-slate-700" />
          </button>
        </div>
      )}

      {/* Button Tạo câu hỏi mới ở đáy */}
      {canAskQuestion && (
        <div className="pt-8 pb-12 flex justify-center">
           <button 
             onClick={() => setViewState('new')}
             className="border-2 border-slate-800 text-slate-800 font-bold px-8 py-3 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
           >
             <Plus size={18} /> Đặt câu hỏi mới
           </button>
        </div>
      )}

      {/* Modal Báo cáo vi phạm */}
      {reportModal?.isOpen && (
        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={() => setReportModal(null)}
          discussionId={reportModal.discussionId}
          reportedUserId={reportModal.reportedUserId}
          reportedUserName={reportModal.reportedUserName}
        />
      )}
    </div>
  );
}

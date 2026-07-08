import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { toast } from 'react-hot-toast';

function formatDistance(dateStr: string) {
  let d = new Date(dateStr);
  let now = new Date();
  
  // Fix TiDB/TypeORM timezone bug where dates are exactly 7 hours behind
  let fixedD = new Date(d.getTime() + 7 * 3600000);
  if (fixedD.getTime() > now.getTime() + 5 * 60000) {
    fixedD = d;
  }
  d = fixedD;
  
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
}

interface Tag {
  maThe: number;
  tenThe: string;
  duongDan: string;
}

interface Author {
  maND: number;
  hoTen: string;
  anhDaiDien: string | null;
}

interface Answer {
  maCTL: number;
  noiDung: string;
  luotBinhChon: number;
  laDapAnDung: boolean;
  ngayTao: string;
  nguoiThich?: (string | number)[];
  tacGia: Author;
  cacPhanHoi?: Answer[];
}

interface QuestionDetail {
  maCH: number;
  tieuDe: string;
  noiDung: string;
  luotXem: number;
  luotBinhChon: number;
  soCauTraLoi: number;
  ngayTao: string;
  nguoiThich?: (string | number)[];
  tacGia: Author;
  danhSachThe: Tag[];
  danhSachTraLoi: Answer[];
}

// Biến toàn cục (module-level) để lưu vết các ID đã xem trong phiên này
// Đảm bảo 100% không bị ảnh hưởng bởi React Strict Mode mount/unmount
const viewedQuestionsInSession = new Set<string>();

export default function ForumDetail() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'top'>('newest');
  
  // For replying
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // For nested replies
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [nestedReplyContent, setNestedReplyContent] = useState('');
  const [isSubmittingNested, setIsSubmittingNested] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});
  const nestedQuillRef = useRef<ReactQuill>(null);

  // Get current user to highlight liked items
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const fetchQuestion = async () => {
    try {
      // Chỉ tăng view nếu id chưa có trong Set toàn cục (phiên hiện tại)
      const shouldIncrement = id && !viewedQuestionsInSession.has(id);
      
      if (shouldIncrement) {
        viewedQuestionsInSession.add(id);
      }

      const data: any = await axiosClient.get(`/forum/questions/${id}${shouldIncrement ? '?increment=true' : ''}`);
      setQuestion(data);
    } catch (error) {
      console.error('Error fetching question details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQuestion();
  }, [id]);

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || replyContent === '<p><br></p>') {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }
    setIsReplying(true);
    try {
      await axiosClient.post(`/forum/questions/${id}/answers`, {
        noiDung: replyContent,
      });
      toast.success('Gửi câu trả lời thành công');
      setReplyContent('');
      fetchQuestion(); // reload
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Không thể gửi câu trả lời');
    } finally {
      setIsReplying(false);
    }
  };

  const handleNestedReplySubmit = async (maCTL_Cha: number) => {
    if (!nestedReplyContent.trim() || nestedReplyContent === '<p><br></p>') {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }
    setIsSubmittingNested(true);
    try {
      await axiosClient.post(`/forum/questions/${id}/answers`, {
        noiDung: nestedReplyContent,
        maCTL_Cha,
      });
      toast.success('Gửi phản hồi thành công');
      setNestedReplyContent('');
      setReplyingTo(null);
      setExpandedReplies(prev => ({ ...prev, [maCTL_Cha]: true }));
      fetchQuestion();
    } catch (error) {
      console.error('Error posting nested reply:', error);
      toast.error('Không thể gửi phản hồi');
    } finally {
      setIsSubmittingNested(false);
    }
  };

  const toggleReplies = (maCTL: number) => {
    setExpandedReplies(prev => ({
      ...prev,
      [maCTL]: !prev[maCTL]
    }));
  };

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        const uploadToast = toast.loading('Đang tải ảnh lên...');
        try {
          const res: any = await axiosClient.post('/forum/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          // Insert image to editor
          const editor = quillRef.current?.getEditor();
          if (editor && res.url) {
            const range = editor.getSelection(true);
            editor.insertEmbed(range.index, 'image', res.url);
          }
          toast.success('Tải ảnh lên thành công', { id: uploadToast });
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Tải ảnh thất bại', { id: uploadToast });
        }
      }
    };
  };

  const handleUpvoteQuestion = async () => {
    try {
      const res: any = await axiosClient.post(`/forum/questions/${id}/upvote`);
      if (res.data) {
        setQuestion(prev => prev ? { 
          ...prev, 
          luotBinhChon: res.data.luotBinhChon,
          nguoiThich: res.data.isLiked 
            ? [...(prev.nguoiThich || []), user?.maND] 
            : (prev.nguoiThich || []).filter((u: any) => u != user?.maND)
        } : prev);
      }
    } catch (e) {
      toast.error('Bình chọn thất bại');
    }
  };

  const handleUpvoteAnswer = async (answerId: number) => {
    try {
      const res: any = await axiosClient.post(`/forum/answers/${answerId}/upvote`);
      if (res.data) {
        setQuestion(prev => {
          if (!prev) return prev;
          const newAnswers = prev.danhSachTraLoi.map(a => 
            a.maCTL === answerId ? { 
              ...a, 
              luotBinhChon: res.data.luotBinhChon,
              nguoiThich: res.data.isLiked 
                ? [...(a.nguoiThich || []), user?.maND]
                : (a.nguoiThich || []).filter((u: any) => u != user?.maND)
            } : a
          );
          return { ...prev, danhSachTraLoi: newAnswers };
        });
      }
    } catch (e) {
      toast.error('Bình chọn thất bại');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép liên kết');
  };

  const sortedAnswers = useMemo(() => {
    if (!question) return [];
    const answers = [...question.danhSachTraLoi];
    if (sortBy === 'newest') {
      answers.sort((a, b) => new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime());
    } else if (sortBy === 'oldest') {
      answers.sort((a, b) => new Date(a.ngayTao).getTime() - new Date(b.ngayTao).getTime());
    } else if (sortBy === 'top') {
      answers.sort((a, b) => b.luotBinhChon - a.luotBinhChon);
    }
    return answers;
  }, [question, sortBy]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-red-500">Câu hỏi không tồn tại.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Author info & Metadata */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          {question.tacGia.anhDaiDien ? (
            <img src={question.tacGia.anhDaiDien} alt="avatar" className="w-5 h-5 rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#0074cc] text-white flex items-center justify-center text-[10px]">
              {question.tacGia.hoTen.charAt(0)}
            </div>
          )}
          <span className="text-[#0074cc] font-medium">{question.tacGia.hoTen}</span>
          <span>•</span>
          <span>{formatDistance(question.ngayTao)}</span>
          <span>•</span>
          <span>{question.luotXem} lượt xem</span>
        </div>

        <style>{`
          .forum-content img {
            max-width: 100% !important;
            max-height: 350px !important;
            border-radius: 8px;
            height: auto !important;
            display: block !important;
            margin: 10px 0 !important;
            margin-right: auto !important;
          }
          .forum-content p {
            margin-bottom: 0.5em;
          }
        `}</style>

        {/* Title */}
        <h1 className="text-[22px] text-gray-900 mb-4 leading-snug">{question.tieuDe}</h1>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-gray-800 text-xs px-2 py-1 rounded font-medium">
            <svg className="w-3.5 h-3.5" viewBox="0 0 18 18"><path fill="currentColor" d="M9 1C4.64 1 1 4.64 1 9c0 4.36 3.64 8 8 8 4.36 0 8-3.64 8-8 0-4.36-3.64-8-8-8zm.81 12.13c-.02.71-.55 1.15-1.24 1.13-.66-.02-1.17-.49-1.15-1.2.02-.72.56-1.18 1.22-1.16.7.03 1.2.51 1.17 1.23zM11.77 8c-.59.66-1.78 1.09-2.05 1.97a4 4 0 0 0-.09.71h-1.35c0-.88.16-1.61 1.06-2.19.88-.56 1.36-.98 1.36-1.55.01-.58-.33-1.04-1.03-1.04-.63 0-1 .42-1.11.96l-1.35-.15A2.62 2.62 0 0 1 9.27 5c1.47 0 2.5 1.06 2.5 2.15 0 1.06-.55 1.57-1.18 2.15z"></path></svg>
            Hỏi đáp
          </span>
          {question.danhSachThe.map(tag => (
            <span key={tag.maThe} className="bg-[#e1ecf4] text-[#39739d] text-xs px-2 py-1 rounded hover:bg-[#d0e3f1] cursor-pointer">
              {tag.tenThe}
            </span>
          ))}
        </div>

        {/* Body content */}
        <div 
          className="text-[15px] leading-relaxed text-gray-800 forum-content mb-6"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.noiDung) }}
        />

        {/* Actions Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center border rounded overflow-hidden transition ${question.nguoiThich?.includes(user?.maND?.toString() as any) || question.nguoiThich?.includes(user?.maND as any) ? 'border-[#f48225] text-[#f48225] bg-[#fff8f2]' : 'border-gray-300 text-gray-600'}`}>
              <button 
                onClick={handleUpvoteQuestion}
                className="flex items-center justify-center px-3 py-1.5 hover:bg-black/5 transition"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
                {question.luotBinhChon}
              </button>
              <div className={`w-px h-5 ${question.nguoiThich?.includes(user?.maND?.toString() as any) || question.nguoiThich?.includes(user?.maND as any) ? 'bg-[#f48225]/30' : 'bg-gray-300'}`}></div>
              <button className="flex items-center justify-center px-3 py-1.5 hover:bg-black/5 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path></svg>
              </button>
            </div>
            
            <button onClick={handleShare} className="text-gray-500 hover:text-gray-800 text-sm font-medium">Share</button>
          </div>
        </div>

        {/* Replies Section */}
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-medium text-gray-800">{question.soCauTraLoi} Replies</h2>
          <div className="flex items-center text-sm text-gray-600">
            Sort by: 
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              className="ml-2 border border-gray-300 rounded p-1 text-sm bg-white"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="top">Nhiều bình chọn</option>
            </select>
          </div>
        </div>

        {/* Input box */}
        <div className="mb-8 border border-gray-300 rounded-md p-4 bg-white shadow-sm">
          <div className="h-[180px] mb-12">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={replyContent}
              onChange={setReplyContent}
              modules={modules}
              className="h-full"
              placeholder="Viết câu trả lời của bạn ở đây..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleReplySubmit}
              disabled={isReplying}
              className="bg-[#0a95ff] hover:bg-[#0074cc] text-white px-4 py-2 rounded text-sm font-medium shadow-sm transition disabled:opacity-50"
            >
              {isReplying ? 'Đang gửi...' : 'Gửi câu trả lời'}
            </button>
          </div>
        </div>

        {/* List of answers */}
        {sortedAnswers.length > 0 ? (
          <div className="space-y-6">
            {sortedAnswers.map(answer => (
              <div key={answer.maCTL} className="flex gap-4 border-b border-gray-100 pb-6">
                <div className="flex flex-col items-center gap-2 w-12 shrink-0">
                  {answer.tacGia.anhDaiDien ? (
                    <img src={answer.tacGia.anhDaiDien} alt="avatar" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      {answer.tacGia.hoTen.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1 text-sm">
                    <span className="font-medium text-gray-800">{answer.tacGia.hoTen}</span>
                    <span className="text-gray-500">{formatDistance(answer.ngayTao)}</span>
                  </div>
                  <div className="ql-snow mb-3">
                    <div 
                      className="ql-editor text-gray-800 whitespace-pre-wrap text-sm forum-content"
                      style={{ padding: 0 }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(answer.noiDung) }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button 
                      onClick={() => handleUpvoteAnswer(answer.maCTL)}
                      className={`flex items-center font-medium transition ${answer.nguoiThich?.includes(user?.maND?.toString() as any) || answer.nguoiThich?.includes(user?.maND as any) ? 'text-[#f48225]' : 'hover:text-gray-800'}`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
                      {answer.luotBinhChon}
                    </button>
                    <button onClick={handleShare} className="hover:text-gray-800">Share</button>
                    <button 
                      onClick={() => setReplyingTo(replyingTo === answer.maCTL ? null : answer.maCTL)} 
                      className="hover:text-gray-800 font-medium ml-2"
                    >
                      Phản hồi
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === answer.maCTL && (
                    <div className="mt-4 border border-gray-300 rounded-md p-3 bg-gray-50">
                      <div className="h-[120px] mb-10">
                        <ReactQuill
                          ref={nestedQuillRef}
                          theme="snow"
                          value={nestedReplyContent}
                          onChange={setNestedReplyContent}
                          modules={modules}
                          className="h-full bg-white"
                          placeholder="Viết phản hồi của bạn..."
                        />
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        <button onClick={() => setReplyingTo(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Hủy</button>
                        <button
                          onClick={() => handleNestedReplySubmit(answer.maCTL)}
                          disabled={isSubmittingNested}
                          className="bg-[#0a95ff] hover:bg-[#0074cc] text-white px-3 py-1.5 rounded text-sm font-medium transition disabled:opacity-50"
                        >
                          {isSubmittingNested ? 'Đang gửi...' : 'Gửi'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {answer.cacPhanHoi && answer.cacPhanHoi.length > 0 && (
                    <div className="mt-3">
                      <button 
                        onClick={() => toggleReplies(answer.maCTL)}
                        className="text-[#0a95ff] text-sm font-medium hover:underline flex items-center gap-1 mb-3"
                      >
                        <svg className={`w-4 h-4 transition-transform ${expandedReplies[answer.maCTL] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        {expandedReplies[answer.maCTL] ? 'Ẩn phản hồi' : `Xem ${answer.cacPhanHoi.length} phản hồi`}
                      </button>
                      
                      {expandedReplies[answer.maCTL] && (
                        <div className="pl-4 sm:pl-6 border-l-2 border-gray-200 space-y-4">
                          {answer.cacPhanHoi.map(reply => (
                            <div key={reply.maCTL} className="flex gap-3">
                              <div className="w-8 h-8 shrink-0">
                                {reply.tacGia.anhDaiDien ? (
                                  <img src={reply.tacGia.anhDaiDien} alt="avatar" className="w-full h-full rounded-full" />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">
                                    {reply.tacGia.hoTen.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium text-gray-800">{reply.tacGia.hoTen}</span>
                                    <span className="text-gray-500">{formatDistance(reply.ngayTao)}</span>
                                  </div>
                                </div>
                                <div className="ql-snow">
                                  <div 
                                    className="ql-editor text-gray-800 whitespace-pre-wrap text-sm forum-content"
                                    style={{ padding: 0 }}
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.noiDung) }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic text-sm">Chưa có câu trả lời nào.</div>
        )}

      </div>
    </div>
  );
}

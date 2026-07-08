import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

function formatDistance(dateStr: string) {
  let d = new Date(dateStr);
  let now = new Date();
  
  // Fix TiDB/TypeORM timezone bug where dates are exactly 7 hours behind
  let fixedD = new Date(d.getTime() + 7 * 3600000);
  if (fixedD.getTime() > now.getTime() + 5 * 60000) {
    fixedD = d;
  }
  d = fixedD;
  
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 60) return `${Math.max(diff, 0)} phút trước`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
}

function stripHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
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

interface Question {
  maCH: number;
  tieuDe: string;
  noiDung: string;
  luotXem: number;
  luotBinhChon: number;
  soCauTraLoi: number;
  ngayTao: string;
  tacGia: Author;
  danhSachThe: Tag[];
}

export default function ForumHome() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('MOI_NHAT');

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const data: any = await axiosClient.get(`/forum/questions?sapXep=${sortBy}`);
        if (data) {
          setQuestions(data.danhSach || []);
          setTotalCount(data.tongSo || 0);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [sortBy]);

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-medium text-gray-800">Câu hỏi mới nhất</h1>
            <Link to="/forum/ask" className="bg-[#0a95ff] hover:bg-[#0074cc] text-white px-3 py-2 rounded text-sm font-medium shadow-sm transition">
              Đặt câu hỏi
            </Link>
          </div>

          {/* Stats and Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="text-lg text-gray-700">
              {totalCount.toLocaleString()} câu hỏi
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex border border-gray-400 rounded overflow-hidden text-[13px]">
                <button 
                  onClick={() => setSortBy('MOI_NHAT')}
                  className={`px-3 py-2 border-r border-gray-400 hover:bg-gray-50 transition ${sortBy === 'MOI_NHAT' ? 'bg-gray-200 text-gray-900 font-medium' : 'text-gray-600'}`}
                >
                  Mới nhất
                </button>
                <button 
                  onClick={() => setSortBy('NHIEU_VIEW_NHAT')}
                  className={`px-3 py-2 border-r border-gray-400 hover:bg-gray-50 transition ${sortBy === 'NHIEU_VIEW_NHAT' ? 'bg-gray-200 text-gray-900 font-medium' : 'text-gray-600'}`}
                >
                  Nhiều View
                </button>
                <button 
                  onClick={() => setSortBy('CHUA_TRA_LOI')}
                  className={`px-3 py-2 hover:bg-gray-50 transition ${sortBy === 'CHUA_TRA_LOI' ? 'bg-gray-200 text-gray-900 font-medium' : 'text-gray-600'}`}
                >
                  Chưa trả lời
                </button>
              </div>
              
              <button className="flex items-center gap-1 bg-[#e1ecf4] text-[#39739d] hover:bg-[#b3d3ea] border border-[#7aa7c7] px-3 py-2 rounded text-sm transition">
                <svg aria-hidden="true" className="w-4 h-4" width="18" height="18" viewBox="0 0 18 18"><path d="M2 4h14v2H2zM4 8h10v2H4zM6 12h6v2H6z" fill="currentColor"></path></svg>
                Lọc
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="border-t border-gray-200">
            {loading ? (
              <div className="py-8 text-center text-gray-500">Đang tải...</div>
            ) : (
              questions.map((q) => (
                <div key={q.maCH} className="flex gap-4 py-4 border-b border-gray-200">
                  {/* Left Column (Stats) */}
                  <div className="flex flex-col items-end gap-1 text-xs text-right whitespace-nowrap w-24 shrink-0">
                    <div className="text-gray-500">
                      <span className="font-medium text-gray-800">{q.luotBinhChon}</span> bình chọn
                    </div>
                    <div className={`px-1.5 py-0.5 rounded ${q.soCauTraLoi > 0 ? 'text-green-600 border border-green-600' : 'text-gray-500'}`}>
                      <span className="font-medium">{q.soCauTraLoi}</span> trả lời
                    </div>
                    <div className="text-gray-500">
                      <span className="font-medium text-gray-800">{q.luotXem}</span> lượt xem
                    </div>
                  </div>

                  {/* Right Column (Content) */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/forum/question/${q.maCH}`} className="text-[17px] text-[#0074cc] hover:text-[#0a95ff] mb-1 leading-snug pr-6 break-words block">
                      {q.tieuDe}
                    </Link>
                    <p className="text-[13px] text-gray-700 mb-2 line-clamp-2 break-words">
                      {stripHtml(q.noiDung)}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-between gap-y-2 mt-1">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {q.danhSachThe.map(tag => (
                          <span 
                            key={tag.maThe} 
                            className="inline-block bg-[#e1ecf4] text-[#39739d] text-[12px] px-1.5 py-1 rounded hover:bg-[#d0e3f1] hover:text-[#2c5877] cursor-pointer transition"
                          >
                            {tag.tenThe}
                          </span>
                        ))}
                      </div>
                      
                      {/* Author & Time */}
                      <div className="flex items-center gap-1.5 text-[12px]">
                        {q.tacGia.anhDaiDien ? (
                          <img src={q.tacGia.anhDaiDien} alt="avatar" className="w-4 h-4 rounded" />
                        ) : (
                          <div className="w-4 h-4 rounded bg-gray-300 flex items-center justify-center text-white text-[10px]">
                            {q.tacGia.hoTen.charAt(0)}
                          </div>
                        )}
                        <span className="text-[#0074cc] hover:text-[#0a95ff] cursor-pointer">
                          {q.tacGia.hoTen}
                        </span>
                        <span className="text-gray-500 font-bold">1</span>
                        <span className="text-[#6a737c]">
                          đã hỏi {formatDistance(q.ngayTao)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

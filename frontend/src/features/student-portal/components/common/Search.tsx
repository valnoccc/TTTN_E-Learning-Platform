import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, TrendingUp } from 'lucide-react';

const popularKeywords = ['React', 'NestJS', 'Python', 'TypeScript', 'Docker', 'JavaScript', 'Node.js', 'TailwindCSS'];

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsOpen(false);
    setQuery('');
    navigate(`/course-grid?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <>
      {/* Trigger Button */}
      <a
        href="#"
        className="nav-link nav-search"
        id="search-trigger"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
      >
        <i className="las la-search" style={{ fontSize: '20px' }}></i>
      </a>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[999999] flex items-start justify-center pt-[15vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Box */}
          <div
            className="relative w-[90%] max-w-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{
              animation: 'searchModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors border-0 cursor-pointer"
              title="Đóng"
            >
              <X size={16} className="text-red-500" />
            </button>

            {/* Search Input */}
            <form onSubmit={handleSubmit} className="p-6 pb-4">
              <div className="flex items-center gap-3 bg-slate-50 rounded-full px-5 py-3.5 border border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                <SearchIcon size={20} className="text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm khóa học, giảng viên, chủ đề..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 text-base placeholder-slate-400"
                  style={{ fontSize: '15px', color: '#1e293b' }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>

            {/* Gợi ý từ khóa phổ biến */}
            <div className="px-6 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Từ khóa phổ biến
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => handleSearch(keyword)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-sm font-medium rounded-full transition-all duration-200 border-0 cursor-pointer hover:shadow-sm"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* Hint */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-400 m-0 text-center">
                Nhấn <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-500 font-mono text-[10px]">Enter</kbd> để tìm kiếm
                &nbsp;·&nbsp;
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-500 font-mono text-[10px]">Esc</kbd> để đóng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Animation CSS */}
      <style>{`
        @keyframes searchModalIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

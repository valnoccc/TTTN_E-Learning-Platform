import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import { Styles } from './styles/blog';
import axiosClient from '../../../../api/axios';
import { Search, Calendar, User, Eye, ChevronLeft, ChevronRight, BookmarkCheck } from 'lucide-react';
import { estimateReadTime } from './utils/article';
import { useSavedArticles } from './hooks/useSavedArticles';

interface PostItem {
  maBV: number;
  tieuDe: string;
  slug: string;
  tomTat: string;
  hinhAnh: string;
  luotXem: number;
  trangThai: string;
  ngayTao: string;
  maDMBV: number;
  category?: {
    maDMBV: number;
    tenDMBV: string;
    slug: string;
  };
  tacGia?: {
    maND: number;
    hoTen: string;
    anhDaiDien?: string;
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function BlogGrid() {
  const { isSaved } = useSavedArticles();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [maDMBV, setMaDMBV] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'a-z' | 'z-a'>('newest');
  const [categories, setCategories] = useState<{ maDMBV: number; tenDMBV: string; slug: string }[]>([]);
  const limit = 6;

  useEffect(() => {
    axiosClient.get('/post-categories').then((res: any) => {
      setCategories(res?.data || []);
    }).catch(() => {
      console.error('Không thể tải danh mục bài viết');
    });
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const res: any = await axiosClient.get('/posts', {
          params: { page, limit, search: search || undefined, maDMBV: maDMBV || undefined, sortBy },
        });
        setPosts(res?.data ?? []);
        setTotal(res?.total ?? 0);
      } catch (err) {
        console.error('Lỗi khi tải danh sách bài viết:', err);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [page, search, maDMBV, sortBy]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <Styles>
      <div className="main-wrapper blog-grid-page">
        <BreadcrumbBox title="Bài viết" />

        <section className="blog-grid-area">
          <Container>
            {/* Search Bar */}
            <Row className="mb-4">
              <Col lg="6" md="8" className="mx-auto">
                <form onSubmit={handleSearch} className="relative">
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-colors">
                    <div className="pl-4 text-slate-400">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Tìm kiếm bài viết..."
                      className="flex-1 px-3 py-3 text-sm outline-none border-none bg-transparent"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Tìm kiếm
                    </button>
                  </div>
                </form>
              </Col>
            </Row>

            <div className="mb-6 flex flex-wrap justify-center gap-2">
              <button onClick={() => { setMaDMBV(''); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-medium ${!maDMBV ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'}`}>Tất cả</button>
              {categories.map((cat) => (
                <button key={cat.maDMBV} onClick={() => { setMaDMBV(cat.maDMBV); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-medium ${maDMBV === cat.maDMBV ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'}`}>{cat.tenDMBV}</button>
              ))}
            </div>

            {/* Results count & Sorting */}
            {!isLoading && (
              <Row className="mb-3">
                <Col className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <p className="text-sm text-slate-500 m-0">
                    {total === 0 && 'Không tìm thấy bài viết nào'}
                    {total > 0 && search && (
                      <span>
                        Kết quả tìm kiếm cho từ khóa "<strong>{search}</strong>"
                        <button
                          onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                          className="ml-2 text-emerald-600 hover:underline"
                        >
                          Xóa bộ lọc
                        </button>
                      </span>
                    )}
                  </p>
                  {total > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-500 font-medium">Sắp xếp:</span>
                      <select 
                        value={sortBy} 
                        onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
                        className="text-sm border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 bg-white shadow-sm"
                      >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="views">Xem nhiều nhất</option>
                        <option value="a-z">Tên (A-Z)</option>
                        <option value="z-a">Tên (Z-A)</option>
                      </select>
                    </div>
                  )}
                </Col>
              </Row>
            )}

            {/* Loading State */}
            {isLoading ? (
              <Row>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Col lg="4" md="6" key={n}>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6 animate-pulse">
                      <div className="h-48 bg-slate-200" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 bg-slate-200 rounded w-1/3" />
                        <div className="h-5 bg-slate-200 rounded w-full" />
                        <div className="h-3 bg-slate-200 rounded w-2/3" />
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Search size={28} className="text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-600 mb-2">Chưa có bài viết nào</h4>
                <p className="text-slate-400">Các bài viết mới sẽ sớm được cập nhật!</p>
              </div>
            ) : (
              <>
                {/* Blog Grid */}
                <Row>
                  {posts.map((post) => (
                    <Col lg="4" md="6" key={post.maBV}>
                      <div
                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                      >
                        {/* Thumbnail */}
                        <div className="h-48 overflow-hidden bg-slate-100 relative">
                          <img
                            src={post.hinhAnh || '/assets/images/blog-1.jpg'}
                            alt={post.tieuDe}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e: any) => { e.target.src = '/assets/images/blog-1.jpg'; }}
                          />
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-slate-600">
                              <Eye size={12} />
                              {post.luotXem}
                            </span>
                            {isSaved(post.maBV) && (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500/90 backdrop-blur-sm rounded-full text-white shadow-sm" title="Đã lưu">
                                <BookmarkCheck size={14} />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          {/* Meta */}
                          <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(post.ngayTao)}
                            </span>
                            {post.tacGia && (
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {post.tacGia.hoTen}
                              </span>
                            )}
                            <span>⏳ {estimateReadTime(post.tomTat || '')} phút đọc</span>
                          </div>

                          <span className="mb-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{post.category?.tenDMBV ?? 'Tin tức'}</span>

                          {/* Title */}
                          <h6 className="font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">
                            {post.tieuDe}
                          </h6>

                          {/* Summary */}
                          <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                            {post.tomTat}
                          </p>

                          {/* Read more */}
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <span className="text-sm font-medium text-emerald-600 group-hover:text-emerald-700 inline-flex items-center gap-1">
                              Đọc thêm
                              <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6 mb-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                      Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </Container>
        </section>
      </div>
    </Styles>
  );
}

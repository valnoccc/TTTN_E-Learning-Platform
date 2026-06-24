import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import axiosClient from '../../../../api/axios';
import { Calendar, User, Eye, ArrowLeft, Clock } from 'lucide-react';

interface PostDetail {
  maBV: number;
  tieuDe: string;
  slug: string;
  tomTat: string;
  noiDung: string;
  hinhAnh: string;
  luotXem: number;
  trangThai: string;
  ngayTao: string;
  ngayCapNhat: string;
  tacGia?: {
    maND: number;
    hoTen: string;
    anhDaiDien?: string;
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export default function BlogDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res: any = await axiosClient.get(`/posts/${slug}`);
        setPost(res?.data ?? null);
      } catch (err: any) {
        console.error('Lỗi khi tải bài viết:', err);
        setError(
          err.response?.status === 404
            ? 'Bài viết không tồn tại hoặc đã bị gỡ.'
            : 'Đã xảy ra lỗi khi tải bài viết. Vui lòng thử lại sau.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <BreadcrumbBox title="Đang tải..." />
        <Container>
          <div className="max-w-4xl mx-auto py-12">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="flex gap-4">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-4 bg-slate-200 rounded w-24" />
              </div>
              <div className="h-64 bg-slate-200 rounded-2xl" />
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <BreadcrumbBox title="Lỗi" />
        <Container>
          <div className="max-w-2xl mx-auto py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-3xl">😔</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">
              {error || 'Không tìm thấy bài viết'}
            </h3>
            <button
              onClick={() => navigate('/blog-grid')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách bài viết
            </button>
          </div>
        </Container>
      </div>
    );
  }

  const readTime = estimateReadTime(post.noiDung || '');

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <BreadcrumbBox title={post.tieuDe} />

      <Container>
        <Row className="justify-content-center">
          <Col lg="9" md="10">
            <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-10 mb-8">
              {/* Featured Image */}
              {post.hinhAnh && (
                <div className="w-full h-[320px] md:h-[420px] overflow-hidden">
                  <img
                    src={post.hinhAnh}
                    alt={post.tieuDe}
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.src = '/assets/images/blog-1.jpg'; }}
                  />
                </div>
              )}

              <div className="p-6 md:p-10">
                {/* Back link */}
                <button
                  onClick={() => navigate('/blog-grid')}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6"
                >
                  <ArrowLeft size={14} />
                  Quay lại danh sách
                </button>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-5">
                  {post.tieuDe}
                </h1>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                  {post.tacGia && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                        {post.tacGia.anhDaiDien ? (
                          <img
                            src={post.tacGia.anhDaiDien}
                            alt={post.tacGia.hoTen}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-emerald-600" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {post.tacGia.hoTen}
                      </span>
                    </div>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Calendar size={14} />
                    {formatDate(post.ngayTao)}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Eye size={14} />
                    {post.luotXem} lượt xem
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock size={14} />
                    {readTime} phút đọc
                  </span>
                </div>

                {/* Summary */}
                {post.tomTat && (
                  <div className="bg-emerald-50/50 border-l-4 border-emerald-500 rounded-r-xl p-4 mb-8">
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      {post.tomTat}
                    </p>
                  </div>
                )}

                {/* Content */}
                <div
                  className="prose prose-slate prose-lg max-w-none
                    prose-headings:text-slate-800 prose-headings:font-bold
                    prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4
                    prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-slate-800
                    prose-ul:space-y-2 prose-li:text-slate-600
                    prose-pre:bg-slate-900 prose-pre:rounded-xl prose-pre:text-sm
                    prose-code:text-emerald-600 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                    prose-img:rounded-xl prose-img:shadow-md"
                  dangerouslySetInnerHTML={{ __html: post.noiDung || '' }}
                />
              </div>
            </article>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

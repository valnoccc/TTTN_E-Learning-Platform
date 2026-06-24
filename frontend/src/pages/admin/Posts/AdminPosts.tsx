import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, FileText, Search, Loader2 } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import axiosClient from '../../../api/axios';
import toast from 'react-hot-toast';

interface PostItem {
  maBV: number;
  tieuDe: string;
  slug: string;
  hinhAnh?: string;
  luotXem: number;
  trangThai: string;
  ngayTao: string;
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
    month: '2-digit',
    year: 'numeric',
  });
}

export default function AdminPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PostItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res: any = await axiosClient.get('/admin/posts');
      setPosts(res?.data ?? []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách bài viết:', err);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axiosClient.delete(`/admin/posts/${deleteTarget.maBV}`);
      toast.success('Xóa bài viết thành công!');
      setPosts((prev) => prev.filter((p) => p.maBV !== deleteTarget.maBV));
      setDeleteTarget(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi khi xóa bài viết';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPosts = posts.filter((p) =>
    p.tieuDe.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={24} className="text-[#1dbf73]" />
              Quản lý bài viết
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý tất cả bài viết trên hệ thống Edumeo
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/posts/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1dbf73] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#18a864] shadow-sm"
          >
            <Plus size={18} />
            Thêm bài viết
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-[#1dbf73]" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">
                {searchTerm ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết nào'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ID
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ảnh
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tiêu đề
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tác giả
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Lượt xem
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Trạng thái
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ngày tạo
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.maBV}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-700">
                        #{post.maBV}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="h-10 w-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          {post.hinhAnh ? (
                            <img
                              src={post.hinhAnh}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e: any) => {
                                e.target.src = '/assets/images/blog-1.jpg';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                              <FileText size={16} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1 max-w-[280px]">
                          {post.tieuDe}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          /{post.slug}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {post.tacGia?.hoTen || 'N/A'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                          <Eye size={13} className="text-slate-400" />
                          {post.luotXem}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            post.trangThai === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {post.trangThai === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {formatDate(post.ngayTao)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/posts/${post.maBV}/edit`)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                            title="Sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(post)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        {!isLoading && posts.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span>
              Tổng cộng: <strong className="text-slate-700">{posts.length}</strong> bài viết
            </span>
            <span>
              Đã xuất bản:{' '}
              <strong className="text-emerald-600">
                {posts.filter((p) => p.trangThai === 'PUBLISHED').length}
              </strong>
            </span>
            <span>
              Bản nháp:{' '}
              <strong className="text-slate-600">
                {posts.filter((p) => p.trangThai === 'DRAFT').length}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              Xác nhận xóa bài viết
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Bạn có chắc chắn muốn xóa bài viết{' '}
              <strong className="text-slate-700">"{deleteTarget.tieuDe}"</strong>? Hành động này
              không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-70 inline-flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa bài viết'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

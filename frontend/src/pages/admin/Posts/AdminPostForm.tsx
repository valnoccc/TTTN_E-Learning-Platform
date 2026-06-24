import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import axiosClient from '../../../api/axios';
import toast from 'react-hot-toast';

function generateSlug(text: string): string {
  const from = 'àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ';
  const to   = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooooooooouuuuuuuuuuuyyyyyd';

  let slug = text.toLowerCase().trim();

  for (let i = 0; i < from.length; i++) {
    slug = slug.replace(new RegExp(from[i], 'g'), to[i]);
  }

  slug = slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug;
}

interface PostFormData {
  tieuDe: string;
  slug: string;
  tomTat: string;
  noiDung: string;
  hinhAnh: string;
  trangThai: string;
}

export default function AdminPostForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<PostFormData>({
    tieuDe: '',
    slug: '',
    tomTat: '',
    noiDung: '',
    hinhAnh: '',
    trangThai: 'DRAFT',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      setIsFetching(true);
      axiosClient
        .get(`/admin/posts/${id}`)
        .then((res: any) => {
          const post = res?.data;
          if (post) {
            setFormData({
              tieuDe: post.tieuDe || '',
              slug: post.slug || '',
              tomTat: post.tomTat || '',
              noiDung: post.noiDung || '',
              hinhAnh: post.hinhAnh || '',
              trangThai: post.trangThai || 'DRAFT',
            });
            setSlugManuallyEdited(true);
          }
        })
        .catch((err: any) => {
          console.error('Lỗi khi tải bài viết:', err);
          toast.error('Không thể tải bài viết');
          navigate('/admin/posts');
        })
        .finally(() => setIsFetching(false));
    }
  }, [isEdit, id, navigate]);

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tieuDe: value,
      slug: slugManuallyEdited ? prev.slug : generateSlug(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug: value }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tieuDe.trim()) {
      toast.error('Tiêu đề không được để trống!');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Slug không được để trống!');
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit && id) {
        await axiosClient.put(`/admin/posts/${id}`, formData);
        toast.success('Cập nhật bài viết thành công!');
      } else {
        await axiosClient.post('/admin/posts', formData);
        toast.success('Tạo bài viết mới thành công!');
      }
      navigate('/admin/posts');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi khi lưu bài viết';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#1dbf73]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/posts')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={22} className="text-[#1dbf73]" />
              {isEdit ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? 'Cập nhật nội dung bài viết' : 'Tạo một bài viết mới cho hệ thống'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
            {/* Tiêu đề */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Tiêu đề bài viết <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tieuDe}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Slug (URL thân thiện) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 shrink-0">/blog/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="tieu-de-bai-viet"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition"
                />
              </div>
              {!slugManuallyEdited && formData.tieuDe && (
                <p className="text-xs text-slate-400 mt-1">
                  Slug tự động tạo từ tiêu đề. Bạn có thể sửa thủ công.
                </p>
              )}
            </div>

            {/* Tóm tắt */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tóm tắt</label>
              <textarea
                name="tomTat"
                value={formData.tomTat}
                onChange={handleChange}
                rows={3}
                placeholder="Nội dung tóm tắt hiển thị ngoài danh sách..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition resize-none"
              />
            </div>

            {/* Link ảnh */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Link ảnh đại diện
              </label>
              <input
                type="text"
                name="hinhAnh"
                value={formData.hinhAnh}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg hoặc /assets/images/blog-1.jpg"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition"
              />
              {formData.hinhAnh && (
                <div className="mt-2 h-32 w-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={formData.hinhAnh}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Trạng thái
              </label>
              <select
                name="trangThai"
                value={formData.trangThai}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition bg-white"
              >
                <option value="DRAFT">Bản nháp (DRAFT)</option>
                <option value="PUBLISHED">Xuất bản (PUBLISHED)</option>
              </select>
            </div>
          </div>

          {/* Nội dung HTML */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nội dung bài viết (HTML)
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Bạn có thể viết hoặc dán mã HTML bài viết vào đây. Hỗ trợ các thẻ: h2, h3, p, ul,
              li, strong, em, a, img, pre, code...
            </p>
            <textarea
              name="noiDung"
              value={formData.noiDung}
              onChange={handleChange}
              rows={15}
              placeholder="<h2>Tiêu đề phần 1</h2>
<p>Nội dung đoạn văn...</p>
<ul>
  <li>Mục 1</li>
  <li>Mục 2</li>
</ul>"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm leading-relaxed focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] outline-none transition resize-y bg-slate-50"
            />
          </div>

          {/* Preview */}
          {formData.noiDung && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Xem trước nội dung
              </h3>
              <div
                className="prose prose-slate prose-sm max-w-none
                  prose-headings:text-slate-800
                  prose-p:text-slate-600
                  prose-a:text-emerald-600
                  prose-strong:text-slate-800
                  prose-pre:bg-slate-900 prose-pre:rounded-xl
                  prose-code:text-emerald-600 prose-code:bg-emerald-50 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
                dangerouslySetInnerHTML={{ __html: formData.noiDung }}
              />
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/posts')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1dbf73] text-sm font-semibold text-white hover:bg-[#18a864] transition-colors disabled:opacity-70 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEdit ? 'Cập nhật bài viết' : 'Tạo bài viết'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

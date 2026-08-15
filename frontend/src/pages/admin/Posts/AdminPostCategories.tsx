import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import axiosClient from "../../../api/axios";
import toast from "react-hot-toast";

type PostCategory = {
  maDMBV: number;
  tenDMBV: string;
  slug: string;
  moTa: string | null;
};

export interface AdminPostCategoriesRef {
  openCreate: () => void;
}

const AdminPostCategoriesTab = forwardRef<AdminPostCategoriesRef, {}>((props, ref) => {
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    tenDMBV: "",
    slug: "",
    moTa: "",
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res: any = await axiosClient.get("/admin/post-categories");
      setCategories(res?.data || []);
    } catch (err) {
      toast.error("Lỗi khi tải danh mục bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ tenDMBV: "", slug: "", moTa: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (cat: PostCategory) => {
    setEditingId(cat.maDMBV);
    setFormData({ tenDMBV: cat.tenDMBV, slug: cat.slug, moTa: cat.moTa || "" });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này? LƯU Ý: Các bài viết thuộc danh mục này sẽ bị mất liên kết.")) return;
    try {
      await axiosClient.delete(`/admin/post-categories/${id}`);
      toast.success("Xóa danh mục thành công");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi xóa danh mục");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenDMBV || !formData.slug) {
      toast.error("Vui lòng nhập tên và đường dẫn (slug) cho danh mục");
      return;
    }

    try {
      if (editingId) {
        await axiosClient.put(`/admin/post-categories/${editingId}`, formData);
        toast.success("Cập nhật danh mục thành công");
      } else {
        await axiosClient.post("/admin/post-categories", formData);
        toast.success("Tạo danh mục mới thành công");
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu danh mục");
    }
  };

  useImperativeHandle(ref, () => ({
    openCreate: handleOpenCreate,
  }));

  return (
    <>
      <div className="space-y-6">

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#1dbf73]" />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">TÊN DANH MỤC</th>
                  <th className="px-6 py-4 font-semibold">ĐƯỜNG DẪN</th>
                  <th className="px-6 py-4 font-semibold text-right">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.maDMBV} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">#{cat.maDMBV}</td>
                    <td className="px-6 py-4 font-medium">{cat.tenDMBV}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{cat.slug}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-2 rounded-lg text-slate-400 hover:text-[#1dbf73] hover:bg-emerald-50 transition"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.maDMBV)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      Chưa có danh mục nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {editingId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tenDMBV}
                  onChange={(e) => setFormData({ ...formData, tenDMBV: e.target.value })}
                  placeholder="Ví dụ: Lập trình Frontend"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Đường dẫn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="vi-du-lap-trinh-frontend"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Mô tả
                </label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                ></textarea>
              </div>

              <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#1dbf73] py-2.5 text-sm font-semibold text-white transition hover:bg-[#19a765]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});

export default AdminPostCategoriesTab;

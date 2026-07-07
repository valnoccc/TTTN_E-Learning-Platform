import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import Pagination from "../../../components/Pagination";
import {
  useAdminCategories,
  type AdminCategoryItem,
} from "./hooks/useAdminCategories";

type CategoryFormState = {
  TenDM: string;
  MoTa: string;
};

const emptyForm: CategoryFormState = {
  TenDM: "",
  MoTa: "",
};

const PAGE_SIZE = 8;

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AdminCategories() {
  const {
    categories,
    loading,
    search,
    setSearch,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useAdminCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<AdminCategoryItem | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalCategories = useMemo(() => categories.length, [categories]);
  const categoriesWithDescription = useMemo(
    () =>
      categories.filter((category) => Boolean(category.moTa?.trim())).length,
    [categories],
  );
  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const indexOfLast = currentPage * PAGE_SIZE;
  const indexOfFirst = indexOfLast - PAGE_SIZE;
  const visibleCategories = useMemo(
    () => categories.slice(indexOfFirst, indexOfLast),
    [categories, indexOfFirst, indexOfLast],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openCreateForm = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (category: AdminCategoryItem) => {
    setEditingCategory(category);
    setForm({
      TenDM: category.tenDM ?? "",
      MoTa: category.moTa ?? "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingCategory(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.TenDM.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        TenDM: form.TenDM.trim(),
        MoTa: form.MoTa.trim(),
      };

      if (editingCategory) {
        await updateCategory(editingCategory.maDM, payload);
      } else {
        await createCategory(payload);
      }

      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.maDM);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Danh mục khóa học
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm danh mục..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-[14px] text-slate-700 shadow-sm outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
              />
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 w-full flex-none items-center justify-center gap-2 rounded-2xl bg-[#1dbf73] px-6 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#18a864] active:translate-y-[1px] sm:w-auto"
            >
              <Plus size={18} />
              Thêm danh mục
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#1dbf73]" />
              <h2 className="text-[16px] font-semibold text-slate-800">
                Danh sách danh mục
              </h2>
            </div>
            <span className="text-[13px] font-medium text-slate-500">
              {totalCategories} mục
            </span>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl bg-slate-50"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <Layers3 size={28} strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-slate-800">
                {search.trim()
                  ? "Không tìm thấy danh mục"
                  : "Chưa có danh mục nào"}
              </h3>
              <p className="mt-2 text-[14px] text-slate-500">
                {search.trim()
                  ? "Thử thay đổi từ khóa tìm kiếm để xem thêm kết quả."
                  : "Tạo danh mục đầu tiên để bắt đầu quản lý nội dung khóa học."}
              </p>
              {!search.trim() ? (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1dbf73] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#18a864]"
                >
                  <Plus size={18} />
                  Thêm danh mục đầu tiên
                </button>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed text-left">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className="w-[14%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        ID
                      </th>
                      <th className="w-[28%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        Tên danh mục
                      </th>
                      <th className="w-[42%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        Mô tả
                      </th>
                      <th className="w-[16%] px-6 py-4 text-right text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleCategories.map((category) => (
                      <tr
                        key={category.maDM}
                        className="transition hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-5 text-[14px] font-semibold text-slate-700">
                          #{category.maDM}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-slate-800">
                                {category.tenDM}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="line-clamp-2 max-w-[600px] text-[14px] leading-6 text-slate-600">
                            {category.moTa?.trim() ||
                              "Không có mô tả cho danh mục này."}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(category)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              title="Sửa"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(category)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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

              <div className="border-t border-slate-100 px-6 pb-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={categories.length}
                  indexOfFirst={indexOfFirst}
                  indexOfLast={indexOfLast}
                  variant="numbers"
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !submitting && closeForm()}
          />
          <div className="relative w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  <Layers3 size={14} />
                  {editingCategory ? "Chỉnh sửa" : "Thêm mới"}
                </div>
                <h3 className="mt-3 text-[22px] font-black tracking-tight text-slate-900">
                  {editingCategory ? "Cập nhật danh mục" : "Tạo danh mục mới"}
                </h3>
                <p className="mt-1 text-[14px] text-slate-500">
                  {editingCategory
                    ? "Chỉnh sửa tên và mô tả danh mục hiện có."
                    : "Nhập tên và mô tả để tạo danh mục mới cho hệ thống."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && closeForm()}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-[14px] font-semibold text-slate-700">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.TenDM}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      TenDM: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Lập trình web"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[14px] font-semibold text-slate-700">
                  Mô tả
                </label>
                <textarea
                  value={form.MoTa}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      MoTa: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Mô tả ngắn về nội dung và nhóm khóa học của danh mục này..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] leading-6 text-slate-700 outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => !submitting && closeForm()}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.TenDM.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1dbf73] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#18a864] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : editingCategory ? (
                    "Cập nhật danh mục"
                  ) : (
                    "Tạo danh mục"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={24} />
            </div>
            <h3 className="mt-4 text-center text-[20px] font-black tracking-tight text-slate-900">
              Xóa danh mục
            </h3>
            <p className="mt-2 text-center text-[14px] leading-6 text-slate-500">
              Bạn có chắc muốn xóa danh mục{" "}
              <span className="font-semibold text-slate-800">
                "{deleteTarget.tenDM}"
              </span>
              ? Hành động này không thể hoàn tác.
            </p>

            <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => !deleting && setDeleteTarget(null)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa danh mục"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

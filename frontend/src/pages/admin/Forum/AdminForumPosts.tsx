import { Clock3, Eye, Hash, MessageSquare, RefreshCw, Search, Tag, Trash2, UserRound, X } from 'lucide-react';
import type { ReactNode } from 'react';

import AdminLayout from '../../../layouts/AdminLayout';
import Pagination from '../../../components/Pagination';
import { useAdminForumPosts } from './hooks/useAdminForumPosts';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/60">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminForumPosts() {
  const {
    items,
    summary,
    loading,
    refreshing,
    page,
    setPage,
    totalPages,
    total,
    searchInput,
    setSearchInput,
    deletingId,
    questionToDelete,
    setQuestionToDelete,
    handleRefresh,
    handleDelete,
    pageStart,
    pageEnd,
    normalizeText,
  } = useAdminForumPosts();

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Quản lý bài đăng diễn đàn
            </h1>
          </div>

          <button
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Bài đăng"
            value={formatCompactNumber(summary.totalQuestions)}
            description="Tổng số topic cấp 1"
            icon={<MessageSquare size={20} />}
          />
          <StatCard
            title="Phản hồi"
            value={formatCompactNumber(summary.totalReplies)}
            description="Tổng số trả lời trong diễn đàn"
            icon={<UserRound size={20} />}
          />
          <StatCard
            title="Lượt xem"
            value={formatCompactNumber(summary.totalViews)}
            description="Tổng lượt đọc toàn hệ thống"
            icon={<Eye size={20} />}
          />
          <StatCard
            title="Kết quả lọc"
            value={formatCompactNumber(total)}
            description="Số bài đang khớp bộ lọc"
            icon={<Hash size={20} />}
          />
        </section>

        <section className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="relative block flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tiêu đề, nội dung, tác giả hoặc thẻ..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
              <Tag size={16} className="text-slate-400" />
              <span>Chỉ quản lý bài đăng cấp 1</span>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách bài đăng</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading ? 'Đang tải dữ liệu...' : `${formatCompactNumber(total)} bài đăng trong bộ lọc hiện tại`}
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Hiển thị {pageStart}-{pageEnd} trong tổng số {formatCompactNumber(total)}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-50" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <MessageSquare size={28} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Không tìm thấy bài đăng</h3>
              <p className="mt-2 text-sm text-slate-500">
                Hãy thử đổi từ khóa tìm kiếm để xem các topic khác trong diễn đàn.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="w-[30%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Bài đăng
                    </th>
                    <th className="w-[18%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tác giả
                    </th>
                    <th className="w-[18%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Thẻ
                    </th>
                    <th className="w-[10%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Phản hồi
                    </th>
                    <th className="w-[10%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Lượt xem
                    </th>
                    <th className="w-[14%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ngày tạo
                    </th>
                    <th className="w-[10%] px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((question) => (
                    <tr key={question.maCH} className="border-t border-slate-100 align-top transition hover:bg-slate-50/70">
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="min-w-0">
                              <h3 className="text-[15px] font-bold leading-6 text-slate-900">
                                {question.tieuDe}
                              </h3>
                            </div>
                          </div>
                          <p className="mt-1 pl-[52px] text-xs text-slate-400">
                            Cập nhật {formatDate(question.ngayCapNhat)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                            {question.tacGia.anhDaiDien ? (
                              <img src={question.tacGia.anhDaiDien} alt={question.tacGia.hoTen} className="h-full w-full object-cover" />
                            ) : (
                              <span>{question.tacGia.hoTen?.charAt(0)?.toUpperCase() || '?'}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{question.tacGia.hoTen}</p>
                            <p className="mt-1 text-xs text-slate-500">Mã: {question.tacGia.maND}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {question.danhSachThe.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {question.danhSachThe.slice(0, 3).map((tag) => (
                              <span
                                key={tag.maThe}
                                className="inline-flex max-w-full items-center rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                              >
                                <span className="truncate">{tag.tenThe}</span>
                              </span>
                            ))}
                            {question.danhSachThe.length > 3 && (
                              <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                +{question.danhSachThe.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Chưa có thẻ</span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                          <UserRound size={14} className="text-slate-400" />
                          {formatCompactNumber(question.soCauTraLoi)}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                          <Eye size={14} className="text-slate-400" />
                          {formatCompactNumber(question.luotXem)}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock3 size={14} className="text-slate-400" />
                          {formatDate(question.ngayTao)}
                        </div>
                      </td>

                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => setQuestionToDelete(question)}
                            disabled={deletingId === question.maCH}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="border-t border-slate-100 px-6 pb-5">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={total}
                indexOfFirst={pageStart > 0 ? pageStart - 1 : 0}
                indexOfLast={pageEnd}
                variant="numbers"
              />
            </div>
          )}
        </section>
      </div>

      {questionToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Đóng hộp thoại"
            className="absolute inset-0 cursor-default"
            onClick={() => setQuestionToDelete(null)}
          />

          <div className="relative w-full max-w-[560px] rounded-[28px] border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">
                  Xóa bài đăng
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  Bạn muốn xóa topic này?
                </h2>
              </div>
              <button
                onClick={() => setQuestionToDelete(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-900">{questionToDelete.tieuDe}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {normalizeText(questionToDelete.noiDungTomTat, 220)}
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Hành động này sẽ xóa luôn toàn bộ phản hồi liên quan theo cơ chế cascade của cơ sở dữ liệu.
              Bạn chỉ nên thực hiện khi đã xác nhận nội dung vi phạm.
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setQuestionToDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deletingId === questionToDelete.maCH}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deletingId === questionToDelete.maCH ? 'Đang xóa...' : 'Xóa bài đăng'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

import { Banknote, BookOpen, RefreshCw, Receipt, Users } from 'lucide-react';

import Pagination from '../../../components/Pagination';
import ClassicFilterBar from '../../../components/instructor/ClassicFilterBar';
import InstructorLayout from '../../../layouts/InstructorLayout';
import { useInstructorTransactions } from './hooks/useInstructorTransactions';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function paymentMethodLabel(value: string | null) {
  if (value === 'VNPAY') return 'VNPay';
  if (value === 'MOMO') return 'MoMo';
  if (value === 'FREE') return 'Miễn phí';
  return value || 'Chuyển khoản';
}

export default function InstructorTransactions() {
  const {
    courses,
    board,
    loading,
    searchInput,
    setSearchInput,
    setAppliedSearch,
    courseId,
    setCourseId,
    selectedCourseName,
    loadTransactions,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedTransactions,
    paginationMeta,
  } = useInstructorTransactions();

  const applyFilters = () => {
    setAppliedSearch(searchInput);
    void loadTransactions(courseId, searchInput);
  };

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1dbf73]">Tài chính khóa học</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Giao dịch mới</h1>
            <p className="mt-2 text-sm text-slate-500">Theo dõi các lượt mua khóa học và phần doanh thu bạn nhận được.</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            Đang xem: <span className="font-bold text-slate-900">{selectedCourseName}</span>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Giao dịch thành công</span><Receipt size={20} className="text-[#1dbf73]" /></div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{board.totalTransactions}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Tổng doanh thu giao dịch</span><Banknote size={20} className="text-[#1dbf73]" /></div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(board.totalGrossRevenue)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Thực nhận</span><Users size={20} className="text-[#1dbf73]" /></div>
            <p className="mt-2 text-3xl font-bold text-[#0b9f62]">{formatCurrency(board.totalInstructorRevenue)}</p>
          </div>
        </section>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <ClassicFilterBar
            searchValue={searchInput}
            onSearchChange={(event) => setSearchInput(event.target.value)}
            onSearchKeyDown={(event) => { if (event.key === 'Enter') applyFilters(); }}
            searchPlaceholder="Tìm theo tên hoặc email học viên..."
            selectValue={courseId}
            onSelectChange={(event) => { setCourseId(event.target.value); void loadTransactions(event.target.value, searchInput); }}
            options={[{ label: 'Tất cả khóa học', value: '' }, ...courses.map((course) => ({ label: course.courseName, value: String(course.courseId) }))]}
            action={<button type="button" onClick={applyFilters} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#1dbf73] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#169b5c] lg:w-auto"><RefreshCw size={14} /> Lọc dữ liệu</button>}
          />
        </div>

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h2 className="text-base font-bold text-slate-800">{board.totalTransactions} giao dịch trong bộ lọc</h2>
          </div>
          {loading ? (
            <div className="space-y-4 p-6 animate-pulse"><div className="h-10 rounded bg-slate-100" /><div className="h-10 rounded bg-slate-50" /><div className="h-10 rounded bg-slate-50" /></div>
          ) : board.transactions.length === 0 ? (
            <div className="py-16 text-center text-slate-500">Chưa có giao dịch thành công phù hợp.</div>
          ) : (
            <div className="flex min-h-[400px] flex-col justify-between overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead><tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="p-4 font-bold text-slate-700">Giao dịch</th>
                  <th className="p-4 font-bold text-slate-700">Học viên</th>
                  <th className="p-4 font-bold text-slate-700">Khóa học</th>
                  <th className="p-4 font-bold text-slate-700">Thời gian</th>
                  <th className="p-4 font-bold text-slate-700">Thanh toán</th>
                  <th className="p-4 text-right font-bold text-slate-700">Tổng tiền</th>
                  <th className="p-4 text-right font-bold text-slate-700">Thực nhận</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.map((transaction) => (
                    <tr key={`${transaction.invoiceId}-${transaction.courseId}`} className="transition-colors hover:bg-slate-50/80">
                      <td className="p-4"><div className="font-bold text-slate-900">HD-{transaction.invoiceId}</div><div className="text-xs text-emerald-600">Đã thanh toán</div></td>
                      <td className="p-4"><div className="font-bold text-slate-900">{transaction.studentName}</div><div className="text-xs text-slate-500">{transaction.studentEmail}</div></td>
                      <td className="p-4"><div className="flex items-center gap-2 font-medium text-slate-700"><BookOpen size={15} className="text-slate-400" />{transaction.courseName}</div></td>
                      <td className="p-4 text-slate-500">{formatDate(transaction.purchasedAt)}</td>
                      <td className="p-4 text-slate-600">{paymentMethodLabel(transaction.paymentMethod)}</td>
                      <td className="p-4 text-right font-semibold text-slate-700">{formatCurrency(transaction.transactionAmount)}</td>
                      <td className="p-4 text-right font-bold text-[#0b9f62]">{formatCurrency(transaction.instructorAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && <div className="mt-auto border-t border-slate-100 bg-white p-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} variant="numbers" totalItems={paginationMeta.totalItems} indexOfFirst={paginationMeta.indexOfFirst} indexOfLast={paginationMeta.indexOfLast} /></div>}
            </div>
          )}
        </section>
      </div>
    </InstructorLayout>
  );
}

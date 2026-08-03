import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  DollarSign,
  Download,
  Landmark,
  Send,
  ShoppingCart,
  WalletCards,
} from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

import axiosClient from "../../../api/axios";
import Pagination from "../../../components/Pagination";
import InstructorLayout from "../../../layouts/InstructorLayout";

type MonthlyCourseRow = {
  courseId: number;
  courseName: string;
  purchases: number;
  grossRevenue: number;
  instructorRevenue: number;
  averageRevenue: number;
};

type MonthlyRevenueMonth = {
  month: string;
  title: string;
  totalPurchases: number;
  totalGrossRevenue: number;
  rows: MonthlyCourseRow[];
};

type MonthlyRevenueResponse = {
  year: number;
  months: MonthlyRevenueMonth[];
};

type WalletSummary = { availableBalance: number; pendingWithdrawalBalance: number; totalPaidOut: number };
type WithdrawalRequest = { requestId: number; amount: number; status: string; bankName: string; accountNumber: string; createdAt: string };
const withdrawalStatusLabel: Record<string, string> = { PENDING: 'Chờ xử lý', COMPLETED: 'Đã chuyển', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy' };
const withdrawalStatusClass: Record<string, string> = { PENDING: 'border-amber-200 bg-amber-50 text-amber-700', COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700', REJECTED: 'border-rose-200 bg-rose-50 text-rose-700', CANCELLED: 'border-slate-200 bg-slate-100 text-slate-600' };
const TABLE_PAGE_SIZE = 5;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonthLabel(month: string) {
  const [monthPart, yearPart] = month.split("/");
  if (!monthPart || !yearPart) {
    return month;
  }

  return `Tháng ${monthPart}/${yearPart}`;
}

function createExportFileName(month: string) {
  return `bao-cao-doanh-thu-${month.replace("/", "-")}.xlsx`;
}

function MonthlyRevenueContent() {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<MonthlyRevenueResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [revenuePage, setRevenuePage] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMonthlyRevenue = async () => {
      setLoading(true);

      try {
        const response = await axiosClient.get<MonthlyRevenueResponse>(
          "/instructors/me/monthly-revenue",
          {
            params: {
              year: currentYear,
            },
          },
        );

        if (!mounted) {
          return;
        }

        setData(response);
        setSelectedMonth((current) => {
          if (
            current &&
            response.months.some((month) => month.month === current)
          ) {
            return current;
          }

          return response.months[0]?.month ?? "";
        });
      } catch (error) {
        console.error("Không thể tải báo cáo doanh thu theo tháng:", error);
        if (mounted) {
          toast.error("Không thể tải báo cáo doanh thu theo tháng.");
          setData({ year: currentYear, months: [] });
          setSelectedMonth("");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadMonthlyRevenue();

    return () => {
      mounted = false;
    };
  }, [currentYear]);

  const loadWallet = async () => {
    try {
      const [walletResponse, requestsResponse] = await Promise.all([
        axiosClient.get<WalletSummary>('/instructor/withdrawals/wallet'),
        axiosClient.get<WithdrawalRequest[]>('/instructor/withdrawals'),
      ]);
      setWallet(walletResponse);
      setWithdrawals(requestsResponse);
      setWithdrawalPage(1);
    } catch {
      setWallet(null);
      setWithdrawals([]);
    }
  };

  useEffect(() => { void loadWallet(); }, []);

  const submitWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();
    const soTien = Number(withdrawAmount.replace(/[^\d]/g, ''));
    if (!soTien || soTien <= 0) { toast.error('Nhập số tiền rút hợp lệ.'); return; }
    setSubmittingWithdrawal(true);
    try {
      await axiosClient.post('/instructor/withdrawals', { soTien });
      toast.success('Đã tạo yêu cầu rút tiền.');
      setWithdrawAmount('');
      await loadWallet();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo yêu cầu rút tiền.');
    } finally { setSubmittingWithdrawal(false); }
  };

  const monthOptions = data?.months ?? [];
  const selectedData = useMemo(
    () => monthOptions.find((month) => month.month === selectedMonth) ?? null,
    [monthOptions, selectedMonth],
  );

  const paginatedWithdrawals = useMemo(() => {
    const start = (withdrawalPage - 1) * TABLE_PAGE_SIZE;
    return withdrawals.slice(start, start + TABLE_PAGE_SIZE);
  }, [withdrawalPage, withdrawals]);

  const paginatedRevenueRows = useMemo(() => {
    const rows = selectedData?.rows ?? [];
    const start = (revenuePage - 1) * TABLE_PAGE_SIZE;
    return rows.slice(start, start + TABLE_PAGE_SIZE);
  }, [revenuePage, selectedData?.rows]);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setRevenuePage(1);
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Tổng tháng",
        value: selectedData
          ? formatMonthLabel(selectedData.month)
          : `Năm ${currentYear}`,
        icon: CalendarDays,
      },
      {
        label: "Khóa học có doanh thu",
        value: selectedData ? `${selectedData.rows.length}` : "0",
        icon: BookOpen,
      },
      {
        label: "Lượt mua",
        value: selectedData ? `${selectedData.totalPurchases}` : "0",
        icon: ShoppingCart,
      },
      {
        label: "Doanh thu gộp",
        value: selectedData
          ? formatCurrency(selectedData.totalGrossRevenue)
          : formatCurrency(0),
        icon: DollarSign,
      },
    ],
    [currentYear, selectedData],
  );

  const handleExport = () => {
    if (!selectedData || selectedData.rows.length === 0) {
      toast.error("Tháng đã chọn chưa có dữ liệu để xuất.");
      return;
    }

    const summaryRows = [
      ["BÁO CÁO DOANH THU GIẢNG VIÊN"],
      ["Kỳ báo cáo", formatMonthLabel(selectedData.month)],
      ["Tổng lượt mua", selectedData.totalPurchases],
      ["Tổng doanh thu gộp", selectedData.totalGrossRevenue],
      [
        "Tổng thực nhận",
        selectedData.rows.reduce(
          (total, row) => total + row.instructorRevenue,
          0,
        ),
      ],
      [],
      ["Khóa học", "Lượt mua", "Doanh thu gộp", "Thực nhận"],
      ...selectedData.rows.map((row) => [
        row.courseName,
        row.purchases,
        row.grossRevenue,
        row.instructorRevenue,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryRows);
    worksheet["!cols"] = [
      { wch: 42 },
      { wch: 16 },
      { wch: 20 },
      { wch: 18 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doanh thu");
    XLSX.writeFile(workbook, createExportFileName(selectedData.month));
    toast.success("Đã xuất báo cáo doanh thu.");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-slate-800">
      <div className="flex w-full items-end justify-end gap-4">
        <div className="min-w-[220px]">
          <label className="mb-1.5 block text-[13px] font-medium text-slate-500">
            Chọn tháng
          </label>
          <select
            value={selectedMonth}
            onChange={(event) => handleMonthChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-700 outline-none transition-colors hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Chọn tháng</option>
            {monthOptions.map((month) => (
              <option key={month.month} value={month.month}>
                {formatMonthLabel(month.month)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={loading || !selectedData || selectedData.rows.length === 0}
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} />
          Xuất bảng
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-500">
                  {card.label}
                </p>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm font-semibold text-emerald-800">Ví giảng viên</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{formatCurrency(wallet?.availableBalance ?? 0)}</h2><p className="mt-1 text-sm text-slate-500">Số dư khả dụng để yêu cầu chi trả</p></div>
            <div className="rounded-2xl bg-emerald-600 p-3 text-white"><WalletCards size={24} /></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-emerald-100 pt-4 text-sm"><div><p className="text-slate-500">Đang chờ xử lý</p><p className="mt-1 font-bold text-slate-800">{formatCurrency(wallet?.pendingWithdrawalBalance ?? 0)}</p></div><div><p className="text-slate-500">Đã chi trả</p><p className="mt-1 font-bold text-slate-800">{formatCurrency(wallet?.totalPaidOut ?? 0)}</p></div></div>
        </div>
        <form onSubmit={submitWithdrawal} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2 text-slate-900"><Landmark size={19} className="text-emerald-600" /><h2 className="font-bold">Yêu cầu rút tiền</h2></div><p className="mt-1 text-sm text-slate-500">Tiền sẽ chuyển vào tài khoản đã lưu trong cài đặt.</p><input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} inputMode="numeric" placeholder="Nhập số tiền (VND)" className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /><button disabled={submittingWithdrawal || !wallet?.availableBalance} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"><Send size={16} />{submittingWithdrawal ? 'Đang gửi...' : 'Tạo yêu cầu rút'}</button></form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="font-bold text-slate-900">Lịch sử rút tiền</h2><p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái chi trả của từng yêu cầu.</p></div></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">Thời gian</th><th className="px-6 py-4">Tài khoản nhận</th><th className="px-6 py-4 text-right">Số tiền</th><th className="px-6 py-4 text-right">Trạng thái</th></tr></thead><tbody className="divide-y divide-slate-100">{withdrawals.length ? paginatedWithdrawals.map((item) => <tr key={item.requestId}><td className="px-6 py-4 text-slate-600">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td><td className="px-6 py-4 font-medium text-slate-800">{item.bankName} · {item.accountNumber}</td><td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(item.amount)}</td><td className="px-6 py-4 text-right"><span className={`rounded-full px-3 py-1 text-xs font-bold ${withdrawalStatusClass[item.status] ?? 'border border-slate-200 bg-slate-100 text-slate-600'}`}>{withdrawalStatusLabel[item.status] ?? item.status}</span></td></tr>) : <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Chưa có yêu cầu rút tiền nào.</td></tr>}</tbody></table></div>{withdrawals.length > TABLE_PAGE_SIZE && <div className="px-6"><Pagination currentPage={withdrawalPage} totalPages={Math.ceil(withdrawals.length / TABLE_PAGE_SIZE)} onPageChange={setWithdrawalPage} totalItems={withdrawals.length} indexOfFirst={(withdrawalPage - 1) * TABLE_PAGE_SIZE} indexOfLast={withdrawalPage * TABLE_PAGE_SIZE} /></div>}</section>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">
              Bảng doanh thu{" "}
              {selectedData
                ? formatMonthLabel(selectedData.month)
                : "theo tháng"}
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500">
              Đang tải dữ liệu doanh thu...
            </div>
          ) : selectedData && selectedData.rows.length > 0 ? (
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-[12px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Khóa học</th>
                  <th className="px-6 py-4 text-center">Lượt mua</th>
                  <th className="px-6 py-4 text-right">Tổng doanh thu</th>
                  <th className="px-6 py-4 text-right">Thực nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRevenueRows.map((row) => (
                  <tr
                    key={`${selectedData.month}-${row.courseId}`}
                    className="hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-[14px] font-bold text-slate-900">
                          {row.courseName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-[14px] font-semibold text-slate-700">
                      {row.purchases}
                    </td>
                    <td className="px-6 py-4 text-right text-[14px] font-bold text-emerald-600">
                      {formatCurrency(row.grossRevenue)}
                    </td>
                    <td className="px-6 py-4 text-right text-[14px] font-semibold text-slate-700">
                      {formatCurrency(row.instructorRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center px-6 text-center">
              <div className="max-w-md">
                <p className="text-[16px] font-bold text-slate-900">
                  Chưa có dữ liệu doanh thu
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Hiện tại chưa có tháng nào có phát sinh thanh toán thành công
                  trong năm {currentYear}.
                </p>
              </div>
            </div>
          )}
        </div>
        {selectedData && selectedData.rows.length > TABLE_PAGE_SIZE && (
          <div className="px-6 pb-5">
            <Pagination
              currentPage={revenuePage}
              totalPages={Math.ceil(selectedData.rows.length / TABLE_PAGE_SIZE)}
              onPageChange={setRevenuePage}
              totalItems={selectedData.rows.length}
              indexOfFirst={(revenuePage - 1) * TABLE_PAGE_SIZE}
              indexOfLast={revenuePage * TABLE_PAGE_SIZE}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MonthlyRevenueReport() {
  return (
    <InstructorLayout>
      <MonthlyRevenueContent />
    </InstructorLayout>
  );
}

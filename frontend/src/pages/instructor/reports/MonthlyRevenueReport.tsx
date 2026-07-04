import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  DollarSign,
  Download,
  ShoppingCart,
} from "lucide-react";
import { toast } from "react-hot-toast";

import axiosClient from "../../../api/axios";
import InstructorLayout from "../../../layouts/InstructorLayout";

type MonthlyCourseRow = {
  courseId: number;
  courseName: string;
  purchases: number;
  grossRevenue: number;
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

function MonthlyRevenueContent() {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<MonthlyRevenueResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);

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

  const monthOptions = data?.months ?? [];
  const selectedData = useMemo(
    () => monthOptions.find((month) => month.month === selectedMonth) ?? null,
    [monthOptions, selectedMonth],
  );

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-slate-800">
      <div className="flex w-full items-end justify-end gap-4">
        <div className="min-w-[220px]">
          <label className="mb-1.5 block text-[13px] font-medium text-slate-500">
            Chọn tháng
          </label>
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
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
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
                  <th className="px-6 py-4 text-right">Doanh thu gộp</th>
                  <th className="px-6 py-4 text-right">Doanh thu/lượt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedData.rows.map((row) => (
                  <tr
                    key={`${selectedData.month}-${row.courseId}`}
                    className="hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-[14px] font-bold text-slate-900">
                          {row.courseName}
                        </p>
                        <p className="mt-1 text-[12px] text-slate-500">
                          Mã khóa học: #{row.courseId}
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
                      {formatCurrency(row.averageRevenue)}
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

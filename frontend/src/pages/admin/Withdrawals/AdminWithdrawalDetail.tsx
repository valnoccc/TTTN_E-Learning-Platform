import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Calendar,
  User,
  CreditCard,
  Wallet,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import axiosClient from "../../../api/axios";
import { toast } from "react-hot-toast";

const money = (v: any) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

export default function AdminWithdrawalDetail() {
  const { id } = useParams();
  const [d, setD] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [actionModal, setActionModal] = useState<"complete" | "reject" | null>(
    null,
  );
  const [actionValue, setActionValue] = useState("");

  useEffect(() => {
    void axiosClient.get(`/admin/withdrawals/${id}`).then(setD);
  }, [id]);

  const updateRequest = async () => {
    if (!actionModal || !actionValue.trim()) return;
    setProcessing(true);
    try {
      const payload =
        actionModal === "complete"
          ? { maGiaoDichNgoaiHeThong: actionValue }
          : { lyDoTuChoi: actionValue };
      setD(
        await axiosClient.patch(
          `/admin/withdrawals/${id}/${actionModal}`,
          payload,
        ),
      );
      toast.success("Đã cập nhật yêu cầu rút tiền.");
      setActionModal(null);
      setActionValue("");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật yêu cầu.",
      );
    } finally {
      setProcessing(false);
    }
  };

  // Tính toán % cho thanh trạng thái phân bổ nguồn vốn
  const soDuKhaDung = Number(d?.SoDuKhaDung || 0);
  const soDuDangRut = Number(d?.SoDuDangRut || 0);
  const tongDaChi = Number(d?.TongDaChi || 0);
  const totalMoney = soDuKhaDung + soDuDangRut + tongDaChi;

  const pctKhaDung = totalMoney > 0 ? (soDuKhaDung / totalMoney) * 100 : 0;
  const pctDangRut = totalMoney > 0 ? (soDuDangRut / totalMoney) * 100 : 0;
  const pctDaChi = totalMoney > 0 ? (tongDaChi / totalMoney) * 100 : 0;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <Link
            to="/admin/withdrawals"
            className="flex items-center gap-2 text-sm font-semibold text-teal-600 transition hover:text-teal-700"
          >
            <ArrowLeft size={16} /> Quay lại yêu cầu rút tiền
          </Link>
        </div>

        <div className="p-6 bg-slate-50/50">
          {!d ? (
            <div className="py-20 text-center text-slate-500 font-medium">
              Đang tải chi tiết...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Actions & Status Header */}
              <div className="flex flex-col gap-6 md:flex-row">
                {/* Left: Status Card */}
                <div className="flex-1 rounded-xl bg-[#131f2a] p-6 text-white shadow-md flex flex-col justify-between">
                  <div>
                    <div className="mt-3 flex items-center gap-4">
                      <h1 className="text-4xl font-bold">{money(d.SoTien)}</h1>
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wide border border-emerald-800/50">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        {d.TrangThai || "PENDING"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
                    <Calendar size={16} /> Ngày gửi yêu cầu:{" "}
                    {d.createdAt || "Oct 24, 2023"}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex w-full flex-col justify-center gap-4 md:w-[280px]">
                  <button
                    disabled={processing || d.TrangThai !== "PENDING"}
                    onClick={() => setActionModal("complete")}
                    className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#c6f1d6] bg-[#eefbf4] text-[15px] font-bold text-[#0d7d59] shadow-sm transition-all hover:bg-[#dcfce7] active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                    Phê duyệt
                  </button>

                  <button
                    disabled={processing || d.TrangThai !== "PENDING"}
                    onClick={() => setActionModal("reject")}
                    className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#fbd5d5] bg-[#fff1f1] text-[15px] font-bold text-[#d92d2d] shadow-sm transition-all hover:bg-[#fee2e2] active:scale-95 disabled:opacity-50"
                  >
                    <XCircle size={18} strokeWidth={2.5} />
                    Từ chối
                  </button>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Giảng viên */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-slate-800">
                    <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                      <User size={20} />
                    </div>
                    Thông tin giảng viên
                  </h2>
                  <div className="space-y-5">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Họ tên
                      </p>
                      <p className="font-semibold text-slate-900">
                        {d.instructorName}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Email
                      </p>
                      <p className="text-slate-700">
                        {d.instructorEmail || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Điện thoại
                      </p>
                      <p className="text-slate-700">
                        {d.instructorPhone || "—"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Tài khoản nhận tiền */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-slate-800">
                    <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                      <CreditCard size={20} />
                    </div>
                    Tài khoản nhận tiền
                  </h2>
                  <div className="space-y-5">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Chủ tài khoản
                      </p>
                      <p className="font-semibold text-slate-900">
                        {d.TenChuTaiKhoan}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Ngân hàng
                      </p>
                      <p className="flex items-center gap-2 text-slate-700">
                        {d.TenNganHang} ({d.MaNganHang})
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200">
                          VERIFIED
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Số tài khoản
                      </p>
                      <p className="font-semibold text-slate-900">
                        {d.SoTaiKhoan}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Wallet Status */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-slate-800">
                  <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                    <Wallet size={20} />
                  </div>
                  Số dư ví giảng viên hiện tại
                </h2>
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-5 border-l-4 border-l-[#0f764a]">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Khả dụng
                    </p>
                    <p className="text-2xl font-bold text-[#0f764a]">
                      {money(soDuKhaDung)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-5 border-l-4 border-l-slate-900">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Đang rút
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {money(soDuDangRut)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-5 border-l-4 border-l-slate-300">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Đã chi trả
                    </p>
                    <p className="text-2xl font-bold text-slate-500">
                      {money(tongDaChi)}
                    </p>
                  </div>
                </div>

                {/* Phân bổ nguồn vốn (Progress Bar) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Phân bổ nguồn vốn
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {pctKhaDung.toFixed(0)}% Khả dụng
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="bg-[#0f764a]"
                      style={{ width: `${pctKhaDung}%` }}
                    ></div>
                    <div
                      className="bg-slate-800"
                      style={{ width: `${pctDangRut}%` }}
                    ></div>
                    <div
                      className="bg-slate-400"
                      style={{ width: `${pctDaChi}%` }}
                    ></div>
                  </div>
                </div>
              </section>
              {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void updateRequest();
                    }}
                    className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                  >
                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                      {actionModal === "complete"
                        ? "Xác nhận đã chuyển tiền"
                        : "Từ chối yêu cầu rút tiền"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {d.instructorName} · {money(d.SoTien)}
                    </p>
                    <label className="mt-5 block text-sm font-bold text-slate-800">
                      {actionModal === "complete"
                        ? "Mã giao dịch ngân hàng"
                        : "Lý do từ chối"}
                    </label>
                    {actionModal === "complete" ? (
                      <input
                        autoFocus
                        required
                        value={actionValue}
                        onChange={(e) => setActionValue(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                        placeholder="Ví dụ: VCB-20260803-001"
                      />
                    ) : (
                      <textarea
                        autoFocus
                        required
                        value={actionValue}
                        onChange={(e) => setActionValue(e.target.value)}
                        className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-rose-500"
                        placeholder="Nêu rõ lý do để giảng viên có thể điều chỉnh..."
                      />
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActionModal(null);
                          setActionValue("");
                        }}
                        className="rounded-xl px-4 py-2 font-bold text-slate-600"
                      >
                        Hủy
                      </button>
                      <button
                        disabled={processing || !actionValue.trim()}
                        className={`rounded-xl px-5 py-2.5 font-bold text-white disabled:opacity-50 ${actionModal === "complete" ? "bg-emerald-600" : "bg-rose-600"}`}
                      >
                        {processing
                          ? "Đang xử lý..."
                          : actionModal === "complete"
                            ? "Xác nhận đã chuyển"
                            : "Xác nhận từ chối"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

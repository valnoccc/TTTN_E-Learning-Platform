import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  AlertTriangle,
  EyeOff,
  UserX,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axiosClient from "../../../api/axios";
import toast from "react-hot-toast";
import AdminSidebar from "../../../components/common/AdminSidebar";
import { formatReportContent } from "./reportContent";

interface Report {
  reportId: string;
  reason: string;
  details: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  adminNotes: string;
  createdAt: string;
  discussionId: number | null;
  commentContent: string | null;
  reporterId: number;
  reporterName: string;
  reporterAvatar: string;
  reportedUserId: number;
  reportedUserName: string;
  reportedUserAvatar: string;
  violationCount: number;
  accountStatus: "ACTIVE" | "LOCKED" | "INACTIVE" | "DELETED";
}

type ResolveAction = "HIDE_COMMENT" | "WARN_USER" | "BLOCK_USER" | "REJECT";
type StatusFilter = "ALL" | "PENDING" | "RESOLVED" | "REJECTED";

const PAGE_SIZE = 20;

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  HATE_SPEECH: "Ngôn từ thù địch",
  HARASSMENT: "Quấy rối",
  FALSE_INFO: "Thông tin sai",
  OTHER: "Khác",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  RESOLVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  RESOLVED: "Đã xử lý",
  REJECTED: "Đã từ chối",
};

const ACCOUNT_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "text-green-600 bg-green-50",
  LOCKED: "text-red-600 bg-red-50",
  INACTIVE: "text-amber-600 bg-amber-50",
  DELETED: "text-slate-600 bg-slate-100",
};

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
  INACTIVE: "INACTIVE",
  DELETED: "DELETED",
};

export default function ModerationDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res: any = await axiosClient.get(`/admin/reports?${params}`);
      setReports(res.data ?? []);
      setTotalPages(res.totalPages ?? 1);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleResolve = async (
    reportId: string,
    action: ResolveAction,
    notes?: string,
  ) => {
    const confirmMessages: Record<ResolveAction, string> = {
      HIDE_COMMENT: "Ẩn bình luận này?",
      WARN_USER:
        "Gửi cảnh báo cho người dùng này? (>=3 lần vi phạm sẽ tự động khóa)",
      BLOCK_USER: "Khóa tài khoản người dùng này vĩnh viễn?",
      REJECT: "Từ chối báo cáo này?",
    };

    if (!window.confirm(confirmMessages[action])) return;

    setProcessingId(reportId);
    try {
      await axiosClient.patch(`/admin/reports/${reportId}/resolve`, {
        action,
        notes,
      });

      const actionMessages: Record<ResolveAction, string> = {
        HIDE_COMMENT: "Đã ẩn bình luận vi phạm",
        WARN_USER: "Đã gửi cảnh báo đến người dùng",
        BLOCK_USER: "Đã khóa tài khoản người dùng",
        REJECT: "Đã từ chối báo cáo sai",
      };

      toast.success(actionMessages[action]);

      if (statusFilter === "PENDING") {
        setReports((prev) => prev.filter((r) => r.reportId !== reportId));
      } else {
        setReports((prev) =>
          prev.map((r) => {
            if (r.reportId !== reportId) return r;

            const nextViolationCount =
              action === "WARN_USER" ? r.violationCount + 1 : r.violationCount;

            return {
              ...r,
              status: action === "REJECT" ? "REJECTED" : "RESOLVED",
              violationCount: nextViolationCount,
              accountStatus:
                action === "BLOCK_USER" ||
                (action === "WARN_USER" && nextViolationCount >= 3)
                  ? "LOCKED"
                  : r.accountStatus,
            };
          }),
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Xử lý báo cáo thất bại");
    } finally {
      setProcessingId(null);
    }
  };

  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMs = new Date().getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 3600));
    if (diffHours < 1) return "Vừa xong";
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900">
                Kiểm duyệt nội dung
              </h1>
            </div>
          </div>

          <button
            onClick={fetchReports}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {(["PENDING", "ALL", "RESOLVED", "REJECTED"] as StatusFilter[]).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  statusFilter === s
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {s === "ALL" ? "Tất cả" : STATUS_LABELS[s]}
              </button>
            ),
          )}
          <span className="ml-auto self-center text-sm text-slate-500">
            Tổng: <span className="font-bold text-slate-900">{total}</span> báo cáo
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <Shield size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">Không có báo cáo nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-5 py-3.5 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      Người báo cáo
                    </th>
                    <th className="text-left px-5 py-3.5 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      Nội dung bị báo cáo
                    </th>
                    <th className="text-left px-5 py-3.5 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      Lý do
                    </th>
                    <th className="text-left px-5 py-3.5 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      Người vi phạm
                    </th>
                    <th className="text-left px-5 py-3.5 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="text-left px-5 py-3.5 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => {
                    const content = formatReportContent(report.commentContent);

                    return (
                      <tr
                        key={report.reportId}
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 overflow-hidden">
                              {report.reporterAvatar ? (
                                <img
                                  src={report.reporterAvatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                report.reporterName?.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="text-slate-900 font-medium text-xs leading-snug">
                                {report.reporterName}
                              </p>
                              <p className="text-slate-500 text-[11px]">
                                {timeAgo(report.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top max-w-[220px]">
                          <p
                            className="text-slate-900 font-medium text-xs leading-snug"
                            title={content.title}
                          >
                            {content.title}
                          </p>
                          {content.subtitle && (
                            <p
                              className="text-slate-700 text-xs line-clamp-2 leading-relaxed mt-1"
                              title={content.subtitle}
                            >
                              {content.subtitle}
                            </p>
                          )}
                          {report.details && (
                            <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">
                              💬 {report.details}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span className="inline-block bg-orange-50 text-orange-700 text-[11px] font-semibold px-2 py-1 rounded-md border border-orange-200">
                            {REASON_LABELS[report.reason] ?? report.reason}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 overflow-hidden">
                              {report.reportedUserAvatar ? (
                                <img
                                  src={report.reportedUserAvatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                report.reportedUserName?.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="text-slate-900 font-medium text-xs leading-snug">
                                {report.reportedUserName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ACCOUNT_STATUS_STYLES[report.accountStatus] ?? ACCOUNT_STATUS_STYLES.INACTIVE}`}
                                >
                                  {ACCOUNT_STATUS_LABELS[report.accountStatus] ?? report.accountStatus}
                                </span>
                                {report.violationCount > 0 && (
                                  <span className="text-[10px] text-amber-600">
                                    ⚠️ {report.violationCount} vi phạm
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2 py-1 rounded-md border ${STATUS_STYLES[report.status]}`}
                          >
                            {STATUS_LABELS[report.status]}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top">
                          {report.status === "PENDING" ? (
                            <div className="flex flex-wrap gap-1.5">
                              {report.discussionId && (
                                <button
                                  onClick={() =>
                                    handleResolve(report.reportId, "HIDE_COMMENT")
                                  }
                                  disabled={processingId === report.reportId}
                                  title="Ẩn bình luận"
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors hover:bg-slate-50 disabled:opacity-50"
                                >
                                  <EyeOff size={12} />
                                  Ẩn bình luận
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  handleResolve(report.reportId, "WARN_USER")
                                }
                                disabled={processingId === report.reportId}
                                title="Cảnh báo người dùng"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                              >
                                <AlertTriangle size={12} />
                                Cảnh báo
                              </button>

                              <button
                                onClick={() =>
                                  handleResolve(report.reportId, "BLOCK_USER")
                                }
                                disabled={processingId === report.reportId}
                                title="Khóa tài khoản"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                              >
                                <UserX size={12} />
                                Khóa user
                              </button>

                              <button
                                onClick={() =>
                                  handleResolve(report.reportId, "REJECT")
                                }
                                disabled={processingId === report.reportId}
                                title="Từ chối báo cáo"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold transition-colors hover:bg-slate-50 disabled:opacity-50"
                              >
                                <X size={12} />
                                Bỏ qua
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs italic">
                              Đã xử lý
                            </span>
                          )}

                          {processingId === report.reportId && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-emerald-600 text-[11px]">
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                              Đang xử lý...
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  page === p
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

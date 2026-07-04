import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, EyeOff, Trash2, UserX, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import axiosClient from '../../../api/axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../../../components/common/AdminSidebar';

// ─── Kiểu dữ liệu ────────────────────────────────────────────────────────────

interface Report {
  reportId: string;
  reason: string;
  details: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
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
  accountStatus: 'ACTIVE' | 'WARNED' | 'BLOCKED';
}

type ResolveAction = 'HIDE_COMMENT' | 'WARN_USER' | 'BLOCK_USER' | 'REJECT';
type StatusFilter = 'ALL' | 'PENDING' | 'RESOLVED' | 'REJECTED';

// ─── Tiêu đề lý do vi phạm ───────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  HATE_SPEECH: 'Ngôn từ thù địch',
  HARASSMENT: 'Quấy rối',
  FALSE_INFO: 'Thông tin sai',
  OTHER: 'Khác',
};

// ─── Nhãn trạng thái ─────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Đã từ chối',
};

const ACCOUNT_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'text-green-600 bg-green-50',
  WARNED: 'text-amber-600 bg-amber-50',
  BLOCKED: 'text-red-600 bg-red-50',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ModerationDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Lấy danh sách báo cáo từ API
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res: any = await axiosClient.get(`/admin/reports?${params}`);
      setReports(res.data ?? []);
      setTotalPages(res.totalPages ?? 1);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset về trang 1 khi đổi bộ lọc
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  /**
   * Xử lý một báo cáo: ẩn bình luận / cảnh báo / khóa user / từ chối
   */
  const handleResolve = async (reportId: string, action: ResolveAction, notes?: string) => {
    const confirmMessages: Record<ResolveAction, string> = {
      HIDE_COMMENT: 'Ẩn bình luận này?',
      WARN_USER: 'Gửi cảnh báo cho người dùng này? (≥3 lần cảnh báo sẽ tự động khóa)',
      BLOCK_USER: '⚠️ Khóa tài khoản người dùng này vĩnh viễn?',
      REJECT: 'Từ chối báo cáo này?',
    };

    if (!window.confirm(confirmMessages[action])) return;

    setProcessingId(reportId);
    try {
      await axiosClient.patch(`/admin/reports/${reportId}/resolve`, { action, notes });

      const actionMessages: Record<ResolveAction, string> = {
        HIDE_COMMENT: 'Đã ẩn bình luận vi phạm',
        WARN_USER: 'Đã gửi cảnh báo đến người dùng',
        BLOCK_USER: 'Đã khóa tài khoản người dùng',
        REJECT: 'Đã từ chối báo cáo sai',
      };

      toast.success(actionMessages[action]);

      // Cập nhật UI tức thì (Optimistic)
      if (statusFilter === 'PENDING') {
        setReports(prev => prev.filter(r => r.reportId !== reportId));
      } else {
        setReports(prev =>
          prev.map(r =>
            r.reportId === reportId
              ? {
                  ...r,
                  status: action === 'REJECT' ? 'REJECTED' : 'RESOLVED',
                // Cập nhật accountStatus nếu action liên quan đến user
                accountStatus:
                  action === 'BLOCK_USER'
                    ? 'BLOCKED'
                    : action === 'WARN_USER'
                    ? r.violationCount + 1 >= 3
                      ? 'BLOCKED'
                      : 'WARNED'
                    : r.accountStatus,
                violationCount: action === 'WARN_USER' ? r.violationCount + 1 : r.violationCount,
              }
            : r,
        ),
      );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xử lý báo cáo thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  // Định dạng thời gian
  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMs = new Date().getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 3600));
    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="flex min-h-screen bg-[#0e1e30]">
      <AdminSidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Shield size={20} className="text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Kiểm duyệt nội dung</h1>
            </div>
            <p className="text-slate-400 text-sm ml-12">
              Quản lý báo cáo vi phạm và xử lý tài khoản vi phạm
            </p>
          </div>

          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a324b] text-slate-300 rounded-lg border border-white/10 hover:bg-[#223d5a] transition-colors text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {/* ── Bộ lọc trạng thái ── */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['PENDING', 'ALL', 'RESOLVED', 'REJECTED'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                statusFilter === s
                  ? 'bg-[#1dbf73] text-white border-transparent'
                  : 'bg-[#1a324b] text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {s === 'ALL' ? 'Tất cả' : STATUS_LABELS[s]}
            </button>
          ))}
          <span className="ml-auto self-center text-slate-400 text-sm">
            Tổng: <span className="text-white font-bold">{total}</span> báo cáo
          </span>
        </div>

        {/* ── Bảng báo cáo ── */}
        <div className="bg-[#1a324b] rounded-xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1dbf73] border-t-transparent" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <Shield size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Không có báo cáo nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Người báo cáo</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Nội dung bị báo cáo</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Lý do</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Người vi phạm</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map(report => (
                    <tr
                      key={report.reportId}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* Người báo cáo */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                            {report.reporterAvatar
                              ? <img src={report.reporterAvatar} alt="" className="w-full h-full object-cover" />
                              : report.reporterName?.charAt(0)
                            }
                          </div>
                          <div>
                            <p className="text-white font-medium text-xs leading-snug">{report.reporterName}</p>
                            <p className="text-slate-500 text-[11px]">{timeAgo(report.createdAt)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Nội dung bị báo cáo */}
                      <td className="px-5 py-4 align-top max-w-[220px]">
                        {report.commentContent ? (
                          <p
                            className="text-slate-300 text-xs line-clamp-2 leading-relaxed"
                            title={report.commentContent}
                          >
                            {report.commentContent.replace(/<[^>]+>/g, '').substring(0, 120)}...
                          </p>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Báo cáo tài khoản</span>
                        )}
                        {report.details && (
                          <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">
                            💬 {report.details}
                          </p>
                        )}
                      </td>

                      {/* Lý do */}
                      <td className="px-5 py-4 align-top">
                        <span className="inline-block bg-orange-500/15 text-orange-400 text-[11px] font-semibold px-2 py-1 rounded-md border border-orange-500/20">
                          {REASON_LABELS[report.reason] ?? report.reason}
                        </span>
                      </td>

                      {/* Người vi phạm */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                            {report.reportedUserAvatar
                              ? <img src={report.reportedUserAvatar} alt="" className="w-full h-full object-cover" />
                              : report.reportedUserName?.charAt(0)
                            }
                          </div>
                          <div>
                            <p className="text-white font-medium text-xs leading-snug">{report.reportedUserName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ACCOUNT_STATUS_STYLES[report.accountStatus]}`}>
                                {report.accountStatus}
                              </span>
                              {report.violationCount > 0 && (
                                <span className="text-[10px] text-amber-500">
                                  ⚠️ {report.violationCount} vi phạm
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 align-top">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-1 rounded-md border ${STATUS_STYLES[report.status]}`}>
                          {STATUS_LABELS[report.status]}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="px-5 py-4 align-top">
                        {report.status === 'PENDING' ? (
                          <div className="flex flex-wrap gap-1.5">
                            {/* Ẩn bình luận */}
                            {report.discussionId && (
                              <button
                                onClick={() => handleResolve(report.reportId, 'HIDE_COMMENT')}
                                disabled={processingId === report.reportId}
                                title="Ẩn bình luận"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                              >
                                <EyeOff size={12} />
                                Ẩn bình luận
                              </button>
                            )}

                            {/* Cảnh báo user */}
                            <button
                              onClick={() => handleResolve(report.reportId, 'WARN_USER')}
                              disabled={processingId === report.reportId || report.accountStatus === 'BLOCKED'}
                              title="Cảnh báo người dùng"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              <AlertTriangle size={12} />
                              Cảnh báo
                            </button>

                            {/* Khóa user */}
                            <button
                              onClick={() => handleResolve(report.reportId, 'BLOCK_USER')}
                              disabled={processingId === report.reportId || report.accountStatus === 'BLOCKED'}
                              title="Khóa tài khoản"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              <UserX size={12} />
                              Khóa user
                            </button>

                            {/* Từ chối */}
                            <button
                              onClick={() => handleResolve(report.reportId, 'REJECT')}
                              disabled={processingId === report.reportId}
                              title="Từ chối báo cáo"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-500 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              <X size={12} />
                              Bỏ qua
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Đã xử lý</span>
                        )}

                        {/* Loading spinner */}
                        {processingId === report.reportId && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[#1dbf73] text-[11px]">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#1dbf73] border-t-transparent" />
                            Đang xử lý...
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Phân trang ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg bg-[#1a324b] text-slate-400 border border-white/10 hover:bg-[#223d5a] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  page === p
                    ? 'bg-[#1dbf73] text-white'
                    : 'bg-[#1a324b] text-slate-400 border border-white/10 hover:bg-[#223d5a]'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg bg-[#1a324b] text-slate-400 border border-white/10 hover:bg-[#223d5a] disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

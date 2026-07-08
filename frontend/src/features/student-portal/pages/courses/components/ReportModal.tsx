import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Flag, AlertTriangle } from 'lucide-react';
import axiosClient from '../../../../../api/axios';
import toast from 'react-hot-toast';

// ─── Kiểu dữ liệu ────────────────────────────────────────────────────────────

/** Các lý do vi phạm hỗ trợ */
type ReportReason = 'SPAM' | 'HATE_SPEECH' | 'HARASSMENT' | 'FALSE_INFO' | 'OTHER';

interface ReportOption {
  value: ReportReason;
  label: string;
  description: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Bình luận bị báo cáo */
  discussionId: number;
  /** Người viết bình luận bị báo cáo */
  reportedUserId: number;
  reportedUserName: string;
}

// ─── Danh sách lý do vi phạm ─────────────────────────────────────────────────

const REPORT_REASONS: ReportOption[] = [
  {
    value: 'SPAM',
    label: 'Spam / Quảng cáo',
    description: 'Nội dung quảng cáo, link rác hoặc lặp lại nhiều lần',
  },
  {
    value: 'HATE_SPEECH',
    label: 'Ngôn từ thù địch',
    description: 'Kỳ thị chủng tộc, giới tính, tôn giáo hoặc kích động thù hận',
  },
  {
    value: 'HARASSMENT',
    label: 'Quấy rối / Bắt nạt',
    description: 'Tấn công cá nhân, đe dọa hoặc quấy rối người khác',
  },
  {
    value: 'FALSE_INFO',
    label: 'Thông tin sai lệch',
    description: 'Lan truyền thông tin không chính xác hoặc gây hiểu nhầm',
  },
  {
    value: 'OTHER',
    label: 'Lý do khác',
    description: 'Vi phạm không thuộc các danh mục trên',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportModal({
  isOpen,
  onClose,
  discussionId,
  reportedUserId,
  reportedUserName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đóng modal và reset trạng thái
  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Vui lòng chọn lý do báo cáo');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosClient.post('/reports', {
        discussionId,
        reportedUserId,
        reason: selectedReason,
        details: details.trim() || undefined,
      });

      toast.success('Báo cáo đã được gửi!');
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    /* Overlay nền */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <Flag size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Báo cáo vi phạm</h2>
              <p className="text-xs text-slate-500">
                Báo cáo bình luận của <span className="font-semibold">{reportedUserName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Nội dung ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Chọn lý do */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Lý do báo cáo <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedReason === option.value
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={option.value}
                    checked={selectedReason === option.value}
                    onChange={() => setSelectedReason(option.value)}
                    className="mt-0.5 w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{option.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Chi tiết bổ sung */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Chi tiết bổ sung <span className="text-slate-400 font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Mô tả thêm về nội dung vi phạm để giúp chúng tôi xem xét nhanh hơn..."
              rows={3}
              maxLength={500}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none text-slate-800 placeholder-slate-400"
            />
            <p className="text-xs text-slate-400 text-right mt-1">{details.length}/500</p>
          </div>

          {/* Lưu ý */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Báo cáo sai sự thật có thể dẫn đến hạn chế tài khoản của bạn. Chỉ báo cáo nội dung thực sự vi phạm.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                Đang gửi...
              </>
            ) : (
              <>
                <Flag size={14} />
                Gửi báo cáo
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

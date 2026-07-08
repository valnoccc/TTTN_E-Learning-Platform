import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, XCircle, Tag } from 'lucide-react';
import axiosClient from '../api/axios';

type AiStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW' | null;

interface AiStatusBadgeProps {
  lessonId: number;
  initialStatus: AiStatus;
  initialLabels?: string[];
  initialRejectReason?: string | null;
  /** Gọi lại khi trạng thái thay đổi (để parent có thể kiểm soát nút Xuất bản) */
  onStatusChange?: (status: AiStatus) => void;
}

/**
 * Component hiển thị trạng thái kiểm duyệt AI của video.
 * Tự động polling 5 giây/lần nếu đang ở trạng thái PENDING.
 */
export function AiStatusBadge({
  lessonId,
  initialStatus,
  initialLabels = [],
  initialRejectReason = null,
  onStatusChange,
}: AiStatusBadgeProps) {
  const [status, setStatus] = useState<AiStatus>(initialStatus);
  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [rejectReason, setRejectReason] = useState<string | null>(initialRejectReason);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const res: any = await axiosClient.get(`/lessons/${lessonId}`);
      const data = res?.data ?? res;
      const newStatus: AiStatus = data?.aiStatus ?? null;
      const newLabels: string[] = data?.aiLabels ?? [];
      const newRejectReason: string | null = data?.aiRejectReason ?? null;

      setStatus(newStatus);
      setLabels(newLabels);
      setRejectReason(newRejectReason);
      onStatusChange?.(newStatus);

      // Dừng polling khi không còn PENDING
      if (newStatus !== 'PENDING' && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch {
      // Bỏ qua lỗi polling
    }
  };

  useEffect(() => {
    if (status === 'PENDING') {
      intervalRef.current = setInterval(fetchStatus, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lessonId, status]);

  // Nếu chưa có video (null) thì không hiển thị gì
  if (status === null) return null;

  if (status === 'PENDING' || status === 'PROCESSING') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <Clock size={14} className="animate-pulse text-amber-500" />
        <span className="text-[12px] font-semibold text-amber-700">
          ⏳ AI đang kiểm duyệt...
        </span>
        {import.meta.env.DEV && (
          <button
            onClick={async () => {
              try {
                await axiosClient.get('/ai/debug-approve-all');
                await fetchStatus();
              } catch (e) {
                console.error(e);
              }
            }}
            className="ml-auto rounded border border-amber-300 bg-white px-2 py-0.5 text-[10px] font-bold text-amber-600 hover:bg-amber-100"
            title="Dev Mode: Click để ép duyệt"
          >
            Mock Approve
          </button>
        )}
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span className="text-[12px] font-semibold text-emerald-700">✅ AI đã duyệt</span>
        </div>
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Tag size={12} className="mt-0.5 shrink-0 text-slate-400" />
            {labels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <XCircle size={14} className="text-rose-600" />
          <span className="text-[12px] font-semibold text-rose-700">🚫 AI từ chối</span>
        </div>
        {rejectReason && (
          <p className="mt-1 pl-5 text-[11px] leading-relaxed text-rose-600">
            {rejectReason}
          </p>
        )}
      </div>
    );
  }

  if (status === 'NEEDS_REVIEW') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-amber-600" />
          <span className="text-[12px] font-semibold text-amber-700">
            ⚠️ Video cần admin duyệt
          </span>
        </div>
        {rejectReason && (
          <p className="mt-1 pl-5 text-[11px] leading-relaxed text-amber-700">
            {rejectReason}
          </p>
        )}
      </div>
    );
  }

  return null;
}

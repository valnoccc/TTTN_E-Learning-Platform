import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import axiosClient from '../api/axios';

interface QuotaData {
  usedMinutes: number;
  limitMinutes: number;
  percentUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
  monthYear: string;
}

/**
 * Banner dính trên cùng cảnh báo hạn mức AI.
 * Chỉ hiển thị khi người dùng đã đăng nhập với role ADMIN hoặc INSTRUCTOR,
 * và khi usedMinutes >= 900.
 */
export function AiQuotaWarningBanner() {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    let role = '';
    try {
      const user = JSON.parse(userStr);
      role = (user.role || user.vaiTro || '').toUpperCase();
    } catch {
      return;
    }

    if (role !== 'ADMIN' && role !== 'INSTRUCTOR') return;

    const fetchQuota = async () => {
      try {
        const res: any = await axiosClient.get('/ai/quota');
        const data = res?.data ?? res;
        setQuota(data);
      } catch {
        // Không hiển thị lỗi - API có thể chưa khả dụng
      }
    };

    fetchQuota();
    // Refresh mỗi 5 phút
    const interval = setInterval(fetchQuota, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!quota || !quota.isWarning || dismissed) return null;

  const isExceeded = quota.isExceeded;
  const bgColor = isExceeded
    ? 'bg-rose-600'
    : 'bg-orange-500';

  return (
    <div
      className={`sticky top-0 z-[9999] w-full ${bgColor} px-4 py-2.5 shadow-lg`}
      role="alert"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-white" />
          <p className="text-[13px] font-semibold text-white">
            {isExceeded ? (
              <>
                🚫 Đã vượt hạn mức <strong>1.000 phút</strong> AI kiểm duyệt miễn phí tháng{' '}
                {quota.monthYear}. Tính năng upload video bị tạm khóa đến tháng sau.
              </>
            ) : (
              <>
                ⚠️ Đã dùng{' '}
                <strong>
                  {quota.usedMinutes}/{quota.limitMinutes} phút
                </strong>{' '}
                AI kiểm duyệt miễn phí tháng {quota.monthYear} ({quota.percentUsed}%).
                Tính năng upload có thể bị gián đoạn khi đạt 1.000 phút.
              </>
            )}
          </p>
        </div>
        {!isExceeded && (
          <button
            onClick={() => setDismissed(true)}
            className="ml-auto shrink-0 rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Đóng cảnh báo"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';

import {
  AUTH_BLOCKED_EVENT,
  BLOCKED_ACCOUNT_MESSAGE,
  type AuthBlockedEventDetail,
  clearAuthSession,
} from '../../utils/authBlock';

export default function BlockedAccountModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(BLOCKED_ACCOUNT_MESSAGE);
  const navigate = useNavigate();

  useEffect(() => {
    const handleBlocked = (event: Event) => {
      const customEvent = event as CustomEvent<AuthBlockedEventDetail>;
      setMessage(customEvent.detail?.message || BLOCKED_ACCOUNT_MESSAGE);
      setIsOpen(true);
    };

    window.addEventListener(AUTH_BLOCKED_EVENT, handleBlocked as EventListener);
    return () =>
      window.removeEventListener(AUTH_BLOCKED_EVENT, handleBlocked as EventListener);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    clearAuthSession();
    navigate('/', { replace: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Đóng thông báo"
        >
          <X size={18} />
        </button>

        <div className="px-8 pb-8 pt-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle size={30} />
          </div>

          <h2 className="text-center text-2xl font-bold text-slate-900">
            Tài khoản đã bị đình chỉ
          </h2>

          <p className="mt-4 text-center text-[15px] leading-7 text-slate-600">
            {message}
          </p>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700"
            >
              Đã hiểu
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Vui lòng liên hệ bộ phận hỗ trợ để được xem xét lại trạng thái tài khoản.
          </p>
        </div>
      </div>
    </div>
  );
}

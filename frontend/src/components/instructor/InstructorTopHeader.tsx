'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock3,
  Info,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';

import {
  useInstructorNotifications,
  type Notification,
} from '../../layouts/InstructorNotificationsContext';

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getNotificationTone(notification: Notification) {
  const title = `${notification.tieuDe} ${notification.noiDung}`.toLowerCase();

  if (title.includes('từ chối') || title.includes('tu choi') || title.includes('ban')) {
    return {
      wrapper: 'border-rose-100 bg-rose-50',
      dot: 'bg-rose-500',
      icon: <TriangleAlert className="text-rose-600" size={16} />,
      label: 'Từ chối',
    };
  }

  if (title.includes('phê duyệt') || title.includes('phe duyet')) {
    return {
      wrapper: 'border-emerald-100 bg-emerald-50',
      dot: 'bg-emerald-500',
      icon: <CheckCheck className="text-emerald-600" size={16} />,
      label: 'Phê duyệt',
    };
  }

  if (title.includes('cảnh báo') || title.includes('canh bao')) {
    return {
      wrapper: 'border-amber-100 bg-amber-50',
      dot: 'bg-amber-500',
      icon: <ShieldAlert className="text-amber-600" size={16} />,
      label: 'Cảnh báo',
    };
  }

  return {
    wrapper: 'border-slate-100 bg-slate-50',
    dot: 'bg-slate-400',
    icon: <Info className="text-slate-600" size={16} />,
    label: 'Thông báo',
  };
}

export default function InstructorTopHeader() {
  const { notifications, unreadCount, markAsRead } = useInstructorNotifications();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const dropdownItems = useMemo(() => notifications.slice(0, 5), [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <header className="relative flex h-[60px] items-center justify-between border-b border-[#d1d7dc] bg-white px-6">
      <div className="text-[1.2rem] font-bold tracking-tight text-[#2c3e50]">
        Bảng điều khiển Giảng viên
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
          aria-label="Thông báo giảng viên"
        >
          <Bell size={18} />
          {unreadCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
          ) : null}
        </button>

        {open ? (
          <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Thông báo</p>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0
                    ? `${unreadCount} thông báo chưa đọc`
                    : 'Không có thông báo mới'}
                </p>
              </div>
              <Clock3 size={16} className="text-slate-400" />
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {dropdownItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Hiện chưa có thông báo nào.
                </div>
              ) : (
                dropdownItems.map((notification) => {
                  const tone = getNotificationTone(notification);
                  return (
                    <button
                      key={notification.maTB}
                      type="button"
                      onClick={async () => {
                        if (!notification.daDoc) {
                          await markAsRead(notification.maTB);
                        }
                        setOpen(false);
                      }}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${tone.wrapper}`}
                    >
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.daDoc ? 'bg-slate-300' : tone.dot}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {tone.icon}
                          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            {tone.label}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                          {notification.tieuDe}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {notification.noiDung}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-400">
                          {formatNotificationTime(notification.thoiGian)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

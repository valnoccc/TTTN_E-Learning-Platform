import { type MouseEventHandler } from 'react';

type UserDropdownProps = {
  user: any;
  onLogout: MouseEventHandler<HTMLButtonElement>;
};

export default function UserDropdown({ user, onLogout }: UserDropdownProps) {
  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-full border border-[#1f3348] bg-[#1a324b] py-1">
      <div className="border-b border-white/10 px-4 pb-3 pt-2">
        <p className="truncate text-[14px] font-bold text-white">{user?.fullName || 'Nguyễn Văn A'}</p>
        <p className="truncate text-[12px] text-[#a0aec0]">{user?.email || 'teacher@example.com'}</p>
      </div>
      <div className="py-1">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-white transition hover:bg-[#112132]"
        >
          Hồ sơ chuyên môn
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-white transition hover:bg-[#112132]"
        >
          Cài đặt tài khoản
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-white transition hover:bg-[#e53e3e]"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

import { useLocation, Link, useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, ChevronUp, GraduationCap, LogOut, Users } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import UserDropdown from '../instructor/UserDropdown';

type SidebarItem = {
  label: string;
  path: string;
  icon: ReactNode;
};

export default function InstructorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items: SidebarItem[] = [
    { label: 'Khóa học của tôi', path: '/instructor/courses', icon: <BookOpen size={18} /> },
    { label: 'Đánh giá học viên', path: '/instructor/students', icon: <Users size={18} /> },
    { label: 'Báo cáo & Thống kê', path: '/instructor/reports', icon: <BarChart3 size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
    window.location.reload();
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-[#1f3348] bg-[#112132] text-white self-start">
      <div className="flex h-[60px] items-center justify-center border-b border-white/10 px-5">
        <div className="flex items-center gap-2 text-[1.2rem] font-bold tracking-tight text-[#1dbf73]">
          <GraduationCap size={20} />
          <span>EDULYN INSTRUCTOR</span>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto py-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-4 border-l-4 px-5 py-4 text-[14px] transition ${
                    isActive
                      ? 'border-l-[#1dbf73] bg-[#1a324b] font-bold text-white'
                      : 'border-l-transparent text-[#d0d6e2] hover:bg-[#1a324b] hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-[#a0aec0]'}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="relative mt-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu((value) => !value)}
            className={`flex w-full items-center justify-between border px-3 py-2 transition ${
              showUserMenu ? 'border-[#aeb8c6] bg-[#1a324b]' : 'border-white/10 bg-[#112132] hover:bg-[#1a324b]'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[2px] bg-[#1dbf73] text-[14px] font-bold text-white">
                {(user?.fullName || 'A').charAt(0)}
              </div>
              <div className="min-w-0 text-left">
                <div className="truncate text-[14px] font-bold text-white">{user?.fullName || 'Nguyễn Văn A'}</div>
                <div className="text-[12px] text-[#a0aec0]">Giảng viên</div>
              </div>
            </div>
            <ChevronUp size={16} className={`text-[#a0aec0] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <UserDropdown onLogout={handleLogout} user={user} />
          )}
        </div>
      </div>
    </aside>
  );
}

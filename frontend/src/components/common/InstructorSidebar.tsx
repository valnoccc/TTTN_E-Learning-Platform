import { useLocation, Link, useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, ChevronUp, GraduationCap, MessageSquare, Star, Users } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import UserDropdown from '../instructor/UserDropdown';
import axiosClient from '../../api/axios'; // Nhớ kiểm tra lại đường dẫn import axiosClient của bạn

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

  // Chuyển sang dùng state để React có thể re-render ngay khi dữ liệu thay đổi
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  // TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU TỪ DATABASE KHI TẢI TRANG (F5)
  useEffect(() => {
    const syncProfileWithDB = async () => {
      try {
        const response = await axiosClient.get<any>('/instructors/me/profile');
        const profileData = response.data || response;

        if (profileData && user) {
          // Kiểm tra xem dữ liệu trong DB có khác với localStorage không
          if (profileData.hoTen !== user.fullName || profileData.anhDaiDien !== user.avatar) {
            const updatedUser = {
              ...user,
              fullName: profileData.hoTen || user.fullName,
              avatar: profileData.anhDaiDien || user.avatar,
              AnhDaiDien: profileData.anhDaiDien || user.AnhDaiDien,
            };
            // Cập nhật cả State và LocalStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        }
      } catch (error) {
        console.error('Không thể đồng bộ thông tin sidebar từ DB:', error);
      }
    };

    void syncProfileWithDB();
  }, []);

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
    { label: 'Báo cáo & Thống kê', path: '/instructor/reports', icon: <BarChart3 size={18} /> },
    { label: 'Khóa học của tôi', path: '/instructor/courses', icon: <BookOpen size={18} /> },
    { label: 'Hỏi đáp', path: '/instructor/discussions', icon: <MessageSquare size={18} /> },
    { label: 'Đánh giá học viên', path: '/instructor/students', icon: <Users size={18} /> },
    { label: 'Đánh giá khóa học', path: '/instructor/reviews', icon: <Star size={18} /> },
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
                  className={`flex items-center gap-4 border-l-4 px-5 py-4 text-[14px] transition ${isActive
                    ? 'border-l-4 border-l-[#1dbf73] bg-[#1a324b] font-bold text-white'
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
            className={`flex w-full items-center justify-between border px-3 py-2 transition ${showUserMenu ? 'border-[#aeb8c6] bg-[#1a324b]' : 'border-white/10 bg-[#112132] hover:bg-[#1a324b]'
              }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              {/* THAY ĐỔI: Hiển thị hình ảnh nếu user đã có avatar trong DB */}
              <div className="flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-[2px] bg-[#1dbf73] text-[14px] font-bold text-white shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  (user?.fullName || 'A').charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 text-left">
                <div className="truncate text-[14px] font-bold text-white">{user?.fullName || 'Unknown'}</div>
                <div className="text-[12px] text-[#a0aec0]">{user?.role || 'Giảng viên'}</div>
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

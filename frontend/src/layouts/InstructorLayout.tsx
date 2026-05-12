import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorSidebar from '../components/common/InstructorSidebar';
import { User, Bell, Search, LogOut } from 'lucide-react';

// Định nghĩa interface cho Props
interface InstructorLayoutProps {
    children: ReactNode;
}

export default function InstructorLayout({ children }: InstructorLayoutProps) {
    // 1. Khai báo các biến và hook
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

    // Sửa lỗi: Cung cấp kiểu dữ liệu cho useRef thay vì mặc định là 'never'
    const menuRef = useRef<HTMLDivElement>(null);

    // 2. Logic xử lý click ra ngoài để đóng menu
    useEffect(() => {
        // Sửa lỗi: Định nghĩa kiểu cho event là MouseEvent
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 3. Hàm xử lý đăng xuất
    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
        window.location.reload();
    };

    return (
        <div className="flex min-h-screen bg-[#F5F5F7]">
            <InstructorSidebar />

            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-14 bg-white/70 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-8 flex items-center justify-between">
                    <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200 w-64">
                        <Search size={14} className="text-gray-400 mr-2" />
                        <input type="text" placeholder="Tìm kiếm nội dung..." className="bg-transparent border-none outline-none text-[12px] w-full" />
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-[#1D1D1F] transition-colors">
                            <Bell size={18} />
                        </button>
                        <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

                        {/* User Profile & Dropdown */}
                        <div className="flex items-center gap-3 relative" ref={menuRef}>
                            <div className="text-right hidden sm:block">
                                <p className="text-[12px] font-bold text-[#1D1D1F] leading-none">{user?.fullName}</p>
                                <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">Giảng viên</p>
                            </div>
                            <div
                                className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-[#0071E3] cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                            >
                                <User size={16} />
                            </div>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 top-full mt-3 w-44 bg-white border border-gray-200 rounded-md shadow-xl py-1 z-50 overflow-hidden">
                                    <div className="px-4 py-2 text-[11px] font-bold text-gray-400 border-b border-gray-50 uppercase">Tài khoản</div>
                                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50">
                                        <User size={14} /> Hồ sơ của tôi
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={14} /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-8 flex-grow">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
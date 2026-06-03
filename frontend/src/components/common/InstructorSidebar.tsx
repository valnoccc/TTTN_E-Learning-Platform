import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    BarChart3,
    Settings,
    HelpCircle,
    Bell,
    User,
    LogOut,
    ChevronUp,
    GraduationCap,
} from 'lucide-react';

export default function InstructorSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
        window.location.reload();
    };

    const menuItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Tổng quan', path: '/instructor' },
        { icon: <BookOpen size={18} />, label: 'Khóa học của tôi', path: '/instructor/courses' },
        { icon: <Users size={18} />, label: 'Quản lý học viên', path: '/instructor/students' },
        { icon: <BarChart3 size={18} />, label: 'Doanh thu', path: '/instructor/revenue' },
    ];

    return (
        <aside className="sticky top-0 z-40 flex h-screen w-[260px] flex-col border-r border-slate-200 bg-white text-slate-800">
            <div className="flex flex-1 flex-col overflow-y-auto pb-[220px]">
                <div className="flex h-[60px] shrink-0 items-center px-5">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-50 text-emerald-600">
                            <GraduationCap size={20} />
                        </div>
                        <span className="text-[16px] tracking-tight">Instructor Hub</span>
                    </div>
                </div>

                <nav className="space-y-1 px-3 py-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 rounded-md px-3 py-2 text-[14px] transition-colors ${
                                    isActive
                                        ? 'bg-slate-100 font-medium text-slate-900'
                                        : 'font-normal text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <span className={isActive ? 'text-slate-800' : 'text-slate-500'}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-3">
                <div className="space-y-1">
                    <Link
                        to="#"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                        <Settings size={18} className="text-slate-500" />
                        Settings
                    </Link>
                    <Link
                        to="#"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                        <HelpCircle size={18} className="text-slate-500" />
                        Help
                    </Link>
                    <Link
                        to="#"
                        className="flex items-center justify-between rounded-md px-3 py-2 text-[14px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                        <div className="flex items-center gap-3">
                            <Bell size={18} className="text-slate-500" />
                            Notification
                        </div>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-medium text-white">
                            1
                        </span>
                    </Link>
                </div>

                <div className="relative mt-3" ref={menuRef}>
                    {showUserMenu && (
                        <div className="absolute bottom-full left-0 z-50 mb-3 w-[222px] overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                            <div className="border-b border-slate-100 px-4 pb-3 pt-2">
                                <p className="text-[14px] font-semibold text-slate-800">{user?.fullName || 'Van Loc'}</p>
                                <p className="text-[13px] text-slate-500">{user?.email || 'locboypro1008@gmail.com'}</p>
                            </div>

                            <div className="py-1">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                >
                                    <User size={14} className="text-slate-500" />
                                    Hồ sơ cá nhân
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                                >
                                    <LogOut size={14} className="text-slate-500" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowUserMenu((value) => !value)}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                            showUserMenu ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                <User size={15} />
                            </div>
                            <span className="text-[14px] font-medium text-slate-700">
                                {user?.fullName || 'Van Loc'}
                            </span>
                        </div>
                        <ChevronUp
                            size={16}
                            className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>
            </div>
        </aside>
    );
}

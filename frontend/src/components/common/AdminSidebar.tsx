import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Layers, ChevronUp, ShieldCheck, FileText, Ticket, Shield, Wallet } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// Dùng lại UserDropdown của giảng viên (hoặc bạn có thể tạo một bản copy tên AdminDropdown nếu cần đổi link bên trong)
import UserDropdown from '../instructor/UserDropdown';

type SidebarItem = {
    label: string;
    path: string;
    icon: ReactNode;
};

type SidebarSection = {
    title: string;
    items: SidebarItem[];
};

type StoredAdminUser = {
    fullName?: string;
    avatar?: string;
    vaiTro?: string;
};

export default function AdminSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const [user] = useState<StoredAdminUser | null>(() => JSON.parse(localStorage.getItem('user') || 'null'));
    const userRole = String(user?.vaiTro ?? '').toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    useEffect(() => {
        if (user && !isAdmin) {
            navigate('/');
        }
    }, [isAdmin, navigate, user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sections: SidebarSection[] = [
        {
            title: 'Tổng quan',
            items: [
                { label: 'Tổng quan', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
            ],
        },
        {
            title: 'Quản lý người dùng',
            items: [
                { label: 'Quản lý người dùng', path: '/admin/users', icon: <Users size={18} /> },
            ],
        },
        {
            title: 'Quản lý nội dung',
            items: [
                { label: 'Phê duyệt khóa học', path: '/admin/courses', icon: <BookOpen size={18} /> },
                { label: 'Quản lý danh mục', path: '/admin/categories', icon: <Layers size={18} /> },
                { label: 'Quản lý bài viết', path: '/admin/posts', icon: <FileText size={18} /> },
            ],
        },
        {
            title: 'Tài chính',
            items: [
                { label: 'Mã giảm giá', path: '/admin/coupons', icon: <Ticket size={18} /> },
                { label: 'Công nợ', path: '/admin/debts', icon: <Wallet size={18} /> },
            ],
        },
        {
            title: 'Kiểm duyệt',
            items: [
                { label: 'Kiểm duyệt vi phạm', path: '/admin/moderation', icon: <Shield size={18} /> },
            ],
        },
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
                    <ShieldCheck size={20} />
                    <span>EDULYN ADMIN</span>
                </div>
            </div>

            <nav className="scrollbar-none min-h-0 flex-1 overflow-y-auto py-3">
                <div className="space-y-4">
                    {sections.map((section, sectionIndex) => (
                        <section key={section.title} className={sectionIndex > 0 ? 'pt-1' : ''}>
                            <div className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f8198]">
                                {section.title}
                            </div>
                            <ul className="space-y-1">
                                {section.items.map((item) => {
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
                        </section>
                    ))}
                </div>
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
                            <div className="flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-[2px] bg-[#1dbf73] text-[14px] font-bold text-white shrink-0">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    (user?.fullName || 'A').charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0 text-left">
                                <div className="truncate text-[14px] font-bold text-white">{user?.fullName || 'Quản trị viên'}</div>
                                <div className="text-[12px] text-[#a0aec0]">
                                    {isAdmin ? 'Quản trị viên' : 'Người dùng'}
                                </div>
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

import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, Users,
    BarChart3, Settings, HelpCircle, PlusCircle
} from 'lucide-react';

export default function InstructorSidebar() {
    const location = useLocation();

    const menuItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Tổng quan', path: '/instructor' },
        { icon: <BookOpen size={18} />, label: 'Khóa học của tôi', path: '/instructor/courses' },
        { icon: <Users size={18} />, label: 'Quản lý học viên', path: '/instructor/students' },
        { icon: <BarChart3 size={18} />, label: 'Doanh thu', path: '/instructor/revenue' },
    ];

    return (
        <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-[#1D1D1F] mb-8">
                    <div className="bg-[#0071E3] p-1.5 rounded-lg">
                        <PlusCircle size={18} className="text-white" />
                    </div>
                    <span>Instructor Hub.</span>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-[#0071E3]'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#1D1D1F]'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-gray-100">
                <nav className="space-y-1">
                    <Link to="#" className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-gray-500 hover:text-[#1D1D1F]">
                        <Settings size={18} /> Cài đặt
                    </Link>
                    <Link to="#" className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-gray-400 hover:text-[#1D1D1F]">
                        <HelpCircle size={18} /> Trợ giúp
                    </Link>
                </nav>
            </div>
        </aside>
    );
}
import { LogOut, Users, DollarSign, BookCheck, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
            {/* Topbar macOS Style */}
            <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200 h-12 flex items-center justify-between px-6">
                <div className="font-semibold tracking-tight text-sm flex items-center gap-2">
                    <ShieldCheck size={16} className="text-red-500" /> Hệ thống Quản trị
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <span className="font-medium">{user?.fullName}</span>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/' }} className="hover:text-red-500">
                        <LogOut size={14} />
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-8">
                <header className="mb-10">
                    <h1 className="text-3xl font-semibold tracking-tight">Tổng quan Hệ thống.</h1>
                </header>

                {/* Stats Grid - Rounded-md */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
                        <Users size={18} className="text-blue-500 mb-3" />
                        <div className="text-2xl font-semibold">1,250</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Tổng Người dùng</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
                        <DollarSign size={18} className="text-green-500 mb-3" />
                        <div className="text-2xl font-semibold">45.2 Tr VNĐ</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Doanh thu tháng</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
                        <BookCheck size={18} className="text-orange-500 mb-3" />
                        <div className="text-2xl font-semibold">15</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Khóa học chờ duyệt</div>
                    </div>
                </div>

                {/* Bảng quản lý User đơn giản */}
                <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 font-medium text-sm bg-gray-50/50">Người dùng mới đăng ký</div>
                    <div className="p-0 text-sm">
                        <div className="flex items-center justify-between p-4 border-b border-gray-50 last:border-none">
                            <div>
                                <div className="font-medium">Chu Văn Lộc</div>
                                <div className="text-xs text-gray-500">loc.chu@tttn.com</div>
                            </div>
                            <div className="text-xs bg-gray-100 px-2 py-0.5 rounded-sm">HOC_VIEN</div>
                            <button className="text-[11px] text-red-600 hover:underline">Khóa</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
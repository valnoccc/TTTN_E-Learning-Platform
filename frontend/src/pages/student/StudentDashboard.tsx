import { LogOut, Book, PlayCircle, Clock } from 'lucide-react';

export default function StudentDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
            {/* Topbar macOS Style */}
            <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200 h-12 flex items-center justify-between px-6">
                <div className="font-semibold tracking-tight text-sm">Học Viên System</div>
                <div className="flex items-center gap-4 text-xs">
                    <span className="font-medium">{user?.fullName}</span>
                    <button onClick={handleLogout} className="hover:text-red-500 transition-colors">
                        <LogOut size={14} />
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-8">
                <header className="mb-10">
                    <h1 className="text-3xl font-semibold tracking-tight">Chào buổi sáng, {user?.fullName?.split(' ').pop()}.</h1>
                    <p className="text-gray-500 text-sm mt-1">Hôm nay bạn muốn học gì mới?</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
                        <Book size={18} className="text-blue-500 mb-3" />
                        <div className="text-2xl font-semibold">08</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Khóa học của tôi</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
                        <Clock size={18} className="text-orange-500 mb-3" />
                        <div className="text-2xl font-semibold">24h</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Thời gian học</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
                        <PlayCircle size={18} className="text-green-500 mb-3" />
                        <div className="text-2xl font-semibold">85%</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Tiến độ</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
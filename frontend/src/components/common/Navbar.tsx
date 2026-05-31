import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User, LogOut, ChevronDown, Bell } from 'lucide-react';

export default function Navbar() {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
        window.location.reload();
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between text-[13px]">
                <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
                    <BookOpen size={18} className="text-[#0071E3]" />
                    <span>STU Learning</span>
                </Link>

                <div className="flex items-center gap-6 font-medium">
                    {!user ? (
                        <>
                            <Link to="/login" className="text-gray-600 hover:text-black">Đăng nhập</Link>
                            <Link to="/register" className="bg-[#0071E3] text-white px-3 py-1 rounded-md hover:bg-[#0077ED]">Đăng ký</Link>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                            <div
                                className="flex items-center gap-2 cursor-pointer py-1 px-2 hover:bg-gray-100 rounded-md transition-colors"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-[#0071E3]">
                                    <User size={14} />
                                </div>
                                <span className="text-gray-700 font-semibold">
                                    {user?.fullName?.split(' ').pop() || user?.name || 'User'}
                                </span>
                                <ChevronDown size={12} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Dropdown Menu - Xử lý hiển thị bằng State */}
                            {showDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                                    <Link
                                        to={user.role === 'ADMIN' ? '/admin' : user.role === 'GIANG_VIEN' ? '/instructor' : '/student'}
                                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <BookOpen size={14} /> Góc quản lý
                                    </Link>
                                    <hr className="my-1 border-gray-100" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 transition-colors text-left"
                                    >
                                        <LogOut size={14} /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
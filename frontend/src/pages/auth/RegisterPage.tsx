import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosClient.post('/auth/register', formData);
            toast.success('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
            navigate('/login');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại');
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
            <div className="max-w-[400px] w-full bg-white border border-gray-200 rounded-md shadow-sm p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">Tạo tài khoản</h2>
                    <p className="text-sm text-gray-500 mt-2">Đăng ký để bắt đầu học tập</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-medium mb-1.5 text-gray-700">Họ và tên</label>
                        <input
                            type="text" required
                            className="w-full px-3 py-2 bg-[#FBFBFD] border border-gray-300 rounded-md text-sm outline-none focus:border-[#0071E3] transition-colors"
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium mb-1.5 text-gray-700">Email</label>
                        <input
                            type="email" required
                            className="w-full px-3 py-2 bg-[#FBFBFD] border border-gray-300 rounded-md text-sm outline-none focus:border-[#0071E3] transition-colors"
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium mb-1.5 text-gray-700">Mật khẩu</label>
                        <input
                            type="password" required
                            className="w-full px-3 py-2 bg-[#FBFBFD] border border-gray-300 rounded-md text-sm outline-none focus:border-[#0071E3] transition-colors"
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button className="w-full bg-[#0071E3] text-white py-2 rounded-md text-sm font-medium hover:bg-[#0077ED] transition-colors mt-2">
                        Đăng ký
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center text-[13px]">
                    <span className="text-gray-500">Đã có tài khoản? </span>
                    <Link to="/login" className="text-[#0071E3] hover:underline font-medium">Đăng nhập ngay</Link>
                </div>
            </div>
        </div>
    );
}
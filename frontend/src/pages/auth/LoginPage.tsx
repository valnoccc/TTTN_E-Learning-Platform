import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axios';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Sửa ở đây: Loại bỏ bóc tách { data } vì axiosClient đã trả về data rồi
            const response: any = await axiosClient.post('/auth/login', { email, password });

            // Lưu thông tin vào LocalStorage (truy cập trực tiếp vào response)
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));

            toast.success('Đăng nhập thành công');

            const role = response.user?.role;
            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'GIANG_VIEN') navigate('/instructor');
            else navigate('/');

        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tài khoản hoặc mật khẩu không đúng');
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
            <div className="max-w-[400px] w-full bg-white border border-gray-200 rounded-md shadow-sm p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">Đăng nhập</h2>
                    <p className="text-sm text-gray-500 mt-2">Sử dụng tài khoản nội bộ của bạn</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-medium mb-1.5 text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 bg-[#FBFBFD] border border-gray-300 rounded-md text-sm outline-none focus:border-[#0071E3] transition-colors"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium mb-1.5 text-gray-700">Mật khẩu</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 bg-[#FBFBFD] border border-gray-300 rounded-md text-sm outline-none focus:border-[#0071E3] transition-colors"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button className="w-full bg-[#0071E3] text-white py-2 rounded-md text-sm font-medium hover:bg-[#0077ED] transition-colors mt-2">
                        Tiếp tục
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center text-[13px]">
                    <span className="text-gray-500">Chưa có tài khoản? </span>
                    <Link to="/register" className="text-[#0071E3] hover:underline font-medium">Tạo tài khoản mới</Link>
                </div>
            </div>
        </div>
    );
}
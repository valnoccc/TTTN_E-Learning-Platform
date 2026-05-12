import { Routes, Route } from 'react-router-dom';
import AdminDashboard from '../pages/admin/AdminDashboard';
// Import thêm các trang Admin khác của bạn vào đây (ví dụ: Quản lý người dùng, thống kê...)

export default function AdminRoutes() {
    return (
        <Routes>
            {/* Đường dẫn gốc là /admin/ */}
            <Route path="/" element={<AdminDashboard />} />

            {/* Ví dụ sau này bạn thêm: <Route path="users" element={<AdminUserManagement />} /> */}
        </Routes>
    );
}
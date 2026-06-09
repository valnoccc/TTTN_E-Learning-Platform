import { Routes, Route } from 'react-router-dom';
import AdminDashboard from '../pages/admin/Dashboard/AdminDashboard';

export default function AdminRoutes() {
    return (
        <Routes>
            {/* Đường dẫn gốc là /admin/ */}
            <Route path="/" element={<AdminDashboard />} />

            {/* Ví dụ sau này bạn thêm: <Route path="users" element={<AdminUserManagement />} /> */}
        </Routes>
    );
}
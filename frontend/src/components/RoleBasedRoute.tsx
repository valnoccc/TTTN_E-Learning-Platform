import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { normalizeRole } from '../utils/roles';

interface RoleBasedRouteProps {
    children: ReactNode;
    allowedRoles: string[];
}

export default function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    // 1. Kiểm tra token trước
    if (!token) return <Navigate to="/login" replace />;

    // 2. Parse an toàn
    let userRole = '';
    if (userString) {
        try {
            const parsedUser = JSON.parse(userString);
            userRole = (normalizeRole(parsedUser.vaiTro) as string) || '';
        } catch {
            userRole = '';
        }
    }

    // 3. Kiểm tra quyền và ngăn chặn vòng lặp
    // Nếu role không khớp và KHÔNG PHẢI đang ở trang chủ, thì mới chuyển về '/'
    if (!userRole || !allowedRoles.includes(userRole)) {
        if (window.location.pathname !== '/') {
            return <Navigate to="/" replace />;
        }
        // Nếu đã ở '/' mà vẫn không có quyền, hiển thị thông báo lỗi thay vì Navigate
        return <div>Bạn không có quyền truy cập trang này.</div>;
    }

    return <>{children}</>;
}

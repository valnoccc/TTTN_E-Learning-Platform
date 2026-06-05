import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { normalizeRole } from '../utils/roles';

interface RoleBasedRouteProps {
    children: ReactNode;
    allowedRoles: string[];
}

export default function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
    const userString = localStorage.getItem('user');
    let user: { role?: string } | null = null;

    if (userString) {
        try {
            const parsedUser = JSON.parse(userString) as { role?: string };
            user = { ...parsedUser, role: normalizeRole(parsedUser.role) };
        } catch {
            user = null;
        }
    }
    const token = localStorage.getItem('access_token');
    const normalizedRole = normalizeRole(user?.role);

    if (!token) return <Navigate to="/login" replace />;
    if (!normalizedRole || !allowedRoles.includes(normalizedRole)) return <Navigate to="/" replace />;

    return <>{children}</>;
}

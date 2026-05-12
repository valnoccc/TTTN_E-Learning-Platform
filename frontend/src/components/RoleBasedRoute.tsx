import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface RoleBasedRouteProps {
    children: ReactNode;
    allowedRoles: string[];
}

export default function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const token = localStorage.getItem('access_token');

    if (!token) return <Navigate to="/login" replace />;
    if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

    return <>{children}</>;
}
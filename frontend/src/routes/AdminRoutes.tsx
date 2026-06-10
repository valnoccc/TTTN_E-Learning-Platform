import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '../pages/admin/Dashboard/AdminDashboard';
import AdminCourseModeration from '../pages/admin/Courses/AdminCourseModeration';

export default function AdminRoutes() {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourseModeration />} />
        </Routes>
    );
}

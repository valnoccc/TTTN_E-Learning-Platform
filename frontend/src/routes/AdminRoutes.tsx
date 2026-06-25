import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '../pages/admin/Dashboard/AdminDashboard';
import AdminCourseModeration from '../pages/admin/Courses/AdminCourseModeration';
import AdminCourseDetail from '../pages/admin/Courses/AdminCourseDetail';
import AdminCategories from '../pages/admin/Categories/AdminCategories';
import AdminPosts from '../pages/admin/Posts/AdminPosts';
import AdminPostForm from '../pages/admin/Posts/AdminPostForm';

export default function AdminRoutes() {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourseModeration />} />
            <Route path="courses/:id" element={<AdminCourseDetail />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="posts/new" element={<AdminPostForm />} />
            <Route path="posts/:id/edit" element={<AdminPostForm />} />
        </Routes>
    );
}


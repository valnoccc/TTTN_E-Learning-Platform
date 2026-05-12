import { Routes, Route } from 'react-router-dom';
import StudentDashboard from '../pages/student/StudentDashboard';
// Import thêm các trang như: Khóa học đã mua, bài tập về nhà, hồ sơ cá nhân...

export default function StudentRoutes() {
    return (
        <Routes>
            {/* Đường dẫn gốc là /student/ */}
            <Route path="/" element={<StudentDashboard />} />
        </Routes>
    );
}
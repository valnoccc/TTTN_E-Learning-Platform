import { Routes, Route } from 'react-router-dom';
import InstructorDashboard from '../pages/instructor/InstructorDashboard';
import InstructorCourses from '../pages/instructor/InstructorCourses';
import InstructorCourseDetail from '../pages/instructor/InstructorCourseDetail';
import AddLesson from '../pages/instructor/AddLesson';
import LessonDetail from '../pages/instructor/LessonDetail'; // Trang sửa bài học ở bước trước

export default function InstructorRoutes() {
    return (
        <Routes>
            {/* Đường dẫn thực tế sẽ là: /instructor/ */}
            <Route path="/" element={<InstructorDashboard />} />

            {/* Đường dẫn thực tế sẽ là: /instructor/courses */}
            <Route path="courses" element={<InstructorCourses />} />

            {/* Đường dẫn thực tế sẽ là: /instructor/courses/:id */}
            <Route path="courses/:id" element={<InstructorCourseDetail />} />

            {/* Đường dẫn thực tế sẽ là: /instructor/lessons/:id */}
            <Route path="lessons/:id" element={<AddLesson />} />

            {/* Đường dẫn thực tế sẽ là: /instructor/lesson-detail/:lessonId */}
            <Route path="lesson-detail/:lessonId" element={<LessonDetail />} />
        </Routes>
    );
}
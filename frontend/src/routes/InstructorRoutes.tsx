import { Navigate, Route, Routes } from 'react-router-dom';

import InstructorCourseCreate from '../pages/instructor/courses/CourseCreate';
import InstructorCourseDetail from '../pages/instructor/courses/CourseDetailShell';
import InstructorCourses from '../pages/instructor/courses/CourseList';
import InstructorCourseLessons from '../pages/instructor/courses/tabs/CourseLessons';
import InstructorCourseOverview from '../pages/instructor/courses/tabs/CourseOverview';
import InstructorCouponManagement from '../pages/instructor/coupons/CouponManagement';
import InstructorDashboard from '../pages/instructor/dashboard/Dashboard';
import InstructorCourseDiscussionsPage from '../pages/instructor/discussions/CourseDiscussions';
import InstructorLessonEdit from '../pages/instructor/lessons/LessonDetail';
import InstructorLessonCreate from '../pages/instructor/lessons/LessonCreate';
import InstructorProfile from '../pages/instructor/profile/InstructorProfile';
import InstructorCourseReviewsPage from '../pages/instructor/reviews/CourseReviews';
import InstructorReports from '../pages/instructor/reports/RevenueReports';
import InstructorStudents from '../pages/instructor/students/StudentEvaluations';

export default function InstructorRoutes() {
  return (
    <Routes>
      <Route path="/" element={<InstructorDashboard />} />
      <Route path="courses" element={<InstructorCourses />} />
      <Route path="coupons" element={<InstructorCouponManagement />} />
      <Route path="courses/new" element={<InstructorCourseCreate />} />
      <Route path="courses/:id" element={<InstructorCourseDetail />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<InstructorCourseOverview />} />
        <Route path="lessons" element={<InstructorCourseLessons />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Route>
      <Route path="profile" element={<InstructorProfile />} />
      <Route path="courses/:id/lessons/new" element={<InstructorLessonCreate />} />
      <Route path="lessons/:lessonId/edit" element={<InstructorLessonEdit />} />
      <Route path="students" element={<InstructorStudents />} />
      <Route path="discussions" element={<InstructorCourseDiscussionsPage />} />
      <Route path="reviews" element={<InstructorCourseReviewsPage />} />
      <Route path="reports" element={<InstructorReports />} />
    </Routes>
  );
}

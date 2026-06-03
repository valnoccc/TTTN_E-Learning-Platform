import { Navigate, Route, Routes } from 'react-router-dom';
import HomeTwo from '../features/student-portal/HomeTwo';
import About from '../features/student-portal/pages/about/About';
import CourseGrid from '../features/student-portal/pages/courses/CourseGrid';
import CourseList from '../features/student-portal/pages/courses/CourseList';
import CourseDetails from '../features/student-portal/pages/courses/CourseDetails';
import Faq from '../features/student-portal/pages/faq/Faq';
import Contact from '../features/student-portal/pages/contact/Contact';

export default function StudentRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeTwo />} />
      <Route path="home-two" element={<HomeTwo />} />
      <Route path="about" element={<About />} />
      <Route path="course-grid" element={<CourseGrid />} />
      <Route path="course-list" element={<CourseList />} />
      <Route path="course-details" element={<CourseDetails />} />
      <Route path="faq" element={<Faq />} />
      <Route path="contact" element={<Contact />} />
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );
}

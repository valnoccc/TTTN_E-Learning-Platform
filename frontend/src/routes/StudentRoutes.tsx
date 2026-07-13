import { Navigate, Route, Routes } from 'react-router-dom';
import HomeTwo from '../features/student-portal/HomeTwo';
import About from '../features/student-portal/pages/about/About';
import CourseGrid from '../features/student-portal/pages/courses/CourseGrid';
import CourseList from '../features/student-portal/pages/courses/CourseList';
import CourseDetails from '../features/student-portal/pages/courses/CourseDetails';
import CourseLearning from '../features/student-portal/pages/courses/CourseLearning';
import MyCourses from '../features/student-portal/pages/courses/MyCourses';
import Faq from '../features/student-portal/pages/faq/Faq';
import Contact from '../features/student-portal/pages/contact/Contact';
import StudentProfile from '../features/student-portal/pages/account/StudentProfile';
import Cart from '../features/student-portal/pages/shop/Cart';
import Wishlist from '../features/student-portal/pages/shop/Wishlist';
import CheckoutSuccess from '../features/student-portal/pages/checkout/CheckoutSuccess';

export default function StudentRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeTwo />} />
      <Route path="home-two" element={<HomeTwo />} />
      <Route path="about" element={<About />} />
      <Route path="course-grid" element={<CourseGrid />} />
      <Route path="course-list" element={<CourseList />} />
      <Route path="course-details/:id" element={<CourseDetails />} />
      <Route path="courses/:id" element={<CourseDetails />} />
      <Route path="my-courses" element={<MyCourses />} />
      <Route path="learn/:id" element={<CourseLearning />} />
      <Route path="faq" element={<Faq />} />
      <Route path="contact" element={<Contact />} />
      <Route path="profile" element={<StudentProfile />} />
      <Route path="cart" element={<Cart />} />
      <Route path="wishlist" element={<Wishlist />} />
      <Route path="checkout/success" element={<CheckoutSuccess />} />
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );
}

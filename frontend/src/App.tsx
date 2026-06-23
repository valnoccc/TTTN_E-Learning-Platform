import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './features/student-portal/helper/ScrollToTop';

import RoleBasedRoute from './components/RoleBasedRoute';
import AdminRoutes from './routes/AdminRoutes';
import InstructorRoutes from './routes/InstructorRoutes';
import StudentRoutes from './routes/StudentRoutes';
import HomeTwo from './features/student-portal/HomeTwo';
import About from './features/student-portal/pages/about/About';
import CourseGrid from './features/student-portal/pages/courses/CourseGrid';
import CourseList from './features/student-portal/pages/courses/CourseList';
import CourseDetails from './features/student-portal/pages/courses/CourseDetails';
import Faq from './features/student-portal/pages/faq/Faq';
import Contact from './features/student-portal/pages/contact/Contact';
import Instructors from './features/student-portal/pages/instructor/Instructors';
import InstructorDetails from './features/student-portal/pages/instructor/InstructorDetails';
import Checkout from './features/student-portal/pages/checkout/Checkout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import BlogGrid from './features/student-portal/pages/blog/BlogGrid';
import BlogDetails from './features/student-portal/pages/blog/BlogDetails';

import StudentLayout from './features/student-portal/components/StudentLayout';

function AnimatedRoutes() {
  return (
    <Routes>
      {/* Student/Public Routes with Persistent Layout */}
      <Route element={<StudentLayout />}>
        <Route path="/" element={<HomeTwo />} />
        <Route path="/home-two" element={<HomeTwo />} />
        <Route path="/about" element={<About />} />
        <Route path="/course-grid" element={<CourseGrid />} />
        <Route path="/course-list" element={<CourseList />} />
        <Route path="/course-details/:id" element={<CourseDetails />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/instructors" element={<Instructors />} />
        <Route path="/instructor-details/:id" element={<InstructorDetails />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/:courseId" element={<Checkout />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/registration" element={<RegisterPage />} />
        <Route path="/blog-grid" element={<BlogGrid />} />
        <Route path="/blog/:slug" element={<BlogDetails />} />
        <Route path="/student/*" element={<StudentRoutes />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <RoleBasedRoute allowedRoles={['ADMIN']}>
            <AdminRoutes />
          </RoleBasedRoute>
        }
      />

      {/* Instructor Routes */}
      <Route
        path="/instructor/*"
        element={
          <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
            <InstructorRoutes />
          </RoleBasedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="top-right"
        containerStyle={{ top: '80px', zIndex: 999999 }}
        toastOptions={{ duration: 3000, style: { fontSize: '14px', borderRadius: '8px' } }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;

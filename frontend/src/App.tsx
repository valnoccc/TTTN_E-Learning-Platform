import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import ScrollToTop from './features/student-portal/helper/ScrollToTop';
import PageTransition from './components/PageTransition';

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

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomeTwo /></PageTransition>} />
        <Route path="/home-two" element={<PageTransition><HomeTwo /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/course-grid" element={<PageTransition><CourseGrid /></PageTransition>} />
        <Route path="/course-list" element={<PageTransition><CourseList /></PageTransition>} />
        <Route path="/course-details" element={<PageTransition><CourseDetails /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><Faq /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/instructors" element={<PageTransition><Instructors /></PageTransition>} />
        <Route path="/instructor-details" element={<PageTransition><InstructorDetails /></PageTransition>} />
        <Route path="/checkout/:courseId" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/registration" element={<PageTransition><RegisterPage /></PageTransition>} />

        <Route
          path="/admin/*"
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <AdminRoutes />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/instructor/*"
          element={
            <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
              <InstructorRoutes />
            </RoleBasedRoute>
          }
        />

        <Route path="/student/*" element={<PageTransition><StudentRoutes /></PageTransition>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="top-center"
        toastOptions={{ duration: 3000, style: { fontSize: '14px', borderRadius: '8px' } }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;

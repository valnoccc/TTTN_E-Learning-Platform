import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

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
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{ duration: 3000, style: { fontSize: '14px', borderRadius: '8px' } }}
      />

      <Routes>
        <Route path="/" element={<HomeTwo />} />
        <Route path="/home-two" element={<HomeTwo />} />
        <Route path="/about" element={<About />} />
        <Route path="/course-grid" element={<CourseGrid />} />
        <Route path="/course-list" element={<CourseList />} />
        <Route path="/course-details" element={<CourseDetails />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/registration" element={<RegisterPage />} />

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
            <RoleBasedRoute allowedRoles={['GIANG_VIEN']}>
              <InstructorRoutes />
            </RoleBasedRoute>
          }
        />

        <Route path="/student/*" element={<StudentRoutes />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

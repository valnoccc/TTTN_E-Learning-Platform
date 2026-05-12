import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout & Pages công khai
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/HomePage';

// Route Modules
import RoleBasedRoute from './components/RoleBasedRoute'; // Giả định bạn đã tách RoleBasedRoute ra file riêng
import AdminRoutes from './routes/AdminRoutes';
import InstructorRoutes from './routes/InstructorRoutes';
import StudentRoutes from './routes/StudentRoutes';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { fontSize: '14px', borderRadius: '8px' } }} />

      <Routes>
        {/* ROUTES CÔNG KHAI */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ADMIN MODULE (Quản trị viên) */}
        <Route path="/admin/*" element={
          <RoleBasedRoute allowedRoles={['ADMIN']}>
            <AdminRoutes />
          </RoleBasedRoute>
        } />

        {/* INSTRUCTOR MODULE (Giảng viên) */}
        <Route path="/instructor/*" element={
          <RoleBasedRoute allowedRoles={['GIANG_VIEN']}>
            <InstructorRoutes />
          </RoleBasedRoute>
        } />

        {/* STUDENT MODULE (Học viên) */}
        <Route path="/student/*" element={
          <RoleBasedRoute allowedRoles={['HOC_VIEN']}>
            <StudentRoutes />
          </RoleBasedRoute>
        } />

        {/* Xử lý các đường dẫn không tồn tại */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
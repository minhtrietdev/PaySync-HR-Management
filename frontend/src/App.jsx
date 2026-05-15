import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Department';
import Payroll from './pages/Payroll';

// Component Bảo vệ (Gác cổng)
const ProtectedRoute = ({ allowedRoles }) => {
  const userStr = localStorage.getItem('user');
  
  // 1. Chưa đăng nhập -> Đá ra trang login
  if (!userStr) return <Navigate to="/login" replace />;

  const user = JSON.parse(userStr);
  
  // 2. Đã đăng nhập nhưng đi nhầm phòng (Sai quyền)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'Employee') {
      // Nhân viên quèn đi lạc -> Dẫn về phòng xem lương của chính họ
      return <Navigate to={`/payroll/${user.id}`} replace />;
    }
    // Các trường hợp khác -> Trục xuất ra login
    return <Navigate to="/login" replace />;
  }

  // 3. Đúng người, đúng tội -> Cho qua
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Chỉ ai đăng nhập mới được vào khu vực MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            
            {/* Vùng dành riêng cho Admin và Manager */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/payroll" element={<Payroll />} /> {/* Bảng lương tổng */}
            </Route>

            {/* Employee chỉ được vào đường dẫn có đúng ID của mình */}
            <Route path="/payroll/:id" element={<Payroll />} />
            
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
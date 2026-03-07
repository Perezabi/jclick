import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/Dashboard';  // Your existing super dashboard
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || !allowedRoles.includes(role)) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['super']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/teacher-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['teacher', 'super']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/student-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['student', 'super']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

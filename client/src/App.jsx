import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TimerProvider } from './contexts/TimerContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TimerPage from './pages/TimerPage';
import TimeEntries from './pages/TimeEntries';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import AdminDashboard from './pages/admin/AdminDashboard';
import Reports from './pages/admin/Reports';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/admin/Settings';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="text-dark-400">טוען...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/timer" element={
        <ProtectedRoute><Layout><TimerPage /></Layout></ProtectedRoute>
      } />
      <Route path="/time-entries" element={
        <ProtectedRoute><Layout><TimeEntries /></Layout></ProtectedRoute>
      } />
      <Route path="/time-entries/new" element={
        <ProtectedRoute><Layout><TimeEntries /></Layout></ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={['manager','admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute roles={['manager','admin']}><Layout><Reports /></Layout></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute roles={['manager','admin']}><Layout><UserManagement /></Layout></ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute roles={['admin']}><Layout><Settings /></Layout></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TimerProvider>
          <AppRoutes />
          <Toaster
            position="bottom-left"
            toastOptions={{
              style: { background: '#1e2d42', color: '#e2e8f0', border: '1px solid #2a3f5c' },
              success: { iconTheme: { primary: '#34d399', secondary: '#1e2d42' } },
              error: { iconTheme: { primary: '#f87171', secondary: '#1e2d42' } },
            }}
          />
        </TimerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

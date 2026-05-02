import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TimerProvider } from './contexts/TimerContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Layout from './components/Layout';
import AnimatedPage from './components/AnimatedPage';
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
        <span className="text-sm font-medium">טוען...</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function page(Component) {
  return (
    <AnimatedPage>
      <Component />
    </AnimatedPage>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Layout>{page(Dashboard)}</Layout></ProtectedRoute>
        } />
        <Route path="/timer" element={
          <ProtectedRoute><Layout>{page(TimerPage)}</Layout></ProtectedRoute>
        } />
        <Route path="/time-entries" element={
          <ProtectedRoute><Layout>{page(TimeEntries)}</Layout></ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute><Layout>{page(Projects)}</Layout></ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute><Layout>{page(Tasks)}</Layout></ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['manager','admin']}><Layout>{page(AdminDashboard)}</Layout></ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute roles={['manager','admin']}><Layout>{page(Reports)}</Layout></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['manager','admin']}><Layout>{page(UserManagement)}</Layout></ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute roles={['admin']}><Layout>{page(Settings)}</Layout></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AnimatePresence>
  );
}

function ToasterWithTheme() {
  const { dark } = useTheme();
  return (
    <Toaster
      position="bottom-left"
      toastOptions={{
        style: {
          background: dark ? '#1e293b' : '#ffffff',
          color: dark ? '#f1f5f9' : '#334155',
          border: `1px solid ${dark ? '#2d3f55' : '#e2e8f0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          fontFamily: 'system-ui, sans-serif',
        },
        success: { iconTheme: { primary: '#16a34a', secondary: dark ? '#1e293b' : '#ffffff' } },
        error: { iconTheme: { primary: '#dc2626', secondary: dark ? '#1e293b' : '#ffffff' } },
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TimerProvider>
            <AppRoutes />
            <ToasterWithTheme />
          </TimerProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

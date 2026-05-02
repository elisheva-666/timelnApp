import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../contexts/TimerContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard, Clock, ListChecks, FolderKanban,
  Users, BarChart3, Settings, LogOut, Timer, Layers, Menu, X, Sun, Moon
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { activeTimer, elapsed, formatElapsed } = useTimer();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const closeSidebar = () => setSidebarOpen(false);
  const roleLabel = user?.role === 'admin' ? 'אדמין' : user?.role === 'manager' ? 'מנהל' : 'עובד';

  const navLink = (to, Icon, label) => (
    <NavLink to={to} onClick={closeSidebar}
      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
      <Icon size={17} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-page)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 right-0 z-50
        w-64 flex-shrink-0 flex flex-col
        transition-transform duration-300 ease-out md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `} style={{ background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border-div)' }}>

        {/* Logo */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-div)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              <Clock size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-none tracking-tight" style={{ color: 'var(--text-h)', margin: 0 }}>
                TimeIn
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
                ניהול שעות עבודה
              </p>
            </div>
          </div>
          <button onClick={closeSidebar}
            className="md:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-div)' }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              {user?.full_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight"
                style={{ color: 'var(--text-h)', letterSpacing: '-0.01em' }}>
                {user?.full_name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{roleLabel}</p>
            </div>
            {/* Dark mode toggle */}
            <button onClick={toggle}
              className="p-1.5 rounded-lg transition-all flex-shrink-0"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}
              title={dark ? 'מצב יום' : 'מצב לילה'}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Active Timer */}
        {activeTimer && (
          <div className="mx-4 mt-4 p-3.5 rounded-xl timer-active"
            style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Timer size={13} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">טיימר פעיל</span>
              </div>
            </div>
            <p className="font-mono text-lg font-bold text-green-700 leading-none">{formatElapsed(elapsed)}</p>
            <p className="text-xs text-green-600 mt-0.5 truncate">{activeTimer.project_name}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navLink('/dashboard', LayoutDashboard, 'דשבורד')}
          {navLink('/timer', Timer, 'טיימר')}
          {navLink('/time-entries', Clock, 'דיווחי שעות')}
          {navLink('/tasks', ListChecks, 'משימות')}
          {navLink('/projects', FolderKanban, 'פרויקטים')}

          {isManager && (
            <>
              <div className="pt-5 pb-2">
                <p className="section-label">ניהול</p>
              </div>
              {navLink('/admin/dashboard', Layers, 'סקירה ניהולית')}
              {navLink('/admin/reports', BarChart3, 'דוחות')}
              {navLink('/admin/users', Users, 'עובדים')}
            </>
          )}

          {isAdmin && navLink('/admin/settings', Settings, 'הגדרות')}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--border-div)', paddingTop: '0.75rem' }}>
          <button onClick={handleLogout}
            className="sidebar-link w-full"
            style={{ color: '#ef4444' }}>
            <LogOut size={17} /> <span>התנתק</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">

        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-div)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              <Clock size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-tight" style={{ color: 'var(--text-h)' }}>TimeIn</span>
          </div>
          <div className="flex items-center gap-2">
            {activeTimer && (
              <span className="font-mono text-green-600 text-sm font-bold">{formatElapsed(elapsed)}</span>
            )}
            <button onClick={toggle}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              <Menu size={20} />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

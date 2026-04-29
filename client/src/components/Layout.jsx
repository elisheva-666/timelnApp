import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../contexts/TimerContext';
import {
  LayoutDashboard, Clock, ListChecks, FolderKanban,
  Users, BarChart3, Settings, LogOut, Timer, Layers, Menu, X
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { activeTimer, elapsed, formatElapsed } = useTimer();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const closeSidebar = () => setSidebarOpen(false);

  const navLink = (to, Icon, label) => (
    <NavLink to={to} onClick={closeSidebar} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
      <Icon size={18} /> {label}
    </NavLink>
  );

  return (
    <div className="flex min-h-screen bg-dark-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 right-0 z-50
        w-64 flex-shrink-0 bg-white border-l border-dark-700 flex flex-col
        transition-transform duration-300 md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm shadow-brand-600/30">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-dark-50 font-bold text-lg leading-none">TimeIn</h1>
              <p className="text-dark-500 text-xs">ניהול שעות עבודה</p>
            </div>
          </div>
          <button onClick={closeSidebar} className="md:hidden p-1 text-dark-400 hover:text-dark-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-600 font-bold text-sm">{user?.full_name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-dark-50 text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-dark-500 text-xs">
                {user?.role === 'admin' ? 'אדמין' : user?.role === 'manager' ? 'מנהל' : 'עובד'}
              </p>
            </div>
          </div>
        </div>

        {/* Active Timer indicator */}
        {activeTimer && (
          <div className="mx-3 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg timer-active">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-green-600" />
              <span className="text-green-700 text-xs font-medium">טיימר פעיל</span>
            </div>
            <p className="text-green-700 font-mono text-base font-bold mt-1">{formatElapsed(elapsed)}</p>
            <p className="text-green-600/70 text-xs truncate">{activeTimer.project_name}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
          {navLink('/dashboard', LayoutDashboard, 'דשבורד')}
          {navLink('/timer', Timer, 'טיימר')}
          {navLink('/time-entries', Clock, 'דיווחי שעות')}
          {navLink('/tasks', ListChecks, 'משימות')}
          {navLink('/projects', FolderKanban, 'פרויקטים')}

          {isManager && (
            <>
              <div className="pt-4 pb-1">
                <p className="text-dark-500 text-xs font-semibold px-4 uppercase tracking-wider">ניהול</p>
              </div>
              {navLink('/admin/dashboard', Layers, 'סקירה ניהולית')}
              {navLink('/admin/reports', BarChart3, 'דוחות')}
              {navLink('/admin/users', Users, 'עובדים')}
            </>
          )}

          {isAdmin && navLink('/admin/settings', Settings, 'הגדרות')}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-dark-700">
          <button onClick={handleLogout}
            className="sidebar-link w-full text-red-500 hover:text-red-700 hover:bg-red-50">
            <LogOut size={18} /> התנתק
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-dark-700 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Clock size={16} className="text-white" />
            </div>
            <span className="font-bold text-dark-50 text-lg">TimeIn</span>
          </div>
          {activeTimer && (
            <span className="font-mono text-green-600 text-sm font-bold">{formatElapsed(elapsed)}</span>
          )}
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-900 rounded-lg transition-colors">
            <Menu size={20} />
          </button>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

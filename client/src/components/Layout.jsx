import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../contexts/TimerContext';
import {
  LayoutDashboard, Clock, ListChecks, FolderKanban,
  Users, BarChart3, Settings, LogOut, Timer, Layers
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { activeTimer, elapsed, formatElapsed } = useTimer();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex min-h-screen bg-dark-950">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-dark-900 border-l border-dark-700 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">TimeIn</h1>
              <p className="text-dark-400 text-xs">ניהול שעות עבודה</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
              <span className="text-brand-400 font-semibold text-sm">{user?.full_name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-dark-400 text-xs">{user?.role === 'admin' ? 'אדמין' : user?.role === 'manager' ? 'מנהל' : 'עובד'}</p>
            </div>
          </div>
        </div>

        {/* Active Timer indicator */}
        {activeTimer && (
          <div className="mx-3 mt-3 p-3 bg-green-900/30 border border-green-600/40 rounded-lg timer-active">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-green-400" />
              <span className="text-green-300 text-xs font-medium">טיימר פעיל</span>
            </div>
            <p className="text-green-400 font-mono text-base font-bold mt-1">{formatElapsed(elapsed)}</p>
            <p className="text-green-500/70 text-xs truncate">{activeTimer.project_name}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> דשבורד
          </NavLink>
          <NavLink to="/timer" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Timer size={18} /> טיימר
          </NavLink>
          <NavLink to="/time-entries" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Clock size={18} /> דיווחי שעות
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ListChecks size={18} /> משימות
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FolderKanban size={18} /> פרויקטים
          </NavLink>

          {isManager && (
            <>
              <div className="pt-3 pb-1">
                <p className="text-dark-500 text-xs font-medium px-4 uppercase tracking-wide">ניהול</p>
              </div>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Layers size={18} /> סקירה ניהולית
              </NavLink>
              <NavLink to="/admin/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <BarChart3 size={18} /> דוחות
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Users size={18} /> עובדים
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <NavLink to="/admin/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Settings size={18} /> הגדרות
              </NavLink>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-dark-700">
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <LogOut size={18} /> התנתק
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

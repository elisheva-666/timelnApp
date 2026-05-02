import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, Calendar, FolderOpen, Timer, Plus, ChevronLeft } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../contexts/TimerContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatMinutes } from '../utils/format';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  return 'ערב טוב';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { activeTimer, elapsed, formatElapsed, stopTimer, pauseTimer, resumeTimer } = useTimer();
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/my-summary').then(r => setSummary(r.data)).catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString('he-IL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-6">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl px-6 py-6 md:px-8 md:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #3b82f6 100%)', boxShadow: '0 8px 32px rgba(37,99,235,0.25)' }}>
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-5" style={{ background: 'white' }} />
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-white text-2xl md:text-3xl font-extrabold leading-tight"
            style={{ letterSpacing: '-0.03em', textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
            {getGreeting()}, {user?.full_name?.split(' ')[0]}
          </h1>
        </div>
        <button onClick={() => navigate('/time-entries?new=1')}
          className="relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}>
          <Plus size={16} strokeWidth={2.5} /> דיווח חדש
        </button>
      </div>

      {/* Active Timer */}
      {activeTimer && (
        <div className="p-5 rounded-2xl timer-active"
          style={{ background: '#f0fdf4', border: '1.5px solid #86efac', boxShadow: '0 2px 12px rgba(22,163,74,0.1)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: '#dcfce7' }}>
                <Timer size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-800" style={{ letterSpacing: '-0.01em' }}>
                  {activeTimer.project_name}
                </p>
                {activeTimer.task_name && (
                  <p className="text-sm text-green-600">{activeTimer.task_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-extrabold text-green-700"
                style={{ letterSpacing: '-0.02em' }}>
                {formatElapsed(elapsed)}
              </span>
              <button
                onClick={() => activeTimer.paused_at ? resumeTimer() : pauseTimer()}
                className="btn-secondary text-sm py-1.5 px-3.5">
                {activeTimer.paused_at ? '▶ המשך' : '⏸ השהה'}
              </button>
              <button
                onClick={() => stopTimer().then(() => window.location.reload())}
                className="btn-danger text-sm py-1.5 px-3.5">
                ⏹ עצור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="שעות היום" value={formatMinutes(summary?.today_minutes)} icon={Clock} color="brand" />
        <StatCard title="שעות השבוע" value={formatMinutes(summary?.week_minutes)} icon={TrendingUp} color="green" />
        <StatCard title="שעות החודש" value={formatMinutes(summary?.month_minutes)} icon={Calendar} color="purple" />
        <StatCard title="פרויקטים פעילים" value={summary?.by_project?.length ?? 0} icon={FolderOpen} color="yellow" />
      </div>

      {/* Lower cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* By Project */}
        <div className="card">
          <h3 className="font-bold text-dark-50 mb-5" style={{ letterSpacing: '-0.02em' }}>
            שעות לפי פרויקט
            <span className="text-xs font-medium text-dark-500 mr-2">החודש</span>
          </h3>
          {summary?.by_project?.length > 0 ? (
            <div className="space-y-4">
              {summary.by_project.map((p, i) => {
                const max = summary.by_project[0].total_minutes;
                const pct = max > 0 ? (p.total_minutes / max) * 100 : 0;
                const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];
                const barColor = colors[i % colors.length];
                return (
                  <div key={p.project_name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-dark-200" style={{ letterSpacing: '-0.01em' }}>
                        {p.project_name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: barColor, letterSpacing: '-0.02em' }}>
                        {formatMinutes(p.total_minutes)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-dark-500 py-6 text-center">אין נתונים לחודש זה</p>
          )}
        </div>

        {/* Recent Entries */}
        <div className="card">
          <h3 className="font-bold text-dark-50 mb-5" style={{ letterSpacing: '-0.02em' }}>
            דיווחים אחרונים
          </h3>
          {summary?.recent_entries?.length > 0 ? (
            <div>
              {summary.recent_entries.slice(0, 6).map(e => (
                <div key={e.id} className="flex items-center justify-between py-3"
                  style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-semibold text-dark-100 truncate" style={{ letterSpacing: '-0.01em' }}>
                      {e.project_name}
                    </p>
                    <p className="text-xs mt-0.5 text-dark-500 truncate">
                      {e.task_name || e.description || '—'} · {formatDate(e.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-sm font-bold"
                      style={{ color: '#2563eb', letterSpacing: '-0.02em' }}>
                      {formatMinutes(e.duration_minutes)}
                    </span>
                    <StatusBadge status={e.status} />
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('/time-entries')}
                className="mt-4 flex items-center gap-1 text-sm font-semibold transition-colors"
                style={{ color: '#2563eb', letterSpacing: '-0.01em' }}
                onMouseEnter={e => e.currentTarget.style.color = '#1d4ed8'}
                onMouseLeave={e => e.currentTarget.style.color = '#2563eb'}>
                <ChevronLeft size={15} /> כל הדיווחים
              </button>
            </div>
          ) : (
            <p className="text-sm text-dark-500 py-6 text-center">אין דיווחים עדיין</p>
          )}
        </div>
      </div>
    </div>
  );
}

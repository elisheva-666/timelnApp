import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, Calendar, FolderOpen, Timer, Plus } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../contexts/TimerContext';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatMinutes } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeTimer, elapsed, formatElapsed, stopTimer, pauseTimer, resumeTimer } = useTimer();
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/my-summary').then(r => setSummary(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader
        title={`שלום, ${user?.full_name}`}
        subtitle={new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={
          <button onClick={() => navigate('/time-entries?new=1')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> דיווח חדש
          </button>
        }
      />

      {/* Active Timer */}
      {activeTimer && (
        <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-xl timer-active">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Timer size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-green-800 font-semibold">{activeTimer.project_name}</p>
                {activeTimer.task_name && <p className="text-green-600 text-sm">{activeTimer.task_name}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-green-700">{formatElapsed(elapsed)}</span>
              <button
                onClick={() => activeTimer.paused_at ? resumeTimer() : pauseTimer()}
                className="btn-secondary text-sm py-1.5 px-3">
                {activeTimer.paused_at ? '▶ המשך' : '⏸ השהה'}
              </button>
              <button
                onClick={() => stopTimer().then(() => window.location.reload())}
                className="btn-danger text-sm py-1.5 px-3">
                ⏹ עצור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="שעות היום" value={formatMinutes(summary?.today_minutes)} icon={Clock} color="brand" />
        <StatCard title="שעות השבוע" value={formatMinutes(summary?.week_minutes)} icon={TrendingUp} color="green" />
        <StatCard title="שעות החודש" value={formatMinutes(summary?.month_minutes)} icon={Calendar} color="purple" />
        <StatCard title="פרויקטים פעילים" value={summary?.by_project?.length ?? 0} icon={FolderOpen} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Project */}
        <div className="card">
          <h3 className="text-dark-50 font-semibold mb-4">שעות לפי פרויקט (חודש)</h3>
          {summary?.by_project?.length > 0 ? (
            <div className="space-y-3">
              {summary.by_project.map(p => {
                const max = summary.by_project[0].total_minutes;
                const pct = max > 0 ? (p.total_minutes / max) * 100 : 0;
                return (
                  <div key={p.project_name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-dark-200 font-medium">{p.project_name}</span>
                      <span className="text-dark-400">{formatMinutes(p.total_minutes)}</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-dark-500 text-sm">אין נתונים לחודש זה</p>}
        </div>

        {/* Recent Entries */}
        <div className="card">
          <h3 className="text-dark-50 font-semibold mb-4">דיווחים אחרונים</h3>
          {summary?.recent_entries?.length > 0 ? (
            <div className="space-y-1">
              {summary.recent_entries.slice(0, 6).map(e => (
                <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-dark-700 last:border-0">
                  <div>
                    <p className="text-dark-100 text-sm font-medium">{e.project_name}</p>
                    <p className="text-dark-500 text-xs">{e.task_name || e.description || '—'} · {formatDate(e.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-brand-600 font-mono text-sm font-semibold">{formatMinutes(e.duration_minutes)}</span>
                    <StatusBadge status={e.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-dark-500 text-sm">אין דיווחים עדיין</p>}
          <button onClick={() => navigate('/time-entries')}
            className="mt-3 text-brand-600 text-sm hover:text-brand-700 font-medium transition-colors">
            ← כל הדיווחים
          </button>
        </div>
      </div>
    </div>
  );
}

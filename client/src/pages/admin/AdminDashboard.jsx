import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, FolderOpen, Clock, TrendingUp, Timer, Wifi, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { formatMinutes, monthStartStr, todayStr } from '../../utils/format';

const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];

function parseUtc(str) {
  if (!str) return new Date();
  if (str.includes('Z') || str.includes('+')) return new Date(str);
  return new Date(str.replace(' ', 'T') + 'Z');
}

function elapsed(startedAt, pausedDuration = 0) {
  const ms = Date.now() - parseUtc(startedAt).getTime() - pausedDuration * 60000;
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// Live Team Pulse component
function LivePulse() {
  const [timers, setTimers] = useState([]);
  const [tick, setTick] = useState(0);
  const [online, setOnline] = useState(true);
  const intervalRef = useRef(null);

  const fetchTimers = useCallback(async () => {
    try {
      const { data } = await api.get('/time-entries/timer/all');
      setTimers(data);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchTimers();
    const poll = setInterval(fetchTimers, 30000);
    const clock = setInterval(() => setTick(t => t + 1), 1000);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, [fetchTimers]);

  const initials = name => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#be185d'];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold" style={{ color: 'var(--text-h)', margin: 0, letterSpacing: '-0.02em' }}>
            Live Team Pulse
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>מתעדכן כל 30 שניות</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={online
              ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }
              : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? 'LIVE' : 'Offline'}
          </div>
          {timers.length > 0 && (
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              {timers.length} עובד{timers.length !== 1 ? 'ים' : ''} פעיל{timers.length !== 1 ? 'ים' : ''}
            </span>
          )}
        </div>
      </div>

      {timers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)' }}>
            <Timer size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            אף עובד לא עובד כרגע
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {timers.map((t, i) => (
            <div key={t.id || t.user_id}
              className="flex items-center gap-3 p-3 rounded-xl timer-active"
              style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                style={{ background: avatarColors[i % avatarColors.length] }}>
                {initials(t.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800 truncate" style={{ letterSpacing: '-0.01em' }}>
                  {t.full_name}
                </p>
                <p className="text-xs text-green-600 truncate">
                  {t.project_name}{t.task_name ? ` · ${t.task_name}` : ''}
                </p>
              </div>
              <div className="text-center flex-shrink-0">
                <p className="font-mono font-bold text-green-700 text-base leading-none" style={{ letterSpacing: '-0.03em' }}>
                  {elapsed(t.started_at, t.paused_duration_minutes)}
                </p>
                {t.paused_at && (
                  <p className="text-xs text-amber-600 mt-0.5">מושהה</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [filters, setFilters] = useState({ date_from: monthStartStr(), date_to: todayStr() });

  const fetchOverview = useCallback(async () => {
    const params = new URLSearchParams(filters);
    const { data } = await api.get(`/reports/overview?${params}`);
    setOverview(data);
  }, [filters]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const userChartData = (overview?.by_user || [])
    .filter(u => u.total_minutes > 0)
    .slice(0, 8)
    .map(u => ({ name: u.full_name.split(' ')[0], minutes: u.total_minutes }));

  const projChartData = (overview?.by_project || [])
    .filter(p => p.total_minutes > 0)
    .slice(0, 6)
    .map(p => ({ name: p.project_name.length > 12 ? p.project_name.slice(0, 12) + '…' : p.project_name, minutes: p.total_minutes }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <PageHeader title="סקירה ניהולית" subtitle="ניהול שעות עבודה לכל הצוות" />
        <div className="flex gap-3 items-end pb-7">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>מתאריך</label>
            <input type="date" value={filters.date_from}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
              className="input-field text-sm w-36" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>עד תאריך</label>
            <input type="date" value={filters.date_to}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
              className="input-field text-sm w-36" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="סה״כ שעות" value={formatMinutes(overview?.total_minutes)} icon={Clock} color="brand" />
        <StatCard title="עובדים פעילים" value={overview?.by_user?.filter(u => u.total_minutes > 0).length ?? 0} icon={Users} color="green" />
        <StatCard title="פרויקטים" value={overview?.by_project?.filter(p => p.total_minutes > 0).length ?? 0} icon={FolderOpen} color="yellow" />
        <StatCard title="ממוצע לעובד" value={formatMinutes(
          overview?.by_user?.filter(u => u.total_minutes > 0).length
            ? Math.round((overview.total_minutes || 0) / overview.by_user.filter(u => u.total_minutes > 0).length)
            : 0
        )} icon={TrendingUp} color="purple" />
      </div>

      {/* Live Pulse + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <LivePulse />

        {/* Bar: users */}
        <div className="card">
          <h3 className="font-bold mb-4" style={{ color: 'var(--text-h)', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
            שעות לפי עובד
          </h3>
          {userChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userChartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${(v/60).toFixed(0)}h`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => formatMinutes(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="minutes" radius={[5, 5, 0, 0]}>
                  {userChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין נתונים</p>}
        </div>

        {/* Bar: projects */}
        <div className="card">
          <h3 className="font-bold mb-4" style={{ color: 'var(--text-h)', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
            שעות לפי פרויקט
          </h3>
          {projChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={projChartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${(v/60).toFixed(0)}h`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => formatMinutes(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="minutes" radius={[5, 5, 0, 0]}>
                  {projChartData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין נתונים</p>}
        </div>
      </div>

      {/* Detailed tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold mb-4" style={{ color: 'var(--text-h)', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
            פירוט לפי עובד
          </h3>
          <div className="space-y-3">
            {overview?.by_user?.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>אין נתונים</p>}
            {overview?.by_user?.map((u, i) => {
              const max = overview.by_user[0]?.total_minutes || 1;
              return (
                <div key={u.id}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: 'var(--text-h)' }}>{u.full_name}</span>
                      {u.team && <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>{u.team}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.entry_count} דיווחים</span>
                      <span className="font-mono font-bold" style={{ color: COLORS[i % COLORS.length] }}>{formatMinutes(u.total_minutes)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(u.total_minutes / max) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold mb-4" style={{ color: 'var(--text-h)', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
            פירוט לפי פרויקט
          </h3>
          <div className="space-y-3">
            {overview?.by_project?.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>אין נתונים</p>}
            {overview?.by_project?.map((p, i) => {
              const max = overview.by_project[0]?.total_minutes || 1;
              const color = COLORS[(i + 2) % COLORS.length];
              return (
                <div key={p.id}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: 'var(--text-h)' }}>{p.project_name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.user_count} עובדים</span>
                    </div>
                    <span className="font-mono font-bold" style={{ color }}>{formatMinutes(p.total_minutes)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(p.total_minutes / max) * 100}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

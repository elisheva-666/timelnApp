import { useState, useEffect, useCallback } from 'react';
import { Users, FolderOpen, Clock, TrendingUp } from 'lucide-react';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { formatMinutes, monthStartStr, todayStr } from '../../utils/format';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [filters, setFilters] = useState({ date_from: monthStartStr(), date_to: todayStr() });

  const fetchOverview = useCallback(async () => {
    const params = new URLSearchParams(filters);
    const { data } = await api.get(`/reports/overview?${params}`);
    setOverview(data);
  }, [filters]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  return (
    <div>
      <PageHeader title="סקירה ניהולית" subtitle="סיכום שעות לכל הצוות" />

      {/* Date Filter */}
      <div className="card mb-6 flex items-center gap-4">
        <div>
          <label className="block text-xs text-dark-400 mb-1">מתאריך</label>
          <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} className="input-field text-sm w-36" />
        </div>
        <div>
          <label className="block text-xs text-dark-400 mb-1">עד תאריך</label>
          <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} className="input-field text-sm w-36" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="סה״כ שעות" value={formatMinutes(overview?.total_minutes)} icon={Clock} color="brand" />
        <StatCard title="עובדים פעילים" value={overview?.by_user?.filter(u => u.total_minutes > 0).length ?? 0} icon={Users} color="green" />
        <StatCard title="פרויקטים" value={overview?.by_project?.filter(p => p.total_minutes > 0).length ?? 0} icon={FolderOpen} color="yellow" />
        <StatCard title="ממוצע לעובד" value={formatMinutes(
          overview?.by_user?.length ? Math.round((overview.total_minutes || 0) / Math.max(overview.by_user.filter(u => u.total_minutes > 0).length, 1)) : 0
        )} icon={TrendingUp} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By User */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">שעות לפי עובד</h3>
          <div className="space-y-3">
            {overview?.by_user?.length === 0 && <p className="text-dark-500 text-sm">אין נתונים</p>}
            {overview?.by_user?.map(u => {
              const max = overview.by_user[0]?.total_minutes || 1;
              return (
                <div key={u.id}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <div>
                      <span className="text-white">{u.full_name}</span>
                      {u.team && <span className="text-dark-500 text-xs mr-2">({u.team})</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-dark-500 text-xs">{u.entry_count} דיווחים</span>
                      <span className="text-brand-400 font-mono font-medium w-16 text-left">{formatMinutes(u.total_minutes)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-600 rounded-full" style={{ width: `${(u.total_minutes / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Project */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">שעות לפי פרויקט</h3>
          <div className="space-y-3">
            {overview?.by_project?.length === 0 && <p className="text-dark-500 text-sm">אין נתונים</p>}
            {overview?.by_project?.map(p => {
              const max = overview.by_project[0]?.total_minutes || 1;
              return (
                <div key={p.id}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <div>
                      <span className="text-white">{p.project_name}</span>
                      <span className="text-dark-500 text-xs mr-2">({p.user_count} עובדים)</span>
                    </div>
                    <span className="text-brand-400 font-mono font-medium w-16 text-left">{formatMinutes(p.total_minutes)}</span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(p.total_minutes / max) * 100}%` }} />
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

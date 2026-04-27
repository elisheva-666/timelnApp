import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import { formatDate, formatMinutes, monthStartStr, todayStr } from '../../utils/format';
import { Download, AlertTriangle } from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('user');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ date_from: monthStartStr(), date_to: todayStr(), user_id: '', project_id: '' });
  const [data, setData] = useState([]);
  const [projectBreakdown, setProjectBreakdown] = useState(null);
  const [anomalies, setAnomalies] = useState(null);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data));
    api.get('/projects').then(r => setProjects(r.data));
  }, []);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.user_id) params.set('user_id', filters.user_id);
    if (filters.project_id) params.set('project_id', filters.project_id);

    if (activeTab === 'user') {
      const { data: d } = await api.get(`/reports/by-user?${params}`);
      setData(d);
    } else if (activeTab === 'project') {
      const { data: d } = await api.get(`/reports/by-project?${params}`);
      setProjectBreakdown(d);
    } else if (activeTab === 'anomalies') {
      const { data: d } = await api.get(`/reports/anomalies?${params}`);
      setAnomalies(d);
    }
  }, [activeTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalMins = data.reduce((s, e) => s + e.duration_minutes, 0);

  const exportCSV = () => {
    const rows = [['תאריך', 'עובד', 'פרויקט', 'משימה', 'שעות', 'התחלה', 'סיום', 'תיאור']];
    data.forEach(e => rows.push([e.date, e.user_name, e.project_name, e.task_name || '', (e.duration_minutes / 60).toFixed(2), e.start_time || '', e.end_time || '', e.description || '']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'timeln-report.csv'; a.click();
  };

  const tabs = [
    { key: 'user', label: 'לפי עובד' },
    { key: 'project', label: 'לפי פרויקט' },
    { key: 'anomalies', label: 'חריגות' },
  ];

  return (
    <div>
      <PageHeader title="דוחות" subtitle="סיכום וניתוח שעות עבודה" />

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-dark-400 mb-1">מתאריך</label>
            <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} className="input-field text-sm w-36" />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">עד תאריך</label>
            <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} className="input-field text-sm w-36" />
          </div>
          {activeTab === 'user' && (
            <div>
              <label className="block text-xs text-dark-400 mb-1">עובד</label>
              <select value={filters.user_id} onChange={e => setFilters(f => ({ ...f, user_id: e.target.value }))} className="input-field text-sm w-44">
                <option value="">כל העובדים</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
          )}
          {activeTab !== 'user' && (
            <div>
              <label className="block text-xs text-dark-400 mb-1">פרויקט</label>
              <select value={filters.project_id} onChange={e => setFilters(f => ({ ...f, project_id: e.target.value }))} className="input-field text-sm w-44">
                <option value="">כל הפרויקטים</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-dark-800 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-dark-600 text-white shadow' : 'text-dark-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* User Report */}
      {activeTab === 'user' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-dark-700 bg-dark-900/50">
            <span className="text-dark-300 text-sm">{data.length} דיווחים · סה"כ {formatMinutes(totalMins)}</span>
            <button onClick={exportCSV} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
              <Download size={14} /> ייצוא CSV
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-right text-dark-400 font-medium px-5 py-3">תאריך</th>
                <th className="text-right text-dark-400 font-medium px-4 py-3">עובד</th>
                <th className="text-right text-dark-400 font-medium px-4 py-3">פרויקט</th>
                <th className="text-right text-dark-400 font-medium px-4 py-3">משימה</th>
                <th className="text-right text-dark-400 font-medium px-4 py-3">שעות</th>
                <th className="text-right text-dark-400 font-medium px-4 py-3">זמן</th>
                <th className="text-right text-dark-400 font-medium px-4 py-3">תיאור</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={7} className="text-center text-dark-500 py-12">אין נתונים</td></tr>
              )}
              {data.map((e, i) => (
                <tr key={i} className="table-row">
                  <td className="px-5 py-3 text-dark-300">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-white">{e.user_name}</td>
                  <td className="px-4 py-3 text-dark-200">{e.project_name}</td>
                  <td className="px-4 py-3 text-dark-400">{e.task_name || '—'}</td>
                  <td className="px-4 py-3 text-brand-400 font-mono font-medium">{formatMinutes(e.duration_minutes)}</td>
                  <td className="px-4 py-3 text-dark-500 font-mono text-xs">{e.start_time && e.end_time ? `${e.start_time}–${e.end_time}` : '—'}</td>
                  <td className="px-4 py-3 text-dark-400 max-w-xs truncate">{e.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Project Report */}
      {activeTab === 'project' && projectBreakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-white font-semibold mb-4">לפי משימה</h3>
            {projectBreakdown.task_breakdown.length === 0 ? <p className="text-dark-500 text-sm">אין נתונים</p> : (
              <div className="space-y-2">
                {projectBreakdown.task_breakdown.map((t, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-dark-700 last:border-0">
                    <div>
                      <p className="text-white text-sm">{t.task_name || 'ללא משימה'}</p>
                      <p className="text-dark-500 text-xs">{t.users} עובדים</p>
                    </div>
                    <span className="text-brand-400 font-mono text-sm font-medium">{formatMinutes(t.total_minutes)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h3 className="text-white font-semibold mb-4">לפי עובד</h3>
            {projectBreakdown.user_breakdown.length === 0 ? <p className="text-dark-500 text-sm">אין נתונים</p> : (
              <div className="space-y-2">
                {projectBreakdown.user_breakdown.map((u, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-dark-700 last:border-0">
                    <p className="text-white text-sm">{u.full_name}</p>
                    <span className="text-brand-400 font-mono text-sm font-medium">{formatMinutes(u.total_minutes)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {activeTab === 'anomalies' && anomalies && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-400" /> דיווחים ארוכים מ-10 שעות
            </h3>
            {anomalies.long_entries.length === 0 ? (
              <p className="text-dark-500 text-sm">✓ לא נמצאו חריגות</p>
            ) : (
              <div className="space-y-2">
                {anomalies.long_entries.map(e => (
                  <div key={e.id} className="flex justify-between items-center py-2 border-b border-dark-700 last:border-0">
                    <div>
                      <p className="text-white text-sm">{e.user_name} · {e.project_name}</p>
                      <p className="text-dark-500 text-xs">{formatDate(e.date)}</p>
                    </div>
                    <span className="text-red-400 font-mono text-sm font-medium">{formatMinutes(e.duration_minutes)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-400" /> ימים עם מעל 10 שעות לעובד
            </h3>
            {anomalies.heavy_days.length === 0 ? (
              <p className="text-dark-500 text-sm">✓ לא נמצאו חריגות</p>
            ) : (
              <div className="space-y-2">
                {anomalies.heavy_days.map((d, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-dark-700 last:border-0">
                    <div>
                      <p className="text-white text-sm">{d.full_name}</p>
                      <p className="text-dark-500 text-xs">{formatDate(d.date)}</p>
                    </div>
                    <span className="text-orange-400 font-mono text-sm font-medium">{formatMinutes(d.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

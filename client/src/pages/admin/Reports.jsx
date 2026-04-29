import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatMinutes, monthStartStr, todayStr } from '../../utils/format';
import { Download, AlertTriangle, ChevronDown, ChevronUp, Users, FolderOpen, X } from 'lucide-react';

// ─── Drill-down panel ────────────────────────────────────────────────────────
function DrillDown({ title, entries, onClose }) {
  const total = entries.reduce((s, e) => s + e.duration_minutes, 0);
  return (
    <div className="card border-brand-200 bg-brand-50/30 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-dark-50 font-semibold">{title}</h4>
          <p className="text-dark-400 text-xs mt-0.5">{entries.length} דיווחים · סה"כ {formatMinutes(total)}</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-dark-400 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-right text-dark-400 font-medium px-3 py-2">תאריך</th>
              {entries[0]?.user_name && <th className="text-right text-dark-400 font-medium px-3 py-2">עובד</th>}
              {entries[0]?.project_name && <th className="text-right text-dark-400 font-medium px-3 py-2">פרויקט</th>}
              <th className="text-right text-dark-400 font-medium px-3 py-2">משימה</th>
              <th className="text-right text-dark-400 font-medium px-3 py-2">שעות</th>
              <th className="text-right text-dark-400 font-medium px-3 py-2">זמן</th>
              <th className="text-right text-dark-400 font-medium px-3 py-2">תיאור</th>
              <th className="text-right text-dark-400 font-medium px-3 py-2">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id || i} className="table-row">
                <td className="px-3 py-2 text-dark-300">{formatDate(e.date)}</td>
                {e.user_name && <td className="px-3 py-2 text-dark-100 font-medium">{e.user_name}</td>}
                {e.project_name && <td className="px-3 py-2 text-dark-100 font-medium">{e.project_name}</td>}
                <td className="px-3 py-2 text-dark-400">{e.task_name || '—'}</td>
                <td className="px-3 py-2 text-brand-600 font-mono font-semibold">{formatMinutes(e.duration_minutes)}</td>
                <td className="px-3 py-2 text-dark-500 font-mono text-xs">
                  {e.start_time && e.end_time ? `${e.start_time}–${e.end_time}` : '—'}
                </td>
                <td className="px-3 py-2 text-dark-400 max-w-xs truncate">{e.description || '—'}</td>
                <td className="px-3 py-2"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Reports() {
  const [activeTab, setActiveTab] = useState('user');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ date_from: monthStartStr(), date_to: todayStr() });

  // by-user tab
  const [userSummary, setUserSummary] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDrill, setUserDrill] = useState(null);
  const [userDrillLoading, setUserDrillLoading] = useState(false);

  // by-project tab
  const [projectSummary, setProjectSummary] = useState([]);
  const [expandedProject, setExpandedProject] = useState(null);
  const [projectDrill, setProjectDrill] = useState(null);
  const [projectDrillLoading, setProjectDrillLoading] = useState(false);

  // anomalies tab
  const [anomalies, setAnomalies] = useState(null);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams(filters);
    setExpandedUser(null);
    setUserDrill(null);
    setExpandedProject(null);
    setProjectDrill(null);

    if (activeTab === 'user') {
      const { data } = await api.get(`/reports/overview?${params}`);
      setUserSummary(data.by_user || []);
    } else if (activeTab === 'project') {
      const { data } = await api.get(`/reports/overview?${params}`);
      setProjectSummary(data.by_project || []);
    } else if (activeTab === 'anomalies') {
      const { data } = await api.get(`/reports/anomalies?${params}`);
      setAnomalies(data);
    }
  }, [activeTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUserExpand = async (u) => {
    if (expandedUser === u.id) { setExpandedUser(null); setUserDrill(null); return; }
    setExpandedUser(u.id);
    setUserDrillLoading(true);
    const params = new URLSearchParams(filters);
    const { data } = await api.get(`/reports/drill/user/${u.id}?${params}`);
    setUserDrill(data);
    setUserDrillLoading(false);
  };

  const handleProjectExpand = async (p) => {
    if (expandedProject === p.id) { setExpandedProject(null); setProjectDrill(null); return; }
    setExpandedProject(p.id);
    setProjectDrillLoading(true);
    const params = new URLSearchParams(filters);
    const { data } = await api.get(`/reports/drill/project/${p.id}?${params}`);
    setProjectDrill(data);
    setProjectDrillLoading(false);
  };

  const exportCSV = async () => {
    const params = new URLSearchParams({ ...filters });
    const { data } = await api.get(`/reports/by-user?${params}`);
    const rows = [['תאריך', 'עובד', 'פרויקט', 'משימה', 'שעות', 'התחלה', 'סיום', 'תיאור']];
    data.forEach(e => rows.push([
      e.date, e.user_name, e.project_name, e.task_name || '',
      (e.duration_minutes / 60).toFixed(2), e.start_time || '', e.end_time || '', e.description || '',
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'timeln-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: 'user',       label: 'לפי עובד',   icon: Users },
    { key: 'project',    label: 'לפי פרויקט', icon: FolderOpen },
    { key: 'anomalies',  label: 'חריגות',      icon: AlertTriangle },
  ];

  const maxUserMins  = userSummary[0]?.total_minutes || 1;
  const maxProjMins  = projectSummary[0]?.total_minutes || 1;

  return (
    <div>
      <PageHeader title="דוחות" subtitle="סיכום וניתוח שעות עבודה" />

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-dark-400 mb-1">מתאריך</label>
            <input type="date" value={filters.date_from}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
              className="input-field text-sm w-36" />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">עד תאריך</label>
            <input type="date" value={filters.date_to}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
              className="input-field text-sm w-36" />
          </div>
          <button onClick={exportCSV}
            className="btn-secondary text-sm flex items-center gap-1.5 py-1.5 mr-auto">
            <Download size={14} /> ייצוא CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-dark-900 border border-dark-700 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === key
                ? 'bg-white text-brand-600 shadow-sm border border-dark-700'
                : 'text-dark-400 hover:text-dark-100'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab: by user ── */}
      {activeTab === 'user' && (
        <div className="space-y-2">
          {userSummary.length === 0 && (
            <div className="card text-center text-dark-500 py-10">אין נתונים לתקופה הנבחרת</div>
          )}
          {userSummary.map(u => (
            <div key={u.id}>
              <div
                className="card py-4 cursor-pointer hover:border-brand-200 hover:shadow-md transition-all group"
                onClick={() => handleUserExpand(u)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
                    {u.full_name[0]}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-dark-100 font-semibold text-sm">{u.full_name}</span>
                      {u.team && <span className="text-xs text-dark-500 bg-dark-900 px-2 py-0.5 rounded-full border border-dark-700">{u.team}</span>}
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${(u.total_minutes / maxUserMins) * 100}%` }} />
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-6 flex-shrink-0 text-sm">
                    <div className="text-center hidden sm:block">
                      <p className="text-dark-400 text-xs">דיווחים</p>
                      <p className="text-dark-100 font-semibold">{u.entry_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-dark-400 text-xs">סה"כ</p>
                      <p className="text-brand-600 font-mono font-bold">{formatMinutes(u.total_minutes)}</p>
                    </div>
                    <div className="text-dark-400 group-hover:text-brand-600 transition-colors">
                      {expandedUser === u.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>
              </div>

              {expandedUser === u.id && (
                userDrillLoading
                  ? <div className="text-center text-dark-500 py-6 text-sm">טוען...</div>
                  : userDrill && (
                    <DrillDown
                      title={`פירוט דיווחים — ${u.full_name}`}
                      entries={userDrill}
                      onClose={() => { setExpandedUser(null); setUserDrill(null); }}
                    />
                  )
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: by project ── */}
      {activeTab === 'project' && (
        <div className="space-y-2">
          {projectSummary.length === 0 && (
            <div className="card text-center text-dark-500 py-10">אין נתונים לתקופה הנבחרת</div>
          )}
          {projectSummary.map(p => (
            <div key={p.id}>
              <div
                className="card py-4 cursor-pointer hover:border-brand-200 hover:shadow-md transition-all group"
                onClick={() => handleProjectExpand(p)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-brand-50 rounded-xl flex-shrink-0">
                    <FolderOpen size={18} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-dark-100 font-semibold text-sm">{p.project_name}</span>
                      <span className="text-xs text-dark-500">{p.user_count} עובדים</span>
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${(p.total_minutes / maxProjMins) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0 text-sm">
                    <div className="text-center hidden sm:block">
                      <p className="text-dark-400 text-xs">דיווחים</p>
                      <p className="text-dark-100 font-semibold">{p.entry_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-dark-400 text-xs">סה"כ</p>
                      <p className="text-teal-600 font-mono font-bold">{formatMinutes(p.total_minutes)}</p>
                    </div>
                    <div className="text-dark-400 group-hover:text-brand-600 transition-colors">
                      {expandedProject === p.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>
              </div>

              {expandedProject === p.id && (
                projectDrillLoading
                  ? <div className="text-center text-dark-500 py-6 text-sm">טוען...</div>
                  : projectDrill && (
                    <DrillDown
                      title={`פירוט דיווחים — ${p.project_name}`}
                      entries={projectDrill}
                      onClose={() => { setExpandedProject(null); setProjectDrill(null); }}
                    />
                  )
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: anomalies ── */}
      {activeTab === 'anomalies' && anomalies && (
        <div className="space-y-5">

          {/* Long entries */}
          <div className="card">
            <h3 className="text-dark-50 font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              דיווחים ארוכים מ-10 שעות
              <span className="text-xs font-normal text-dark-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {anomalies.long_entries.length}
              </span>
            </h3>
            {anomalies.long_entries.length === 0 ? (
              <p className="text-emerald-600 text-sm flex items-center gap-1.5">✓ לא נמצאו חריגות</p>
            ) : (
              <div className="space-y-2">
                {anomalies.long_entries.map(e => (
                  <div key={e.id} className="flex justify-between items-center py-2.5 border-b border-dark-700 last:border-0">
                    <div>
                      <p className="text-dark-100 text-sm font-medium">{e.user_name}
                        <span className="text-dark-400 font-normal"> · {e.project_name}</span>
                      </p>
                      <p className="text-dark-500 text-xs">{formatDate(e.date)}{e.description ? ` · ${e.description}` : ''}</p>
                    </div>
                    <span className="text-red-600 font-mono text-sm font-bold bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                      {formatMinutes(e.duration_minutes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Heavy days */}
          <div className="card">
            <h3 className="text-dark-50 font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              ימים עם מעל 10 שעות לעובד
              <span className="text-xs font-normal text-dark-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                {anomalies.heavy_days.length}
              </span>
            </h3>
            {anomalies.heavy_days.length === 0 ? (
              <p className="text-emerald-600 text-sm flex items-center gap-1.5">✓ לא נמצאו חריגות</p>
            ) : (
              <div className="space-y-2">
                {anomalies.heavy_days.map((d, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-dark-700 last:border-0">
                    <div>
                      <p className="text-dark-100 text-sm font-medium">{d.full_name}</p>
                      <p className="text-dark-500 text-xs">{formatDate(d.date)}</p>
                    </div>
                    <span className="text-orange-600 font-mono text-sm font-bold bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
                      {formatMinutes(d.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* No-entry users */}
          <div className="card">
            <h3 className="text-dark-50 font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-blue-500" />
              עובדים ללא דיווחים בתקופה
              <span className="text-xs font-normal text-dark-500 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {anomalies.no_entry_users.length}
              </span>
            </h3>
            {anomalies.no_entry_users.length === 0 ? (
              <p className="text-emerald-600 text-sm flex items-center gap-1.5">✓ כל העובדים הגישו דיווחים</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {anomalies.no_entry_users.map(u => (
                  <div key={u.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs">
                      {u.full_name[0]}
                    </div>
                    <div>
                      <p className="text-dark-100 text-sm font-medium">{u.full_name}</p>
                      {u.team && <p className="text-dark-500 text-xs">{u.team}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overlaps */}
          {anomalies.overlaps && anomalies.overlaps.length > 0 && (
            <div className="card">
              <h3 className="text-dark-50 font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                חפיפות בדיווחים
                <span className="text-xs font-normal text-dark-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  {anomalies.overlaps.length}
                </span>
              </h3>
              <div className="space-y-2">
                {anomalies.overlaps.map((o, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-dark-700 last:border-0">
                    <div>
                      <p className="text-dark-100 text-sm font-medium">{o.full_name}</p>
                      <p className="text-dark-500 text-xs">
                        {formatDate(o.date)} · {o.start_time}–{o.end_time} חופף עם {o.b_start}–{o.b_end}
                      </p>
                    </div>
                    <span className="text-red-500 text-xs font-medium">חפיפה</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

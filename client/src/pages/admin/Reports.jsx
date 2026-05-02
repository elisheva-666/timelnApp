import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatMinutes, monthStartStr, todayStr } from '../../utils/format';
import { Download, AlertTriangle, ChevronDown, ChevronUp, Users, FolderOpen, X, BarChart2, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CHART_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#be185d','#65a30d'];

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700, fontSize: 14 }}>
          {typeof p.value === 'number' ? formatMinutes(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// Drill-down table
function DrillDown({ title, entries, onClose }) {
  const total = entries.reduce((s, e) => s + e.duration_minutes, 0);
  return (
    <div className="card mt-4" style={{ borderColor: '#bfdbfe', background: 'var(--bg-elevated)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 style={{ color: 'var(--text-h)', margin: 0, fontWeight: 700 }}>{title}</h4>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {entries.length} דיווחים · סה"כ {formatMinutes(total)}
          </p>
        </div>
        <button onClick={onClose}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['תאריך', entries[0]?.user_name && 'עובד', entries[0]?.project_name && 'פרויקט', 'משימה', 'שעות', 'זמן', 'תיאור', 'סטטוס']
                .filter(Boolean).map(h => (
                  <th key={h} className="text-right font-semibold px-3 py-2 text-xs"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id || i} className="table-row">
                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-body)' }}>{formatDate(e.date)}</td>
                {e.user_name && <td className="px-3 py-2 font-medium text-sm" style={{ color: 'var(--text-h)' }}>{e.user_name}</td>}
                {e.project_name && <td className="px-3 py-2 font-medium text-sm" style={{ color: 'var(--text-h)' }}>{e.project_name}</td>}
                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>{e.task_name || '—'}</td>
                <td className="px-3 py-2 font-mono font-bold text-sm" style={{ color: '#2563eb' }}>{formatMinutes(e.duration_minutes)}</td>
                <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {e.start_time && e.end_time ? `${e.start_time}–${e.end_time}` : '—'}
                </td>
                <td className="px-3 py-2 text-sm max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{e.description || '—'}</td>
                <td className="px-3 py-2"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('charts');
  const [filters, setFilters] = useState({ date_from: monthStartStr(), date_to: todayStr() });
  const [overview, setOverview] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDrill, setUserDrill] = useState(null);
  const [userDrillLoading, setUserDrillLoading] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [projectDrill, setProjectDrill] = useState(null);
  const [projectDrillLoading, setProjectDrillLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef(null);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams(filters);
    setExpandedUser(null); setUserDrill(null);
    setExpandedProject(null); setProjectDrill(null);
    try {
      if (activeTab === 'charts' || activeTab === 'user' || activeTab === 'project') {
        const { data } = await api.get(`/reports/overview?${params}`);
        setOverview(data);
      }
      if (activeTab === 'anomalies') {
        const { data } = await api.get(`/reports/anomalies?${params}`);
        setAnomalies(data);
      }
    } catch {}
  }, [activeTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUserExpand = async (u) => {
    if (expandedUser === u.id) { setExpandedUser(null); setUserDrill(null); return; }
    setExpandedUser(u.id); setUserDrillLoading(true);
    const { data } = await api.get(`/reports/drill/user/${u.id}?${new URLSearchParams(filters)}`);
    setUserDrill(data); setUserDrillLoading(false);
  };

  const handleProjectExpand = async (p) => {
    if (expandedProject === p.id) { setExpandedProject(null); setProjectDrill(null); return; }
    setExpandedProject(p.id); setProjectDrillLoading(true);
    const { data } = await api.get(`/reports/drill/project/${p.id}?${new URLSearchParams(filters)}`);
    setProjectDrill(data); setProjectDrillLoading(false);
  };

  const exportCSV = async () => {
    const { data } = await api.get(`/reports/by-user?${new URLSearchParams(filters)}`);
    const rows = [['תאריך','עובד','פרויקט','משימה','שעות','התחלה','סיום','תיאור']];
    data.forEach(e => rows.push([
      e.date, e.user_name, e.project_name, e.task_name || '',
      (e.duration_minutes / 60).toFixed(2), e.start_time || '', e.end_time || '', e.description || '',
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `timeln-report-${filters.date_from}.csv`; a.click();
  };

  const exportPDF = async () => {
    setPdfLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();

      // Header
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageW, 28, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TimeIn - Work Hours Report', pageW / 2, 12, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${filters.date_from}  to  ${filters.date_to}`, pageW / 2, 22, { align: 'center' });

      let y = 38;

      // Summary box
      if (overview) {
        pdf.setFillColor(239, 246, 255);
        pdf.roundedRect(14, y, pageW - 28, 24, 3, 3, 'F');
        pdf.setTextColor(30, 64, 175);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const totalH = (overview.total_minutes / 60).toFixed(1);
        const activeUsers = overview.by_user?.filter(u => u.total_minutes > 0).length ?? 0;
        const activeProjects = overview.by_project?.filter(p => p.total_minutes > 0).length ?? 0;
        pdf.text(`Total Hours: ${totalH}h`, 20, y + 10);
        pdf.text(`Active Employees: ${activeUsers}`, 80, y + 10);
        pdf.text(`Active Projects: ${activeProjects}`, 145, y + 10);
        y += 32;
      }

      // Users table
      if (overview?.by_user?.length) {
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Hours by Employee', 14, y);
        y += 6;

        // Table header
        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, y, pageW - 28, 8, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Employee', 18, y + 5.5);
        pdf.text('Reports', 110, y + 5.5);
        pdf.text('Total Hours', 145, y + 5.5);
        y += 8;

        overview.by_user.forEach((u, i) => {
          if (y > 270) { pdf.addPage(); y = 20; }
          if (i % 2 === 0) { pdf.setFillColor(249, 250, 251); pdf.rect(14, y, pageW - 28, 7, 'F'); }
          pdf.setTextColor(30, 41, 59);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text(u.full_name, 18, y + 5);
          pdf.text(String(u.entry_count), 115, y + 5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(37, 99, 235);
          pdf.text(`${(u.total_minutes / 60).toFixed(1)}h`, 148, y + 5);
          y += 7;
        });
        y += 8;
      }

      // Projects table
      if (overview?.by_project?.length && y < 230) {
        if (y > 200) { pdf.addPage(); y = 20; }
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Hours by Project', 14, y);
        y += 6;

        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, y, pageW - 28, 8, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Project', 18, y + 5.5);
        pdf.text('Users', 110, y + 5.5);
        pdf.text('Total Hours', 145, y + 5.5);
        y += 8;

        overview.by_project.filter(p => p.total_minutes > 0).forEach((p, i) => {
          if (y > 270) { pdf.addPage(); y = 20; }
          if (i % 2 === 0) { pdf.setFillColor(249, 250, 251); pdf.rect(14, y, pageW - 28, 7, 'F'); }
          pdf.setTextColor(30, 41, 59);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text(p.project_name, 18, y + 5);
          pdf.text(String(p.user_count), 113, y + 5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(5, 150, 105);
          pdf.text(`${(p.total_minutes / 60).toFixed(1)}h`, 148, y + 5);
          y += 7;
        });
      }

      // Footer
      const pages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`Generated by TimeIn · Page ${i} of ${pages}`, pageW / 2, 290, { align: 'center' });
      }

      pdf.save(`timeln-report-${filters.date_from}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  };

  // Chart data
  const userChartData = (overview?.by_user || [])
    .filter(u => u.total_minutes > 0)
    .map(u => ({ name: u.full_name.split(' ')[0], minutes: u.total_minutes, full: u.full_name }));

  const projectPieData = (overview?.by_project || [])
    .filter(p => p.total_minutes > 0)
    .map((p, i) => ({ name: p.project_name, value: p.total_minutes, color: CHART_COLORS[i % CHART_COLORS.length] }));

  const tabs = [
    { key: 'charts',    label: 'גרפים',      icon: BarChart2 },
    { key: 'user',      label: 'לפי עובד',   icon: Users },
    { key: 'project',   label: 'לפי פרויקט', icon: FolderOpen },
    { key: 'anomalies', label: 'חריגות',      icon: AlertTriangle },
  ];

  return (
    <div ref={reportRef}>
      <PageHeader title="דוחות" subtitle="ניתוח שעות עבודה אינטראקטיבי"
        actions={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-1.5">
              <Download size={14} /> CSV
            </button>
            <button onClick={exportPDF} disabled={pdfLoading}
              className="btn-primary text-sm flex items-center gap-1.5">
              <FileText size={14} /> {pdfLoading ? 'מייצא...' : 'PDF'}
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-end">
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
          {overview && (
            <div className="mr-auto flex items-center gap-3">
              {[
                { label: 'סה"כ שעות', value: formatMinutes(overview.total_minutes), color: '#2563eb' },
                { label: 'עובדים', value: overview.by_user?.filter(u => u.total_minutes > 0).length ?? 0, color: '#059669' },
                { label: 'פרויקטים', value: overview.by_project?.filter(p => p.total_minutes > 0).length ?? 0, color: '#7c3aed' },
              ].map(s => (
                <div key={s.label} className="text-center px-4 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="font-extrabold text-lg leading-none" style={{ color: s.color, letterSpacing: '-0.04em' }}>{s.value}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={activeTab === key
              ? { background: 'var(--bg-card)', color: '#2563eb', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }
              : { color: 'var(--text-muted)', border: '1px solid transparent' }
            }>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Charts Tab ── */}
      {activeTab === 'charts' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Bar chart: hours by user */}
            <div className="card">
              <h3 className="font-bold mb-5" style={{ color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
                שעות לפי עובד
              </h3>
              {userChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={userChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${(v/60).toFixed(0)}h`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-elevated)' }} />
                    <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                      {userChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>אין נתונים</p>}
            </div>

            {/* Pie chart: hours by project */}
            <div className="card">
              <h3 className="font-bold mb-5" style={{ color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
                התפלגות לפי פרויקט
              </h3>
              {projectPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={projectPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {projectPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMinutes(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }} />
                    <Legend formatter={(v) => <span style={{ color: 'var(--text-body)', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>אין נתונים</p>}
            </div>
          </div>

          {/* Horizontal bar: project comparison */}
          {overview?.by_project?.filter(p => p.total_minutes > 0).length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-5" style={{ color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
                השוואת שעות — פרויקטים
              </h3>
              <ResponsiveContainer width="100%" height={Math.max(180, overview.by_project.filter(p=>p.total_minutes>0).length * 44)}>
                <BarChart
                  layout="vertical"
                  data={overview.by_project.filter(p => p.total_minutes > 0).map(p => ({ name: p.project_name, minutes: p.total_minutes }))}
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${(v/60).toFixed(0)}h`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'var(--text-body)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-elevated)' }} />
                  <Bar dataKey="minutes" radius={[0, 6, 6, 0]}>
                    {overview.by_project.filter(p=>p.total_minutes>0).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── By User Tab ── */}
      {activeTab === 'user' && (
        <div className="space-y-2">
          {(!overview?.by_user?.length) && (
            <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>אין נתונים לתקופה</div>
          )}
          {overview?.by_user?.map(u => {
            const max = overview.by_user[0]?.total_minutes || 1;
            return (
              <div key={u.id}>
                <div className="card py-4 cursor-pointer transition-all group"
                  style={{ '--hover-border': '#bfdbfe' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#bfdbfe'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  onClick={() => handleUserExpand(u)}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      {u.full_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>{u.full_name}</span>
                        {u.team && <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>{u.team}</span>}
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(u.total_minutes / max) * 100}%`, background: '#2563eb' }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-5 flex-shrink-0 text-sm">
                      <div className="text-center hidden sm:block">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>דיווחים</p>
                        <p className="font-semibold" style={{ color: 'var(--text-h)' }}>{u.entry_count}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>סה"כ</p>
                        <p className="font-mono font-bold" style={{ color: '#2563eb' }}>{formatMinutes(u.total_minutes)}</p>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {expandedUser === u.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>
                  </div>
                </div>
                {expandedUser === u.id && (
                  userDrillLoading
                    ? <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>טוען...</div>
                    : userDrill && <DrillDown title={`פירוט — ${u.full_name}`} entries={userDrill}
                        onClose={() => { setExpandedUser(null); setUserDrill(null); }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── By Project Tab ── */}
      {activeTab === 'project' && (
        <div className="space-y-2">
          {(!overview?.by_project?.length) && (
            <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>אין נתונים לתקופה</div>
          )}
          {overview?.by_project?.map((p, i) => {
            const max = overview.by_project[0]?.total_minutes || 1;
            const color = CHART_COLORS[i % CHART_COLORS.length];
            return (
              <div key={p.id}>
                <div className="card py-4 cursor-pointer transition-all"
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#a5b4fc'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  onClick={() => handleProjectExpand(p)}>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>{p.project_name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.user_count} עובדים</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(p.total_minutes / max) * 100}%`, background: color }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-5 flex-shrink-0 text-sm">
                      <div className="text-center hidden sm:block">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>דיווחים</p>
                        <p className="font-semibold" style={{ color: 'var(--text-h)' }}>{p.entry_count}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>סה"כ</p>
                        <p className="font-mono font-bold" style={{ color }}>{formatMinutes(p.total_minutes)}</p>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {expandedProject === p.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>
                  </div>
                </div>
                {expandedProject === p.id && (
                  projectDrillLoading
                    ? <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>טוען...</div>
                    : projectDrill && <DrillDown title={`פירוט — ${p.project_name}`} entries={projectDrill}
                        onClose={() => { setExpandedProject(null); setProjectDrill(null); }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Anomalies Tab ── */}
      {activeTab === 'anomalies' && anomalies && (
        <div className="space-y-5">
          {[
            { key: 'long_entries', title: 'דיווחים ארוכים מ-10 שעות', color: '#f59e0b', items: anomalies.long_entries,
              render: e => ({ label: `${e.user_name} · ${e.project_name}`, sub: formatDate(e.date), val: formatMinutes(e.duration_minutes), valColor: '#dc2626' }) },
            { key: 'heavy_days', title: 'ימים עם מעל 10 שעות לעובד', color: '#f97316', items: anomalies.heavy_days,
              render: d => ({ label: d.full_name, sub: formatDate(d.date), val: formatMinutes(d.total), valColor: '#ea580c' }) },
            { key: 'no_entry', title: 'עובדים ללא דיווחים בתקופה', color: '#3b82f6', items: anomalies.no_entry_users,
              render: u => ({ label: u.full_name, sub: u.team || 'ללא צוות', val: '0 שעות', valColor: '#64748b' }) },
          ].map(section => (
            <div key={section.key} className="card">
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-h)', margin: '0 0 1rem' }}>
                <AlertTriangle size={16} style={{ color: section.color }} />
                {section.title}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
                  style={{ color: section.color, background: `${section.color}18`, border: `1px solid ${section.color}40` }}>
                  {section.items.length}
                </span>
              </h3>
              {section.items.length === 0 ? (
                <p className="text-sm flex items-center gap-1.5" style={{ color: '#16a34a' }}>✓ לא נמצאו חריגות</p>
              ) : (
                <div className="space-y-1">
                  {section.items.map((item, i) => {
                    const r = section.render(item);
                    return (
                      <div key={i} className="flex items-center justify-between py-2.5"
                        style={{ borderBottom: '1px solid var(--border-div)' }}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{r.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.sub}</p>
                        </div>
                        <span className="font-mono font-bold text-sm px-3 py-1 rounded-lg"
                          style={{ color: r.valColor, background: `${r.valColor}15`, border: `1px solid ${r.valColor}30` }}>
                          {r.val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {anomalies.overlaps?.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-h)', margin: '0 0 1rem' }}>
                <AlertTriangle size={16} style={{ color: '#dc2626' }} /> חפיפות בדיווחים
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
                  {anomalies.overlaps.length}
                </span>
              </h3>
              {anomalies.overlaps.map((o, i) => (
                <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border-div)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{o.full_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(o.date)} · {o.start_time}–{o.end_time} חופף עם {o.b_start}–{o.b_end}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>חפיפה</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

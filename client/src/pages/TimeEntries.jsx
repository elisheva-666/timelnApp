import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Copy, Filter } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import TimeEntryForm from '../components/TimeEntryForm';
import toast from 'react-hot-toast';
import { formatDate, formatMinutes, todayStr, monthStartStr } from '../utils/format';

export default function TimeEntries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    date_from: monthStartStr(),
    date_to: todayStr(),
    project_id: '',
    status: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const fetchEntries = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.project_id) params.set('project_id', filters.project_id);
    if (filters.status) params.set('status', filters.status);
    const { data } = await api.get(`/time-entries?${params}`);
    setEntries(data);
  }, [filters]);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    if (searchParams.get('new') === '1') { setEditEntry(null); setModalOpen(true); }
  }, [searchParams]);

  const handleDelete = async id => {
    if (!confirm('האם למחוק דיווח זה?')) return;
    await api.delete(`/time-entries/${id}`);
    toast.success('נמחק');
    fetchEntries();
  };

  const handleDuplicate = entry => {
    setEditEntry({
      project_id: entry.project_id,
      task_id: entry.task_id,
      date: todayStr(),
      start_time: entry.start_time,
      end_time: entry.end_time,
      duration_minutes: entry.duration_minutes,
      description: entry.description,
      work_type: entry.work_type,
    });
    setModalOpen(true);
  };

  const totalMinutes = entries.reduce((s, e) => s + e.duration_minutes, 0);

  return (
    <div>
      <PageHeader
        title="דיווחי שעות"
        subtitle={`${entries.length} דיווחים · סה"כ ${formatMinutes(totalMinutes)}`}
        actions={
          <button onClick={() => { setEditEntry(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> דיווח חדש
          </button>
        }
      />

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
          <div>
            <label className="block text-xs text-dark-400 mb-1">פרויקט</label>
            <select value={filters.project_id}
              onChange={e => setFilters(f => ({ ...f, project_id: e.target.value }))}
              className="input-field text-sm w-44">
              <option value="">הכל</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">סטטוס</label>
            <select value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="input-field text-sm w-36">
              <option value="">הכל</option>
              <option value="draft">טיוטה</option>
              <option value="submitted">הוגש</option>
              <option value="approved">אושר</option>
            </select>
          </div>
          <button onClick={() => setFilters({ date_from: monthStartStr(), date_to: todayStr(), project_id: '', status: '' })}
            className="btn-secondary text-sm flex items-center gap-1">
            <Filter size={14} /> נקה סינון
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700 bg-dark-900/50">
              <th className="text-right text-dark-400 font-medium px-5 py-3">תאריך</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">פרויקט</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">משימה</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">שעות</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">זמן</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">תיאור</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">סטטוס</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={8} className="text-center text-dark-500 py-12">אין דיווחים לתקופה הנבחרת</td></tr>
            )}
            {entries.map(e => (
              <tr key={e.id} className="table-row">
                <td className="px-5 py-3 text-dark-300">{formatDate(e.date)}</td>
                <td className="px-4 py-3 text-white font-medium">{e.project_name}</td>
                <td className="px-4 py-3 text-dark-300">{e.task_name || <span className="text-dark-600">—</span>}</td>
                <td className="px-4 py-3 text-brand-400 font-mono font-medium">{formatMinutes(e.duration_minutes)}</td>
                <td className="px-4 py-3 text-dark-400 font-mono text-xs">
                  {e.start_time && e.end_time ? `${e.start_time}–${e.end_time}` : '—'}
                </td>
                <td className="px-4 py-3 text-dark-400 max-w-xs truncate">{e.description || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditEntry(e); setModalOpen(true); }}
                      className="p-1.5 text-dark-500 hover:text-brand-400 hover:bg-dark-700 rounded transition-colors" title="ערוך">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDuplicate(e)}
                      className="p-1.5 text-dark-500 hover:text-brand-400 hover:bg-dark-700 rounded transition-colors" title="שכפל">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => handleDelete(e.id)}
                      className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-dark-700 rounded transition-colors" title="מחק">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditEntry(null); }}
        title={editEntry?.id ? 'עריכת דיווח' : 'דיווח שעות חדש'} size="lg">
        <TimeEntryForm
          initial={editEntry}
          onSuccess={() => { setModalOpen(false); setEditEntry(null); fetchEntries(); }}
          onCancel={() => { setModalOpen(false); setEditEntry(null); }}
        />
      </Modal>
    </div>
  );
}

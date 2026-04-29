import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, User, Calendar } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';

function TaskForm({ initial, projects, users, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    task_name: '', description: '', project_id: '', assigned_user_id: '',
    status: 'new', priority: 'medium', estimated_hours: '', due_date: '',
    clickup_task_id: '', ...initial,
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assigned_user_id: form.assigned_user_id || null, task_id: form.task_id || null };
      if (initial?.id) await api.put(`/tasks/${initial.id}`, payload);
      else await api.post('/tasks', payload);
      toast.success(initial?.id ? 'משימה עודכנה' : 'משימה נוצרה!');
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.error || 'שגיאה'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-dark-300 mb-1.5">שם משימה *</label>
        <input type="text" value={form.task_name} onChange={e => set('task_name', e.target.value)} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm text-dark-300 mb-1.5">תיאור</label>
        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} className="input-field resize-none" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">פרויקט *</label>
          <select value={form.project_id} onChange={e => set('project_id', e.target.value)} className="input-field" required>
            <option value="">— בחר —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">שייך לעובד</label>
          <select value={form.assigned_user_id || ''} onChange={e => set('assigned_user_id', e.target.value)} className="input-field">
            <option value="">— לא מוקצה —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">סטטוס</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
            <option value="new">חדש</option>
            <option value="in_progress">בעבודה</option>
            <option value="completed">הושלם</option>
            <option value="cancelled">בוטל</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">עדיפות</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value)} className="input-field">
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
            <option value="urgent">דחוף</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">שעות מוערכות</label>
          <input type="number" min="0" step="0.5" value={form.estimated_hours || ''} onChange={e => set('estimated_hours', e.target.value)} className="input-field" placeholder="8" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">תאריך יעד</label>
          <input type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">ClickUp Task ID</label>
          <input type="text" value={form.clickup_task_id || ''} onChange={e => set('clickup_task_id', e.target.value)} className="input-field" placeholder="task_..." />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'שומר...' : initial?.id ? 'עדכן' : 'צור משימה'}</button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">ביטול</button>
      </div>
    </form>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ project_id: '', status: '', assigned_to_me: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.project_id) params.set('project_id', filters.project_id);
    if (filters.status) params.set('status', filters.status);
    if (filters.assigned_to_me) params.set('assigned_to_me', 'true');
    const { data } = await api.get(`/tasks?${params}`);
    setTasks(data);
  }, [filters]);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data));
    if (isManager) api.get('/users').then(r => setUsers(r.data));
    else setUsers([]);
  }, [isManager]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async id => {
    if (!confirm('מחק משימה?')) return;
    await api.delete(`/tasks/${id}`);
    toast.success('נמחקה');
    fetchTasks();
  };

  return (
    <div>
      <PageHeader
        title="ניהול משימות"
        subtitle={`${tasks.length} משימות`}
        actions={isManager && (
          <button onClick={() => { setEditTask(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> משימה חדשה
          </button>
        )}
      />

      {/* Filters */}
      <div className="card mb-5 flex flex-wrap gap-3 items-center">
        <select value={filters.project_id} onChange={e => setFilters(f => ({ ...f, project_id: e.target.value }))} className="input-field text-sm w-44">
          <option value="">כל הפרויקטים</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input-field text-sm w-36">
          <option value="">הצג הכל</option>
          <option value="new">חדש</option>
          <option value="in_progress">בעבודה</option>
          <option value="completed">הושלם</option>
        </select>
        <label className="flex items-center gap-2 text-dark-300 text-sm cursor-pointer">
          <input type="checkbox" checked={filters.assigned_to_me} onChange={e => setFilters(f => ({ ...f, assigned_to_me: e.target.checked }))}
            className="rounded border-dark-500 bg-dark-700 text-brand-500 focus:ring-brand-500 w-4 h-4" />
          הצג רק משימות שלי
        </label>
        <button onClick={() => setFilters({ project_id: '', status: '', assigned_to_me: false })} className="text-dark-500 hover:text-dark-300 text-sm">
          × נקה סינון
        </button>
      </div>

      {/* Tasks list */}
      <div className="space-y-3">
        {tasks.length === 0 && (
          <div className="card text-center text-dark-500 py-12">אין משימות</div>
        )}
        {tasks.map(t => (
          <div key={t.id} className="card flex items-center gap-4 group hover:border-dark-500 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={t.status} />
                <StatusBadge status={t.priority} />
                <h3 className="text-dark-50 font-medium">{t.task_name}</h3>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-dark-500 flex-wrap">
                <span className="text-dark-400">{t.project_name}</span>
                {t.assigned_user_name && <span className="flex items-center gap-1"><User size={11} />{t.assigned_user_name}</span>}
                {t.due_date && <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(t.due_date)}</span>}
                {t.estimated_hours && <span>{t.estimated_hours}ש' מוערך</span>}
                {t.clickup_task_id && <span className="text-blue-400">ClickUp: {t.clickup_task_id}</span>}
              </div>
              {t.description && <p className="text-dark-400 text-xs mt-1 truncate">{t.description}</p>}
            </div>
            {isManager && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => { setEditTask(t); setModalOpen(true); }}
                  className="p-1.5 text-dark-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="ערוך">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-dark-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="מחק">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditTask(null); }}
        title={editTask?.id ? 'עריכת משימה' : 'משימה חדשה'} size="lg">
        <TaskForm
          initial={editTask}
          projects={projects}
          users={users}
          onSuccess={() => { setModalOpen(false); setEditTask(null); fetchTasks(); }}
          onCancel={() => { setModalOpen(false); setEditTask(null); }}
        />
      </Modal>
    </div>
  );
}

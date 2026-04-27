import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { todayStr } from '../utils/format';

export default function TimeEntryForm({ initial, onSuccess, onCancel }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inputMode, setInputMode] = useState('times'); // 'times' | 'duration'
  const [form, setForm] = useState({
    project_id: '',
    task_id: '',
    date: todayStr(),
    start_time: '',
    end_time: '',
    duration_minutes: '',
    work_type: 'development',
    description: '',
    status: 'submitted',
    related_commit_ids: '',
    related_clickup_task_id: '',
    ...initial,
  });
  const [loading, setLoading] = useState(false);
  const [overlap, setOverlap] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data));
  }, []);

  useEffect(() => {
    if (form.project_id) {
      api.get(`/tasks?project_id=${form.project_id}`).then(r => setTasks(r.data)).catch(() => setTasks([]));
    } else {
      setTasks([]);
    }
  }, [form.project_id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setOverlap(false);
    setLoading(true);
    try {
      const payload = { ...form };
      if (inputMode === 'duration') { payload.start_time = null; payload.end_time = null; }
      if (inputMode === 'times') { payload.duration_minutes = null; }
      if (!payload.task_id) payload.task_id = null;

      if (initial?.id) {
        await api.put(`/time-entries/${initial.id}`, payload);
        toast.success('דיווח עודכן');
      } else {
        await api.post('/time-entries', payload);
        toast.success('דיווח נשמר!');
      }
      onSuccess();
    } catch (err) {
      if (err.response?.data?.overlap) {
        setOverlap(true);
        toast.error('חפיפה עם דיווח קיים!');
      } else {
        toast.error(err.response?.data?.error || 'שגיאה');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">פרויקט *</label>
          <select value={form.project_id} onChange={e => set('project_id', e.target.value)} className="input-field" required>
            <option value="">— בחר פרויקט —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">תאריך *</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" required />
        </div>
      </div>

      <div>
        <label className="block text-sm text-dark-300 mb-1.5">משימה (אופציונלי)</label>
        <select value={form.task_id || ''} onChange={e => set('task_id', e.target.value)} className="input-field" disabled={!form.project_id}>
          <option value="">— ללא משימה —</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.task_name}</option>)}
        </select>
      </div>

      {/* Time input toggle */}
      <div>
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setInputMode('times')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${inputMode === 'times' ? 'bg-brand-600 text-white' : 'bg-dark-700 text-dark-400 hover:text-white'}`}>
            שעת התחלה/סיום
          </button>
          <button type="button" onClick={() => setInputMode('duration')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${inputMode === 'duration' ? 'bg-brand-600 text-white' : 'bg-dark-700 text-dark-400 hover:text-white'}`}>
            משך זמן
          </button>
        </div>

        {inputMode === 'times' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">שעת התחלה</label>
              <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">שעת סיום</label>
              <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className="input-field" />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">משך בדקות *</label>
            <input type="number" min="1" max="1440" value={form.duration_minutes}
              onChange={e => set('duration_minutes', e.target.value)}
              className="input-field" placeholder="60" required={inputMode === 'duration'} />
          </div>
        )}
      </div>

      {overlap && (
        <div className="p-3 bg-red-900/30 border border-red-600/40 rounded-lg text-red-300 text-sm">
          ⚠️ קיימת חפיפה עם דיווח אחר בתאריך ושעה אלה. אנא בדוק את הזמנים.
        </div>
      )}

      <div>
        <label className="block text-sm text-dark-300 mb-1.5">תיאור</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          className="input-field resize-none" rows={2} placeholder="תיאור קצר של העבודה..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">סוג עבודה</label>
          <select value={form.work_type} onChange={e => set('work_type', e.target.value)} className="input-field">
            <option value="development">פיתוח</option>
            <option value="design">עיצוב</option>
            <option value="testing">בדיקות</option>
            <option value="meetings">פגישות</option>
            <option value="review">Code Review</option>
            <option value="planning">תכנון</option>
            <option value="other">אחר</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">סטטוס</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
            <option value="draft">טיוטה</option>
            <option value="submitted">הגש</option>
          </select>
        </div>
      </div>

      {/* Integration fields */}
      <details className="group">
        <summary className="text-dark-400 text-sm cursor-pointer hover:text-dark-200 transition-colors">
          אינטגרציות (Git / ClickUp)
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">Commit Hash (Git)</label>
            <input type="text" value={form.related_commit_ids} onChange={e => set('related_commit_ids', e.target.value)}
              className="input-field" placeholder="abc123def456..." />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">ClickUp Task ID</label>
            <input type="text" value={form.related_clickup_task_id} onChange={e => set('related_clickup_task_id', e.target.value)}
              className="input-field" placeholder="task_abc123..." />
          </div>
        </div>
      </details>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
          {loading ? 'שומר...' : initial?.id ? 'עדכן דיווח' : 'שמור דיווח'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">ביטול</button>
      </div>
    </form>
  );
}

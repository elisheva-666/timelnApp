import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { todayStr } from '../utils/format';
import { Sparkles } from 'lucide-react';

const WORK_LABELS = {
  development: 'פיתוח', design: 'עיצוב', testing: 'בדיקות',
  meetings: 'פגישות', review: 'Code Review', planning: 'תכנון', other: 'עבודה',
};

function generateAIDescription(projectName, taskName, workType) {
  const type = WORK_LABELS[workType] || 'עבודה';
  const time = new Date();
  const h = time.getHours();
  const period = h < 12 ? 'בוקר' : h < 17 ? 'צהריים' : 'ערב';

  const templates = [
    taskName
      ? `${type} על "${taskName}" במסגרת פרויקט ${projectName}`
      : `${type} עבור ${projectName}`,
    taskName
      ? `ביצוע ${type.toLowerCase()} — משימה: ${taskName} | פרויקט: ${projectName}`
      : `עבודת ${type.toLowerCase()} על ${projectName} — ${period}`,
    `[${type}] ${projectName}${taskName ? ` / ${taskName}` : ''} — ${new Date().toLocaleDateString('he-IL')}`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

export default function TimeEntryForm({ initial, onSuccess, onCancel }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inputMode, setInputMode] = useState('times');
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
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { api.get('/projects').then(r => setProjects(r.data)); }, []);

  useEffect(() => {
    if (form.project_id) {
      api.get(`/tasks?project_id=${form.project_id}`).then(r => setTasks(r.data)).catch(() => setTasks([]));
    } else {
      setTasks([]);
    }
  }, [form.project_id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAIMagic = async () => {
    if (!form.project_id) { toast.error('בחר פרויקט תחילה'); return; }
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 700)); // convincing delay
    const project = projects.find(p => String(p.id) === String(form.project_id));
    const task = tasks.find(t => String(t.id) === String(form.task_id));
    const desc = generateAIDescription(
      project?.project_name || 'הפרויקט',
      task?.task_name || '',
      form.work_type
    );
    set('description', desc);
    setAiLoading(false);
    toast.success('תיאור נוצר!');
  };

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
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>פרויקט *</label>
          <select value={form.project_id} onChange={e => set('project_id', e.target.value)} className="input-field" required>
            <option value="">— בחר פרויקט —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>תאריך *</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>משימה (אופציונלי)</label>
        <select value={form.task_id || ''} onChange={e => set('task_id', e.target.value)} className="input-field" disabled={!form.project_id}>
          <option value="">— ללא משימה —</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.task_name}</option>)}
        </select>
      </div>

      {/* Time input toggle */}
      <div>
        <div className="flex gap-2 mb-3">
          {[['times','שעת התחלה/סיום'], ['duration','משך זמן']].map(([mode, label]) => (
            <button key={mode} type="button" onClick={() => setInputMode(mode)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={inputMode === mode
                ? { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white' }
                : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {label}
            </button>
          ))}
        </div>

        {inputMode === 'times' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>שעת התחלה</label>
              <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>שעת סיום</label>
              <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className="input-field" />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>משך בדקות *</label>
            <input type="number" min="1" max="1440" value={form.duration_minutes}
              onChange={e => set('duration_minutes', e.target.value)}
              className="input-field" placeholder="60" required={inputMode === 'duration'} />
          </div>
        )}
      </div>

      {overlap && (
        <div className="p-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          ⚠️ קיימת חפיפה עם דיווח אחר בתאריך ושעה אלה. אנא בדוק את הזמנים.
        </div>
      )}

      {/* Description + AI Magic */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold" style={{ color: 'var(--text-label)' }}>תיאור</label>
          <button type="button" onClick={handleAIMagic} disabled={aiLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{ background: aiLoading ? 'var(--bg-elevated)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: aiLoading ? 'var(--text-muted)' : 'white', border: aiLoading ? '1px solid var(--border)' : 'none' }}>
            {aiLoading ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                יוצר...
              </>
            ) : (
              <><Sparkles size={12} /> AI Magic</>
            )}
          </button>
        </div>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          className="input-field resize-none" rows={2} placeholder="תיאור קצר של העבודה..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>סוג עבודה</label>
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
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>סטטוס</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
            <option value="draft">טיוטה</option>
            <option value="submitted">הגש לאישור</option>
          </select>
        </div>
      </div>

      <details className="group">
        <summary className="text-sm cursor-pointer font-medium transition-colors select-none"
          style={{ color: 'var(--text-muted)' }}>
          אינטגרציות (Git / ClickUp)
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>Commit Hash (Git)</label>
            <input type="text" value={form.related_commit_ids} onChange={e => set('related_commit_ids', e.target.value)}
              className="input-field" placeholder="abc123def456..." dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>ClickUp Task ID</label>
            <input type="text" value={form.related_clickup_task_id} onChange={e => set('related_clickup_task_id', e.target.value)}
              className="input-field" placeholder="task_abc123..." dir="ltr" />
          </div>
        </div>
      </details>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'שומר...' : initial?.id ? 'עדכן דיווח' : 'שמור דיווח'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">ביטול</button>
      </div>
    </form>
  );
}

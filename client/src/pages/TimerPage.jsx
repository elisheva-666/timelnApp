import { useState, useEffect } from 'react';
import { Play, Pause, Square, Trash2, Timer } from 'lucide-react';
import api from '../api/client';
import { useTimer } from '../contexts/TimerContext';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

export default function TimerPage() {
  const { activeTimer, elapsed, formatElapsed, startTimer, stopTimer, pauseTimer, resumeTimer, discardTimer } = useTimer();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ project_id: '', task_id: '', description: '' });
  const [stopDesc, setStopDesc] = useState('');
  const [stopCommit, setStopCommit] = useState('');
  const [showStop, setShowStop] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.project_id) {
      api.get(`/tasks?project_id=${form.project_id}`).then(r => setTasks(r.data)).catch(() => {});
    } else {
      setTasks([]);
    }
  }, [form.project_id]);

  const handleStart = async () => {
    if (!form.project_id) { toast.error('בחר פרויקט'); return; }
    try {
      await startTimer(form.project_id, form.task_id || null, form.description);
      toast.success('הטיימר הופעל!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'שגיאה');
    }
  };

  const handleStop = async () => {
    try {
      const result = await stopTimer({ description: stopDesc || undefined, related_commit_ids: stopCommit || undefined });
      toast.success(`דיווח נשמר — ${result.duration_minutes} דקות`);
      setShowStop(false);
      setStopDesc('');
      setStopCommit('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'שגיאה');
    }
  };

  const isPaused = activeTimer?.paused_at;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="טיימר עבודה" subtitle="מדוד ועקוב אחר זמן העבודה בזמן אמת" />

      {!activeTimer ? (
        /* Start Timer */
        <div className="card">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <Timer size={18} className="text-brand-400" /> הפעל טיימר חדש
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">פרויקט *</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value, task_id: '' }))}
                className="input-field">
                <option value="">— בחר פרויקט —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">משימה (אופציונלי)</label>
              <select value={form.task_id} onChange={e => setForm(f => ({ ...f, task_id: e.target.value }))}
                className="input-field" disabled={!form.project_id}>
                <option value="">— בחר משימה —</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.task_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">תיאור (אופציונלי)</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input-field" placeholder="על מה אתה עובד?" />
            </div>
            <button onClick={handleStart} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
              <Play size={18} /> התחל טיימר
            </button>
          </div>
        </div>
      ) : (
        /* Active Timer */
        <div className="card border-green-600/30 timer-active">
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2 text-green-400 mb-2">
              <Timer size={16} />
              <span className="text-sm font-medium">{activeTimer.project_name}</span>
              {activeTimer.task_name && <span className="text-green-500">· {activeTimer.task_name}</span>}
            </div>
            <p className="font-mono text-6xl font-bold text-white mb-2">{formatElapsed(elapsed)}</p>
            {isPaused && <p className="text-yellow-400 text-sm">⏸ מושהה</p>}
          </div>

          {!showStop ? (
            <div className="flex gap-3 mt-4">
              <button onClick={() => isPaused ? resumeTimer() : pauseTimer()}
                className="btn-secondary flex-1 flex items-center justify-center gap-2">
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                {isPaused ? 'המשך' : 'השהה'}
              </button>
              <button onClick={() => setShowStop(true)}
                className="flex-1 bg-red-800/60 hover:bg-red-700 text-red-200 font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Square size={16} /> עצור ושמור
              </button>
              <button onClick={async () => { await discardTimer(); toast.success('הטיימר בוטל'); }}
                className="p-2 text-dark-500 hover:text-red-400 transition-colors rounded-lg hover:bg-dark-700" title="בטל טיימר">
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3 border-t border-dark-600 pt-4">
              <p className="text-white font-medium">עצור ושמור דיווח</p>
              <div>
                <label className="block text-sm text-dark-300 mb-1">תיאור</label>
                <input type="text" value={stopDesc} onChange={e => setStopDesc(e.target.value)}
                  className="input-field" placeholder="מה עשית?" />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Commit Hash (אופציונלי)</label>
                <input type="text" value={stopCommit} onChange={e => setStopCommit(e.target.value)}
                  className="input-field" placeholder="abc1234..." />
              </div>
              <div className="flex gap-2">
                <button onClick={handleStop} className="btn-primary flex-1">שמור דיווח</button>
                <button onClick={() => setShowStop(false)} className="btn-secondary flex-1">ביטול</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Pencil, FolderOpen, GitBranch, ExternalLink } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';

function ProjectForm({ initial, users, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    project_name: '', description: '', status: 'active', manager_id: '',
    external_clickup_list_id: '', git_repository_name: '', git_repository_url: '',
    ...initial,
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) await api.put(`/projects/${initial.id}`, form);
      else await api.post('/projects', form);
      toast.success(initial?.id ? 'פרויקט עודכן' : 'פרויקט נוצר!');
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.error || 'שגיאה'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-dark-300 mb-1.5">שם פרויקט *</label>
        <input type="text" value={form.project_name} onChange={e => set('project_name', e.target.value)} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm text-dark-300 mb-1.5">תיאור</label>
        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} className="input-field resize-none" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">מנהל פרויקט</label>
          <select value={form.manager_id || ''} onChange={e => set('manager_id', e.target.value)} className="input-field">
            <option value="">— בחר —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">סטטוס</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
            <option value="active">פעיל</option>
            <option value="inactive">לא פעיל</option>
            <option value="archived">ארכיון</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">Git Repository</label>
          <input type="text" value={form.git_repository_name || ''} onChange={e => set('git_repository_name', e.target.value)} className="input-field" placeholder="my-repo" />
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">ClickUp List ID</label>
          <input type="text" value={form.external_clickup_list_id || ''} onChange={e => set('external_clickup_list_id', e.target.value)} className="input-field" placeholder="list_abc..." />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'שומר...' : initial?.id ? 'עדכן' : 'צור פרויקט'}</button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">ביטול</button>
      </div>
    </form>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const fetchProjects = () => api.get('/projects').then(r => setProjects(r.data));

  useEffect(() => {
    fetchProjects();
    if (isManager) api.get('/users').then(r => setUsers(r.data));
  }, [isManager]);

  return (
    <div>
      <PageHeader
        title="פרויקטים"
        subtitle={`${projects.length} פרויקטים פעילים`}
        actions={isManager && (
          <button onClick={() => { setEditProject(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> פרויקט חדש
          </button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <div key={p.id} className="card hover:border-brand-300 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-600/10 rounded-lg">
                  <FolderOpen size={18} className="text-brand-400" />
                </div>
                <div>
                  <h3 className="text-dark-50 font-semibold">{p.project_name}</h3>
                  {p.manager_name && <p className="text-dark-400 text-xs">{p.manager_name}</p>}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
            {p.description && <p className="text-dark-400 text-sm mb-3 line-clamp-2">{p.description}</p>}
            <div className="flex items-center gap-3 text-xs text-dark-500 mt-3 pt-3 border-t border-dark-700">
              {p.git_repository_name && (
                <span className="flex items-center gap-1"><GitBranch size={12} />{p.git_repository_name}</span>
              )}
              {p.external_clickup_list_id && (
                <span className="flex items-center gap-1"><ExternalLink size={12} />ClickUp</span>
              )}
              <span className="mr-auto">{formatDate(p.created_at)}</span>
            </div>
            {isManager && (
              <button onClick={() => { setEditProject(p); setModalOpen(true); }}
                className="mt-3 text-dark-500 hover:text-brand-600 transition-colors text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <Pencil size={12} /> ערוך
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditProject(null); }}
        title={editProject?.id ? 'עריכת פרויקט' : 'פרויקט חדש'} size="md">
        <ProjectForm
          initial={editProject}
          users={users}
          onSuccess={() => { setModalOpen(false); setEditProject(null); fetchProjects(); }}
          onCancel={() => { setModalOpen(false); setEditProject(null); }}
        />
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

function UserForm({ initial, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'employee', team: '', is_active: 1, ...initial,
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (initial?.id && !payload.password) delete payload.password;
      if (initial?.id) await api.put(`/users/${initial.id}`, payload);
      else await api.post('/users', payload);
      toast.success(initial?.id ? 'משתמש עודכן' : 'משתמש נוצר!');
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.error || 'שגיאה'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">שם מלא *</label>
          <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">אימייל *</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" required />
        </div>
      </div>
      <div>
        <label className="block text-sm text-dark-300 mb-1.5">{initial?.id ? 'סיסמה חדשה (השאר ריק לא לשנות)' : 'סיסמה *'}</label>
        <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
          className="input-field" required={!initial?.id} placeholder={initial?.id ? '••••••••' : ''} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">תפקיד</label>
          <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
            <option value="employee">עובד</option>
            <option value="manager">מנהל</option>
            <option value="admin">אדמין</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">צוות</label>
          <input type="text" value={form.team || ''} onChange={e => set('team', e.target.value)} className="input-field" placeholder="פיתוח" />
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">סטטוס</label>
          <select value={form.is_active} onChange={e => set('is_active', Number(e.target.value))} className="input-field">
            <option value={1}>פעיל</option>
            <option value={0}>לא פעיל</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'שומר...' : initial?.id ? 'עדכן' : 'צור משתמש'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">ביטול</button>
      </div>
    </form>
  );
}

const roleConfig = {
  admin:    { label: 'אדמין', cls: 'bg-purple-100 text-purple-700 border border-purple-200' },
  manager:  { label: 'מנהל',  cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  employee: { label: 'עובד',  cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (u) => {
    await api.put(`/users/${u.id}`, { is_active: u.is_active ? 0 : 1 });
    toast.success(u.is_active ? 'משתמש הושבת' : 'משתמש הופעל');
    fetchUsers();
  };

  return (
    <div>
      <PageHeader
        title="ניהול משתמשים"
        subtitle={`${users.length} משתמשים`}
        actions={
          <button onClick={() => { setEditUser(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> משתמש חדש
          </button>
        }
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700 bg-dark-900">
              <th className="text-right text-dark-400 font-medium px-5 py-3">שם</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">אימייל</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">תפקיד</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">צוות</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">נוצר</th>
              <th className="text-right text-dark-400 font-medium px-4 py-3">סטטוס</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={`table-row ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">
                      {u.full_name[0]}
                    </div>
                    <span className="text-dark-100 font-medium">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-dark-400">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${(roleConfig[u.role] || roleConfig.employee).cls}`}>
                    {(roleConfig[u.role] || roleConfig.employee).label}
                  </span>
                </td>
                <td className="px-4 py-3 text-dark-400">{u.team || '—'}</td>
                <td className="px-4 py-3 text-dark-500 text-xs">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {u.is_active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditUser(u); setModalOpen(true); }}
                      className="p-1.5 text-dark-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="ערוך">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => toggleActive(u)}
                      className="p-1.5 text-dark-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      title={u.is_active ? 'השבת' : 'הפעל'}>
                      {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditUser(null); }}
        title={editUser?.id ? 'עריכת משתמש' : 'משתמש חדש'} size="md">
        <UserForm
          initial={editUser}
          onSuccess={() => { setModalOpen(false); setEditUser(null); fetchUsers(); }}
          onCancel={() => { setModalOpen(false); setEditUser(null); }}
        />
      </Modal>
    </div>
  );
}

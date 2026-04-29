import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_USERS = [
  { email: 'admin@timeln.com',  label: 'מנהל ראשי',  role: 'admin'   },
  { email: 'sara@timeln.com',   label: 'שרה כהן',     role: 'manager' },
  { email: 'david@timeln.com',  label: 'דוד לוי',     role: 'employee'},
  { email: 'michal@timeln.com', label: 'מיכל אברהם',  role: 'employee'},
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const attemptLogin = async (emailVal, passVal) => {
    try {
      await login(emailVal, passVal);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        toast.error('לא ניתן להתחבר לשרת — ודא שהשרת פועל');
      } else if (err.response?.status === 401) {
        toast.error('אימייל או סיסמה שגויים');
      } else {
        toast.error(err.response?.data?.error || 'שגיאה בהתחברות');
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    await attemptLogin(email, password);
    setLoading(false);
  };

  const handleQuickLogin = async (u) => {
    setQuickLoading(u.email);
    await attemptLogin(u.email, 'password123');
    setQuickLoading(null);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-600/20">
            <Clock size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dark-50">TimeIn</h1>
          <p className="text-dark-400 mt-1 text-sm">מערכת ניהול שעות עבודה</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">סיסמה</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'מתחבר...' : 'כניסה'}
            </button>
          </form>
        </div>

        {/* Demo Users */}
        <div className="mt-6">
          <p className="text-dark-500 text-xs text-center mb-3">כניסה מהירה לחשבונות הדמו</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.map(u => (
              <button
                key={u.email}
                onClick={() => handleQuickLogin(u)}
                disabled={!!quickLoading}
                className="text-right px-3 py-2.5 rounded-lg border border-dark-700 bg-white hover:border-brand-300 hover:bg-brand-50 transition-all disabled:opacity-60 group"
              >
                <span className="block text-sm font-medium text-dark-100 group-hover:text-brand-700">{u.label}</span>
                <span className="block text-xs text-dark-500">
                  {quickLoading === u.email ? 'מתחבר...' : u.email.split('@')[0]}
                </span>
              </button>
            ))}
          </div>
          <p className="text-dark-500 text-xs text-center mt-4">סיסמה: password123</p>
        </div>

        <p className="text-dark-500 text-xs text-center mt-6">
          משתמשים חדשים נוצרים על ידי האדמין בלבד
        </p>
      </div>
    </div>
  );
}

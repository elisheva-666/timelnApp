import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_USERS = [
  { email: 'admin@timeln.com',  label: 'מנהל ראשי',  initials: 'מר', color: '#7c3aed', bg: '#f5f3ff' },
  { email: 'sara@timeln.com',   label: 'שרה כהן',     initials: 'שכ', color: '#0891b2', bg: '#ecfeff' },
  { email: 'david@timeln.com',  label: 'דוד לוי',     initials: 'דל', color: '#059669', bg: '#f0fdf4' },
  { email: 'michal@timeln.com', label: 'מיכל אברהם',  initials: 'מא', color: '#d97706', bg: '#fffbeb' },
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
    <div className="min-h-screen flex" style={{ background: '#f8fafc', direction: 'rtl' }}>

      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1e40af 0%, #1d4ed8 40%, #2563eb 70%, #3b82f6 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'white' }} />
        <div className="absolute bottom-24 -right-16 w-56 h-56 rounded-full opacity-10"
          style={{ background: 'white' }} />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full opacity-5"
          style={{ background: 'white' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Clock size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-extrabold text-2xl tracking-tight">TimeIn</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-white font-extrabold text-4xl leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
            עבודה חכמה<br />מתחילה<br />במדידה מדויקת
          </h2>
          <p className="text-blue-200 text-lg font-medium leading-relaxed">
            מעקב שעות עבודה, דיווחים אוטומטיים<br />וניהול פרויקטים במקום אחד.
          </p>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { num: '∞', label: 'פרויקטים' },
            { num: '24/7', label: 'מעקב בזמן אמת' },
            { num: '100%', label: 'דיוק בדיווח' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-white font-extrabold text-2xl leading-none" style={{ letterSpacing: '-0.03em' }}>{s.num}</p>
              <p className="text-blue-200 text-xs mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden justify-center">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              <Clock size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-dark-50 font-extrabold text-2xl tracking-tight">TimeIn</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-dark-50" style={{ letterSpacing: '-0.03em' }}>ברוך השב</h1>
            <p className="text-dark-400 mt-2 font-medium">היכנס לחשבונך להמשיך</p>
          </div>

          {/* Login form */}
          <div className="card mb-6" style={{ padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.06)' }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-1.5"
                  style={{ letterSpacing: '-0.01em' }}>אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-1.5"
                  style={{ letterSpacing: '-0.01em' }}>סיסמה</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.75rem', textAlign: 'left' }}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#94a3b8' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base mt-2"
                style={{ borderRadius: '0.75rem', fontSize: '0.9375rem' }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    מתחבר...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    כניסה <ArrowLeft size={16} />
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Demo users */}
          <div>
            <p className="text-center text-xs font-semibold mb-3"
              style={{ color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              כניסה מהירה — דמו
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => handleQuickLogin(u)}
                  disabled={!!quickLoading}
                  className="text-right p-3 rounded-xl border transition-all disabled:opacity-60 group"
                  style={{ background: quickLoading === u.email ? u.bg : '#ffffff', borderColor: '#e8edf2' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = u.color; e.currentTarget.style.background = u.bg; }}
                  onMouseLeave={e => { if (quickLoading !== u.email) { e.currentTarget.style.borderColor = '#e8edf2'; e.currentTarget.style.background = '#ffffff'; } }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: u.bg, color: u.color }}>
                      {u.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-dark-100 leading-tight truncate"
                        style={{ letterSpacing: '-0.01em' }}>{u.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                        {quickLoading === u.email ? 'מתחבר...' : u.email.split('@')[0]}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-xs mt-3" style={{ color: '#94a3b8' }}>סיסמה: password123</p>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#cbd5e1' }}>
            משתמשים חדשים נוצרים על ידי האדמין בלבד
          </p>
        </div>
      </div>
    </div>
  );
}

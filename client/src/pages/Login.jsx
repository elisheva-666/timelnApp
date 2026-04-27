import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-600/20">
            <Clock size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">TimeIn</h1>
          <p className="text-dark-400 mt-2">מערכת ניהול שעות עבודה</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">התחברות</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">אימייל</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="your@email.com" required
              />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">סיסמה</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10" placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700 text-sm">
          <p className="text-dark-400 text-center mb-2 font-medium">משתמשי דמו</p>
          <div className="space-y-1 text-dark-400 text-xs">
            {[
              ['admin@timeln.com', 'אדמין'],
              ['sara@timeln.com', 'מנהלת'],
              ['david@timeln.com', 'עובד'],
              ['michal@timeln.com', 'עובדת'],
            ].map(([e, r]) => (
              <button key={e} onClick={() => { setEmail(e); setPassword('password123'); }}
                className="flex justify-between w-full px-2 py-1 hover:bg-dark-700 rounded transition-colors">
                <span className="text-dark-300">{e}</span>
                <span className="text-brand-400">{r}</span>
              </button>
            ))}
            <p className="text-center mt-2 text-dark-500">סיסמה: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

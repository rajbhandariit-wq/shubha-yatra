import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bus, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🙏`);
      const from = location.state?.from || (user.role === 'provider' ? '/provider' : user.role === 'admin' ? '/admin' : '/');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const demoLogin = async (email, password) => {
    setForm({ email, password });
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Logged in as ${user.role}!`);
      navigate(user.role === 'provider' ? '/provider' : user.role === 'admin' ? '/admin' : '/');
    } catch { toast.error('Demo login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Nepal imagery */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80" alt="Swayambhunath" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-nepal-blue/80 to-nepal-red/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
          <div className="text-7xl font-nepali font-bold opacity-30 absolute top-10">शुभ यात्रा</div>
          <Bus className="h-16 w-16 mb-4 drop-shadow-lg" />
          <h2 className="text-4xl font-bold mb-3 text-center">Shubha Yatra</h2>
          <p className="text-xl font-nepali text-center mb-2">शुभ यात्रा — सुरक्षित यात्रा</p>
          <p className="text-white/80 text-center max-w-xs">Nepal's most trusted bus ticket booking platform. Journey safely across the Himalayas.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[['50+','Operators'],['200+','Routes'],['10K+','Travelers']].map(([n,l]) => (
              <div key={l} className="bg-white/10 backdrop-blur rounded-xl p-3"><p className="text-2xl font-bold">{n}</p><p className="text-xs text-white/70">{l}</p></div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-nepal-red rounded-2xl mb-4 shadow-lg">
              <Bus className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">स्वागतम् • Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} className="input-field pl-10" placeholder="your@email.com" required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} className="input-field pl-10 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-right mt-1">
                <a href="/forgot-password" className="text-sm text-nepal-red hover:underline">
                  Forgot Password?
                </a>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/> : <><LogIn className="h-4 w-4" /> Sign In</>}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 bg-white rounded-2xl shadow p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Demo Accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {[['Customer','customer1@example.com','pass123','bg-green-50 border-green-200 text-green-700'],
                ['Provider','provider1@shubhayatra.com','pass123','bg-blue-50 border-blue-200 text-blue-700'],
                ['Admin','admin@shubhayatra.com','Admin@123','bg-yellow-50 border-yellow-200 text-yellow-700']].map(([role,email,pwd,cls]) => (
                <button key={role} onClick={() => demoLogin(email, pwd)} className={`border rounded-xl p-2.5 text-xs text-center ${cls} hover:shadow transition-all`}>
                  <p className="font-bold">{role}</p><p className="opacity-70 mt-0.5 truncate">{email}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account? <Link to="/register" className="text-primary-600 font-semibold hover:underline">Register here</Link>
          </p>
          <Link to="/" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-2">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

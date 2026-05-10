import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, User, Mail, Lock, Phone, Building2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',

    phoneNumber: '',
    address: '',

    idType: 'NID',
    idNumber: '',
    dateOfBirth: '',

    role: 'customer',

    companyName: '',
    companyAddress: '',
    TCPermitNumber: ''
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome to Shubha Yatra, ${user.name.split(' ')[0]}! 🙏`);
      navigate(user.role === 'provider' ? '/provider' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({...p, [k]: e.target.value})) });

  return (
    
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <img src="/images/Swayambhu.jpg" alt="Annapurna" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-nepal-blue/85 to-nepal-red/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-10 text-center">
          <div className="text-6xl font-nepali font-bold opacity-20 absolute top-10">नेपाल</div>
          <Bus className="h-14 w-14 mb-4" />
          <h2 className="text-3xl font-bold mb-2">Join Shubha Yatra</h2>
          <p className="font-nepali mb-3">शुभ यात्रामा सामेल हुनुहोस्</p>
          <p className="text-white/80 text-sm">Create your account and start booking bus tickets across Nepal's beautiful landscapes.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-nepal-red rounded-2xl mb-3 shadow-lg">
              <Bus className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">खाता सिर्जना गर्नुहोस् • Get started for free</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-7 space-y-4">
            {/* Role selector */}
            <div>
              <label className="label">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                
                {[['customer','🧑 Traveler / Customer'],['provider','🚌 Bus Operator / Provider']].map(([r, l]) => (
                  <label key={r} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.role===r ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="role" value={r} checked={form.role===r} onChange={() => setForm(p=>({...p,role:r}))} className="text-primary-500" />
                    <span className="text-sm font-medium">{l}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...f('name')} className="input-field pl-10" placeholder="Arjun Karki" required /></div>
              </div>
              <div>
                <label className="label">Phone</label>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...f('phoneNumber')} className="input-field pl-10" placeholder="98XXXXXXXX" required /></div>
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" {...f('email')} className="input-field pl-10" placeholder="your@email.com" required /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type={showPwd?'text':'password'} {...f('password')} className="input-field pl-10 pr-10" placeholder="Min. 6 chars" required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPwd?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="password" {...f('confirmPassword')} className="input-field pl-10" placeholder="Repeat password" required /></div>
              </div>
            </div>
          {/* Identity Details */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-sm font-medium text-gray-700">
                Passenger Identity Details
              </p>

              {/* Customer Address */}
              {form.role === 'customer' && (
                <div>
                  <label className="label">Address</label>
                  <input
                    {...f('address')}
                    className="input-field"
                    placeholder="Kathmandu, Nepal"
                    required
                  />
                </div>
              )}

              {/* ID Type + ID Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">ID Type</label>
                  <select
                    {...f('idType')}
                    className="input-field"
                    required
                  >
                    <option value="NID">National ID</option>
                    <option value="CITIZEN_ID">Citizenship</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>

                <div>
                  <label className="label">ID Number</label>
                  <input
                    {...f('idNumber')}
                    className="input-field"
                    placeholder="Document Number"
                    required
                  />
                </div>
              </div>

              {/* DOB */}
              <div>
                <label className="label">Date of Birth</label>
                <input
                  type="date"
                  {...f('dateOfBirth')}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {form.role === 'provider' && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2"><Building2 className="h-4 w-4 text-nepal-blue"/> Company Details</p>
                <div>
                  <label className="label">Company/Agency Name</label>
                  <input {...f('companyName')} className="input-field" placeholder="Himalayan Express Travels" />
                </div>
                <div>
                  <label className="label">Company Address</label>
                  <input {...f('companyAddress')} className="input-field" placeholder="Kalanki, Kathmandu" />
                </div>
                <div>
                  <label className="label">Transport Company Permit Number</label>
                  <input
                    {...f('TCPermitNumber')}
                    className="input-field"
                    placeholder="TC-XXXX-XXXX"
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/> : <><UserPlus className="h-4 w-4" /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
          <Link to="/" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-2">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

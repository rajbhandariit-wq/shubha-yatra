// frontend/src/components/ForgotPassword.jsx
import { useState } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {  // ← Make sure this says "export default"
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-lg text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Check Your Email</h3>
        <p className="text-gray-600 mb-4">
          We've sent password reset instructions to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500">
          Didn't receive the email? Check your spam folder or{' '}
          <button onClick={() => setSubmitted(false)} className="text-nepal-red hover:underline">
            try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nepal-blue focus:border-nepal-blue"
            placeholder="your@email.com"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-nepal-blue text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
      </form>
      
      <div className="text-center mt-4">
        <a href="/login" className="text-sm text-nepal-red hover:underline">
          Back to Login
        </a>
      </div>
    </div>
  );
}
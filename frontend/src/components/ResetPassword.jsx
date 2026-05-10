// frontend/src/components/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {  // ← Make sure this says "export default"
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await authAPI.verifyResetToken(token);
        setValidToken(true);
      } catch (error) {
        setValidToken(false);
        toast.error('Invalid or expired reset link');
      } finally {
        setChecking(false);
      }
    };
    
    if (token) {
      verifyToken();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await authAPI.resetPassword(token, { password, confirmPassword });
      toast.success('Password reset successful! Please login with your new password.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-nepal-blue border-t-transparent"></div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-lg text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid or Expired Link</h2>
        <p className="text-gray-600 mb-4">
          This password reset link is invalid or has expired.
        </p>
        <a href="/forgot-password" className="text-nepal-red hover:underline">
          Request a new reset link
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create New Password</h2>
        <p className="text-gray-600 mt-2">
          Please enter your new password below.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nepal-blue focus:border-nepal-blue"
            placeholder="Enter new password"
            required
            minLength="6"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nepal-blue focus:border-nepal-blue"
            placeholder="Confirm new password"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-nepal-blue text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
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
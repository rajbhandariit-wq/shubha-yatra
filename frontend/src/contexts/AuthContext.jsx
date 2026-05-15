import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sy_token');
    const savedUser = localStorage.getItem('sy_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      authAPI.getProfile()
        .then(res => { setUser(res.data.user); localStorage.setItem('sy_user', JSON.stringify(res.data.user)); })
        .catch(() => { localStorage.removeItem('sy_token'); localStorage.removeItem('sy_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (identifier, password) => {
    const res = await authAPI.login({ identifier, password });
    const { token, user } = res.data;
    localStorage.setItem('sy_token', token);
    localStorage.setItem('sy_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token, user } = res.data;
    localStorage.setItem('sy_token', token);
    localStorage.setItem('sy_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('sy_token');
    localStorage.removeItem('sy_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('sy_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

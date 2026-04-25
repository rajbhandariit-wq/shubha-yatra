import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Menu, X, User, LogOut, Ticket, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out. शुभ यात्रा! 🙏');
    navigate('/');
  };

  const getDashboardLink = () => {
    if (user?.role === 'provider') return '/provider';
    if (user?.role === 'admin') return '/admin';
    return '/my-bookings';
  };

  return (
    <nav className="bg-gradient-to-r from-nepal-blue via-[#004DB3] to-nepal-blue shadow-lg sticky top-0 z-50">
      {/* Top patriotic strip */}
      <div className="h-1 bg-gradient-to-r from-nepal-red via-white to-nepal-red" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-nepal-red p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <span className="text-white font-bold text-lg tracking-tight">Shubha Yatra</span>
              <div className="text-blue-200 text-xs font-nepali leading-none">शुभ यात्रा</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-blue-100 hover:text-white text-sm font-medium transition-colors">Home</Link>
            <Link to="/search" className="text-blue-100 hover:text-white text-sm font-medium transition-colors">Search Buses</Link>
            {!user && <>
              <Link to="/login" className="text-blue-100 hover:text-white text-sm font-medium transition-colors">Login</Link>
              <Link to="/register" className="bg-nepal-red hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Register</Link>
            </>}
            {user && (
              <div className="relative">
                <button onClick={() => setDropOpen(!dropOpen)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                  <div className="w-7 h-7 bg-nepal-red rounded-full flex items-center justify-center text-xs font-bold">{user.name?.[0]?.toUpperCase()}</div>
                  <span>{user.name?.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50" onMouseLeave={() => setDropOpen(false)}>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <Link to={getDashboardLink()} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                      <LayoutDashboard className="h-4 w-4 text-nepal-blue" /> Dashboard
                    </Link>
                    {user.role === 'customer' && (
                      <Link to="/my-bookings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                        <Ticket className="h-4 w-4 text-green-600" /> My Bookings
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-nepal-blue border-t border-blue-700 px-4 py-4 space-y-3">
          <Link to="/" className="block text-blue-100 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/search" className="block text-blue-100 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Search Buses</Link>
          {!user && <>
            <Link to="/login" className="block text-blue-100 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className="block bg-nepal-red text-white px-4 py-2 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Register</Link>
          </>}
          {user && <>
            <Link to={getDashboardLink()} className="block text-blue-100 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <button onClick={handleLogout} className="block w-full text-left text-red-300 hover:text-red-100 py-2">Logout</button>
          </>}
        </div>
      )}
    </nav>
  );
}

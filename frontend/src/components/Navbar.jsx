import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Menu, X, User, LogOut, Ticket, LayoutDashboard, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [fromCity, setFromCity] = useState('Kathmandu');
  const [toCity, setToCity] = useState('Pokhara');
  const [travelDate, setTravelDate] = useState(today);

  const handleLogout = () => {
    logout();
    toast.success('Logged out. शुभ यात्रा! 🙏');
    navigate('/');
  };

  const getDashboardLink = () => {
    if (user?.role === 'provider') return '/provider';
    if (user?.role === 'admin') return '/admin';
    return '/dashboard';
  };

  return (
    <nav className="bg-gradient-to-r from-nepal-blue via-[#004DB3] to-nepal-blue shadow-lg sticky top-0 z-50">
      {/* Top patriotic strip */}
      <div className="h-1 bg-gradient-to-r from-nepal-red via-white to-nepal-red" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/images/Android_logo_new.png" alt="Shubha Yatra" className="h-10 w-auto object-contain group-hover:scale-110 transition-transform drop-shadow" />
            <div className="leading-tight">
              <span className="text-white font-bold text-lg tracking-tight">Shubha Yatra</span>
              <div className="text-blue-200 text-xs font-nepali leading-none">शुभ यात्रा</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-blue-100 hover:text-white text-sm font-medium transition-colors">Home</Link>
            
            {/* Popular Destinations Button with relative positioning */}
            <div className="relative">
              <button
                onClick={() => setShowQuickSearch(!showQuickSearch)}
                className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
              >
                Popular Destinations
              </button>
              
              {/* Popular Destinations Dropdown - positioned relative to this div */}
              {showQuickSearch && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-80">
                  <div className="px-4 py-3">
                    <div className="mb-3">
                      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Popular Destinations
                      </h2>
                    </div>

                    <div className="flex flex-col gap-2">
                      {[
                        { from: 'Kathmandu', destination: 'Pokhara' },
                        { from: 'Kathmandu', destination: 'Chitwan' },
                        { from: 'Pokhara', destination: 'Lumbini' },
                      ].map((route, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const params = new URLSearchParams({
                              source: route.from,
                              destination: route.destination,
                              date: travelDate,
                            });

                            navigate(`/search?${params.toString()}`);
                            setShowQuickSearch(false);
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-nepal-blue hover:text-white rounded-lg text-sm font-medium transition-all text-left"
                        >
                          {route.from} → {route.destination}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                    {user.role === 'customer' && (<>
                      <Link to="/my-bookings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                        <Ticket className="h-4 w-4 text-green-600" /> My Bookings
                      </Link>
                      <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                        <Settings className="h-4 w-4 text-gray-500" /> Account Settings
                      </Link>
                    </>)}
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
          <button
            onClick={() => setShowQuickSearch(!showQuickSearch)}
            className="block text-blue-100 hover:text-white py-2"
          >
            Popular Destinations
          </button>
          {!user && <>
            <Link to="/login" className="block text-blue-100 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className="block bg-nepal-red text-white px-4 py-2 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Register</Link>
          </>}
          {user && <>
            <Link to={getDashboardLink()} className="block text-blue-100 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            {user.role === 'customer' && <>
              <Link to="/my-bookings" className="block text-blue-100 hover:text-white py-2" onClick={() => setMenuOpen(false)}>My Bookings</Link>
              <Link to="/dashboard" className="block text-blue-100 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Account Settings</Link>
            </>}
            <button onClick={handleLogout} className="block w-full text-left text-red-300 hover:text-red-100 py-2">Logout</button>
          </>}
        </div>
      )}
      
      {/* Mobile version of dropdown - shows when mobile menu is open and popular destinations is clicked */}
      {menuOpen && showQuickSearch && (
        <div className="md:hidden bg-white rounded-xl shadow-2xl border border-gray-200 mx-4 mt-2">
          <div className="px-4 py-3">
            <div className="mb-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Popular Destinations
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { from: 'Kathmandu', destination: 'Pokhara' },
                { from: 'Kathmandu', destination: 'Chitwan' },
                { from: 'Pokhara', destination: 'Lumbini' },
              ].map((route, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const params = new URLSearchParams({
                      source: route.from,
                      destination: route.destination,
                      date: travelDate,
                    });

                    navigate(`/search?${params.toString()}`);
                    setShowQuickSearch(false);
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-nepal-blue hover:text-white rounded-lg text-sm font-medium transition-all text-left"
                >
                  {route.from} → {route.destination}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
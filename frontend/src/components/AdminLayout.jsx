import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart2, LogOut, Shield, Menu, X, Building2, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const links = [
  { to: '/admin',          icon: LayoutDashboard, label: 'Dashboard',        exact: true },
  { to: '/admin/users',    icon: Users,           label: 'All Users'                     },
  { to: '/admin/bookings', icon: Building2,       label: 'Pending Transfers'             },
  { to: '/admin/reports',  icon: BarChart2,       label: 'Reports'                       },
  { to: '/admin/billing',  icon: DollarSign,      label: 'Billing & Payouts'             },
];

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [pendingCount,   setPendingCount]   = useState(0);
  const handleLogout = () => { logout(); toast.success('Logged out!'); navigate('/'); };

  useEffect(() => {
    adminAPI.getPendingBookings()
      .then(r => setPendingCount(r.data.count || 0))
      .catch(() => {});
  }, []);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center"><Shield className="h-6 w-6 text-white" /></div>
          <div><p className="text-white font-semibold text-sm">{user?.name}</p><p className="text-yellow-300 text-xs">Super Admin</p></div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon className="h-5 w-5" />
            <span className="flex-1">{label}</span>
            {to === '/admin/bookings' && pendingCount > 0 && (
              <span className="ml-auto bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300"><LogOut className="h-5 w-5" /><span>Logout</span></button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-gray-900 to-gray-800 flex-col shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <Shield className="h-6 w-6 text-yellow-400" />
          <div><span className="text-white font-bold">Shubha Yatra</span><div className="text-yellow-300 text-xs">Admin Panel</div></div>
        </div>
        <Sidebar />
      </aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <span className="text-white font-bold">Admin Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white"><X className="h-5 w-5" /></button>
            </div>
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-gray-600" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
            <Shield className="h-4 w-4 text-yellow-600" /><span className="text-yellow-700 text-sm font-medium">Admin</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

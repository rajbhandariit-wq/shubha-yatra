import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, LogOut, Shield, Menu, X, DollarSign,
  BookOpen, Map, Calendar, ChevronDown, Settings, Truck,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import useAdminPerms from '../hooks/useAdminPerms';
import toast from 'react-hot-toast';

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin, adminRole } = useAdminPerms();

  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [pendingCount,   setPendingCount]   = useState(0);
  const [schedulesOpen,  setSchedulesOpen]  = useState(location.pathname.startsWith('/admin/schedules'));

  useEffect(() => {
    adminAPI.getPendingBookings().then(r => setPendingCount(r.data.count || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/schedules')) setSchedulesOpen(true);
  }, [location.pathname]);

  const handleLogout = () => { logout(); toast.success('Logged out!'); navigate('/'); };

  const lnk = (isActive) => `sidebar-link ${isActive ? 'active' : ''}`;

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-yellow-300 text-xs capitalize">{adminRole?.replace('_', ' ') || 'Admin'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavLink to="/admin" end className={({ isActive }) => lnk(isActive)}>
          <LayoutDashboard className="h-5 w-5" /><span>Dashboard</span>
        </NavLink>

        <NavLink to="/admin/bookings" className={({ isActive }) => lnk(isActive)}>
          <BookOpen className="h-5 w-5" />
          <span className="flex-1">Bookings</span>
          {pendingCount > 0 && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </NavLink>

        {/* Schedules — collapsible */}
        <div>
          <button
            onClick={() => setSchedulesOpen(o => !o)}
            className={`sidebar-link w-full ${location.pathname.startsWith('/admin/schedules') ? 'active' : ''}`}
          >
            <Calendar className="h-5 w-5" />
            <span className="flex-1 text-left">Schedules</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${schedulesOpen ? 'rotate-180' : ''}`} />
          </button>
          {schedulesOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
              <NavLink to="/admin/schedules/routes" className={({ isActive }) => lnk(isActive)}>
                <Map className="h-4 w-4" /><span>Routes</span>
              </NavLink>
              <NavLink to="/admin/schedules" end className={({ isActive }) => lnk(isActive)}>
                <Calendar className="h-4 w-4" /><span>Trip Schedules</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink to="/admin/providers" className={({ isActive }) => lnk(isActive)}>
          <Truck className="h-5 w-5" /><span>Providers</span>
        </NavLink>

        <NavLink to="/admin/users" className={({ isActive }) => lnk(isActive)}>
          <Users className="h-5 w-5" /><span>Users</span>
        </NavLink>

        <NavLink to="/admin/billing" className={({ isActive }) => lnk(isActive)}>
          <DollarSign className="h-5 w-5" /><span>Billing & Payouts</span>
        </NavLink>

        {isSuperAdmin && (
          <NavLink to="/admin/settings" className={({ isActive }) => lnk(isActive)}>
            <Settings className="h-5 w-5" /><span>Settings</span>
          </NavLink>
        )}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300">
          <LogOut className="h-5 w-5" /><span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-gray-900 to-gray-800 flex-col shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <Shield className="h-6 w-6 text-yellow-400" />
          <div>
            <span className="text-white font-bold">Shubha Yatra</span>
            <div className="text-yellow-300 text-xs">Admin Panel</div>
          </div>
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
            <button className="lg:hidden p-2 text-gray-600" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
            <Shield className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-700 text-sm font-medium capitalize">
              {adminRole?.replace('_', ' ') || 'Admin'}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

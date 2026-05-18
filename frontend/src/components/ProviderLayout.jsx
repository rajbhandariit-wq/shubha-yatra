import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Bus, Route, Users, BookOpen, MessageSquare, BarChart2, Calendar, LogOut, Menu, X, FolderOpen, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Ticket } from "lucide-react";

const links = [
  { to: '/provider', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/provider/buses', icon: Bus, label: 'Buses' },
  { to: '/provider/routes', icon: Route, label: 'Routes' },
  { to: '/provider/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/provider/bookings', icon: BookOpen, label: 'Bookings' },
  { to: '/provider/create-booking', icon: Ticket, label: 'Create Booking' },
  { to: '/provider/staff', icon: Users, label: 'Staff' },
  { to: '/provider/messaging', icon: MessageSquare, label: 'Messaging' },
  { to: '/provider/reports', icon: BarChart2, label: 'Reports' },
  { to: '/provider/documents', icon: FolderOpen, label: 'Documents' },
];

export default function ProviderLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => { logout(); toast.success('Logged out!'); navigate('/'); };
  const isApproved = user?.status === 'active';
  const Sidebar = () => (
    
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-nepal-red rounded-xl flex items-center justify-center text-white font-bold text-lg">{user?.name?.[0]}</div>
          <div>
            <p className="text-white font-semibold text-sm">{user?.name}</p>
            <p className="text-blue-300 text-xs">{user?.companyName || 'Bus Operator'}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label, exact }) => {
          const blocked = !isApproved && (
            to.includes('/buses') ||
            to.includes('/routes') ||
            to.includes('/schedules')
          );

          return (
            <NavLink
              key={to}
              to={blocked ? '#' : to}
              end={exact}
              className={() =>
                `sidebar-link ${blocked ? 'opacity-40 pointer-events-none' : ''}`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
              {!isApproved && blocked && (
                <span className="text-xs text-yellow-400 ml-auto">Pending</span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="h-5 w-5" /><span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-nepal-blue to-gray-900 flex-col shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <Bus className="h-6 w-6 text-nepal-red" />
          <div><span className="text-white font-bold">Shubha Yatra</span><div className="text-blue-300 text-xs font-nepali">Provider Portal</div></div>
        </div>
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-gradient-to-b from-nepal-blue to-gray-900 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <span className="text-white font-bold">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white"><X className="h-5 w-5" /></button>
            </div>
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-gray-600" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-8 h-8 bg-nepal-red rounded-full flex items-center justify-center text-white text-xs font-bold">{user?.name?.[0]}</div>
            <span className="hidden sm:block">{user?.companyName || user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
          {!isApproved && (
            <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800">Account Pending Verification</p>
                <p className="text-sm text-yellow-700 mt-0.5">
                  Your account is awaiting admin approval. Please{' '}
                  <NavLink to="/provider/documents" className="underline font-medium hover:text-yellow-900">
                    upload the required documents
                  </NavLink>{' '}
                  to speed up the verification process.
                </p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Bus, Route, Calendar, BookOpen, Ticket,
  Users, MessageSquare, BarChart2, FolderOpen, LogOut, ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ProviderLayout from '../../components/ProviderLayout';
import toast from 'react-hot-toast';

const today = new Date().toISOString().split('T')[0];

const MENU_ITEMS = [
  { to: '/provider',                icon: LayoutDashboard, label: 'Dashboard',      desc: 'Overview and stats' },
  { to: '/provider/buses',          icon: Bus,             label: 'Buses',          desc: 'Manage your fleet' },
  { to: '/provider/routes',         icon: Route,           label: 'Routes',         desc: 'Manage routes and fares' },
  { to: '/provider/schedules',      icon: Calendar,        label: 'Schedules',      desc: 'Create and manage trips' },
  { to: `/provider/bookings?date=${today}`, icon: BookOpen, label: 'Bookings',     desc: "Today's bookings" },
  { to: '/provider/create-booking', icon: Ticket,          label: 'Create Booking', desc: 'Manual booking for walk-in' },
  { to: '/provider/staff',          icon: Users,           label: 'Staff',          desc: 'Manage staff accounts' },
  { to: '/provider/messaging',      icon: MessageSquare,   label: 'Messaging',      desc: 'Notifications and alerts' },
  { to: '/provider/reports',        icon: BarChart2,       label: 'Reports',        desc: 'Revenue and analytics' },
  { to: '/provider/documents',      icon: FolderOpen,      label: 'Documents',      desc: 'Upload required documents' },
];

export default function ProviderProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isApproved = user?.status === 'active';

  const handleLogout = () => {
    logout();
    toast.success('Logged out!');
    navigate('/');
  };

  const lockedItems = new Set(['/provider/buses', '/provider/routes', '/provider/schedules']);
  const isLocked = (to) => !isApproved && lockedItems.has(to.split('?')[0]);

  return (
    <ProviderLayout title="Profile">
      {/* Profile header — mobile only */}
      <div className="lg:hidden bg-gradient-to-br from-nepal-blue to-blue-700 rounded-2xl p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-nepal-red rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-lg truncate">{user?.name}</p>
          <p className="text-blue-200 text-sm truncate">{user?.companyName || 'Bus Operator'}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${isApproved ? 'bg-green-400/20 text-green-200' : 'bg-yellow-400/20 text-yellow-200'}`}>
            {isApproved ? 'Approved' : 'Pending Approval'}
          </span>
        </div>
      </div>

      {/* Pending warning (mobile) */}
      {!isApproved && (
        <div className="lg:hidden mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">Some features are locked until your account is approved by admin.</p>
        </div>
      )}

      {/* Nav list — shown on all screen sizes but styled for mobile utility */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {MENU_ITEMS.map(({ to, icon: Icon, label, desc }) => {
          const locked = isLocked(to);
          return (
            <Link
              key={to}
              to={locked ? '#' : to}
              className={`flex items-center gap-3 px-4 py-4 border-b border-gray-50 last:border-0 transition-colors
                ${locked ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50 active:bg-gray-100'}`}
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{locked ? 'Pending approval' : desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-100 text-red-500 hover:bg-red-50 transition-colors font-semibold text-sm"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </ProviderLayout>
  );
}

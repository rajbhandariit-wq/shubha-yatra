import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Route, BookOpen, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const today = new Date().toISOString().split('T')[0];

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/provider',                        match: '/provider' },
  { label: 'Routes',    icon: Route,           to: '/provider/routes',                  match: '/provider/routes' },
  { label: 'Bookings',  icon: BookOpen,         to: `/provider/bookings?date=${today}`,  match: '/provider/bookings' },
  { label: 'Profile',   icon: User,             to: '/provider/profile',                 match: '/provider/profile' },
];

export default function ProviderBottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (user?.role !== 'provider') return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
      <div className="flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map(({ label, icon: Icon, to, match }) => {
          const isActive = match === '/provider'
            ? pathname === '/provider'
            : pathname.startsWith(match);
          return (
            <Link key={label} to={to}
              className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${isActive ? 'text-nepal-blue' : 'text-gray-400'}`}>
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

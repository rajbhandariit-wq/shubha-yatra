import { Link, useLocation } from 'react-router-dom';
import { Home, Ticket, Heart, User, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import { notificationAPI } from '../services/api';

export default function BottomNav() {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchUnread = useCallback(async () => {
    if (!user || user.role !== 'customer') return;
    try {
      const res = await notificationAPI.getAll();
      setUnreadCount(res.data.unreadCount);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchUnread]);

  // Reset badge when user navigates to notifications page
  useEffect(() => {
    if (pathname === '/notifications') setUnreadCount(0);
  }, [pathname]);

  if (user && user.role !== 'customer') return null;
  if (pathname.startsWith('/provider') || pathname.startsWith('/admin')) return null;

  const isFavouritesActive = pathname === '/dashboard' && search.includes('tab=favourites');
  const isProfileActive    = pathname === '/dashboard' && !search.includes('tab=favourites');
  const isNotifActive      = pathname === '/notifications';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
      <div className="flex items-center justify-around h-16 px-1 safe-area-bottom">

        {/* Discover */}
        <Link to="/"
          className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${pathname === '/' ? 'text-primary-600' : 'text-gray-400'}`}>
          <Home className="h-5 w-5" strokeWidth={pathname === '/' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Discover</span>
        </Link>

        {/* My Bookings */}
        <Link to="/my-bookings"
          className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${pathname === '/my-bookings' ? 'text-primary-600' : 'text-gray-400'}`}>
          <Ticket className="h-5 w-5" strokeWidth={pathname === '/my-bookings' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Bookings</span>
        </Link>

        {/* Favourites */}
        <Link to="/dashboard?tab=favourites"
          className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${isFavouritesActive ? 'text-red-500' : 'text-gray-400'}`}>
          <Heart className={`h-5 w-5 ${isFavouritesActive ? 'fill-red-500' : ''}`} strokeWidth={isFavouritesActive ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Favourites</span>
        </Link>

        {/* Notifications */}
        <Link to="/notifications"
          className={`relative flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${isNotifActive ? 'text-nepal-blue' : 'text-gray-400'}`}>
          <div className="relative">
            <Bell className="h-5 w-5" strokeWidth={isNotifActive ? 2.5 : 2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-nepal-red text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </Link>

        {/* Profile */}
        <Link to="/dashboard"
          className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${isProfileActive ? 'text-primary-600' : 'text-gray-400'}`}>
          {user ? (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isProfileActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {user.name?.[0]?.toUpperCase()}
            </div>
          ) : (
            <User className="h-5 w-5" strokeWidth={isProfileActive ? 2.5 : 2} />
          )}
          <span className="text-[10px] font-medium">Profile</span>
        </Link>

      </div>
    </nav>
  );
}

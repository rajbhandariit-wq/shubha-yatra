import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Bus, Ticket, AlertTriangle, MessageSquare } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TYPE_CONFIG = {
  new_booking:       { icon: Ticket,        color: 'text-green-600',  bg: 'bg-green-50' },
  booking_cancelled: { icon: X,             color: 'text-red-600',    bg: 'bg-red-50' },
  schedule_changed:  { icon: Bus,           color: 'text-blue-600',   bg: 'bg-blue-50' },
  schedule_delayed:  { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  schedule_cancelled:{ icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50' },
  provider_message:  { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ dark = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // silently ignore polling failures
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalRef.current);
  }, [user, fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative p-2 rounded-lg transition-colors ${dark ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-nepal-red text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-nepal-blue" />
              <span className="font-semibold text-gray-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-nepal-red text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-nepal-blue hover:text-blue-800 font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.provider_message;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-sm font-medium text-gray-800 leading-snug ${!notif.isRead ? 'font-semibold' : ''}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-nepal-blue" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

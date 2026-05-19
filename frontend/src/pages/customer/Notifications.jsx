import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Ticket, X, AlertTriangle, MessageSquare, Bus } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TYPE_CONFIG = {
  new_booking:        { icon: Ticket,        color: 'text-green-600',  bg: 'bg-green-100',  label: 'New Booking' },
  booking_cancelled:  { icon: X,             color: 'text-red-600',    bg: 'bg-red-100',    label: 'Cancelled' },
  schedule_changed:   { icon: Bus,           color: 'text-blue-600',   bg: 'bg-blue-100',   label: 'Schedule Change' },
  schedule_delayed:   { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Delay' },
  schedule_cancelled: { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-100',    label: 'Cancelled' },
  provider_message:   { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Message' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-nepal-blue" />
            <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-nepal-red text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-sm text-nepal-blue font-medium hover:underline"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-nepal-blue border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell className="h-12 w-12 mb-3 opacity-25" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">You'll see updates about your bookings here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.provider_message;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                  className={`flex gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${
                    notif.isRead
                      ? 'bg-white border-gray-100'
                      : 'bg-blue-50 border-blue-100'
                  }`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug text-gray-800 ${!notif.isRead ? 'font-semibold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="shrink-0 w-2.5 h-2.5 mt-1 rounded-full bg-nepal-blue" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

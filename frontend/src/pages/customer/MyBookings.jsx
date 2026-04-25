import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bus, MapPin, Calendar, ArrowRight, Ticket, XCircle, Eye, Clock, Filter } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    customerAPI.getMyBookings().then(r => setBookings(r.data.bookings || [])).catch(() => toast.error('Failed to load bookings')).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(id);
    try {
      await customerAPI.cancelBooking(id, { reason: 'Customer request' });
      toast.success('Booking cancelled. Refund will be processed shortly.');
      setBookings(prev => prev.map(b => b.id === id ? {...b, bookingStatus: 'cancelled', paymentStatus: 'refunded'} : b));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally { setCancelling(null); }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.bookingStatus === filter);
  const statusColors = { confirmed:'badge-confirmed', cancelled:'badge-cancelled', pending:'badge-pending', completed:'badge-completed' };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {/* Header with Nepal BG */}
      <div className="relative bg-gradient-to-r from-nepal-blue to-blue-700 text-white py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 1200 200" className="w-full h-full" fill="white">
            <polygon points="0,200 100,100 200,160 300,80 400,140 500,60 600,120 700,40 800,100 900,50 1000,120 1100,70 1200,200"/>
          </svg>
        </div>
        <div className="relative max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3"><Ticket className="h-8 w-8" /> My Bookings</h1>
          <p className="text-blue-200 font-nepali">मेरो बुकिङहरू • {user?.name}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Filter className="h-4 w-4 text-gray-500" />
          {['all','confirmed','cancelled','completed','pending'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium border capitalize transition-all ${filter===s ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
              {s === 'all' ? 'All Bookings' : s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Ticket className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">No bookings found</h3>
            <p className="text-gray-400 font-nepali mb-6">कुनै बुकिङ भेटिएन</p>
            <Link to="/" className="btn-primary">Book Your First Trip 🚌</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(b => {
              const schedule = b.schedule;
              const route = schedule?.route;
              const bus = schedule?.bus;
              const isCancellable = b.bookingStatus === 'confirmed';
              const travelPast = schedule?.travelDate < new Date().toISOString().split('T')[0];

              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                  {/* Status bar */}
                  <div className={`h-1 ${b.bookingStatus==='confirmed'?'bg-green-500':b.bookingStatus==='cancelled'?'bg-red-500':b.bookingStatus==='completed'?'bg-blue-500':'bg-yellow-400'}`} />
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-nepal-blue to-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <Bus className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800 flex items-center gap-1.5">
                              {route?.source} <ArrowRight className="h-3.5 w-3.5 text-gray-400" /> {route?.destination}
                            </span>
                            <span className={statusColors[b.bookingStatus] || 'badge-pending'}>{b.bookingStatus}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{schedule?.travelDate}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{schedule?.departureTime}</span>
                            <span className="flex items-center gap-1"><Bus className="h-3 w-3" />{bus?.name}</span>
                            <span>Seats: {b.seats?.sort((a,c)=>a-c).join(', ')}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">Ticket: <span className="font-mono font-medium">{b.ticketNumber}</span></p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <p className="text-xl font-extrabold text-primary-600">NPR {b.totalAmount}</p>
                        <div className="flex gap-2">
                          <Link to={`/ticket/${b.id}`} state={{ booking: b }} className="flex items-center gap-1.5 px-3 py-1.5 bg-nepal-blue text-white text-xs font-medium rounded-lg hover:bg-blue-700">
                            <Eye className="h-3.5 w-3.5" /> View Ticket
                          </Link>
                          {isCancellable && !travelPast && (
                            <button onClick={() => handleCancel(b.id)} disabled={cancelling===b.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 disabled:opacity-50">
                              {cancelling===b.id ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-400 border-t-transparent"/> : <XCircle className="h-3.5 w-3.5" />} Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {b.bookingStatus === 'cancelled' && (
                      <div className="mt-3 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                        Cancelled{b.cancelledAt ? ` on ${new Date(b.cancelledAt).toLocaleDateString()}` : ''}{b.cancellationReason ? ` — ${b.cancellationReason}` : ''} • Refund: {b.paymentStatus}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

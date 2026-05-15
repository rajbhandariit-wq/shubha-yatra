import { useState, useEffect } from 'react';
import { Bus, MapPin, Calendar, Clock, User, CheckCircle, XCircle, ArrowRight, Building2, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminBookings() {
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]    = useState(null); // id being approved/rejected

  const load = () => {
    setLoading(true);
    adminAPI.getPendingBookings()
      .then(r => setBookings(r.data.bookings || []))
      .catch(() => toast.error('Failed to load pending bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    if (!confirm('Approve this booking and send the ticket to the customer?')) return;
    setActing(id);
    try {
      await adminAPI.approveBooking(id);
      toast.success('Booking approved — ticket sent to customer!');
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally { setActing(null); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection (optional):') ?? '';
    if (reason === null) return; // user clicked Cancel on prompt
    setActing(id);
    try {
      await adminAPI.rejectBooking(id, { reason: reason || 'Bank transfer not verified' });
      toast.success('Booking rejected and seats released.');
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally { setActing(null); }
  };

  return (
    <AdminLayout title="Pending Bank Transfers">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">
            Bank transfer bookings waiting for payment verification.
            Approve once you confirm the transfer in your bank statement.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500 mb-1">No pending bookings</h3>
          <p className="text-gray-400 text-sm">All bank transfer bookings have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const schedule = b.schedule;
            const route    = schedule?.route;
            const bus      = schedule?.bus;
            const customer = b.customer;
            const isActing = acting === b.id;

            return (
              <div key={b.id} className="bg-white rounded-2xl border border-yellow-200 shadow-sm overflow-hidden">
                {/* Yellow pending bar */}
                <div className="h-1 bg-yellow-400" />

                <div className="p-5">
                  <div className="flex flex-col lg:flex-row gap-4">

                    {/* Left — booking info */}
                    <div className="flex-1 space-y-3">
                      {/* Route + ticket */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-yellow-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800 flex items-center gap-1.5">
                              {route?.source} <ArrowRight className="h-3.5 w-3.5 text-gray-400" /> {route?.destination}
                            </span>
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                              Bank Transfer
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{b.ticketNumber}</p>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <p className="text-gray-400 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" /> Date</p>
                          <p className="font-semibold">{schedule?.travelDate}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <p className="text-gray-400 flex items-center gap-1 mb-1"><Clock className="h-3 w-3" /> Departure</p>
                          <p className="font-semibold">{schedule?.departureTime}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <p className="text-gray-400 flex items-center gap-1 mb-1"><Bus className="h-3 w-3" /> Bus</p>
                          <p className="font-semibold">{bus?.name}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <p className="text-gray-400 mb-1">Seats</p>
                          <p className="font-semibold">{b.seats?.sort((a,c)=>a-c).join(', ')}</p>
                        </div>
                      </div>

                      {/* Customer + reference */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span className="font-medium text-gray-700">{customer?.name}</span>
                          <span>{customer?.email}</span>
                          {customer?.phoneNumber && <span>· {customer.phoneNumber}</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          Ref: <span className="font-mono font-bold text-gray-700">{b.paymentReference}</span>
                        </span>
                        <span className="text-gray-400">
                          Received: {new Date(b.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Passengers */}
                      {b.passengerDetails?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {b.passengerDetails.map((p, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                              {p.name}{p.age ? `, ${p.age}y` : ''} · Seat {b.seats[i]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right — amount + actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Amount</p>
                        <p className="text-2xl font-extrabold text-primary-600">NPR {b.totalAmount}</p>
                        <p className="text-xs text-gray-400">{b.seats?.length} seat{b.seats?.length > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(b.id)}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">
                          {isActing
                            ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            : <CheckCircle className="h-4 w-4" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(b.id)}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Filter, RefreshCw, ArrowRight, CheckCircle, XCircle,
  User, Calendar, Bus, Clock, MapPin, ChevronLeft, ChevronRight,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
import useAdminPerms from '../../hooks/useAdminPerms';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};
const PAY_COLORS = {
  bank:   'bg-orange-100 text-orange-700',
  esewa:  'bg-green-100 text-green-700',
  khalti: 'bg-purple-100 text-purple-700',
  stripe: 'bg-blue-100 text-blue-700',
  online: 'bg-cyan-100 text-cyan-700',
};

function StatusBadge({ status }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-500'}`}>{status}</span>;
}

// ─── Pending Transfers card view ──────────────────────────────────────────────
function PendingCard({ b, onApprove, onReject, acting }) {
  const schedule = b.schedule;
  const route    = schedule?.route;
  const bus      = schedule?.bus;
  const customer = b.customer;
  const isActing = acting === b.id;

  return (
    <div className="bg-white rounded-2xl border border-yellow-200 shadow-sm overflow-hidden">
      <div className="h-1 bg-yellow-400" />
      <div className="p-5 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
              <Bus className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  {route?.source} <ArrowRight className="h-3.5 w-3.5 text-gray-400" /> {route?.destination}
                </span>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Bank Transfer</span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{b.ticketNumber}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              [Calendar, 'Date',      schedule?.travelDate],
              [Clock,    'Departure', schedule?.departureTime],
              [Bus,      'Bus',       bus?.name],
              [null,     'Seats',     b.seats?.sort((a, c) => a - c).join(', ')],
            ].map(([Icon, label, val]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-gray-400 flex items-center gap-1 mb-1">
                  {Icon && <Icon className="h-3 w-3" />} {label}
                </p>
                <p className="font-semibold">{val}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium text-gray-700">{customer?.name}</span> {customer?.email}
              {customer?.phoneNumber && <span>· {customer.phoneNumber}</span>}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Ref: <span className="font-mono font-bold text-gray-700">{b.paymentReference}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-gray-400">Amount</p>
            <p className="text-2xl font-extrabold text-primary-600">NPR {b.totalAmount}</p>
            <p className="text-xs text-gray-400">{b.seats?.length} seat{b.seats?.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onApprove(b.id)} disabled={isActing}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
              {isActing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <CheckCircle className="h-4 w-4" />}
              Approve
            </button>
            <button onClick={() => onReject(b.id)} disabled={isActing}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-semibold rounded-xl disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminBookings() {
  const { isManager, isSuperAdmin, assignedProviderId } = useAdminPerms();
  const [tab, setTab] = useState('all');

  // ── All Bookings state ──
  const [bookings, setBookings] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filters, setFilters]   = useState({ status: '', paymentMethod: '', providerId: assignedProviderId || '', from: '', to: '', dateType: 'booking', page: 1 });
  const [providers, setProviders] = useState([]);
  const searchRef = useRef(null);

  // ── Pending Transfers state ──
  const [pending, setPending]   = useState([]);
  const [pendLoading, setPendLoading] = useState(false);
  const [acting, setActing]     = useState(null);

  const loadAll = useCallback(() => {
    setLoading(true);
    const params = { ...filters, search: search || undefined };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    adminAPI.getAllBookings(params)
      .then(r => { setBookings(r.data.bookings || []); setTotal(r.data.total || 0); })
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, [filters, search]);

  const loadPending = useCallback(() => {
    setPendLoading(true);
    adminAPI.getPendingBookings()
      .then(r => setPending(r.data.bookings || []))
      .catch(() => toast.error('Failed to load pending bookings'))
      .finally(() => setPendLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (tab === 'pending' && pending.length === 0) loadPending();
  }, [tab]);

  useEffect(() => {
    if (isManager || isSuperAdmin) {
      adminAPI.getAllProviders({ limit: 100 })
        .then(r => setProviders(r.data.providers || []))
        .catch(() => {});
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => loadAll(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  const handleApprove = async (id) => {
    if (!confirm('Approve this booking and send ticket to customer?')) return;
    setActing(id);
    try {
      await adminAPI.approveBooking(id);
      toast.success('Booking approved — ticket sent!');
      setPending(p => p.filter(b => b.id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Approval failed'); }
    finally { setActing(null); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason (optional):') ?? '';
    if (reason === null) return;
    setActing(id);
    try {
      await adminAPI.rejectBooking(id, { reason: reason || 'Bank transfer not verified' });
      toast.success('Booking rejected and seats released.');
      setPending(p => p.filter(b => b.id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Rejection failed'); }
    finally { setActing(null); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout title="Bookings">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl shadow-sm p-1.5 mb-5 w-fit">
        {[['all', 'All Bookings'], ['pending', 'Pending Transfers']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === id ? 'bg-nepal-blue text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {label}
            {id === 'pending' && pending.length > 0 && (
              <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div className="space-y-4">
          {/* Search + Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="label text-xs">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                  className="input-field pl-9 py-1.5 text-sm" placeholder="Ticket #, customer name/email..." />
              </div>
            </div>
            <div>
              <label className="label text-xs">Status</label>
              <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="input-field py-1.5 text-sm">
                {[['','All'], ['confirmed','Confirmed'], ['pending','Pending'], ['cancelled','Cancelled'], ['completed','Completed']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Payment</label>
              <select value={filters.paymentMethod} onChange={e => setFilter('paymentMethod', e.target.value)} className="input-field py-1.5 text-sm">
                {[['','All'], ['bank','Bank'], ['esewa','eSewa'], ['khalti','Khalti'], ['stripe','Stripe']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {(isManager || isSuperAdmin) && providers.length > 0 && (
              <div>
                <label className="label text-xs">Provider</label>
                <select value={filters.providerId} onChange={e => setFilter('providerId', e.target.value)} className="input-field py-1.5 text-sm">
                  <option value="">All Providers</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.companyName || p.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label text-xs">Date type</label>
              <select value={filters.dateType} onChange={e => setFilter('dateType', e.target.value)} className="input-field py-1.5 text-sm">
                <option value="booking">Booking date</option>
                <option value="trip">Trip date</option>
              </select>
            </div>
            <div>
              <label className="label text-xs">From</label>
              <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)} className="input-field py-1.5 text-sm" />
            </div>
            <div>
              <label className="label text-xs">To</label>
              <input type="date" value={filters.to} onChange={e => setFilter('to', e.target.value)} className="input-field py-1.5 text-sm" />
            </div>
            <button onClick={() => { setSearch(''); setFilters({ status: '', paymentMethod: '', providerId: assignedProviderId || '', from: '', to: '', dateType: 'booking', page: 1 }); }}
              className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Clear
            </button>
            <button onClick={loadAll} className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <span className="ml-auto text-xs text-gray-400 self-end">{total} bookings</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{['Ticket #', 'Customer', 'Route', 'Provider', 'Trip Date', 'Fare', 'Payment', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.ticketNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{b.customer?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{b.customer?.phoneNumber}</p>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {b.schedule?.route ? `${b.schedule.route.source} → ${b.schedule.route.destination}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {b.schedule?.bus?.provider?.companyName || b.schedule?.bus?.provider?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{b.schedule?.travelDate || '—'}</td>
                        <td className="px-4 py-3 text-xs font-semibold">NPR {b.totalAmount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PAY_COLORS[b.paymentMethod] || 'bg-gray-100 text-gray-500'}`}>
                            {b.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={b.bookingStatus} /></td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr><td colSpan="8" className="text-center py-16 text-gray-400">No bookings found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilter('page', filters.page - 1)}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm text-gray-600">Page {filters.page} of {totalPages}</span>
              <button disabled={filters.page >= totalPages} onClick={() => setFilter('page', filters.page + 1)}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      )}

      {tab === 'pending' && (
        <div>
          <p className="text-gray-500 text-sm mb-4">Bank transfer bookings awaiting payment verification.</p>
          {pendLoading ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>
          ) : pending.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-500">No pending bookings</h3>
              <p className="text-gray-400 text-sm">All bank transfer bookings have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(b => (
                <PendingCard key={b.id} b={b} acting={acting} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
import { Search, Filter, ArrowRight, Bus, User, Calendar } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusColors = { confirmed:'badge-confirmed', cancelled:'badge-cancelled', pending:'badge-pending', completed:'badge-completed' };

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status:'', startDate:'', endDate:'' });

  const load = (f={}) => {
    setLoading(true);
    providerAPI.getBookings(f).then(r => setBookings(r.data.bookings||[])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => load(), []);

  const handleFilter = (e) => { e.preventDefault(); load(filters); };

  return (
    <ProviderLayout title="Bookings">
      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div><label className="label text-xs">Status</label>
          <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} className="input-field py-2 text-sm">
            <option value="">All</option>{['confirmed','cancelled','completed','pending'].map(s=><option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        <div><label className="label text-xs">From Date</label><input type="date" value={filters.startDate} onChange={e=>setFilters(f=>({...f,startDate:e.target.value}))} className="input-field py-2 text-sm"/></div>
        <div><label className="label text-xs">To Date</label><input type="date" value={filters.endDate} onChange={e=>setFilters(f=>({...f,endDate:e.target.value}))} className="input-field py-2 text-sm"/></div>
        <button type="submit" className="btn-primary py-2 text-sm flex items-center gap-2"><Filter className="h-4 w-4"/>Apply Filter</button>
        <button type="button" onClick={() => { setFilters({status:'',startDate:'',endDate:''}); load(); }} className="py-2 px-4 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Clear</button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{bookings.length} bookings</h3>
          <p className="text-sm text-gray-400">Total Revenue: <span className="font-bold text-green-600">NPR {bookings.filter(b=>b.paymentStatus==='paid').reduce((s,b)=>s+parseFloat(b.totalAmount),0).toLocaleString()}</span></p>
        </div>
        {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Ticket','Customer','Phone','Route','Date','Seats','Amount','Status'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{b.ticketNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.customer?.name}</p>
                      <p className="text-xs text-gray-400">{b.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {b.customer?.phoneNumber || '-'}
                    </td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1 whitespace-nowrap">{b.schedule?.route?.source}<ArrowRight className="h-3 w-3"/>{b.schedule?.route?.destination}</div></td>
                    <td className="px-4 py-3 whitespace-nowrap">{b.schedule?.travelDate}</td>
                    <td className="px-4 py-3">{b.seats?.join(', ')}</td>
                    <td className="px-4 py-3 font-semibold text-primary-600">NPR {b.totalAmount}</td>
                    <td className="px-4 py-3"><span className={statusColors[b.bookingStatus]||'badge-pending'}>{b.bookingStatus}</span></td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan="8" className="text-center py-16 text-gray-400">No bookings found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}

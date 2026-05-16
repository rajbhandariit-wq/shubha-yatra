import { useState, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
import useAdminPerms from '../../hooks/useAdminPerms';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  delayed:   'bg-yellow-100 text-yellow-700',
  boarding:  'bg-purple-100 text-purple-700',
};

export default function AdminSchedules() {
  const { isManager, isSuperAdmin } = useAdminPerms();
  const [schedules, setSchedules] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [filters, setFilters]     = useState({
    search: '', from: '', to: '', status: '', providerId: '', page: 1,
  });

  const load = useCallback((f = filters) => {
    setLoading(true);
    setSearched(true);
    const params = { ...f };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    adminAPI.getAllSchedules(params)
      .then(r => { setSchedules(r.data.schedules || []); setTotal(r.data.total || 0); })
      .catch(() => toast.error('Failed to load schedules'))
      .finally(() => setLoading(false));
  }, [filters]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout title="Trip Schedules">
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="label text-xs">Search route</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={filters.search} onChange={e => setFilter('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              className="input-field pl-9 py-1.5 text-sm" placeholder="Origin or destination..." />
          </div>
        </div>
        <div>
          <label className="label text-xs">Status</label>
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="input-field py-1.5 text-sm">
            {[['','All'], ['scheduled','Scheduled'], ['boarding','Boarding'], ['completed','Completed'], ['cancelled','Cancelled'], ['delayed','Delayed']].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
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
        <button onClick={() => load()} className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2">
          <Search className="h-4 w-4" /> Search
        </button>
        <button onClick={() => { const f = { search: '', from: '', to: '', status: '', providerId: '', page: 1 }; setFilters(f); load(f); }}
          className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Clear</button>
        <button onClick={() => load()} className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <span className="ml-auto text-xs text-gray-400 self-end">{searched ? `${total} schedules` : 'Use search to load'}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Route', 'Trip Date', 'Departure', 'Bus', 'Provider', 'Seats', 'Fare (NPR)', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {schedules.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {s.route ? `${s.route.source} → ${s.route.destination}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.travelDate}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.departureTime}</td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium">{s.bus?.name}</p>
                      <p className="text-gray-400">{s.bus?.registrationNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {s.bus?.provider?.companyName || s.bus?.provider?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-center">{s.availableSeats}/{s.bus?.totalSeats}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{s.fare}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-500'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && searched && schedules.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-16 text-gray-400">No schedules found</td></tr>
                )}
                {!searched && (
                  <tr><td colSpan="8" className="text-center py-16 text-gray-400">Enter search criteria and click Search</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={filters.page <= 1} onClick={() => { const f = { ...filters, page: filters.page - 1 }; setFilters(f); load(f); }}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-gray-600">Page {filters.page} of {totalPages}</span>
          <button disabled={filters.page >= totalPages} onClick={() => { const f = { ...filters, page: filters.page + 1 }; setFilters(f); load(f); }}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </AdminLayout>
  );
}

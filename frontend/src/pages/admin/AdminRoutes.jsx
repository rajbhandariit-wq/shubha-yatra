import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminRoutes() {
  const [routes, setRoutes]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '', isActive: '', providerId: '', page: 1,
  });

  const load = useCallback((f = filters) => {
    setLoading(true);
    const params = { ...f };
    Object.keys(params).forEach(k => (params[k] === '' || params[k] == null) && delete params[k]);
    adminAPI.getAllRoutes(params)
      .then(r => { setRoutes(r.data.routes || []); setTotal(r.data.total || 0); })
      .catch(() => toast.error('Failed to load routes'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, []);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const totalPages = Math.ceil(total / 50);

  return (
    <AdminLayout title="Routes">
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="label text-xs">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={filters.search} onChange={e => setFilter('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              className="input-field pl-9 py-1.5 text-sm" placeholder="Origin or destination..." />
          </div>
        </div>
        <div>
          <label className="label text-xs">Status</label>
          <select value={filters.isActive} onChange={e => setFilter('isActive', e.target.value)} className="input-field py-1.5 text-sm">
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button onClick={() => load()} className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2">
          <Search className="h-4 w-4" /> Search
        </button>
        <button onClick={() => { const f = { search: '', isActive: '', providerId: '', page: 1 }; setFilters(f); load(f); }}
          className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Clear</button>
        <button onClick={() => load()} className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <span className="ml-auto text-xs text-gray-400 self-end">{total} routes</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Origin', 'Destination', 'Distance', 'Duration', 'Fare (NPR)', 'Provider', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {routes.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.source}</td>
                    <td className="px-4 py-3 font-medium">{r.destination}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.distance ? `${r.distance} km` : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.estimatedDuration ? `${Math.floor(r.estimatedDuration / 60)}h ${r.estimatedDuration % 60}m` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">{r.fare}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.provider?.companyName || r.provider?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {routes.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-16 text-gray-400">No routes found</td></tr>
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

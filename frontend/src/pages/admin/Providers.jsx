import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, CheckCircle, XCircle, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
import useAdminPerms from '../../hooks/useAdminPerms';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active:   'bg-green-100 text-green-700',
  pending:  'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function AdminProviders() {
  const { isManager, isSuperAdmin, readonly } = useAdminPerms();
  const [providers, setProviders] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [acting, setActing]       = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    adminAPI.getAllProviders(params)
      .then(r => { setProviders(r.data.providers || []); setTotal(r.data.total || 0); })
      .catch(() => toast.error('Failed to load providers'))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id, name) => {
    if (!confirm(`Approve ${name}?`)) return;
    setActing(id);
    try {
      await adminAPI.approveProvider(id);
      toast.success(`${name} approved`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(null); }
  };

  const handleReject = async (id, name) => {
    if (!confirm(`Reject ${name}?`)) return;
    setActing(id);
    try {
      await adminAPI.rejectProvider(id);
      toast.success(`${name} rejected`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(null); }
  };

  const handleToggle = async (p) => {
    if (!confirm(`${p.isActive ? 'Deactivate' : 'Activate'} ${p.name}?`)) return;
    setActing(p.id);
    try {
      await adminAPI.toggleUserStatus(p.id);
      toast.success(`Provider ${p.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(null); }
  };

  return (
    <AdminLayout title="Providers">
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="label text-xs">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 py-1.5 text-sm" placeholder="Name, email, company..." />
          </div>
        </div>
        <div>
          <label className="label text-xs">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-1.5 text-sm">
            {[['','All'], ['pending','Pending Approval'], ['active','Active'], ['rejected','Rejected']].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <button onClick={load} className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <span className="ml-auto text-xs text-gray-400 self-end">{total} providers</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Provider', 'Company', 'Phone', 'Buses', 'Approval', 'Active', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {providers.map(p => {
                  const isActing = acting === p.id;
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 ${!p.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {p.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.companyName || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.phoneNumber || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">{p.busCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {p.isActive ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!readonly && (
                          <div className="flex items-center gap-1">
                            {p.status === 'pending' && (
                              <>
                                <button onClick={() => handleApprove(p.id, p.name)} disabled={isActing}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleReject(p.id, p.name)} disabled={isActing}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Reject">
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button onClick={() => handleToggle(p)} disabled={isActing}
                              className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg" title={p.isActive ? 'Deactivate' : 'Activate'}>
                              {p.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                        {readonly && <span className="text-xs text-gray-300 italic">View only</span>}
                      </td>
                    </tr>
                  );
                })}
                {providers.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-16 text-gray-400">
                    <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-200" />No providers found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

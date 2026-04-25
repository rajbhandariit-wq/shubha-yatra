import { useState, useEffect } from 'react';
import { BarChart2, Users, Shield, TrendingUp, BookOpen, XCircle, Bus } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [customerReports, setCustomerReports] = useState([]);
  const [providerReports, setProviderReports] = useState([]);
  const [tab, setTab] = useState('customers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getCustomerReports(), adminAPI.getProviderReports()])
      .then(([c, p]) => { setCustomerReports(c.data.reports || []); setProviderReports(p.data.reports || []); })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const totalCustomerSpend = customerReports.reduce((s, r) => s + r.totalSpent, 0);
  const totalProviderRevenue = providerReports.reduce((s, r) => s + r.totalRevenue, 0);

  return (
    <AdminLayout title="Platform Reports">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: 'Total Customers', value: customerReports.length, color: 'from-blue-500 to-indigo-600' },
          { icon: TrendingUp, label: 'Customer Spend', value: `NPR ${totalCustomerSpend.toLocaleString()}`, color: 'from-green-500 to-emerald-600' },
          { icon: Shield, label: 'Bus Operators', value: providerReports.length, color: 'from-purple-500 to-violet-600' },
          { icon: TrendingUp, label: 'Provider Revenue', value: `NPR ${totalProviderRevenue.toLocaleString()}`, color: 'from-yellow-500 to-orange-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5`}>
            <Icon className="h-6 w-6 mb-2 opacity-80" />
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="text-white/80 text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('customers')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'customers' ? 'bg-nepal-blue text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
          <Users className="h-4 w-4" /> Customer Report
        </button>
        <button onClick={() => setTab('providers')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'providers' ? 'bg-purple-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
          <Shield className="h-4 w-4" /> Provider Report
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent" />
        </div>
      ) : tab === 'customers' ? (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-blue-50 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-blue-800">Customer Analytics</h3>
            <span className="text-sm text-blue-500 ml-auto">{customerReports.length} customers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Customer', 'Email', 'Phone', 'Total Bookings', 'Cancelled', 'Total Spent', 'Avg/Booking'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customerReports.sort((a, b) => b.totalSpent - a.totalSpent).map(r => (
                  <tr key={r.customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">{r.customer.name?.[0]}</div>
                        <span className="font-medium">{r.customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.customer.email}</td>
                    <td className="px-4 py-3 text-gray-500">{r.customer.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-blue-400" /><span className="font-semibold">{r.totalBookings}</span></div>
                    </td>
                    <td className="px-4 py-3">
                      {r.cancelledBookings > 0
                        ? <span className="badge-cancelled">{r.cancelledBookings}</span>
                        : <span className="text-gray-300">0</span>}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600">NPR {r.totalSpent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">
                      NPR {r.totalBookings > 0 ? Math.round(r.totalSpent / r.totalBookings).toLocaleString() : 0}
                    </td>
                  </tr>
                ))}
                {customerReports.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-16 text-gray-400">No customer data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-purple-50 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-purple-800">Provider Analytics</h3>
            <span className="text-sm text-purple-500 ml-auto">{providerReports.length} operators</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Provider', 'Company', 'Total Buses', 'Active Buses', 'Bookings', 'Revenue', 'Cancellation Rate'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {providerReports.sort((a, b) => b.totalRevenue - a.totalRevenue).map(r => (
                  <tr key={r.provider.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">{r.provider.name?.[0]}</div>
                        <span className="font-medium">{r.provider.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.provider.companyName || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1"><Bus className="h-3.5 w-3.5 text-gray-400" /><span>{r.totalBuses}</span></div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={r.activeBuses > 0 ? 'badge-confirmed' : 'badge-cancelled'}>{r.activeBuses}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.totalBookings}</td>
                    <td className="px-4 py-3 font-bold text-green-600">NPR {r.totalRevenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${parseFloat(r.cancellationRate) > 20 ? 'bg-red-400' : parseFloat(r.cancellationRate) > 10 ? 'bg-yellow-400' : 'bg-green-400'}`}
                            style={{ width: `${Math.min(parseFloat(r.cancellationRate), 100)}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${parseFloat(r.cancellationRate) > 20 ? 'text-red-600' : parseFloat(r.cancellationRate) > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {r.cancellationRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {providerReports.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-16 text-gray-400">No provider data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
import { Users, Bus, TrendingUp, BookOpen, XCircle, Shield, ArrowRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
import { Link } from 'react-router-dom';


export default function AdminDashboard() {
  const [pendingProviders, setPendingProviders] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false)); 
    adminAPI.getPendingProviders()
    .then(r => setPendingProviders(r.data))
    .catch(console.error);
  }, []);

  const handleApprove = async (id) => {
    await adminAPI.approveProvider(id);
    setPendingProviders(prev => prev.filter(p => p.id !== id));
  };

  const handleReject = async (id) => {
    await adminAPI.rejectProvider(id);
    setPendingProviders(prev => prev.filter(p => p.id !== id));
  };

  const StatCard = ({ icon: Icon, label, value, color, bg, to }) => (
    <div className={`bg-white rounded-2xl p-5 border-l-4 ${color} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-extrabold text-gray-800 mb-1">{value ?? '—'}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
        <div className={`p-3 rounded-xl ${bg}`}><Icon className="h-6 w-6 text-white"/></div>
      </div>
      {to && <Link to={to} className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">View details <ArrowRight className="h-3 w-3"/></Link>}
    </div>
  );

  if (loading) return <AdminLayout title="Dashboard"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"/></div></AdminLayout>;

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center"><Shield className="h-8 w-8 text-white"/></div>
        <div>
          <h2 className="text-xl font-bold">Platform Overview</h2>
          
          <p className="text-gray-300 text-sm">Shubha Yatra Super Admin Panel • {new Date().toLocaleDateString('en-NP', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Total Customers" value={data?.totalCustomers} color="border-blue-500" bg="bg-blue-500" to="/admin/users?role=customer"/>
        <StatCard icon={Shield} label="Bus Operators" value={data?.totalProviders} color="border-purple-500" bg="bg-purple-500" to="/admin/users?role=provider"/>
        <StatCard icon={BookOpen} label="Total Bookings" value={data?.totalBookings} color="border-green-500" bg="bg-green-500"/>
        <StatCard icon={TrendingUp} label="Total Revenue" value={`NPR ${(data?.totalRevenue||0).toLocaleString()}`} color="border-yellow-500" bg="bg-yellow-500" to="/admin/reports"/>
        <StatCard icon={Bus} label="Active Buses" value={data?.activeBuses} color="border-nepal-red" bg="bg-nepal-red"/>
        <StatCard icon={XCircle} label="Cancelled Bookings" value={data?.cancelledBookings} color="border-red-400" bg="bg-red-400"/>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Recent Bookings</h3>
          <Link to="/admin/reports" className="text-xs text-yellow-600 hover:underline">View Reports</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['Ticket','Customer','Route','Date','Amount','Status'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.recentBookings||[]).map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{b.ticketNumber}</td>
                  <td className="px-4 py-3"><p className="font-medium">{b.customer?.name}</p><p className="text-xs text-gray-400">{b.customer?.email}</p></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">{b.schedule?.route?.source}<ArrowRight className="h-3 w-3"/>{b.schedule?.route?.destination}</div></td>
                  <td className="px-4 py-3">{b.schedule?.travelDate}</td>
                  <td className="px-4 py-3 font-bold text-green-600">NPR {b.totalAmount}</td>
                  <td className="px-4 py-3"><span className={b.bookingStatus==='confirmed'?'badge-confirmed':b.bookingStatus==='cancelled'?'badge-cancelled':'badge-pending'}>{b.bookingStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pending Provider Approvals */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
        <h3 className="font-bold text-gray-800 mb-4">
          Pending Provider Approvals
        </h3>

        {pendingProviders.length === 0 ? (
          <p className="text-sm text-gray-400">No pending providers</p>
        ) : (
          <div className="space-y-3">
            {pendingProviders.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between border p-4 rounded-xl"
              >
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.email} • {p.companyName}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleReject(p.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

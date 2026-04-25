import { useState, useEffect } from 'react';
import { Bus, Route, Users, BookOpen, TrendingUp, Calendar, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import { Link } from 'react-router-dom';

export default function ProviderDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerAPI.getDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, sub, to }) => (
    <div className={`bg-white rounded-2xl p-5 border-l-4 ${color} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${color.replace('border','bg').replace('-600','-100')}`}><Icon className={`h-6 w-6 ${color.replace('border','text')}`}/></div>
        {to && <Link to={to} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">View all <ArrowRight className="h-3 w-3"/></Link>}
      </div>
      <p className="text-3xl font-extrabold text-gray-800">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  if (loading) return <ProviderLayout title="Dashboard"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"/></div></ProviderLayout>;

  const statusColors = { scheduled:'bg-green-100 text-green-700', delayed:'bg-yellow-100 text-yellow-700', cancelled:'bg-red-100 text-red-700', boarding:'bg-blue-100 text-blue-700' };

  return (
    <ProviderLayout title="Dashboard">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-nepal-blue to-blue-700 rounded-2xl p-6 text-white mb-6">
        <p className="text-blue-200 text-sm font-nepali">स्वागतम् • Welcome back</p>
        <h2 className="text-2xl font-bold mt-1">Provider Dashboard</h2>
        <p className="text-blue-200 text-sm mt-1">{new Date().toLocaleDateString('en-NP', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} label="Total Revenue" value={`NPR ${(data?.totalRevenue || 0).toLocaleString()}`} color="border-green-600" sub="All time earnings" to="/provider/reports"/>
        <StatCard icon={Bus} label="Active Buses" value={data?.activeBuses || 0} color="border-blue-600" sub="Currently operating" to="/provider/buses"/>
        <StatCard icon={Route} label="Active Routes" value={data?.activeRoutes || 0} color="border-purple-600" sub="Available routes" to="/provider/routes"/>
        <StatCard icon={BookOpen} label="Upcoming Bookings" value={data?.upcomingBookings?.length || 0} color="border-nepal-red" sub="Next 30 days" to="/provider/bookings"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's trips */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar className="h-5 w-5 text-nepal-blue"/> Today's Trips</h3>
            <Link to="/provider/schedules" className="text-xs text-primary-500 hover:underline">Manage Schedules</Link>
          </div>
          {data?.todaySchedules?.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-200"/><p>No trips scheduled today</p></div>
          ) : (
            <div className="space-y-3">
              {(data?.todaySchedules || []).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm">{s.route?.source} → {s.route?.destination}</p>
                    <p className="text-xs text-gray-500">{s.bus?.name} • {s.departureTime} → {s.arrivalTime}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                    <p className="text-xs text-gray-400 mt-1">{s.availableSeats} seats left</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><BookOpen className="h-5 w-5 text-green-600"/> Recent Bookings</h3>
            <Link to="/provider/bookings" className="text-xs text-primary-500 hover:underline">View All</Link>
          </div>
          {data?.upcomingBookings?.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-200"/><p>No upcoming bookings</p></div>
          ) : (
            <div className="space-y-3">
              {(data?.upcomingBookings || []).slice(0,5).map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm">{b.customer?.name}</p>
                    <p className="text-xs text-gray-500">{b.schedule?.route?.source} → {b.schedule?.route?.destination} • {b.schedule?.travelDate}</p>
                    <p className="text-xs text-gray-400">{b.ticketNumber} • Seats: {b.seats?.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600 text-sm">NPR {b.totalAmount}</p>
                    <span className="badge-confirmed text-xs">{b.bookingStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/provider/buses', icon: Bus, label: 'Add Bus', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
          { to: '/provider/routes', icon: Route, label: 'Add Route', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
          { to: '/provider/schedules', icon: Calendar, label: 'New Schedule', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
          { to: '/provider/messaging', icon: Users, label: 'Message Customers', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to} className={`flex items-center gap-3 p-4 rounded-xl ${color} font-medium text-sm transition-colors`}>
            <Icon className="h-5 w-5 shrink-0" />{label}
          </Link>
        ))}
      </div>
    </ProviderLayout>
  );
}

import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Bus, Route, Download } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProviderReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({ start:'', end:'' });

  const load = (params={}) => {
    setLoading(true);
    providerAPI.getReports(params).then(r => setData(r.data)).catch(() => toast.error('Failed to load reports')).finally(() => setLoading(false));
  };
  useEffect(() => load(), []);

  const handleFilter = (e) => { e.preventDefault(); load({ startDate: dates.start, endDate: dates.end }); };

  return (
    <ProviderLayout title="Reports">
      <form onSubmit={handleFilter} className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div><label className="label text-xs">From</label><input type="date" value={dates.start} onChange={e=>setDates(d=>({...d,start:e.target.value}))} className="input-field py-2 text-sm"/></div>
        <div><label className="label text-xs">To</label><input type="date" value={dates.end} onChange={e=>setDates(d=>({...d,end:e.target.value}))} className="input-field py-2 text-sm"/></div>
        <button type="submit" className="btn-primary py-2 text-sm">Apply</button>
        <button type="button" onClick={() => { setDates({start:'',end:''}); load(); }} className="py-2 px-4 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">All Time</button>
      </form>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
          <TrendingUp className="h-7 w-7 mb-2 opacity-80"/>
          <p className="text-3xl font-extrabold">NPR {(data?.totalRevenue||0).toLocaleString()}</p>
          <p className="text-green-100 text-sm">Total Revenue</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
          <Bus className="h-7 w-7 mb-2 opacity-80"/>
          <p className="text-3xl font-extrabold">{data?.totalBookings||0}</p>
          <p className="text-blue-100 text-sm">Total Bookings</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white">
          <Route className="h-7 w-7 mb-2 opacity-80"/>
          <p className="text-3xl font-extrabold">{data?.salesByRoute?.length||0}</p>
          <p className="text-purple-100 text-sm">Active Routes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Bus */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Bus className="h-5 w-5 text-nepal-blue"/> Sales by Bus</h3>
          {loading ? <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"/></div> : (
            <div className="space-y-3">
              {(data?.salesByBus||[]).map((b, i) => {
                const maxRev = Math.max(...(data?.salesByBus||[]).map(x=>x.revenue), 1);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1"><span className="font-medium">{b.bus?.name}</span><span className="text-primary-600 font-bold">NPR {b.revenue.toLocaleString()}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-nepal-blue to-primary-500 rounded-full" style={{width:`${(b.revenue/maxRev)*100}%`}}/>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>{b.bus?.type}</span><span>{b.bookings} bookings • {b.passengers} passengers</span></div>
                  </div>
                );
              })}
              {(data?.salesByBus||[]).length === 0 && <p className="text-center text-gray-400 py-8">No data available</p>}
            </div>
          )}
        </div>

        {/* Sales by Route */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Route className="h-5 w-5 text-green-600"/> Sales by Route</h3>
          {loading ? <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"/></div> : (
            <div className="space-y-3">
              {(data?.salesByRoute||[]).map((r, i) => {
                const maxRev = Math.max(...(data?.salesByRoute||[]).map(x=>x.revenue), 1);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1"><span className="font-medium">{r.route?.source} → {r.route?.destination}</span><span className="text-green-600 font-bold">NPR {r.revenue.toLocaleString()}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{width:`${(r.revenue/maxRev)*100}%`}}/>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Fare: NPR {r.route?.fare}</span><span>{r.bookings} bookings</span></div>
                  </div>
                );
              })}
              {(data?.salesByRoute||[]).length === 0 && <p className="text-center text-gray-400 py-8">No data available</p>}
            </div>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}

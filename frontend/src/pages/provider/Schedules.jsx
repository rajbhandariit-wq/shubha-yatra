import { useState, useEffect } from 'react';
import { Plus, Calendar, Bus, X, ArrowRight } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusColors = { scheduled:'bg-green-100 text-green-700', delayed:'bg-yellow-100 text-yellow-700', cancelled:'bg-red-100 text-red-600', completed:'bg-blue-100 text-blue-700', boarding:'bg-purple-100 text-purple-700' };

export default function ProviderSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ busId:'', routeId:'', travelDate:'', departureTime:'', arrivalTime:'', fare:'' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [s, b, r] = await Promise.all([providerAPI.getSchedules(), providerAPI.getBuses(), providerAPI.getRoutes()]);
      setSchedules(s.data.schedules||[]); setBuses(b.data.buses||[]); setRoutes(r.data.routes||[]);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };
  useEffect(load, []);

  const handleRouteChange = (routeId) => {
    const r = routes.find(x => x.id === routeId);
    if (r) setForm(f => ({ ...f, routeId, departureTime: r.departureTime, arrivalTime: r.arrivalTime, fare: r.fare }));
    else setForm(f => ({ ...f, routeId }));
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await providerAPI.createSchedule({ ...form, fare: +form.fare });
      toast.success('Schedule created!'); setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <ProviderLayout title="Schedules">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">{schedules.length} schedule{schedules.length!==1?'s':''}</p>
        <button onClick={() => { setForm({ busId:'', routeId:'', travelDate:new Date().toISOString().split('T')[0], departureTime:'', arrivalTime:'', fare:'' }); setModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4"/>Add Schedule</button>
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"/></div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Date','Route','Bus','Departure','Arrival','Fare','Seats','Status'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedules.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.travelDate}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">{s.route?.source}<ArrowRight className="h-3 w-3 text-gray-400"/>{s.route?.destination}</div></td>
                  <td className="px-4 py-3 text-gray-600">{s.bus?.name}</td>
                  <td className="px-4 py-3">{s.departureTime}</td>
                  <td className="px-4 py-3">{s.arrivalTime}</td>
                  <td className="px-4 py-3 font-semibold text-primary-600">NPR {s.fare}</td>
                  <td className="px-4 py-3">{s.availableSeats}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status]||'bg-gray-100 text-gray-600'}`}>{s.status}</span></td>
                </tr>
              ))}
              {schedules.length === 0 && <tr><td colSpan="8" className="text-center py-16 text-gray-400">No schedules. Create one!</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Create Schedule</h2>
              <button onClick={() => setModal(false)}><X className="h-5 w-5 text-gray-400"/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="label">Bus *</label>
                <select value={form.busId} onChange={e=>setForm(f=>({...f,busId:e.target.value}))} className="input-field" required>
                  <option value="">Select Bus</option>{buses.map(b=><option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
                </select>
              </div>
              <div><label className="label">Route *</label>
                <select value={form.routeId} onChange={e=>handleRouteChange(e.target.value)} className="input-field" required>
                  <option value="">Select Route</option>{routes.map(r=><option key={r.id} value={r.id}>{r.source} → {r.destination} (NPR {r.fare})</option>)}
                </select>
              </div>
              <div><label className="label">Travel Date *</label><input type="date" value={form.travelDate} onChange={e=>setForm(f=>({...f,travelDate:e.target.value}))} className="input-field" required min={new Date().toISOString().split('T')[0]}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Departure Time</label><input type="time" value={form.departureTime} onChange={e=>setForm(f=>({...f,departureTime:e.target.value}))} className="input-field" required/></div>
                <div><label className="label">Arrival Time</label><input type="time" value={form.arrivalTime} onChange={e=>setForm(f=>({...f,arrivalTime:e.target.value}))} className="input-field" required/></div>
              </div>
              <div><label className="label">Fare (NPR) *</label><input type="number" value={form.fare} onChange={e=>setForm(f=>({...f,fare:e.target.value}))} className="input-field" placeholder="800" required/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving?'Creating...':'Create Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}

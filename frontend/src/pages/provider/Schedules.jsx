import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, X, ArrowRight, CalendarRange } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const statusColors = {
  scheduled: 'bg-green-100 text-green-700',
  delayed: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
  boarding: 'bg-purple-100 text-purple-700',
};
const today = new Date().toISOString().split('T')[0];
const initSingle = () => ({ busId: '', routeId: '', travelDate: today, departureTime: '', arrivalTime: '', fare: '' });
const initBulk = () => ({ busId: '', routeId: '', startDate: today, endDate: '', daysOfWeek: [], departureTime: '', arrivalTime: '', fare: '', dayOverrides: {} });

export default function ProviderSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState('single');
  const [form, setForm] = useState(initSingle());
  const [bulk, setBulk] = useState(initBulk());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [s, b, r] = await Promise.all([providerAPI.getSchedules(), providerAPI.getBuses(), providerAPI.getRoutes()]);
      setSchedules(s.data.schedules || []);
      setBuses(b.data.buses || []);
      setRoutes((r.data.routes || []).filter(rt => rt.isActive !== false));
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleRouteChange = (routeId) => {
    const r = routes.find(x => x.id === routeId);
    if (r) setForm(f => ({ ...f, routeId, departureTime: r.departureTime, arrivalTime: r.arrivalTime, fare: r.fare }));
    else setForm(f => ({ ...f, routeId }));
  };

  const handleBulkRouteChange = (routeId) => {
    const r = routes.find(x => x.id === routeId);
    if (r) setBulk(f => ({ ...f, routeId, departureTime: r.departureTime, arrivalTime: r.arrivalTime, fare: r.fare, dayOverrides: {} }));
    else setBulk(f => ({ ...f, routeId }));
  };

  const toggleDay = (day) => {
    setBulk(f => {
      const days = f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day];
      const overrides = { ...f.dayOverrides };
      if (!days.includes(day)) delete overrides[day];
      return { ...f, daysOfWeek: days, dayOverrides: overrides };
    });
  };

  const setDayOverride = (day, field, value) => {
    setBulk(f => ({
      ...f,
      dayOverrides: { ...f.dayOverrides, [day]: { ...(f.dayOverrides[day] || {}), [field]: value } },
    }));
  };

  const previewDates = useMemo(() => {
    if (!bulk.startDate || !bulk.endDate || bulk.daysOfWeek.length === 0) return [];
    const dates = [];
    const end = new Date(bulk.endDate);
    const cur = new Date(bulk.startDate);
    while (cur <= end && dates.length < 120) {
      if (bulk.daysOfWeek.includes(cur.getDay())) dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, [bulk.startDate, bulk.endDate, bulk.daysOfWeek]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await providerAPI.createSchedule({ ...form, fare: +form.fare });
      toast.success('Schedule created!'); setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleBulkSave = async (e) => {
    e.preventDefault();
    if (bulk.daysOfWeek.length === 0) return toast.error('Select at least one day');
    if (!bulk.endDate) return toast.error('Select an end date');
    if (previewDates.length === 0) return toast.error('No dates match the selected days in this range');
    setSaving(true);
    try {
      const res = await providerAPI.createBulkSchedules({
        busId: bulk.busId, routeId: bulk.routeId,
        startDate: bulk.startDate, endDate: bulk.endDate,
        daysOfWeek: bulk.daysOfWeek,
        departureTime: bulk.departureTime, arrivalTime: bulk.arrivalTime,
        fare: +bulk.fare,
        dayOverrides: bulk.dayOverrides,
      });
      toast.success(`${res.data.count} schedules created!`);
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const openModal = () => {
    setForm(initSingle()); setBulk(initBulk()); setTab('single'); setModal(true);
  };

  return (
    <ProviderLayout title="Schedules">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">{schedules.length} schedule{schedules.length !== 1 ? 's' : ''}</p>
        <button onClick={openModal} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" />Add Schedule</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Date', 'Route', 'Bus', 'Departure', 'Arrival', 'Fare', 'Seats', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedules.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.travelDate}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">{s.route?.source}<ArrowRight className="h-3 w-3 text-gray-400" />{s.route?.destination}</div></td>
                  <td className="px-4 py-3 text-gray-600">{s.bus?.name}</td>
                  <td className="px-4 py-3">{s.departureTime}</td>
                  <td className="px-4 py-3">{s.arrivalTime}</td>
                  <td className="px-4 py-3 font-semibold text-primary-600">NPR {s.fare}</td>
                  <td className="px-4 py-3">{s.availableSeats}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || 'bg-gray-100 text-gray-600'}`}>{s.status}</span></td>
                </tr>
              ))}
              {schedules.length === 0 && <tr><td colSpan="8" className="text-center py-16 text-gray-400">No schedules. Create one!</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full ${tab === 'bulk' ? 'max-w-xl' : 'max-w-md'} max-h-[90vh] flex flex-col`}>
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button type="button" onClick={() => setTab('single')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'single' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Calendar className="h-3.5 w-3.5" />Single Date
                </button>
                <button type="button" onClick={() => setTab('bulk')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'bulk' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  <CalendarRange className="h-3.5 w-3.5" />Weekly / Bulk
                </button>
              </div>
              <button onClick={() => setModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <div className="overflow-y-auto flex-1">
              {tab === 'single' ? (
                <form onSubmit={handleSave} className="p-6 space-y-4">
                  <div>
                    <label className="label">Bus *</label>
                    <select value={form.busId} onChange={e => setForm(f => ({ ...f, busId: e.target.value }))} className="input-field" required>
                      <option value="">Select Bus</option>{buses.map(b => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Route *</label>
                    <select value={form.routeId} onChange={e => handleRouteChange(e.target.value)} className="input-field" required>
                      <option value="">Select Route</option>{routes.map(r => <option key={r.id} value={r.id}>{r.source} → {r.destination} (NPR {r.fare})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Travel Date *</label>
                    <input type="date" value={form.travelDate} onChange={e => setForm(f => ({ ...f, travelDate: e.target.value }))} className="input-field" required min={today} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Departure</label><input type="time" value={form.departureTime} onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))} className="input-field" required /></div>
                    <div><label className="label">Arrival</label><input type="time" value={form.arrivalTime} onChange={e => setForm(f => ({ ...f, arrivalTime: e.target.value }))} className="input-field" required /></div>
                  </div>
                  <div>
                    <label className="label">Fare (NPR) *</label>
                    <input type="number" value={form.fare} onChange={e => setForm(f => ({ ...f, fare: e.target.value }))} className="input-field" placeholder="800" required />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Creating...' : 'Create Schedule'}</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBulkSave} className="p-6 space-y-4">
                  <div>
                    <label className="label">Bus *</label>
                    <select value={bulk.busId} onChange={e => setBulk(f => ({ ...f, busId: e.target.value }))} className="input-field" required>
                      <option value="">Select Bus</option>{buses.map(b => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Route *</label>
                    <select value={bulk.routeId} onChange={e => handleBulkRouteChange(e.target.value)} className="input-field" required>
                      <option value="">Select Route</option>{routes.map(r => <option key={r.id} value={r.id}>{r.source} → {r.destination} (NPR {r.fare})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">From Date *</label><input type="date" value={bulk.startDate} onChange={e => setBulk(f => ({ ...f, startDate: e.target.value }))} className="input-field" required min={today} /></div>
                    <div><label className="label">To Date *</label><input type="date" value={bulk.endDate} onChange={e => setBulk(f => ({ ...f, endDate: e.target.value }))} className="input-field" required min={bulk.startDate || today} /></div>
                  </div>
                  <div>
                    <label className="label">Days of Week *</label>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {DAY_LABELS.map((d, i) => (
                        <button key={i} type="button" onClick={() => toggleDay(i)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${bulk.daysOfWeek.includes(i) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Fare (NPR) *</label>
                    <input type="number" value={bulk.fare} onChange={e => setBulk(f => ({ ...f, fare: e.target.value }))} className="input-field" placeholder="800" required />
                  </div>

                  {bulk.daysOfWeek.length > 0 && (
                    <div>
                      <label className="label">Departure & Arrival per Day</label>
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-[52px_1fr_16px_1fr] gap-2 px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <span>Day</span><span>Departure</span><span /><span>Arrival</span>
                        </div>
                        {[...bulk.daysOfWeek].sort((a, b) => a - b).map(day => (
                          <div key={day} className="grid grid-cols-[52px_1fr_16px_1fr] gap-2 items-center px-3 py-2 border-t border-gray-50">
                            <span className="text-sm font-medium text-gray-700">{DAY_LABELS[day]}</span>
                            <input type="time"
                              value={bulk.dayOverrides[day]?.departureTime ?? bulk.departureTime}
                              onChange={e => setDayOverride(day, 'departureTime', e.target.value)}
                              className="input-field py-1.5 text-sm" required />
                            <ArrowRight className="h-3 w-3 text-gray-400 justify-self-center" />
                            <input type="time"
                              value={bulk.dayOverrides[day]?.arrivalTime ?? bulk.arrivalTime}
                              onChange={e => setDayOverride(day, 'arrivalTime', e.target.value)}
                              className="input-field py-1.5 text-sm" required />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Times are auto-filled from the route. Edit individual days as needed.</p>
                    </div>
                  )}

                  {previewDates.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-blue-800 mb-2">{previewDates.length} schedule{previewDates.length !== 1 ? 's' : ''} will be created</p>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {previewDates.map((d, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                            {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={saving || previewDates.length === 0} className="flex-1 btn-primary">
                      {saving ? 'Creating...' : `Create ${previewDates.length > 0 ? previewDates.length + ' ' : ''}Schedule${previewDates.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}

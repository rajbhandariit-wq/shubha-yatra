import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, X, ArrowRight, Clock, DollarSign } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = { source:'', destination:'', distance:'', estimatedDuration:'', fare:'', departureTime:'', arrivalTime:'', stops:'' };
const NEPAL_CITIES = ['Kathmandu','Pokhara','Chitwan','Lumbini','Butwal','Nepalgunj','Dharan','Biratnagar','Janakpur','Bhairahawa','Birgunj','Hetauda','Dhangadhi','Illam','Tansen','Mustang'];

export default function ProviderRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => { providerAPI.getRoutes().then(r => setRoutes(r.data.routes||[])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (r) => { setForm({ source:r.source, destination:r.destination, distance:r.distance||'', estimatedDuration:r.estimatedDuration||'', fare:r.fare, departureTime:r.departureTime, arrivalTime:r.arrivalTime, stops:(r.stops||[]).join(', ') }); setEditing(r.id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const data = { ...form, distance: +form.distance || undefined, estimatedDuration: +form.estimatedDuration || undefined, fare: +form.fare, stops: form.stops ? form.stops.split(',').map(s=>s.trim()).filter(Boolean) : [] };
    try {
      if (editing) { await providerAPI.updateRoute(editing, data); toast.success('Route updated!'); }
      else { await providerAPI.createRoute(data); toast.success('Route created!'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save route'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this route?')) return;
    try { await providerAPI.deleteRoute(id); toast.success('Route deactivated'); load(); }
    catch { toast.error('Failed'); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm(p=>({...p,[k]:e.target.value})) });

  return (
    <ProviderLayout title="Manage Routes">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">{routes.length} route{routes.length!==1?'s':''} configured</p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4"/>Add Route</button>
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"/></div> : (
        <div className="space-y-3">
          {routes.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <span className="text-primary-500">{r.source}</span>
                    <ArrowRight className="h-5 w-5 text-gray-400"/>
                    <span className="text-nepal-blue">{r.destination}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>{r.isActive?'Active':'Inactive'}</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-gray-400"/>{r.departureTime} → {r.arrivalTime}</div>
                  <div className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-green-500"/><span className="font-bold text-primary-600">NPR {r.fare}</span></div>
                  {r.distance && <span className="text-gray-400">{r.distance} km</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(r)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 className="h-3.5 w-3.5"/>Edit</button>
                  <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-100 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5"/>Remove</button>
                </div>
              </div>
              {(r.stops||[]).length > 0 && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><MapPin className="h-3 w-3"/>Stops: {r.stops.join(' → ')}</p>}
            </div>
          ))}
          {routes.length === 0 && <div className="text-center py-16 bg-white rounded-2xl text-gray-400"><MapPin className="h-16 w-16 mx-auto mb-3 text-gray-200"/><p>No routes yet. Add your first route!</p></div>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editing?'Edit Route':'Add New Route'}</h2>
              <button onClick={() => setModal(false)}><X className="h-5 w-5 text-gray-400"/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">From (Source) *</label>
                  <select {...f('source')} className="input-field" required>
                    <option value="">Select city</option>{NEPAL_CITIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">To (Destination) *</label>
                  <select {...f('destination')} className="input-field" required>
                    <option value="">Select city</option>{NEPAL_CITIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Departure Time *</label><input type="time" {...f('departureTime')} className="input-field" required/></div>
                <div><label className="label">Arrival Time *</label><input type="time" {...f('arrivalTime')} className="input-field" required/></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Fare (NPR) *</label><input type="number" {...f('fare')} className="input-field" placeholder="800" required min="1"/></div>
                <div><label className="label">Distance (km)</label><input type="number" {...f('distance')} className="input-field" placeholder="204"/></div>
                <div><label className="label">Duration (min)</label><input type="number" {...f('estimatedDuration')} className="input-field" placeholder="420"/></div>
              </div>
              <div><label className="label">Stops (comma separated)</label><input {...f('stops')} className="input-field" placeholder="Mugling, Damauli"/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving?'Saving...':editing?'Update Route':'Add Route'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}

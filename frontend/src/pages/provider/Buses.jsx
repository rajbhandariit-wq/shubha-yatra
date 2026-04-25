import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Bus, CheckCircle, XCircle, X } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = { name:'', registrationNumber:'', type:'Non-AC', totalSeats:40, amenities:[] };
const BUS_TYPES = ['AC','Non-AC','Sleeper','Deluxe','Super-Deluxe'];
const ALL_AMENITIES = ['WiFi','AC','USB Charging','Water Bottle','Blanket','Pillow','Sleeper Berth','Reclining Seats','Fan','TV'];

export default function ProviderBuses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => { providerAPI.getBuses().then(r => setBuses(r.data.buses||[])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (b) => { setForm({ name:b.name, registrationNumber:b.registrationNumber, type:b.type, totalSeats:b.totalSeats, amenities:b.amenities||[] }); setEditing(b.id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await providerAPI.updateBus(editing, form); toast.success('Bus updated!'); }
      else { await providerAPI.createBus(form); toast.success('Bus added!'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save bus'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this bus?')) return;
    try { await providerAPI.deleteBus(id); toast.success('Bus deactivated'); load(); }
    catch { toast.error('Failed'); }
  };

  const toggleAmenity = (a) => setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x=>x!==a) : [...f.amenities, a] }));

  return (
    <ProviderLayout title="Manage Buses">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">{buses.length} bus{buses.length!==1?'es':''} registered</p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4"/>Add Bus</button>
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"/></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buses.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-nepal-blue to-blue-600 rounded-xl flex items-center justify-center">
                    <Bus className="h-6 w-6 text-white"/>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{b.name}</h3>
                    <p className="text-xs text-gray-400">{b.registrationNumber}</p>
                  </div>
                </div>
                {b.isActive ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0"/> : <XCircle className="h-5 w-5 text-red-400 shrink-0"/>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="bg-gray-50 rounded-lg px-3 py-1.5"><p className="text-xs text-gray-400">Type</p><p className="font-semibold">{b.type}</p></div>
                <div className="bg-gray-50 rounded-lg px-3 py-1.5"><p className="text-xs text-gray-400">Seats</p><p className="font-semibold">{b.totalSeats}</p></div>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {(b.amenities||[]).slice(0,3).map(a => <span key={a} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{a}</span>)}
                {(b.amenities||[]).length > 3 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{b.amenities.length-3} more</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(b)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><Edit2 className="h-3.5 w-3.5"/>Edit</button>
                <button onClick={() => handleDelete(b.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-red-100 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5"/>Remove</button>
              </div>
            </div>
          ))}
          {buses.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400"><Bus className="h-16 w-16 mx-auto mb-3 text-gray-200"/><p className="font-medium">No buses yet. Add your first bus!</p></div>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editing?'Edit Bus':'Add New Bus'}</h2>
              <button onClick={() => setModal(false)}><X className="h-5 w-5 text-gray-400"/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="label">Bus Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input-field" placeholder="Himalayan Express 001" required/></div>
              <div><label className="label">Registration Number *</label><input value={form.registrationNumber} onChange={e=>setForm(f=>({...f,registrationNumber:e.target.value}))} className="input-field" placeholder="BA 1 KHA 1234" required/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Bus Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="input-field">
                    {BUS_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Total Seats</label><input type="number" value={form.totalSeats} onChange={e=>setForm(f=>({...f,totalSeats:+e.target.value}))} className="input-field" min="10" max="60" required/></div>
              </div>
              <div>
                <label className="label">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_AMENITIES.map(a => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-1.5 rounded-full text-sm border transition-all ${form.amenities.includes(a)?'bg-primary-500 text-white border-primary-500':'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300'}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving?'Saving...':editing?'Update Bus':'Add Bus'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}

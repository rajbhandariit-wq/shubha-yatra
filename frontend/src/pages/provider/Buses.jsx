import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Bus, CheckCircle, XCircle, X, ChevronRight, ChevronLeft, Minus } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import SeatMap from '../../components/SeatMap';
import { BUS_CATEGORIES, generateSeatLayout } from '../../utils/seatLayout';
import toast from 'react-hot-toast';

const EMPTY = { name: '', registrationNumber: '', busCategory: 'standard', type: 'Non-AC', totalSeats: 40, amenities: [], seatLayout: null };
const ALL_AMENITIES = ['WiFi', 'AC', 'USB Charging', 'Water Bottle', 'Blanket', 'Pillow', 'Sleeper Berth', 'Reclining Seats', 'Fan', 'TV'];

function CategoryCard({ id, cat, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
    >
      <div className={`text-sm font-bold mb-1 ${selected ? 'text-primary-700' : 'text-gray-800'}`}>{cat.label}</div>
      <div className="text-xs text-gray-500">{cat.description}</div>
      <div className={`mt-2 text-xs font-medium ${selected ? 'text-primary-600' : 'text-gray-400'}`}>
        Default: {cat.defaultSeats} seats
      </div>
    </button>
  );
}

export default function ProviderBuses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    providerAPI.getBuses().then(r => setBuses(r.data.buses || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => {
    const layout = generateSeatLayout('standard', 40);
    setForm({ ...EMPTY, seatLayout: layout });
    setEditing(null);
    setStep(1);
    setModal(true);
  };

  const openEdit = (b) => {
    const busCategory = b.seatLayout?.busCategory || 'standard';
    const layout = (b.seatLayout?.seats?.length > 0 ? b.seatLayout : null) || generateSeatLayout(busCategory, b.totalSeats);
    setForm({
      name: b.name,
      registrationNumber: b.registrationNumber,
      busCategory,
      type: b.type,
      totalSeats: b.totalSeats,
      amenities: b.amenities || [],
      seatLayout: layout,
    });
    setEditing(b.id);
    setStep(1);
    setModal(true);
  };

  const handleCategoryChange = (cat) => {
    const cfg = BUS_CATEGORIES[cat];
    const layout = generateSeatLayout(cat, cfg.defaultSeats);
    setForm(f => ({ ...f, busCategory: cat, totalSeats: cfg.defaultSeats, seatLayout: layout }));
  };

  const handleSeatsChange = (val) => {
    const cfg = BUS_CATEGORIES[form.busCategory] || BUS_CATEGORIES.standard;
    const n = Math.max(cfg.minSeats, Math.min(cfg.maxSeats, parseInt(val) || cfg.minSeats));
    const layout = generateSeatLayout(form.busCategory, n);
    setForm(f => ({ ...f, totalSeats: n, seatLayout: layout }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing) { await providerAPI.updateBus(editing, payload); toast.success('Bus updated!'); }
      else { await providerAPI.createBus(payload); toast.success('Bus added!'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bus');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this bus?')) return;
    try { await providerAPI.deleteBus(id); toast.success('Bus deactivated'); load(); }
    catch { toast.error('Failed'); }
  };

  const toggleAmenity = (a) => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }));

  const cfg = BUS_CATEGORIES[form.busCategory] || BUS_CATEGORIES.standard;
  const previewSeats = (form.seatLayout?.seats || []).map(s => ({ ...s, status: 'available' }));

  return (
    <ProviderLayout title="Manage Buses">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">{buses.length} bus{buses.length !== 1 ? 'es' : ''} registered</p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" />Add Bus</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buses.map(b => {
            const catLabel = b.seatLayout?.busCategory ? BUS_CATEGORIES[b.seatLayout.busCategory]?.label : null;
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-nepal-blue to-blue-600 rounded-xl flex items-center justify-center">
                      <Bus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{b.name}</h3>
                      <p className="text-xs text-gray-400">{b.registrationNumber}</p>
                    </div>
                  </div>
                  {b.isActive ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> : <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="bg-gray-50 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-gray-400">Category</p>
                    <p className="font-semibold">{catLabel || b.type || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-gray-400">Seats</p>
                    <p className="font-semibold">{b.totalSeats}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {(b.amenities || []).slice(0, 3).map(a => (
                    <span key={a} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                  {(b.amenities || []).length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{b.amenities.length - 3} more</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    <Edit2 className="h-3.5 w-3.5" />Edit
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-red-100 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />Remove
                  </button>
                </div>
              </div>
            );
          })}
          {buses.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Bus className="h-16 w-16 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No buses yet. Add your first bus!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold">{editing ? 'Edit Bus' : 'Add New Bus'}</h2>
                <p className="text-xs text-gray-400">Step {step} of 2 — {step === 1 ? 'Bus Details' : 'Seat Layout'}</p>
              </div>
              <button onClick={() => setModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            {/* Step indicators */}
            <div className="flex px-6 pt-4 gap-2">
              {[1, 2].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-primary-500' : 'bg-gray-200'}`} />
              ))}
            </div>

            {/* Step 1 — Bus Details */}
            {step === 1 && (
              <div className="p-6 space-y-5">
                <div>
                  <label className="label">Bus Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input-field" placeholder="Himalayan Express 001" required />
                </div>
                <div>
                  <label className="label">Registration Number *</label>
                  <input value={form.registrationNumber} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))}
                    className="input-field" placeholder="BA 1 KHA 1234" required />
                </div>

                <div>
                  <label className="label">Bus Category *</label>
                  <div className="flex gap-3">
                    {Object.entries(BUS_CATEGORIES).map(([id, cat]) => (
                      <CategoryCard key={id} id={id} cat={cat} selected={form.busCategory === id} onSelect={handleCategoryChange} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_AMENITIES.map(a => (
                      <button key={a} type="button" onClick={() => toggleAmenity(a)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${form.amenities.includes(a) ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="button"
                    disabled={!form.name.trim() || !form.registrationNumber.trim()}
                    onClick={() => setStep(2)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                    Next: Seat Layout <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Seat Layout */}
            {step === 2 && (
              <div className="p-6 space-y-5">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">Number of Seats</span>
                    <span className="text-xs text-gray-400">{cfg.minSeats}–{cfg.maxSeats} for {cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <button type="button"
                      onClick={() => handleSeatsChange(form.totalSeats - 1)}
                      disabled={form.totalSeats <= cfg.minSeats}
                      className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-white disabled:opacity-40">
                      <Minus className="h-4 w-4" />
                    </button>
                    <input type="number" value={form.totalSeats}
                      onChange={e => handleSeatsChange(e.target.value)}
                      className="w-20 text-center input-field py-2 font-bold text-lg"
                      min={cfg.minSeats} max={cfg.maxSeats} />
                    <button type="button"
                      onClick={() => handleSeatsChange(form.totalSeats + 1)}
                      disabled={form.totalSeats >= cfg.maxSeats}
                      className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-white disabled:opacity-40">
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-500">{cfg.label} · {cfg.layoutType} layout</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Seat Preview (as customers will see)</p>
                  {previewSeats.length > 0 && (
                    <SeatMap
                      seats={previewSeats}
                      layout={form.seatLayout}
                      selectedSeats={[]}
                      readonly
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button type="button" onClick={handleSave} disabled={saving}
                    className="flex-1 btn-primary">
                    {saving ? 'Saving...' : editing ? 'Update Bus' : 'Add Bus'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}

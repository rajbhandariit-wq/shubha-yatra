import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Bus, X, ChevronRight, ChevronLeft, Minus, Power, PowerOff } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import SeatMap from '../../components/SeatMap';
import { BUS_CATEGORIES, generateSeatLayout } from '../../utils/seatLayout';
import toast from 'react-hot-toast';

const BUS_TYPES = ['AC', 'Non-AC', 'Sleeper', 'Deluxe', 'Super-Deluxe', 'Others'];

const EMPTY = {
  name: '', registrationNumber: '', busCategory: 'standard', type: 'Non-AC', customType: 'Tata Sumo', amenities: [],
  leftCols: 2, rightCols: 2, regularRows: 10, backRowSeats: 0, seatLayout: null,
};
const ALL_AMENITIES = ['WiFi', 'AC', 'USB Charging', 'Water Bottle', 'Blanket', 'Pillow', 'Sleeper Berth', 'Reclining Seats', 'Fan', 'TV'];

function Stepper({ label, value, onDec, onInc, min, max }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onDec} disabled={value <= min}
          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center font-bold text-lg">{value}</span>
        <button type="button" onClick={onInc} disabled={value >= max}
          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function rebuild(f) {
  return generateSeatLayout({
    busCategory: f.busCategory,
    leftCols: f.leftCols,
    rightCols: f.rightCols,
    regularRows: f.regularRows,
    backRowSeats: f.backRowSeats,
  });
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
    const f = { ...EMPTY };
    setForm({ ...f, seatLayout: rebuild(f) });
    setEditing(null);
    setStep(1);
    setModal(true);
  };

  const openEdit = (b) => {
    const sl = b.seatLayout;
    const busCategory = sl?.busCategory || 'standard';
    const leftCols    = sl?.leftCols    ?? 2;
    const rightCols   = sl?.rightCols   ?? 2;
    const regularRows = sl?.regularRows ?? 10;
    const backRowSeats = sl?.backRowSeats ?? 0;
    const knownTypes = ['AC', 'Non-AC', 'Sleeper', 'Deluxe', 'Super-Deluxe'];
    const isCustomType = b.type && !knownTypes.includes(b.type);
    const resolvedCategory = isCustomType ? 'others' : (busCategory || 'standard');
    const f = {
      name: b.name,
      registrationNumber: b.registrationNumber,
      busCategory: resolvedCategory,
      type: isCustomType ? 'Others' : (b.type || 'Non-AC'),
      customType: isCustomType ? b.type : 'Tata Sumo',
      amenities: b.amenities || [],
      leftCols, rightCols, regularRows, backRowSeats,
      seatLayout: sl?.seats?.length > 0 ? sl : rebuild({ busCategory, leftCols, rightCols, regularRows, backRowSeats }),
    };
    setForm(f);
    setEditing(b.id);
    setStep(1);
    setModal(true);
  };

  const update = (patch) => {
    setForm(f => {
      const next = { ...f, ...patch };
      next.seatLayout = rebuild(next);
      return next;
    });
  };

  const handleCategoryChange = (cat) => {
    const cfg = BUS_CATEGORIES[cat];
    update({ busCategory: cat, leftCols: cfg.leftCols, rightCols: cfg.rightCols });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const totalSeats = form.seatLayout?.totalSeats || form.seatLayout?.seats?.length || 0;
      const resolvedType = (form.busCategory === 'others' || form.type === 'Others')
        ? (form.customType.trim() || 'Tata Sumo')
        : form.type;
      const payload = {
        name: form.name,
        registrationNumber: form.registrationNumber,
        type: resolvedType,
        amenities: form.amenities,
        totalSeats,
        seatLayout: form.seatLayout,
      };
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

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this bus? It will be hidden from schedules.')) return;
    try { await providerAPI.deleteBus(id); toast.success('Bus deactivated'); load(); }
    catch { toast.error('Failed to deactivate'); }
  };

  const handleReactivate = async (id) => {
    try { await providerAPI.updateBus(id, { isActive: true }); toast.success('Bus reactivated'); load(); }
    catch { toast.error('Failed to reactivate'); }
  };

  const toggleAmenity = (a) => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }));

  const previewSeats = (form.seatLayout?.seats || []).map(s => ({ ...s, status: 'available' }));
  const totalSeats = form.seatLayout?.totalSeats ?? previewSeats.length;

  return (
    <ProviderLayout title="Manage Buses">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{buses.length} bus{buses.length !== 1 ? 'es' : ''}</span>
          <span className="flex items-center gap-1 text-green-700 font-medium"><Power className="h-3.5 w-3.5" />{buses.filter(b => b.isActive !== false).length} active</span>
          {buses.filter(b => b.isActive === false).length > 0 && (
            <span className="flex items-center gap-1 text-red-500 font-medium"><PowerOff className="h-3.5 w-3.5" />{buses.filter(b => b.isActive === false).length} inactive</span>
          )}
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" />Add Bus</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buses.map(b => {
            const sl = b.seatLayout;
            const active = b.isActive !== false;
            const layoutLabel = sl?.busCategory ? BUS_CATEGORIES[sl.busCategory]?.label : null;
            const layoutDetail = sl?.layoutType ? `${sl.layoutType} · ${sl.totalSeats || b.totalSeats} seats` : null;
            return (
              <div key={b.id} className={`rounded-2xl border transition-shadow p-5 ${active ? 'bg-white border-gray-200 hover:shadow-md' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? 'bg-gradient-to-br from-nepal-blue to-blue-600' : 'bg-gray-300'}`}>
                      <Bus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{b.name}</h3>
                      <p className="text-xs text-gray-400">{b.registrationNumber}</p>
                    </div>
                  </div>
                  {active
                    ? <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700"><Power className="h-3 w-3" />Active</span>
                    : <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600"><PowerOff className="h-3 w-3" />Inactive</span>
                  }
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="bg-gray-100 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-gray-400">Category</p>
                    <p className="font-semibold">{layoutLabel || b.type || '—'}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-gray-400">Layout</p>
                    <p className="font-semibold">{layoutDetail || `${b.totalSeats} seats`}</p>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {(b.amenities || []).slice(0, 3).map(a => (
                    <span key={a} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                  {(b.amenities || []).length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{b.amenities.length - 3} more</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    <Edit2 className="h-3.5 w-3.5" />Edit
                  </button>
                  {active ? (
                    <button onClick={() => handleDeactivate(b.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-red-100 rounded-lg hover:bg-red-50 text-red-500">
                      <PowerOff className="h-3.5 w-3.5" />Deactivate
                    </button>
                  ) : (
                    <button onClick={() => handleReactivate(b.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-green-200 rounded-lg hover:bg-green-50 text-green-600">
                      <Power className="h-3.5 w-3.5" />Reactivate
                    </button>
                  )}
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
                  <label className="label">Bus Type *</label>
                  <div className="flex flex-wrap gap-2">
                    {BUS_TYPES.map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${form.type === t ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {form.type === 'Others' && (
                    <input
                      value={form.customType}
                      onChange={e => setForm(f => ({ ...f, customType: e.target.value }))}
                      className="input-field mt-3"
                      placeholder="e.g. Tata Sumo, Hiace, Bolero..."
                    />
                  )}
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

                {/* Template presets */}
                <div>
                  <label className="label">Vehicle Type</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(BUS_CATEGORIES).map(([id, cat]) => (
                      <button key={id} type="button" onClick={() => handleCategoryChange(id)}
                        className={`flex-1 min-w-[80px] rounded-xl border-2 py-2 px-3 text-left text-xs transition-all ${form.busCategory === id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                        <div className="font-bold">{cat.label}</div>
                        <div className="text-gray-400">{cat.description}</div>
                      </button>
                    ))}
                  </div>
                  {form.busCategory === 'others' && (
                    <div className="mt-3">
                      <label className="label">Vehicle Name</label>
                      <input
                        value={form.customType}
                        onChange={e => setForm(f => ({ ...f, customType: e.target.value }))}
                        className="input-field"
                        placeholder="e.g. Tata Sumo, Hiace, Bolero..."
                      />
                    </div>
                  )}
                </div>

                {/* Layout controls */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-6 flex-wrap">
                    <Stepper label="Left seats/row" value={form.leftCols} min={1} max={3}
                      onDec={() => update({ leftCols: form.leftCols - 1 })}
                      onInc={() => update({ leftCols: form.leftCols + 1 })} />
                    <div className="text-gray-300 text-2xl pb-1">│</div>
                    <Stepper label="Right seats/row" value={form.rightCols} min={1} max={3}
                      onDec={() => update({ rightCols: form.rightCols - 1 })}
                      onInc={() => update({ rightCols: form.rightCols + 1 })} />
                    <div className="h-10 w-px bg-gray-200" />
                    <Stepper label="Regular rows" value={form.regularRows} min={1} max={20}
                      onDec={() => update({ regularRows: form.regularRows - 1 })}
                      onInc={() => update({ regularRows: form.regularRows + 1 })} />
                  </div>

                  {/* Back row */}
                  <div className="border-t border-gray-200 pt-3 flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={form.backRowSeats > 0}
                        onChange={e => update({ backRowSeats: e.target.checked ? 5 : 0 })}
                        className="w-4 h-4 rounded accent-primary-500" />
                      <span className="text-sm font-medium text-gray-700">Add back row</span>
                    </label>
                    {form.backRowSeats > 0 && (
                      <Stepper label="Back row seats" value={form.backRowSeats} min={3} max={7}
                        onDec={() => update({ backRowSeats: form.backRowSeats - 1 })}
                        onInc={() => update({ backRowSeats: form.backRowSeats + 1 })} />
                    )}
                  </div>

                  <div className="text-sm font-semibold text-primary-700">
                    Total seats: {totalSeats}
                    <span className="ml-3 text-xs font-normal text-gray-400">
                      ({form.leftCols}+{form.rightCols}) × {form.regularRows} rows{form.backRowSeats > 0 ? ` + ${form.backRowSeats} back` : ''}
                    </span>
                  </div>
                </div>

                {/* Live preview */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Preview (as customers will see)</p>
                  {previewSeats.length > 0 && (
                    <SeatMap seats={previewSeats} layout={form.seatLayout} selectedSeats={[]} readonly />
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

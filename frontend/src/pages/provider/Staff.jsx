import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, X, Phone, CheckCircle, XCircle } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = { name:'', phone:'', role:'driver', licenseNumber:'', licenseExpiry:'', address:'', joiningDate:'', salary:'' };

export default function ProviderStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => { providerAPI.getStaff().then(r => setStaff(r.data.staff||[])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openEdit = (s) => { setForm({ name:s.name, phone:s.phone, role:s.role, licenseNumber:s.licenseNumber||'', licenseExpiry:s.licenseExpiry||'', address:s.address||'', joiningDate:s.joiningDate||'', salary:s.salary||'' }); setEditing(s.id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await providerAPI.updateStaff(editing, form); toast.success('Staff updated!'); }
      else { await providerAPI.createStaff(form); toast.success('Staff added!'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm(p=>({...p,[k]:e.target.value})) });
  const roleColors = { driver:'bg-blue-100 text-blue-700', conductor:'bg-green-100 text-green-700', helper:'bg-yellow-100 text-yellow-700' };

  return (
    <ProviderLayout title="Manage Staff">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">{staff.length} staff member{staff.length!==1?'s':''}</p>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4"/>Add Staff</button>
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"/></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">{s.name?.[0]}</div>
                  <div>
                    <p className="font-bold text-gray-800">{s.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${roleColors[s.role]||'bg-gray-100 text-gray-600'}`}>{s.role}</span>
                  </div>
                </div>
                {s.isActive ? <CheckCircle className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-red-400"/>}
              </div>
              <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400"/>{s.phone}</div>
                {s.licenseNumber && <div className="text-xs text-gray-400">License: {s.licenseNumber}{s.licenseExpiry ? ` • Exp: ${s.licenseExpiry}` : ''}</div>}
                {s.salary && <div className="text-xs text-gray-400">Salary: NPR {s.salary}/month</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 className="h-3.5 w-3.5"/>Edit</button>
                <button onClick={async () => { if(!confirm('Deactivate staff?'))return; try{await providerAPI.deleteStaff(s.id);toast.success('Deactivated');load();}catch{toast.error('Failed');} }} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-sm border border-red-100 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5"/>Remove</button>
              </div>
            </div>
          ))}
          {staff.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400"><Users className="h-16 w-16 mx-auto mb-3 text-gray-200"/><p>No staff added yet.</p></div>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editing?'Edit Staff':'Add Staff Member'}</h2>
              <button onClick={() => setModal(false)}><X className="h-5 w-5 text-gray-400"/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Full Name *</label><input {...f('name')} className="input-field" required/></div>
                <div><label className="label">Phone *</label><input {...f('phone')} className="input-field" required/></div>
              </div>
              <div><label className="label">Role *</label>
                <select {...f('role')} className="input-field">
                  <option value="driver">Driver</option><option value="conductor">Conductor</option><option value="helper">Helper</option>
                </select>
              </div>
              {form.role === 'driver' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">License Number</label><input {...f('licenseNumber')} className="input-field" placeholder="DL-BAG-001"/></div>
                  <div><label className="label">License Expiry</label><input type="date" {...f('licenseExpiry')} className="input-field"/></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Joining Date</label><input type="date" {...f('joiningDate')} className="input-field"/></div>
                <div><label className="label">Salary (NPR)</label><input type="number" {...f('salary')} className="input-field" placeholder="25000"/></div>
              </div>
              <div><label className="label">Address</label><textarea {...f('address')} className="input-field" rows="2" placeholder="Kathmandu, Nepal"/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving?'Saving...':editing?'Update':'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}

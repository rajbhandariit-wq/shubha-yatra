import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet, Heart, ShieldCheck, Users, Bell, Lock,
  Plus, Trash2, Check, X, ChevronRight, CreditCard,
  ArrowRight, Phone, ExternalLink, AlertTriangle,
  Smartphone, Mail, ToggleLeft, ToggleRight, Upload,
  FileText, User, KeyRound, ChevronLeft,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { customerAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const NEPAL_CITIES = ['Kathmandu','Pokhara','Chitwan','Lumbini','Butwal','Nepalgunj','Dharan','Biratnagar','Janakpur','Bhairahawa','Birgunj','Hetauda','Dhangadhi','Illam','Tansen','Mustang'];
const RELATIONSHIPS = ['Parent','Spouse','Sibling','Child','Friend','Colleague','Other'];

const MENU = [
  { id: 'wallet',        icon: Wallet,      label: 'Wallet & Payments',   desc: 'Saved payment methods' },
  { id: 'favourites',    icon: Heart,       label: 'Favourites',           desc: 'Saved routes' },
  { id: 'id',            icon: ShieldCheck, label: 'ID Verification',      desc: 'Verified documents' },
  { id: 'emergency',     icon: Users,       label: 'Emergency Contacts',   desc: 'Contact details' },
  { id: 'notifications', icon: Bell,        label: 'Notifications',        desc: 'Alerts & offers' },
  { id: 'privacy',       icon: Lock,        label: 'Privacy & Data',       desc: 'Policies & your data' },
  { id: 'settings',      icon: KeyRound,    label: 'Settings',             desc: 'Password & security' },
];

// ── Wallet & Payments ────────────────────────────────────────────────────────
function WalletSection({ prefs, onSave }) {
  const [form, setForm] = useState({
    esewaId: prefs.esewaId || '',
    khaltiId: prefs.khaltiId || '',
    defaultMethod: prefs.defaultMethod || 'esewa',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave({ esewaId: form.esewaId, khaltiId: form.khaltiId, defaultMethod: form.defaultMethod });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Wallet & Payments</h2>
        <p className="text-sm text-gray-500">Save your payment account IDs for faster checkout.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-lg">💚</div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">eSewa</p>
              <p className="text-xs text-gray-400">Link your eSewa mobile number</p>
            </div>
          </div>
          <input
            value={form.esewaId}
            onChange={e => setForm(f => ({ ...f, esewaId: e.target.value }))}
            className="input-field"
            placeholder="98XXXXXXXX"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">💜</div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Khalti</p>
              <p className="text-xs text-gray-400">Link your Khalti mobile number</p>
            </div>
          </div>
          <input
            value={form.khaltiId}
            onChange={e => setForm(f => ({ ...f, khaltiId: e.target.value }))}
            className="input-field"
            placeholder="98XXXXXXXX"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Default Payment Method</p>
          <div className="flex gap-3">
            {[['esewa', '💚 eSewa'], ['khalti', '💜 Khalti']].map(([val, label]) => (
              <button key={val} type="button"
                onClick={() => setForm(f => ({ ...f, defaultMethod: val }))}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form.defaultMethod === val ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full py-2.5">
        {saving ? 'Saving...' : 'Save Payment Info'}
      </button>
    </div>
  );
}

// ── Favourites ────────────────────────────────────────────────────────────────
function FavouritesSection({ prefs, onSave }) {
  const navigate = useNavigate();
  const routes = prefs.favouriteRoutes || [];
  const [adding, setAdding] = useState(false);
  const [newRoute, setNewRoute] = useState({ source: '', destination: '' });
  const [saving, setSaving] = useState(false);

  const addRoute = async () => {
    if (!newRoute.source || !newRoute.destination) return toast.error('Select both cities');
    if (newRoute.source === newRoute.destination) return toast.error('Source and destination must differ');
    if (routes.find(r => r.source === newRoute.source && r.destination === newRoute.destination))
      return toast.error('Route already saved');
    setSaving(true);
    await onSave({ favouriteRoutes: [...routes, newRoute] });
    setNewRoute({ source: '', destination: '' });
    setAdding(false);
    setSaving(false);
  };

  const remove = async (idx) => {
    await onSave({ favouriteRoutes: routes.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Favourite Routes</h2>
          <p className="text-sm text-gray-500">Quickly book your regular journeys.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus className="h-4 w-4" /> Add Route
        </button>
      </div>

      {adding && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">Add Favourite Route</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">From</label>
              <select value={newRoute.source} onChange={e => setNewRoute(f => ({ ...f, source: e.target.value }))} className="input-field text-sm">
                <option value="">Select city</option>
                {NEPAL_CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">To</label>
              <select value={newRoute.destination} onChange={e => setNewRoute(f => ({ ...f, destination: e.target.value }))} className="input-field text-sm">
                <option value="">Select city</option>
                {NEPAL_CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Cancel</button>
            <button onClick={addRoute} disabled={saving} className="flex-1 btn-primary text-sm py-2">{saving ? 'Saving...' : 'Save Route'}</button>
          </div>
        </div>
      )}

      {routes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Heart className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No favourite routes yet</p>
          <p className="text-sm mt-1">Add routes you travel regularly</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 font-semibold text-gray-800">
                <span>{r.source}</span>
                <ArrowRight className="h-4 w-4 text-primary-400" />
                <span>{r.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/search?source=${r.source}&destination=${r.destination}&date=${new Date().toISOString().split('T')[0]}`)}
                  className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 font-medium">
                  Book Now
                </button>
                <button onClick={() => remove(i)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ID Verification ───────────────────────────────────────────────────────────
function IDVerificationSection({ user }) {
  const docs = user?.documents || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">ID Verification</h2>
        <p className="text-sm text-gray-500">Upload a government-issued ID. Verified accounts get priority support.</p>
      </div>

      {docs.length > 0 && (
        <div className="space-y-3">
          {docs.map((doc, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{doc.type || 'Document'}</p>
                  <p className="text-xs text-gray-400">{doc.name || doc.url}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {doc.verified ? '✓ Verified' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
        <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-700 mb-1">Upload Government ID</p>
        <p className="text-sm text-gray-400 mb-4">Citizenship card, passport, or driving license</p>
        <p className="text-xs text-gray-400 mb-4">JPG, PNG or PDF · Max 5MB</p>
        <label className="btn-primary px-6 py-2 text-sm cursor-pointer">
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={() => toast.success('Document submitted for review. You will be notified once verified.')} />
          Choose File
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex gap-3">
        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
        <p>Your documents are encrypted and only used for identity verification. We never share them with third parties.</p>
      </div>
    </div>
  );
}

// ── Emergency Contacts ────────────────────────────────────────────────────────
function EmergencyContactsSection({ prefs, onSave }) {
  const contacts = prefs.emergencyContacts || [];
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', relationship: 'Parent' });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ name: '', phone: '', relationship: 'Parent' }); setEditIdx(null); setAdding(true); };
  const openEdit = (i) => { setForm({ ...contacts[i] }); setEditIdx(i); setAdding(true); };

  const saveContact = async () => {
    if (!form.name.trim() || !form.phone.trim()) return toast.error('Name and phone are required');
    setSaving(true);
    const updated = editIdx !== null
      ? contacts.map((c, i) => i === editIdx ? form : c)
      : [...contacts, form];
    await onSave({ emergencyContacts: updated });
    setAdding(false);
    setSaving(false);
  };

  const remove = async (idx) => {
    await onSave({ emergencyContacts: contacts.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Emergency Contacts</h2>
          <p className="text-sm text-gray-500">People to contact in case of a travel emergency.</p>
        </div>
        {contacts.length < 3 && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Plus className="h-4 w-4" /> Add Contact
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-orange-800">{editIdx !== null ? 'Edit Contact' : 'New Emergency Contact'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field text-sm" placeholder="Ram Bahadur" />
            </div>
            <div>
              <label className="label text-xs">Phone Number *</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field text-sm" placeholder="98XXXXXXXX" />
            </div>
            <div className="sm:col-span-2">
              <label className="label text-xs">Relationship</label>
              <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} className="input-field text-sm">
                {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Cancel</button>
            <button onClick={saveContact} disabled={saving} className="flex-1 btn-primary text-sm py-2">{saving ? 'Saving...' : 'Save Contact'}</button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !adding ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No emergency contacts added</p>
          <p className="text-sm mt-1">Add up to 3 contacts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-bold text-sm">
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.phone} · {c.relationship}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`tel:${c.phone}`} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <Phone className="h-4 w-4" />
                </a>
                <button onClick={() => openEdit(i)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <User className="h-4 w-4" />
                </button>
                <button onClick={() => remove(i)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
function NotificationsSection({ prefs, onSave }) {
  const n = prefs.notifications || {};
  const [settings, setSettings] = useState({
    bookingConfirmations: n.bookingConfirmations ?? true,
    cancellationAlerts:   n.cancellationAlerts   ?? true,
    tripReminders:        n.tripReminders        ?? true,
    priceDropAlerts:      n.priceDropAlerts      ?? false,
    promotionalOffers:    n.promotionalOffers    ?? false,
    channelEmail:         n.channelEmail         ?? true,
    channelSMS:           n.channelSMS           ?? true,
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const save = async () => {
    setSaving(true);
    await onSave({ notifications: settings });
    setSaving(false);
  };

  const Toggle = ({ on, onToggle }) => (
    <button type="button" onClick={onToggle} className={`transition-colors ${on ? 'text-primary-600' : 'text-gray-300'}`}>
      {on ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
    </button>
  );

  const rows = [
    { key: 'bookingConfirmations', label: 'Booking Confirmations',  desc: 'Get notified when a booking is confirmed', icon: Check },
    { key: 'cancellationAlerts',   label: 'Cancellation Alerts',    desc: 'Alerts when a booking is cancelled',      icon: X },
    { key: 'tripReminders',        label: 'Trip Reminders',         desc: 'Reminder 24 hours before departure',      icon: Bell },
    { key: 'priceDropAlerts',      label: 'Price Drop Alerts',      desc: 'Notify when fares drop on saved routes',  icon: ArrowRight },
    { key: 'promotionalOffers',    label: 'Promotional Offers',     desc: 'Deals, discounts and special offers',     icon: Heart },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Notifications</h2>
        <p className="text-sm text-gray-500">Choose what you want to be notified about.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {rows.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <Toggle on={settings[key]} onToggle={() => toggle(key)} />
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Notification Channels</p>
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800">Email</p>
                <p className="text-xs text-gray-400">Notifications sent to your registered email</p>
              </div>
            </div>
            <Toggle on={settings.channelEmail} onToggle={() => toggle('channelEmail')} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800">SMS</p>
                <p className="text-xs text-gray-400">Text messages to your registered phone number</p>
              </div>
            </div>
            <Toggle on={settings.channelSMS} onToggle={() => toggle('channelSMS')} />
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full py-2.5">
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}

// ── Privacy & Data ────────────────────────────────────────────────────────────
function PrivacySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Privacy & Data</h2>
        <p className="text-sm text-gray-500">Manage your data and review our policies.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {[
          { to: '/privacy-policy',   label: 'Privacy Policy',    desc: 'How we collect and use your data' },
          { to: '/terms-of-service', label: 'Terms of Service',  desc: 'Rules governing use of Shubha Yatra' },
          { to: '/refund-policy',    label: 'Refund Policy',     desc: 'Cancellation and refund conditions' },
        ].map(({ to, label, desc }) => (
          <Link key={to} to={to} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors group">
            <div>
              <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-primary-400" />
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Your Data</p>
        <button
          onClick={() => toast.success('Your data export request has been received. We will email it to you within 48 hours.')}
          className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors">
          <span>Download a copy of my data</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-semibold text-sm">Danger Zone</p>
        </div>
        <p className="text-xs text-red-600">Deleting your account is permanent and cannot be undone. All your booking history, tickets, and saved data will be lost.</p>
        <button
          onClick={() => toast.error('To delete your account, please contact support@shubha-yatra.com')}
          className="w-full py-2.5 border-2 border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
          Request Account Deletion
        </button>
      </div>
    </div>
  );
}

// ── Settings (password change) ────────────────────────────────────────────────
function SettingsSection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.currentPassword || !form.newPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Settings</h2>
        <p className="text-sm text-gray-500">Change your password and manage account security.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
            <KeyRound className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Change Password</p>
            <p className="text-xs text-gray-400">Use a strong password you haven't used before</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="input-field"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              className="input-field"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="input-field"
              placeholder="Re-enter new password"
            />
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full py-2.5 mt-2">
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = MENU.find(m => m.id === searchParams.get('tab'))?.id || null;
  const [active, setActive] = useState(initialTab);
  // mobile: 'menu' shows the list, 'detail' shows the content panel
  const [mobileView, setMobileView] = useState(initialTab ? 'detail' : 'menu');
  const [prefs, setPrefs] = useState({});
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && MENU.find(m => m.id === tab)) {
      setActive(tab);
      setMobileView('detail');
    }
  }, [searchParams]);

  useEffect(() => {
    customerAPI.getProfile()
      .then(r => {
        setProfileUser(r.data.user);
        setPrefs(r.data.user.preferences || {});
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (patch) => {
    try {
      const r = await customerAPI.updatePreferences(patch);
      setPrefs(r.data.preferences);
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const selectTab = (id) => {
    setActive(id);
    setMobileView('detail');
  };

  const activeMenu = MENU.find(m => m.id === active);

  const SidebarMenu = ({ onClick }) => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {MENU.map(({ id, icon: Icon, label, desc }) => (
        <button key={id} onClick={() => onClick(id)}
          className={`w-full flex items-center gap-3 px-4 py-4 text-left border-b border-gray-100 last:border-0 transition-colors ${active === id ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active === id ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <Icon className={`h-4 w-4 ${active === id ? 'text-primary-600' : 'text-gray-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${active === id ? 'text-primary-700' : 'text-gray-700'}`}>{label}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </div>
          <ChevronRight className={`h-4 w-4 shrink-0 ${active === id ? 'text-primary-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );

  const ContentPanel = () => (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {active === 'wallet'        && <WalletSection prefs={prefs} onSave={handleSave} />}
          {active === 'favourites'    && <FavouritesSection prefs={prefs} onSave={handleSave} />}
          {active === 'id'            && <IDVerificationSection user={profileUser} />}
          {active === 'emergency'     && <EmergencyContactsSection prefs={prefs} onSave={handleSave} />}
          {active === 'notifications' && <NotificationsSection prefs={prefs} onSave={handleSave} />}
          {active === 'privacy'       && <PrivacySection />}
          {active === 'settings'      && <SettingsSection />}
          {!active && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <User className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Select an option from the menu</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">

        {/* ── Mobile layout ── */}
        <div className="lg:hidden">
          {mobileView === 'menu' ? (
            <>
              {/* User header card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <SidebarMenu onClick={selectTab} />
            </>
          ) : (
            <>
              {/* Back button + section title */}
              <button
                onClick={() => setMobileView('menu')}
                className="flex items-center gap-2 text-primary-600 font-medium text-sm mb-4 hover:text-primary-700 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                {activeMenu?.label || 'Back'}
              </button>
              <ContentPanel />
            </>
          )}
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden lg:block">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-gray-800">My Account</h1>
            <p className="text-gray-500 text-sm mt-1">{user?.name} · {user?.email}</p>
          </div>
          <div className="flex gap-6">
            <div className="w-64 shrink-0">
              <SidebarMenu onClick={setActive} />
            </div>
            <ContentPanel />
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

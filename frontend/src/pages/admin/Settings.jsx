import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useAdminPerms from '../../hooks/useAdminPerms';
import { Navigate } from 'react-router-dom';
import { Shield, MapPin, RefreshCw, Save } from 'lucide-react';
import { appSettingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { isSuperAdmin } = useAdminPerms();
  const [form, setForm]     = useState({ location_interval_minutes: '5', tracking_refresh_seconds: '60' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    appSettingsAPI.get()
      .then(r => setForm(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await appSettingsAPI.update(form);
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => ({
    value: form[k],
    onChange: e => setForm(p => ({ ...p, [k]: e.target.value })),
  });

  return (
    <AdminLayout title="Settings">
      <div className="max-w-xl space-y-6">

        {/* Live Tracking Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold text-gray-800">Live Tracking Settings</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="label">Driver Location Update Interval (minutes)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="1" max="60" step="1"
                    {...f('location_interval_minutes')}
                    className="input-field w-32"
                  />
                  <p className="text-sm text-gray-400">How often the driver app sends GPS coordinates</p>
                </div>
              </div>

              <div>
                <label className="label">Customer Map Refresh Interval (seconds)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="10" max="300" step="5"
                    {...f('tracking_refresh_seconds')}
                    className="input-field w-32"
                  />
                  <p className="text-sm text-gray-400">How often the live map auto-refreshes for passengers</p>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving
                    ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    : <Save className="h-4 w-4" />}
                  {saving ? 'Saving…' : 'Save Settings'}
                </button>
                <p className="text-xs text-gray-400 mt-2">Changes take effect on the driver's next app load</p>
              </div>
            </form>
          )}
        </div>

        {/* Billing note */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-yellow-400" />
            <h2 className="font-semibold text-gray-800">Billing Settings</h2>
          </div>
          <p className="text-gray-500 text-sm">
            Billing and payout settings are managed under{' '}
            <a href="/admin/billing" className="text-nepal-blue hover:underline">Billing & Payouts → Settings tab</a>.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

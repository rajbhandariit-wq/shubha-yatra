import AdminLayout from '../../components/AdminLayout';
import useAdminPerms from '../../hooks/useAdminPerms';
import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AdminSettings() {
  const { isSuperAdmin } = useAdminPerms();

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  return (
    <AdminLayout title="Settings">
      <div className="max-w-xl bg-white rounded-2xl shadow-sm p-8 text-center">
        <Shield className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">System Settings</h2>
        <p className="text-gray-500 text-sm">
          Billing and payout settings are managed under{' '}
          <a href="/admin/billing" className="text-nepal-blue hover:underline">Billing & Payouts → Settings tab</a>.
        </p>
        <p className="text-gray-400 text-xs mt-4">
          Additional system configuration will appear here as new features are added.
        </p>
      </div>
    </AdminLayout>
  );
}

import { useAuth } from '../contexts/AuthContext';

export default function useAdminPerms() {
  const { user } = useAuth();
  const adminRole = user?.adminRole || (user?.role === 'admin' ? 'super_admin' : null);
  return {
    adminRole,
    isSuperAdmin: adminRole === 'super_admin',
    isManager:    adminRole === 'manager' || adminRole === 'super_admin',
    isOperator:   adminRole === 'operator',
    canDelete:    adminRole === 'super_admin',
    canCreate:    adminRole !== 'operator',
    canEdit:      adminRole !== 'operator',
    readonly:     adminRole === 'operator',
    assignedProviderId: user?.assignedProviderId || null,
  };
}

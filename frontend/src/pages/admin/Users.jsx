import { useState, useEffect } from 'react';
import { Search, Shield, User, Trash2, Lock, ToggleLeft, ToggleRight, X, Filter, Eye, Phone, Building2, MapPin, Calendar, CheckCircle, XCircle, UserPlus, Edit2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
import useAdminPerms from '../../hooks/useAdminPerms';
import toast from 'react-hot-toast';

const ADMIN_ROLE_COLORS = {
  super_admin: 'bg-red-100 text-red-700',
  manager:     'bg-blue-100 text-blue-700',
  operator:    'bg-teal-100 text-teal-700',
};

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { isSuperAdmin, canDelete } = useAdminPerms();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Admin role management
  const [createAdminModal, setCreateAdminModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phoneNumber: '', adminRole: 'manager' });
  const [createSaving, setCreateSaving] = useState(false);
  const [editRoleModal, setEditRoleModal] = useState(null);
  const [editRoleForm, setEditRoleForm] = useState({ adminRole: '' });
  const [editRoleSaving, setEditRoleSaving] = useState(false);

  // Edit customer/provider profile
  const [editUserModal, setEditUserModal] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', phoneNumber: '' });
  const [editUserSaving, setEditUserSaving] = useState(false);

  const load = (params = {}) => {
    setLoading(true);
    adminAPI.getUsers(params).then(r => setUsers(r.data.users || [])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleSearch = (e) => { e.preventDefault(); load({ search, role: roleFilter }); };

  const handleToggle = async (user) => {
    if (!confirm(`${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}?`)) return;
    try {
      await adminAPI.toggleUserStatus(user.id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      load({ search, role: roleFilter });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Permanently delete ${user.name}? This cannot be undone and will remove all their associated data.`)) return;
    try {
      await adminAPI.deleteUser(user.id);
      toast.success('User deleted');
      load({ search, role: roleFilter });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateSaving(true);
    try {
      await adminAPI.createAdminUser(createForm);
      toast.success('Admin user created');
      setCreateAdminModal(false);
      setCreateForm({ name: '', email: '', password: '', phoneNumber: '', adminRole: 'manager' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreateSaving(false); }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    setEditRoleSaving(true);
    try {
      await adminAPI.setAdminRole(editRoleModal.id, { adminRole: editRoleForm.adminRole });
      toast.success('Admin role updated');
      setEditRoleModal(null);
      load({ search, role: roleFilter });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEditRoleSaving(false); }
  };

  const openEditUser = (user) => {
    setEditUserModal(user);
    setEditUserForm({ name: user.name || '', email: user.email || '', phoneNumber: user.phoneNumber || '' });
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditUserSaving(true);
    try {
      await adminAPI.updateUserProfile(editUserModal.id, editUserForm);
      toast.success('Profile updated');
      setEditUserModal(null);
      load({ search, role: roleFilter });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEditUserSaving(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await adminAPI.resetPassword(resetModal.id, { newPassword });
      toast.success(`Password reset for ${resetModal.name}`);
      setResetModal(null); setNewPassword('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleViewDetail = async (user) => {
    setDetailLoading(true);
    setDetailUser(user);
    try {
      const r = await adminAPI.getUserById(user.id);
      setDetailUser(r.data.user);
    } catch { toast.error('Failed to load user details'); }
    finally { setDetailLoading(false); }
  };

  const roleColors = { customer: 'bg-blue-100 text-blue-700', provider: 'bg-purple-100 text-purple-700', admin: 'bg-yellow-100 text-yellow-700' };
  const roleIcons = { customer: User, provider: Shield, admin: Shield };

  return (
    <AdminLayout title="User Management">
      {/* Top action row */}
      {isSuperAdmin && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setCreateAdminModal(true)}
            className="btn-primary flex items-center gap-2 text-sm py-2">
            <UserPlus className="h-4 w-4" /> Create Admin User
          </button>
        </div>
      )}

      {/* Search & Filter bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="label text-xs">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 text-sm py-2" placeholder="Name or email..." />
          </div>
        </div>
        <div>
          <label className="label text-xs">Role</label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field py-2 text-sm">
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="provider">Provider</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn-primary py-2 text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> Search</button>
        <button type="button" onClick={() => { setSearch(''); setRoleFilter(''); load(); }} className="py-2 px-4 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Clear</button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{users.length} user{users.length !== 1 ? 's' : ''} found</h3>
          <div className="flex gap-2 text-xs text-gray-400">
            <span className="badge-confirmed">{users.filter(u => u.isActive).length} active</span>
            <span className="badge-cancelled">{users.filter(u => !u.isActive).length} inactive</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['User', 'Role', 'Phone', 'Company', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => {
                  const RoleIcon = roleIcons[u.role] || User;
                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">{u.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <p className="font-medium text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${roleColors[u.role]}`}>
                          <RoleIcon className="h-3 w-3" />{u.role}
                        </span>
                        {u.role === 'admin' && (
                          <span className={`ml-1 inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ADMIN_ROLE_COLORS[u.adminRole || 'super_admin']}`}>
                            {(u.adminRole || 'super_admin').replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.phoneNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-32 truncate">{u.companyName || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={u.isActive ? 'badge-confirmed' : 'badge-cancelled'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleViewDetail(u)} title="View Details" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          {u.role !== 'admin' && (
                            <>
                              <button onClick={() => openEditUser(u)} title="Edit Profile" className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setResetModal(u); setNewPassword(''); }} title="Reset Password" className="p-1.5 text-gray-400 hover:text-nepal-blue hover:bg-blue-50 rounded-lg transition-colors">
                                <Lock className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleToggle(u)} title={u.isActive ? 'Deactivate' : 'Activate'} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                                {u.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                              </button>
                              {canDelete && (
                                <button onClick={() => handleDelete(u)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                          {u.role === 'admin' && isSuperAdmin && (
                            <button onClick={() => { setEditRoleModal(u); setEditRoleForm({ adminRole: u.adminRole || 'super_admin', assignedProviderId: u.assignedProviderId || '' }); }}
                              title="Edit Admin Role" className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {u.role === 'admin' && !isSuperAdmin && <span className="text-xs text-gray-300 italic ml-1">Protected</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-16 text-gray-400">
                    <User className="h-12 w-12 mx-auto mb-2 text-gray-200" />No users found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2"><Eye className="h-5 w-5 text-green-600" /> User Details</h2>
              <button onClick={() => setDetailUser(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>
            ) : (
              <div className="p-6 space-y-4">
                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-nepal-blue to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0">
                    {detailUser.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{detailUser.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${roleColors[detailUser.role]}`}>
                      {detailUser.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <DetailRow icon={User} label="Email" value={detailUser.email} />
                  <DetailRow icon={Phone} label="Phone" value={detailUser.phoneNumber || '—'} />
                  {detailUser.companyName && <DetailRow icon={Building2} label="Company" value={detailUser.companyName} />}
                  {detailUser.companyAddress && <DetailRow icon={MapPin} label="Address" value={detailUser.companyAddress} />}
                  <DetailRow icon={Calendar} label="Joined" value={new Date(detailUser.createdAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })} />
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-500 font-medium">Account Status</span>
                    <div className="flex items-center gap-2">
                      {detailUser.isActive
                        ? <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle className="h-4 w-4" /> Active</span>
                        : <span className="flex items-center gap-1 text-red-500 text-sm font-medium"><XCircle className="h-4 w-4" /> Inactive</span>}
                    </div>
                  </div>
                  {detailUser.role === 'provider' && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-500 font-medium">Approval Status</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                        detailUser.status === 'active' ? 'bg-green-100 text-green-700' :
                        detailUser.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{detailUser.status}</span>
                    </div>
                  )}
                  {detailUser.documents?.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 font-medium mb-2">Uploaded Documents</p>
                      <div className="space-y-1">
                        {detailUser.documents.map((doc, i) => (
                          <a key={i} href={`/api/uploads/${doc.filename}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-sm text-nepal-blue hover:underline">
                            📄 {doc.originalName || doc.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Profile Modal */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2"><Edit2 className="h-5 w-5 text-teal-600" /> Edit Profile</h2>
              <button onClick={() => setEditUserModal(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="text-gray-500 text-xs">Editing profile for:</p>
                <p className="font-semibold text-gray-800">{editUserModal.name}</p>
                <p className="text-gray-400 text-xs capitalize">{editUserModal.role}</p>
              </div>
              <div>
                <label className="label text-xs">Full Name *</label>
                <input type="text" value={editUserForm.name}
                  onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="label text-xs">Email *</label>
                <input type="email" value={editUserForm.email}
                  onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="input-field" required />
                <p className="text-xs text-gray-400 mt-1">Must be unique — error shown if already registered</p>
              </div>
              <div>
                <label className="label text-xs">Phone Number</label>
                <input type="text" value={editUserForm.phoneNumber}
                  onChange={e => setEditUserForm({ ...editUserForm, phoneNumber: e.target.value })}
                  className="input-field" placeholder="Leave blank to keep current" />
                <p className="text-xs text-gray-400 mt-1">Must be unique — error shown if already in use</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditUserModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editUserSaving} className="flex-1 btn-primary">{editUserSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Admin User Modal */}
      {createAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2"><UserPlus className="h-5 w-5 text-teal-600" /> Create Admin User</h2>
              <button onClick={() => setCreateAdminModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-3">
              {[['name','Name *','text'],['email','Email *','email'],['password','Password *','password'],['phoneNumber','Phone','text']].map(([k,l,t]) => (
                <div key={k}>
                  <label className="label text-xs">{l}</label>
                  <input type={t} value={createForm[k]} onChange={e => setCreateForm({ ...createForm, [k]: e.target.value })}
                    className="input-field" required={l.endsWith('*')} minLength={k === 'password' ? 6 : undefined} />
                </div>
              ))}
              <div>
                <label className="label text-xs">Admin Role *</label>
                <select value={createForm.adminRole} onChange={e => setCreateForm({ ...createForm, adminRole: e.target.value })} className="input-field">
                  <option value="operator">Operator</option>
                  <option value="manager">Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCreateAdminModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createSaving} className="flex-1 btn-primary">{createSaving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Role Modal */}
      {editRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2"><Edit2 className="h-5 w-5 text-teal-600" /> Edit Admin Role</h2>
              <button onClick={() => setEditRoleModal(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEditRole} className="p-6 space-y-3">
              <p className="text-sm text-gray-500">Editing role for <span className="font-semibold text-gray-800">{editRoleModal.name}</span></p>
              <div>
                <label className="label text-xs">Admin Role</label>
                <select value={editRoleForm.adminRole} onChange={e => setEditRoleForm({ ...editRoleForm, adminRole: e.target.value })} className="input-field">
                  <option value="super_admin">Super Admin</option>
                  <option value="manager">Manager</option>
                  <option value="operator">Operator</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditRoleModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editRoleSaving} className="flex-1 btn-primary">{editRoleSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2"><Lock className="h-5 w-5 text-nepal-blue" /> Reset Password</h2>
              <button onClick={() => setResetModal(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="text-gray-500">Resetting password for:</p>
                <p className="font-semibold text-gray-800">{resetModal.name}</p>
                <p className="text-gray-400 text-xs">{resetModal.email}</p>
              </div>
              <div>
                <label className="label">New Password *</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="Min. 6 characters" required minLength={6} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setResetModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Resetting...' : 'Reset Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

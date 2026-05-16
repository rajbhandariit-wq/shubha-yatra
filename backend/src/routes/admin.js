const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireAdminRole } = require('../middleware/rbac');
const ctrl = require('../controllers/adminController');

const auth        = [authenticate, authorize('admin')];
const superAdmin  = [authenticate, authorize('admin'), requireAdminRole('super_admin')];
const managerUp   = [authenticate, authorize('admin'), requireAdminRole('super_admin', 'manager')];

// Dashboard
router.get('/dashboard',          ...auth, ctrl.getDashboard);

// Users
router.get('/users',              ...auth, ctrl.getAllUsers);
router.get('/users/:id',          ...auth, ctrl.getUserById);
router.put('/users/:id/reset-password',  ...auth, ctrl.resetPassword);
router.put('/users/:id/toggle-status',   ...auth, ctrl.toggleUserStatus);
router.put('/users/:id/profile',         ...auth, ctrl.updateUserProfile);
router.delete('/users/:id',       ...superAdmin, ctrl.deleteUser);
router.post('/users/admin',       ...superAdmin, ctrl.createAdminUser);
router.put('/users/:id/admin-role', ...superAdmin, ctrl.setAdminRole);

// Reports
router.get('/reports/customers',  ...auth, ctrl.getCustomerReports);
router.get('/reports/providers',  ...auth, ctrl.getProviderReports);

// Pending bank transfer bookings (existing approve/reject flow)
router.get('/bookings/pending',   ...auth, ctrl.getPendingBookings);
router.put('/bookings/:id/approve', ...auth, ctrl.approveBooking);
router.put('/bookings/:id/reject',  ...auth, ctrl.rejectBooking);

// All bookings / schedules / routes / providers
router.get('/all-bookings',  ...auth, ctrl.getAllBookingsAdmin);
router.get('/all-schedules', ...auth, ctrl.getAllSchedulesAdmin);
router.get('/all-routes',    ...auth, ctrl.getAllRoutesAdmin);
router.get('/all-providers', ...auth, ctrl.getAllProvidersAdmin);

// Provider management (all admin roles)
router.get('/providers/pending',       ...auth, ctrl.getPendingProviders);
router.put('/providers/:id/approve',   ...auth, ctrl.approveProvider);
router.put('/providers/:id/reject',    ...auth, ctrl.rejectProvider);

module.exports = router;

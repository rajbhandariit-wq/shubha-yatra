const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');
const auth = [authenticate, authorize('admin')];
const adminController = require('../controllers/adminController');

router.get('/dashboard', ...auth, ctrl.getDashboard);
router.get('/users', ...auth, ctrl.getAllUsers);
router.get('/users/:id', ...auth, ctrl.getUserById);
router.put('/users/:id/reset-password', ...auth, ctrl.resetPassword);
router.put('/users/:id/toggle-status', ...auth, ctrl.toggleUserStatus);
router.delete('/users/:id', ...auth, ctrl.deleteUser);
router.get('/reports/customers', ...auth, ctrl.getCustomerReports);
router.get('/reports/providers', ...auth, ctrl.getProviderReports);
// Pending bank transfer bookings
router.get('/bookings/pending',       ...auth, ctrl.getPendingBookings);
router.put('/bookings/:id/approve',   ...auth, ctrl.approveBooking);
router.put('/bookings/:id/reject',    ...auth, ctrl.rejectBooking);

router.get('/providers/pending', adminController.getPendingProviders);
router.put('/providers/:id/approve', adminController.approveProvider);
router.put('/providers/:id/reject', adminController.rejectProvider);

module.exports = router;

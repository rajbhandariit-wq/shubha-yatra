const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');
const auth = [authenticate, authorize('admin')];

router.get('/dashboard', ...auth, ctrl.getDashboard);
router.get('/users', ...auth, ctrl.getAllUsers);
router.get('/users/:id', ...auth, ctrl.getUserById);
router.put('/users/:id/reset-password', ...auth, ctrl.resetPassword);
router.put('/users/:id/toggle-status', ...auth, ctrl.toggleUserStatus);
router.delete('/users/:id', ...auth, ctrl.deleteUser);
router.get('/reports/customers', ...auth, ctrl.getCustomerReports);
router.get('/reports/providers', ...auth, ctrl.getProviderReports);

module.exports = router;

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/providerController');
const auth = [authenticate, authorize('provider')];

router.get('/dashboard', ...auth, ctrl.getDashboard);

router.get('/buses', ...auth, ctrl.getBuses);
router.post('/buses', ...auth, ctrl.createBus);
router.put('/buses/:id', ...auth, ctrl.updateBus);
router.delete('/buses/:id', ...auth, ctrl.deleteBus);

router.get('/routes', ...auth, ctrl.getRoutes);
router.post('/routes', ...auth, ctrl.createRoute);
router.put('/routes/:id', ...auth, ctrl.updateRoute);
router.delete('/routes/:id', ...auth, ctrl.deleteRoute);

router.get('/schedules', ...auth, ctrl.getSchedules);
router.post('/schedules', ...auth, ctrl.createSchedule);

router.get('/bookings', ...auth, ctrl.getBookings);

router.get('/staff', ...auth, ctrl.getStaff);
router.post('/staff', ...auth, ctrl.createStaff);
router.put('/staff/:id', ...auth, ctrl.updateStaff);
router.delete('/staff/:id', ...auth, ctrl.deleteStaff);

router.post('/messages/send', ...auth, ctrl.sendMessage);
router.get('/messages', ...auth, ctrl.getNotifications);

router.get('/reports', ...auth, ctrl.getReports);

module.exports = router;

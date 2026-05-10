// Corrected provider.route.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/providerController');

// Debug to see what's available
console.log('Available controller functions:', Object.keys(ctrl));

// Create middleware array
const auth = [authenticate, authorize('provider')];

// Dashboard
router.get('/dashboard', ...auth, ctrl.getDashboard);

// Bus management
router.get('/buses', ...auth, ctrl.getBuses);
router.post('/buses', ...auth, ctrl.createBus);
router.put('/buses/:id', ...auth, ctrl.updateBus);
router.delete('/buses/:id', ...auth, ctrl.deleteBus);

// Route management
router.get('/routes', ...auth, ctrl.getRoutes);
router.post('/routes', ...auth, ctrl.createRoute);
router.put('/routes/:id', ...auth, ctrl.updateRoute);
router.delete('/routes/:id', ...auth, ctrl.deleteRoute);

// Schedule management
router.get('/schedules', ...auth, ctrl.getSchedules);
router.post('/schedules', ...auth, ctrl.createSchedule);

// NEW: Schedule search for manual booking
router.get('/schedules/search', ...auth, ctrl.searchSchedules);
router.get('/schedules/:scheduleId/seats', ...auth, ctrl.getSeatLayout);

// Bookings
router.get('/bookings', ...auth, ctrl.getBookings);
router.post('/bookings/create', ...auth, ctrl.createManualBooking);

// Staff management
router.get('/staff', ...auth, ctrl.getStaff);
router.post('/staff', ...auth, ctrl.createStaff);
router.put('/staff/:id', ...auth, ctrl.updateStaff);
router.delete('/staff/:id', ...auth, ctrl.deleteStaff);

// Messaging
router.post('/messages/send', ...auth, ctrl.sendMessage);
router.get('/messages', ...auth, ctrl.getNotifications);

// Reports
router.get('/reports', ...auth, ctrl.getReports);

module.exports = router;
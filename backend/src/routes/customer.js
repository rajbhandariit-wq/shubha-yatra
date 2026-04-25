const router = require('express').Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/customerController');

router.get('/cities', ctrl.getCities);
router.get('/popular-routes', ctrl.getPopularRoutes);
router.get('/search', ctrl.searchBuses);
router.get('/seats/:scheduleId', ctrl.getSeats);

router.post('/bookings', authenticate, ctrl.createBooking);
router.get('/bookings', authenticate, ctrl.getMyBookings);
router.get('/bookings/:id', authenticate, ctrl.getBooking);
router.put('/bookings/:id/cancel', authenticate, ctrl.cancelBooking);

module.exports = router;

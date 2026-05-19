const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/driverController');
const { authenticate, authorize } = require('../middleware/auth');

const driverOnly = [authenticate, authorize('driver')];

router.get('/schedules',                    ...driverOnly, ctrl.getTodaySchedules);
router.get('/my-schedule',                  ...driverOnly, ctrl.getMyActiveSchedule);
router.post('/schedules/:id/claim',         ...driverOnly, ctrl.claimSchedule);
router.post('/schedules/:id/takeover',      ...driverOnly, ctrl.takeoverSchedule);
router.post('/schedules/:id/start',         ...driverOnly, ctrl.startJourney);
router.post('/schedules/:id/location',      ...driverOnly, ctrl.updateLocation);
router.post('/schedules/:id/end',           ...driverOnly, ctrl.endJourney);

module.exports = router;

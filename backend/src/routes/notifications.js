const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.get('/',            authenticate, ctrl.getNotifications);
router.put('/:id/read',    authenticate, ctrl.markAsRead);
router.put('/read-all',    authenticate, ctrl.markAllRead);

module.exports = router;

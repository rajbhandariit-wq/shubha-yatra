const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

// Cancel / release seats
router.post('/cancel', authenticate, ctrl.cancelPayment);

// Stripe
router.post('/stripe/create-intent', authenticate, ctrl.createStripeIntent);
router.post('/stripe/confirm',       authenticate, ctrl.confirmStripe);

// eSewa sandbox
router.post('/esewa/initiate', authenticate, ctrl.initiateEsewa);
router.post('/esewa/verify',   authenticate, ctrl.verifyEsewa);

// Khalti sandbox
router.post('/khalti/initiate', authenticate, ctrl.initiateKhalti);
router.post('/khalti/verify',   authenticate, ctrl.verifyKhalti);

// Card (mock)
router.post('/card', authenticate, ctrl.payByCard);

// Bank transfer
router.post('/bank', authenticate, ctrl.payByBank);

module.exports = router;

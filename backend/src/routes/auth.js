const router = require('express').Router();
const authController = require('../controllers/authController');
const passwordResetController = require('../controllers/passwordResetController');
const { authenticate } = require('../middleware/auth');

console.log('=== Loading Auth Routes ===');
console.log('authController functions:', Object.keys(authController));
console.log('passwordResetController functions:', Object.keys(passwordResetController));

// Existing auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

// Password reset routes
router.post('/forgot-password', passwordResetController.forgotPassword);
router.get('/reset-password/:token', passwordResetController.verifyResetToken);
router.post('/reset-password/:token', passwordResetController.resetPassword);

console.log('✅ All routes registered successfully');
module.exports = router;
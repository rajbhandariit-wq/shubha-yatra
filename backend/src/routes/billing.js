const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/billingController');
const auth = [authenticate, authorize('admin')];

// Dashboard
router.get('/dashboard',          ...auth, ctrl.getDashboard);

// Operators
router.get('/operators',          ...auth, ctrl.getOperators);
router.get('/operators/:id',      ...auth, ctrl.getOperatorDetail);
router.put('/operators/:id/settings', ...auth, ctrl.updateOperatorSettings);

// Transactions
router.get('/transactions',       ...auth, ctrl.getTransactions);
router.put('/transactions/:id/status', ...auth, ctrl.updateTransactionStatus);

// Payout batches
router.post('/batches/generate',  ...auth, ctrl.generateBatch);
router.get('/batches',            ...auth, ctrl.getBatches);
router.get('/batches/:id',        ...auth, ctrl.getBatchDetail);
router.put('/batches/:id/approve',   ...auth, ctrl.approveBatch);
router.put('/batches/:id/reject',    ...auth, ctrl.rejectBatch);
router.put('/batches/:id/mark-paid', ...auth, ctrl.markBatchPaid);
router.get('/batches/:id/export',    ...auth, ctrl.exportBatchCSV);

// Settings
router.get('/settings',  ...auth, ctrl.getSettings);
router.put('/settings',  ...auth, ctrl.updateSettings);

// Utilities
router.post('/sync',         ...auth, ctrl.syncTransactions);
router.post('/run-nightly',  ...auth, ctrl.runNightly);

module.exports = router;

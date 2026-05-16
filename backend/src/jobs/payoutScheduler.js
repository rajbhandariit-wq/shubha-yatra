const cron = require('node-cron');
const billing = require('../services/billingService');

let started = false;

function start() {
  if (started) return;
  started = true;

  // Every day at 01:00 — move pending transactions whose trip has passed to 'held'
  cron.schedule('0 1 * * *', async () => {
    console.log('[Scheduler] Running nightly billing job...');
    try {
      const n = await billing.processNightly();
      console.log(`[Scheduler] Nightly done: ${n} transactions moved to held`);
    } catch (err) {
      console.error('[Scheduler] Nightly job failed:', err.message);
    }
  });

  // Every day at 06:00 — auto-generate payout batches for operators whose payout day matches today
  cron.schedule('0 6 * * *', async () => {
    console.log('[Scheduler] Running payout schedule job...');
    try {
      const n = await billing.processPayoutSchedule();
      console.log(`[Scheduler] Payout schedule done: ${n} batches generated`);
    } catch (err) {
      console.error('[Scheduler] Payout schedule failed:', err.message);
    }
  });

  console.log('[Scheduler] Billing cron jobs registered (nightly 01:00, payout 06:00)');
}

module.exports = { start };

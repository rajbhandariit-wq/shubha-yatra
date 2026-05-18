const cron = require('node-cron');
const { Op } = require('sequelize');
const { Schedule } = require('../models');

let started = false;

async function runCleanup() {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 3);
  const cutoffDate = cutoff.toISOString().split('T')[0];

  const [count] = await Schedule.update(
    { status: 'completed' },
    {
      where: {
        travelDate: { [Op.lt]: cutoffDate },
        status: { [Op.in]: ['scheduled', 'boarding', 'delayed'] },
      },
    }
  );
  return count;
}

function start() {
  if (started) return;
  started = true;

  // Run at 00:30 every day
  cron.schedule('30 0 * * *', async () => {
    console.log('[Cleanup] Running schedule cleanup...');
    try {
      const n = await runCleanup();
      console.log(`[Cleanup] Marked ${n} past schedules as completed`);
    } catch (err) {
      console.error('[Cleanup] Failed:', err.message);
    }
  });

  // Also run once on startup to catch any backlog
  runCleanup()
    .then(n => { if (n > 0) console.log(`[Cleanup] Startup cleanup: ${n} past schedules marked completed`); })
    .catch(err => console.error('[Cleanup] Startup cleanup failed:', err.message));
}

module.exports = { start, runCleanup };

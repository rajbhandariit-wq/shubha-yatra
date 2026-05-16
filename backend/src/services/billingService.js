const { Op } = require('sequelize');

// Models loaded lazily to avoid circular-require at startup
const m = () => require('../models');

// ─── Default global settings ──────────────────────────────────────────────────
const DEFAULTS = {
  commissionRate:   '15',    // percent
  settlementCycle:  'weekly',
  payoutDay:        '1',     // Monday (0=Sun…6=Sat) for weekly; day-of-month for monthly
  minimumThreshold: '1000',  // NPR
  autoApprove:      'false',
};

async function getSetting(key) {
  const { BillingSetting } = m();
  const row = await BillingSetting.findOne({ where: { key } });
  return row ? row.value : (DEFAULTS[key] ?? null);
}

async function getSettings() {
  const { BillingSetting } = m();
  const rows = await BillingSetting.findAll();
  const result = { ...DEFAULTS };
  for (const r of rows) result[r.key] = r.value;
  return result;
}

async function setSettings(updates) {
  const { BillingSetting } = m();
  for (const [key, value] of Object.entries(updates)) {
    await BillingSetting.upsert({ key, value });
  }
}

// ─── Operator balance helpers ─────────────────────────────────────────────────

async function getOrCreateBalance(providerId) {
  const { OperatorBalance } = m();
  const [bal] = await OperatorBalance.findOrCreate({ where: { providerId }, defaults: { providerId } });
  return bal;
}

async function getCommissionRate(providerId) {
  const { OperatorBalance } = m();
  const bal = await OperatorBalance.findOne({ where: { providerId } });
  if (bal?.commissionRate != null) return parseFloat(bal.commissionRate);
  return parseFloat(await getSetting('commissionRate'));
}

// ─── Transaction creation ─────────────────────────────────────────────────────

async function createTransactionForBooking(booking, schedule) {
  const { BillingTransaction, Schedule, Bus } = m();

  // Idempotent — skip if already exists
  const exists = await BillingTransaction.findOne({ where: { bookingId: booking.id } });
  if (exists) return exists;

  // Resolve providerId
  let providerId = schedule?.bus?.providerId ?? schedule?.bus?.dataValues?.providerId;
  if (!providerId) {
    const sch = await Schedule.findByPk(booking.scheduleId, {
      include: [{ model: Bus, as: 'bus', attributes: ['providerId'] }],
    });
    providerId = sch?.bus?.providerId;
  }
  if (!providerId) return null;

  // Resolve tripDate
  const tripDate =
    schedule?.travelDate ?? schedule?.dataValues?.travelDate ??
    (await Schedule.findByPk(booking.scheduleId))?.travelDate ??
    new Date().toISOString().split('T')[0];

  const gross = parseFloat(booking.totalAmount);
  const rate  = await getCommissionRate(providerId);
  const comm  = parseFloat((gross * rate / 100).toFixed(2));
  const net   = parseFloat((gross - comm).toFixed(2));

  const tx = await BillingTransaction.create({
    bookingId: booking.id,
    providerId,
    grossAmount:      gross,
    commissionRate:   rate,
    commissionAmount: comm,
    netAmount:        net,
    status:   'pending',
    tripDate,
    auditLog: [{ status: 'pending', at: new Date().toISOString(), by: 'system', note: 'Booking confirmed' }],
  });

  const bal = await getOrCreateBalance(providerId);
  await bal.increment('pendingBalance', { by: net });

  return tx;
}

async function refundTransaction(bookingId, changedBy = 'system') {
  const { BillingTransaction, PayoutBatch } = m();
  const tx = await BillingTransaction.findOne({ where: { bookingId } });
  if (!tx || tx.status === 'refunded') return;

  const oldStatus = tx.status;
  const entry = { status: 'refunded', from: oldStatus, at: new Date().toISOString(), by: changedBy, note: 'Booking cancelled' };
  await tx.update({ status: 'refunded', batchId: null, auditLog: [...(tx.auditLog || []), entry] });

  const bal = await getOrCreateBalance(tx.providerId);
  const net = parseFloat(tx.netAmount);
  if (oldStatus === 'pending')  await bal.decrement('pendingBalance',  { by: net });
  if (oldStatus === 'held')     await bal.decrement('heldBalance',     { by: net });
  if (oldStatus === 'released') await bal.decrement('releasedBalance', { by: net });

  // If it was in a draft/pending batch, recalculate that batch
  if (tx.batchId) {
    const batch = await PayoutBatch.findByPk(tx.batchId);
    if (batch && ['draft', 'pending_approval'].includes(batch.status)) {
      await tx.update({ batchId: null });
      await _recalcBatch(batch.id);
    }
  }
}

// ─── Nightly & schedule jobs ──────────────────────────────────────────────────

async function processNightly() {
  const { BillingTransaction } = m();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const cutoff = yesterday.toISOString().split('T')[0];

  const txs = await BillingTransaction.findAll({
    where: { status: 'pending', tripDate: { [Op.lte]: cutoff } },
  });

  for (const tx of txs) {
    const entry = { status: 'held', from: 'pending', at: new Date().toISOString(), by: 'system', note: 'Trip date passed' };
    await tx.update({ status: 'held', auditLog: [...(tx.auditLog || []), entry] });
    const bal = await getOrCreateBalance(tx.providerId);
    await bal.decrement('pendingBalance', { by: parseFloat(tx.netAmount) });
    await bal.increment('heldBalance',    { by: parseFloat(tx.netAmount) });
  }

  console.log(`[Billing] Nightly: ${txs.length} transactions → held`);
  return txs.length;
}

async function processPayoutSchedule() {
  const { OperatorBalance } = m();
  const settings = await getSettings();
  const today = new Date();
  const dow   = today.getDay();   // 0=Sun
  const dom   = today.getDate();  // 1-31

  const operators = await OperatorBalance.findAll();
  let generated = 0;

  for (const bal of operators) {
    const cycle      = bal.settlementCycle    ?? settings.settlementCycle;
    const payoutDay  = bal.payoutDay != null  ? bal.payoutDay : parseInt(settings.payoutDay);

    let shouldRun = false, periodStart, periodEnd;

    if (cycle === 'weekly' && dow === payoutDay) {
      shouldRun = true;
      const end = new Date(today); end.setDate(end.getDate() - 1);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      periodStart = start.toISOString().split('T')[0];
      periodEnd   = end.toISOString().split('T')[0];
    } else if (cycle === 'monthly' && dom === payoutDay) {
      shouldRun = true;
      const end = new Date(today); end.setDate(end.getDate() - 1);
      const start = new Date(today.getFullYear(), today.getMonth() - 1, payoutDay);
      periodStart = start.toISOString().split('T')[0];
      periodEnd   = end.toISOString().split('T')[0];
    }

    if (shouldRun) {
      const batch = await generateBatchForProvider(bal.providerId, periodStart, periodEnd, 'scheduler');
      if (batch) {
        generated++;
        const next = new Date(today);
        if (cycle === 'weekly') next.setDate(next.getDate() + 7);
        else next.setMonth(next.getMonth() + 1);
        await bal.update({ nextPayoutDate: next.toISOString().split('T')[0] });
      }
    }
  }

  console.log(`[Billing] Schedule: ${generated} batches generated`);
  return generated;
}

// ─── Batch generation ─────────────────────────────────────────────────────────

async function generateBatchForProvider(providerId, periodStart, periodEnd, triggeredBy = 'admin') {
  const { BillingTransaction, PayoutBatch, OperatorBalance } = m();
  const settings = await getSettings();

  const bal = await OperatorBalance.findOne({ where: { providerId } });
  const minThreshold = parseFloat(bal?.minimumThreshold ?? settings.minimumThreshold);

  const txs = await BillingTransaction.findAll({
    where: { providerId, status: 'held', tripDate: { [Op.between]: [periodStart, periodEnd] } },
  });
  if (!txs.length) return null;

  const totalNet   = txs.reduce((s, t) => s + parseFloat(t.netAmount), 0);
  if (totalNet < minThreshold) return null;

  const totalGross = txs.reduce((s, t) => s + parseFloat(t.grossAmount), 0);
  const totalComm  = txs.reduce((s, t) => s + parseFloat(t.commissionAmount), 0);

  const batchNumber = `BATCH-${Date.now().toString(36).toUpperCase()}`;
  const autoApprove = settings.autoApprove === 'true';

  const batch = await PayoutBatch.create({
    batchNumber,
    providerId,
    status:           autoApprove ? 'approved' : 'pending_approval',
    totalGross:       parseFloat(totalGross.toFixed(2)),
    totalCommission:  parseFloat(totalComm.toFixed(2)),
    totalNet:         parseFloat(totalNet.toFixed(2)),
    transactionCount: txs.length,
    periodStart,
    periodEnd,
    auditLog: [{ action: 'created', by: triggeredBy, at: new Date().toISOString() }],
  });

  for (const tx of txs) {
    const entry = { status: 'released', from: 'held', at: new Date().toISOString(), by: triggeredBy, note: `Batch ${batchNumber}` };
    await tx.update({ status: 'released', batchId: batch.id, auditLog: [...(tx.auditLog || []), entry] });
  }

  if (bal) {
    await bal.decrement('heldBalance',    { by: parseFloat(totalNet.toFixed(2)) });
    await bal.increment('releasedBalance',{ by: parseFloat(totalNet.toFixed(2)) });
  }

  return batch;
}

// ─── Batch actions ────────────────────────────────────────────────────────────

async function approveBatch(batchId, adminId) {
  const { PayoutBatch } = m();
  const batch = await PayoutBatch.findByPk(batchId);
  if (!batch) throw new Error('Batch not found');
  if (!['draft', 'pending_approval'].includes(batch.status))
    throw new Error(`Cannot approve a batch with status "${batch.status}"`);

  const entry = { action: 'approved', by: adminId, at: new Date().toISOString() };
  await batch.update({ status: 'approved', approvedBy: adminId, approvedAt: new Date(), auditLog: [...(batch.auditLog || []), entry] });
  return batch.reload();
}

async function rejectBatch(batchId, adminId, reason) {
  const { PayoutBatch, BillingTransaction } = m();
  const batch = await PayoutBatch.findByPk(batchId);
  if (!batch) throw new Error('Batch not found');
  if (!['draft', 'pending_approval', 'approved'].includes(batch.status))
    throw new Error(`Cannot reject a batch with status "${batch.status}"`);

  const txs = await BillingTransaction.findAll({ where: { batchId } });
  const totalNet = txs.reduce((s, t) => s + parseFloat(t.netAmount), 0);

  for (const tx of txs) {
    const entry = { status: 'held', from: 'released', at: new Date().toISOString(), by: adminId, note: `Batch rejected: ${reason}` };
    await tx.update({ status: 'held', batchId: null, auditLog: [...(tx.auditLog || []), entry] });
  }

  const bal = await getOrCreateBalance(batch.providerId);
  await bal.decrement('releasedBalance', { by: parseFloat(totalNet.toFixed(2)) });
  await bal.increment('heldBalance',     { by: parseFloat(totalNet.toFixed(2)) });

  const entry = { action: 'rejected', by: adminId, reason, at: new Date().toISOString() };
  await batch.update({
    status: 'rejected', rejectedBy: adminId, rejectedAt: new Date(),
    rejectionReason: reason, auditLog: [...(batch.auditLog || []), entry],
  });
  return batch.reload();
}

async function markBatchPaid(batchId, adminId, payoutMethod, payoutReference, notes) {
  const { PayoutBatch, BillingTransaction } = m();
  const batch = await PayoutBatch.findByPk(batchId);
  if (!batch) throw new Error('Batch not found');
  if (batch.status !== 'approved')
    throw new Error(`Batch must be approved first (current: "${batch.status}")`);

  const txs = await BillingTransaction.findAll({ where: { batchId } });
  const totalNet = txs.reduce((s, t) => s + parseFloat(t.netAmount), 0);

  for (const tx of txs) {
    const entry = { status: 'paid', from: 'released', at: new Date().toISOString(), by: adminId, note: `Ref: ${payoutReference}` };
    await tx.update({ status: 'paid', auditLog: [...(tx.auditLog || []), entry] });
  }

  const bal = await getOrCreateBalance(batch.providerId);
  await bal.decrement('releasedBalance', { by: parseFloat(totalNet.toFixed(2)) });
  await bal.increment('totalPaid',       { by: parseFloat(totalNet.toFixed(2)) });

  const entry = { action: 'paid', by: adminId, payoutReference, at: new Date().toISOString() };
  await batch.update({
    status: 'paid', paidAt: new Date(), payoutMethod, payoutReference, notes,
    auditLog: [...(batch.auditLog || []), entry],
  });
  return batch.reload();
}

// ─── Sync existing bookings ───────────────────────────────────────────────────

async function syncExistingBookings() {
  const { Booking, Schedule, Bus } = m();
  const bookings = await Booking.findAll({
    where: { paymentStatus: 'paid', bookingStatus: { [Op.in]: ['confirmed', 'completed'] } },
    include: [{ model: Schedule, as: 'schedule', include: [{ model: Bus, as: 'bus', attributes: ['providerId', 'id'] }] }],
  });

  let created = 0;
  for (const b of bookings) {
    const tx = await createTransactionForBooking(b, b.schedule);
    if (tx) created++;
  }
  return created;
}

// ─── CSV export ───────────────────────────────────────────────────────────────

async function generateBatchCSV(batchId) {
  const { PayoutBatch, BillingTransaction, Booking, User } = m();
  const batch = await PayoutBatch.findByPk(batchId, {
    include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'email'] }],
  });
  const txs = await BillingTransaction.findAll({
    where: { batchId },
    include: [{ model: Booking, as: 'booking', attributes: ['ticketNumber', 'paymentMethod', 'createdAt'] }],
    order: [['tripDate', 'ASC']],
  });

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Batch Number', 'Provider', 'Email', 'Period Start', 'Period End', 'Total Gross (NPR)', 'Commission (NPR)', 'Net Payable (NPR)', 'Status'].map(esc).join(','),
    [batch.batchNumber, batch.provider?.companyName || batch.provider?.name, batch.provider?.email, batch.periodStart, batch.periodEnd, batch.totalGross, batch.totalCommission, batch.totalNet, batch.status].map(esc).join(','),
    '',
    ['Ticket #', 'Trip Date', 'Gross (NPR)', 'Comm Rate', 'Commission (NPR)', 'Net (NPR)', 'Status', 'Payment Method'].map(esc).join(','),
    ...txs.map(tx => [
      tx.booking?.ticketNumber ?? tx.bookingId,
      tx.tripDate,
      tx.grossAmount,
      `${tx.commissionRate}%`,
      tx.commissionAmount,
      tx.netAmount,
      tx.status,
      tx.booking?.paymentMethod ?? '',
    ].map(esc).join(',')),
  ];
  return rows.join('\n');
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function _recalcBatch(batchId) {
  const { PayoutBatch, BillingTransaction } = m();
  const batch = await PayoutBatch.findByPk(batchId);
  if (!batch) return;
  const txs = await BillingTransaction.findAll({ where: { batchId, status: 'released' } });
  await batch.update({
    totalGross:       parseFloat(txs.reduce((s, t) => s + parseFloat(t.grossAmount), 0).toFixed(2)),
    totalCommission:  parseFloat(txs.reduce((s, t) => s + parseFloat(t.commissionAmount), 0).toFixed(2)),
    totalNet:         parseFloat(txs.reduce((s, t) => s + parseFloat(t.netAmount), 0).toFixed(2)),
    transactionCount: txs.length,
  });
}

module.exports = {
  getSetting, getSettings, setSettings,
  getOrCreateBalance, getCommissionRate,
  createTransactionForBooking, refundTransaction,
  processNightly, processPayoutSchedule,
  generateBatchForProvider,
  approveBatch, rejectBatch, markBatchPaid,
  syncExistingBookings, generateBatchCSV,
};

const { Op } = require('sequelize');
const billing = require('../services/billingService');

const m = () => require('../models');

// ─── Dashboard ────────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const { BillingTransaction, PayoutBatch, OperatorBalance, sequelize } = m();
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end   = now.toISOString().split('T')[0];

    const [pendingTotal, heldTotal, releasedTotal, paidThisMonth, commissionThisMonth,
           batchesPending, batchesApproved, totalOperators] = await Promise.all([
      BillingTransaction.sum('netAmount',        { where: { status: 'pending' } }),
      BillingTransaction.sum('netAmount',        { where: { status: 'held' } }),
      BillingTransaction.sum('netAmount',        { where: { status: 'released' } }),
      BillingTransaction.sum('netAmount',        { where: { status: 'paid', updatedAt: { [Op.between]: [start, `${end}T23:59:59`] } } }),
      BillingTransaction.sum('commissionAmount', { where: { status: { [Op.not]: 'refunded' }, createdAt: { [Op.between]: [start, `${end}T23:59:59`] } } }),
      PayoutBatch.count({ where: { status: 'pending_approval' } }),
      PayoutBatch.count({ where: { status: 'approved' } }),
      OperatorBalance.count(),
    ]);

    // Average settlement days (paid transactions)
    const paidTxs = await BillingTransaction.findAll({
      where: { status: 'paid' },
      attributes: ['createdAt', 'updatedAt'],
      limit: 100,
      order: [['updatedAt', 'DESC']],
    });
    const avgDays = paidTxs.length
      ? paidTxs.reduce((s, t) => s + (new Date(t.updatedAt) - new Date(t.createdAt)) / 86400000, 0) / paidTxs.length
      : 0;

    // Recent batches
    const recentBatches = await PayoutBatch.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{ model: m().User, as: 'provider', attributes: ['name', 'companyName'] }],
    });

    res.json({
      pendingTotal:      parseFloat((pendingTotal  || 0).toFixed(2)),
      heldTotal:         parseFloat((heldTotal     || 0).toFixed(2)),
      releasedTotal:     parseFloat((releasedTotal || 0).toFixed(2)),
      paidThisMonth:     parseFloat((paidThisMonth || 0).toFixed(2)),
      commissionThisMonth: parseFloat((commissionThisMonth || 0).toFixed(2)),
      batchesPending,
      batchesApproved,
      totalOperators,
      avgSettlementDays: parseFloat(avgDays.toFixed(1)),
      recentBatches,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Operators ────────────────────────────────────────────────────────────────

exports.getOperators = async (req, res) => {
  try {
    const { User, OperatorBalance } = m();
    const providers = await User.findAll({
      where: { role: 'provider' },
      attributes: { exclude: ['password'] },
    });

    const result = await Promise.all(providers.map(async (p) => {
      const bal = await OperatorBalance.findOne({ where: { providerId: p.id } });
      return { provider: p, balance: bal };
    }));

    res.json({ operators: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOperatorDetail = async (req, res) => {
  try {
    const { User, BillingTransaction, PayoutBatch } = m();
    const providerId = req.params.id;

    const provider = await User.findByPk(providerId, { attributes: { exclude: ['password'] } });
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    const balance = await billing.getOrCreateBalance(providerId);

    const recentTxs = await BillingTransaction.findAll({
      where: { providerId },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    const recentBatches = await PayoutBatch.findAll({
      where: { providerId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.json({ provider, balance, recentTxs, recentBatches });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateOperatorSettings = async (req, res) => {
  try {
    const { settlementCycle, commissionRate, minimumThreshold, payoutDay, bankDetails, notes } = req.body;
    const bal = await billing.getOrCreateBalance(req.params.id);
    await bal.update({
      ...(settlementCycle  != null && { settlementCycle }),
      ...(commissionRate   != null && { commissionRate: parseFloat(commissionRate) }),
      ...(minimumThreshold != null && { minimumThreshold: parseFloat(minimumThreshold) }),
      ...(payoutDay        != null && { payoutDay: parseInt(payoutDay) }),
      ...(bankDetails      != null && { bankDetails }),
      ...(notes            != null && { notes }),
    });
    res.json({ message: 'Settings updated', balance: bal });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Transactions ─────────────────────────────────────────────────────────────

exports.getTransactions = async (req, res) => {
  try {
    const { BillingTransaction, User, Booking } = m();
    const { status, providerId, page = 1, limit = 50, from, to } = req.query;

    const where = {};
    if (status)     where.status     = status;
    if (providerId) where.providerId = providerId;
    if (from && to) where.tripDate   = { [Op.between]: [from, to] };

    const txs = await BillingTransaction.findAndCountAll({
      where,
      include: [
        { model: User,    as: 'provider', attributes: ['name', 'companyName'] },
        { model: Booking, as: 'booking',  attributes: ['ticketNumber', 'paymentMethod', 'totalAmount'],
          include: [{ model: User, as: 'customer', attributes: ['name', 'phoneNumber'] }] },
      ],
      order: [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ transactions: txs.rows, total: txs.count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { BillingTransaction } = m();
    const { status, note } = req.body;
    const allowed = ['pending', 'held', 'released', 'paid', 'refunded'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const tx = await BillingTransaction.findByPk(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    const entry = { status, from: tx.status, at: new Date().toISOString(), by: req.user.id, note: note || 'Manual override' };
    await tx.update({ status, auditLog: [...(tx.auditLog || []), entry] });
    res.json({ transaction: tx });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Payout Batches ───────────────────────────────────────────────────────────

exports.generateBatch = async (req, res) => {
  try {
    const { providerId, periodStart, periodEnd } = req.body;
    if (!providerId || !periodStart || !periodEnd)
      return res.status(400).json({ message: 'providerId, periodStart, periodEnd are required' });

    const batch = await billing.generateBatchForProvider(providerId, periodStart, periodEnd, req.user.id);
    if (!batch) return res.status(400).json({ message: 'No held transactions found in the selected period, or total net amount is below the minimum payout threshold.' });
    res.status(201).json({ message: 'Batch generated', batch });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getBatches = async (req, res) => {
  try {
    const { PayoutBatch, User } = m();
    const { status, providerId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status)     where.status     = status;
    if (providerId) where.providerId = providerId;

    const batches = await PayoutBatch.findAndCountAll({
      where,
      include: [{ model: User, as: 'provider', attributes: ['name', 'companyName'] }],
      order: [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ batches: batches.rows, total: batches.count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getBatchDetail = async (req, res) => {
  try {
    const { PayoutBatch, BillingTransaction, User, Booking } = m();
    const batch = await PayoutBatch.findByPk(req.params.id, {
      include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'email', 'phoneNumber'] }],
    });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const transactions = await BillingTransaction.findAll({
      where: { batchId: batch.id },
      include: [{ model: Booking, as: 'booking', attributes: ['ticketNumber', 'paymentMethod', 'createdAt', 'seats'] }],
      order: [['tripDate', 'ASC']],
    });

    res.json({ batch, transactions });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.approveBatch = async (req, res) => {
  try {
    const batch = await billing.approveBatch(req.params.id, req.user.id);
    res.json({ message: 'Batch approved', batch });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.rejectBatch = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });
    const batch = await billing.rejectBatch(req.params.id, req.user.id, reason);
    res.json({ message: 'Batch rejected', batch });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.markBatchPaid = async (req, res) => {
  try {
    const { payoutMethod, payoutReference, notes } = req.body;
    if (!payoutMethod || !payoutReference)
      return res.status(400).json({ message: 'payoutMethod and payoutReference are required' });
    const batch = await billing.markBatchPaid(req.params.id, req.user.id, payoutMethod, payoutReference, notes);
    res.json({ message: 'Batch marked as paid', batch });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.exportBatchCSV = async (req, res) => {
  try {
    const csv = await billing.generateBatchCSV(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payout-${req.params.id}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Settings ─────────────────────────────────────────────────────────────────

exports.getSettings = async (req, res) => {
  try {
    res.json({ settings: await billing.getSettings() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateSettings = async (req, res) => {
  try {
    await billing.setSettings(req.body);
    res.json({ message: 'Settings saved', settings: await billing.getSettings() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Utilities ────────────────────────────────────────────────────────────────

exports.syncTransactions = async (req, res) => {
  try {
    const count = await billing.syncExistingBookings();
    res.json({ message: `Synced ${count} new billing transactions from existing confirmed bookings` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.runNightly = async (req, res) => {
  try {
    const count = await billing.processNightly();
    res.json({ message: `Moved ${count} transactions from pending → held` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

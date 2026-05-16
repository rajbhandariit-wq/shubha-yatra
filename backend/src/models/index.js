const sequelize = require('../config/database');
const User               = require('./User')(sequelize);
const Bus                = require('./Bus')(sequelize);
const Route              = require('./Route')(sequelize);
const Schedule           = require('./Schedule')(sequelize);
const Booking            = require('./Booking')(sequelize);
const Staff              = require('./Staff')(sequelize);
const Notification       = require('./Notification')(sequelize);
const OperatorBalance    = require('./OperatorBalance')(sequelize);
const BillingTransaction = require('./BillingTransaction')(sequelize);
const PayoutBatch        = require('./PayoutBatch')(sequelize);
const BillingSetting     = require('./BillingSetting')(sequelize);

// ── Core associations ────────────────────────────────────────────────────────
User.hasMany(Bus,      { foreignKey: 'providerId', as: 'buses' });
Bus.belongsTo(User,   { foreignKey: 'providerId', as: 'provider' });

User.hasMany(Route,    { foreignKey: 'providerId', as: 'routes' });
Route.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

Bus.hasMany(Schedule,      { foreignKey: 'busId', as: 'schedules' });
Schedule.belongsTo(Bus,    { foreignKey: 'busId', as: 'bus' });

Route.hasMany(Schedule,    { foreignKey: 'routeId', as: 'schedules' });
Schedule.belongsTo(Route,  { foreignKey: 'routeId', as: 'route' });

User.hasMany(Booking,      { foreignKey: 'customerId', as: 'bookings' });
Booking.belongsTo(User,    { foreignKey: 'customerId', as: 'customer' });

Schedule.hasMany(Booking,  { foreignKey: 'scheduleId', as: 'bookings' });
Booking.belongsTo(Schedule,{ foreignKey: 'scheduleId', as: 'schedule' });

User.hasMany(Staff,    { foreignKey: 'providerId', as: 'staff' });
Staff.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

User.hasMany(Notification, { foreignKey: 'senderId', as: 'notifications' });

// ── Billing associations ─────────────────────────────────────────────────────
User.hasOne(OperatorBalance,  { foreignKey: 'providerId', as: 'operatorBalance' });
OperatorBalance.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

User.hasMany(BillingTransaction, { foreignKey: 'providerId', as: 'billingTransactions' });
BillingTransaction.belongsTo(User,    { foreignKey: 'providerId', as: 'provider' });
BillingTransaction.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Booking.hasOne(BillingTransaction,    { foreignKey: 'bookingId', as: 'billingTransaction' });

User.hasMany(PayoutBatch,     { foreignKey: 'providerId', as: 'payoutBatches' });
PayoutBatch.belongsTo(User,   { foreignKey: 'providerId', as: 'provider' });

PayoutBatch.hasMany(BillingTransaction, { foreignKey: 'batchId', as: 'transactions' });
BillingTransaction.belongsTo(PayoutBatch, { foreignKey: 'batchId', as: 'batch' });

module.exports = {
  sequelize,
  User, Bus, Route, Schedule, Booking, Staff, Notification,
  OperatorBalance, BillingTransaction, PayoutBatch, BillingSetting,
};

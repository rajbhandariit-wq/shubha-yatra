const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('PayoutBatch', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    batchNumber:     { type: DataTypes.STRING, allowNull: false, unique: true },
    providerId:      { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'paid', 'rejected'),
      defaultValue: 'pending_approval',
    },
    totalGross:       { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalCommission:  { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalNet:         { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    transactionCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    periodStart:      { type: DataTypes.DATEONLY, allowNull: false },
    periodEnd:        { type: DataTypes.DATEONLY, allowNull: false },
    payoutMethod:     { type: DataTypes.STRING, allowNull: true },
    payoutReference:  { type: DataTypes.STRING, allowNull: true },
    approvedBy:       { type: DataTypes.UUID, allowNull: true },
    approvedAt:       { type: DataTypes.DATE, allowNull: true },
    paidAt:           { type: DataTypes.DATE, allowNull: true },
    rejectedBy:       { type: DataTypes.UUID, allowNull: true },
    rejectedAt:       { type: DataTypes.DATE, allowNull: true },
    rejectionReason:  { type: DataTypes.TEXT, allowNull: true },
    auditLog:         { type: DataTypes.JSONB, defaultValue: [] },
    notes:            { type: DataTypes.TEXT, allowNull: true },
  }, { timestamps: true });
};

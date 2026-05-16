const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BillingTransaction', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    bookingId:        { type: DataTypes.UUID, allowNull: false, unique: true },
    providerId:       { type: DataTypes.UUID, allowNull: false },
    batchId:          { type: DataTypes.UUID, allowNull: true },
    grossAmount:      { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    commissionRate:   { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    commissionAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    netAmount:        { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    // pending → held (trip passed) → released (in batch) → paid | refunded
    status: {
      type: DataTypes.ENUM('pending', 'held', 'released', 'paid', 'refunded'),
      defaultValue: 'pending',
    },
    tripDate:  { type: DataTypes.DATEONLY, allowNull: false },
    auditLog:  { type: DataTypes.JSONB, defaultValue: [] },
    notes:     { type: DataTypes.TEXT, allowNull: true },
  }, { timestamps: true });
};

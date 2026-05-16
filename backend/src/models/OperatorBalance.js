const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('OperatorBalance', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    providerId:       { type: DataTypes.UUID, allowNull: false, unique: true },
    pendingBalance:   { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    heldBalance:      { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    releasedBalance:  { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalPaid:        { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // Per-operator overrides (null = use global setting)
    settlementCycle:  { type: DataTypes.ENUM('weekly', 'monthly'), allowNull: true },
    commissionRate:   { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    minimumThreshold: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    payoutDay:        { type: DataTypes.INTEGER, allowNull: true }, // 0-6 weekly (0=Sun); 1-28 monthly
    nextPayoutDate:   { type: DataTypes.DATEONLY, allowNull: true },
    bankDetails:      { type: DataTypes.JSONB, allowNull: true },   // { bankName, accountNumber, accountHolder, branch }
    notes:            { type: DataTypes.TEXT, allowNull: true },
  }, { timestamps: true });
};

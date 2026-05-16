const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BillingSetting', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    key:         { type: DataTypes.STRING, allowNull: false, unique: true },
    value:       { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
  }, { timestamps: true });
};

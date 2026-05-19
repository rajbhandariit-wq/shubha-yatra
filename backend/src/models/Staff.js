const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Staff = sequelize.define('Staff', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    providerId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('driver', 'conductor', 'helper'), allowNull: false },
    licenseNumber: { type: DataTypes.STRING, allowNull: true },
    licenseExpiry: { type: DataTypes.DATEONLY, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    joiningDate: { type: DataTypes.DATEONLY, allowNull: true },
    salary: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    userId: { type: DataTypes.UUID, allowNull: true },
  });
  return Staff;
};

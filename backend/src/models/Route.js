const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Route = sequelize.define('Route', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    providerId: { type: DataTypes.UUID, allowNull: false },
    source: { type: DataTypes.STRING, allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    distance: { type: DataTypes.FLOAT, allowNull: true },
    estimatedDuration: { type: DataTypes.INTEGER, allowNull: true, comment: 'in minutes' },
    fare: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    departureTime: { type: DataTypes.STRING, allowNull: false },
    arrivalTime: { type: DataTypes.STRING, allowNull: false },
    stops: { type: DataTypes.JSONB, defaultValue: [] },
    daysOfWeek: { type: DataTypes.JSONB, defaultValue: [0,1,2,3,4,5,6] },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  });
  return Route;
};

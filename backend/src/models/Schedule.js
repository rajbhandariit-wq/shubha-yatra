const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Schedule = sequelize.define('Schedule', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    busId: { type: DataTypes.UUID, allowNull: false },
    routeId: { type: DataTypes.UUID, allowNull: false },
    travelDate: { type: DataTypes.DATEONLY, allowNull: false },
    departureTime: { type: DataTypes.STRING, allowNull: false },
    arrivalTime: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('scheduled', 'delayed', 'cancelled', 'completed', 'boarding'), defaultValue: 'scheduled' },
    availableSeats: { type: DataTypes.INTEGER, allowNull: false },
    fare: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    delayMinutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    currentDriverId: { type: DataTypes.UUID, allowNull: true },
    journeyStatus: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      defaultValue: 'not_started',
    },
    driverLocation: { type: DataTypes.JSONB, allowNull: true },
    journeyStartedAt: { type: DataTypes.DATE, allowNull: true },
    journeyEndedAt: { type: DataTypes.DATE, allowNull: true },
  });
  return Schedule;
};

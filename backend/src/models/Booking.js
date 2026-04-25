const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ticketNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    customerId: { type: DataTypes.UUID, allowNull: false },
    scheduleId: { type: DataTypes.UUID, allowNull: false },
    seats: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    passengerDetails: { type: DataTypes.JSONB, defaultValue: [] },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'), defaultValue: 'pending' },
    paymentMethod: { type: DataTypes.STRING, allowNull: true },
    paymentReference: { type: DataTypes.STRING, allowNull: true },
    bookingStatus: { type: DataTypes.ENUM('confirmed', 'cancelled', 'completed', 'pending'), defaultValue: 'pending' },
    cancellationReason: { type: DataTypes.TEXT, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    boardingPoint: { type: DataTypes.STRING, allowNull: true },
    droppingPoint: { type: DataTypes.STRING, allowNull: true }
  });
  return Booking;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bus = sequelize.define('Bus', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    providerId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    registrationNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('AC', 'Non-AC', 'Sleeper', 'Deluxe', 'Super-Deluxe'), defaultValue: 'Non-AC' },
    totalSeats: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 40 },
    seatLayout: {
      type: DataTypes.JSONB,
      defaultValue: { rows: 10, seatsPerRow: 4, layout: '2-2', hasUpperDeck: false }
    },
    amenities: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    imageUrl: { type: DataTypes.STRING, allowNull: true }
  });
  return Bus;
};

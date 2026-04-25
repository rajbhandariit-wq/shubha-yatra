const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    senderId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.ENUM('SMS', 'Email', 'Both'), defaultValue: 'Email' },
    subject: { type: DataTypes.STRING, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    recipients: { type: DataTypes.JSONB, defaultValue: [] },
    scheduleId: { type: DataTypes.UUID, allowNull: true },
    status: { type: DataTypes.ENUM('sent', 'failed', 'pending'), defaultValue: 'sent' },
    sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });
  return Notification;
};

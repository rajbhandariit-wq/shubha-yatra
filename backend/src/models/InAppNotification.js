const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InAppNotification = sequelize.define('InAppNotification', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId:    { type: DataTypes.UUID, allowNull: false },
    title:     { type: DataTypes.STRING, allowNull: false },
    message:   { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        'new_booking',
        'booking_cancelled',
        'schedule_changed',
        'schedule_delayed',
        'schedule_cancelled',
        'provider_message'
      ),
      allowNull: false
    },
    isRead:    { type: DataTypes.BOOLEAN, defaultValue: false },
    relatedId: { type: DataTypes.UUID, allowNull: true },
  }, {
    tableName: 'in_app_notifications',
    indexes: [
      { fields: ['userId'] },
      { fields: ['userId', 'isRead'] },
    ]
  });
  return InAppNotification;
};

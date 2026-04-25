const sequelize = require('../config/database');
const User = require('./User')(sequelize);
const Bus = require('./Bus')(sequelize);
const Route = require('./Route')(sequelize);
const Schedule = require('./Schedule')(sequelize);
const Booking = require('./Booking')(sequelize);
const Staff = require('./Staff')(sequelize);
const Notification = require('./Notification')(sequelize);

// Associations
User.hasMany(Bus, { foreignKey: 'providerId', as: 'buses' });
Bus.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

User.hasMany(Route, { foreignKey: 'providerId', as: 'routes' });
Route.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

Bus.hasMany(Schedule, { foreignKey: 'busId', as: 'schedules' });
Schedule.belongsTo(Bus, { foreignKey: 'busId', as: 'bus' });

Route.hasMany(Schedule, { foreignKey: 'routeId', as: 'schedules' });
Schedule.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });

User.hasMany(Booking, { foreignKey: 'customerId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

Schedule.hasMany(Booking, { foreignKey: 'scheduleId', as: 'bookings' });
Booking.belongsTo(Schedule, { foreignKey: 'scheduleId', as: 'schedule' });

User.hasMany(Staff, { foreignKey: 'providerId', as: 'staff' });
Staff.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

User.hasMany(Notification, { foreignKey: 'senderId', as: 'notifications' });

module.exports = { sequelize, User, Bus, Route, Schedule, Booking, Staff, Notification };

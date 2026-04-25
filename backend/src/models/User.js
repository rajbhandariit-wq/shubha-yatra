const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM('customer', 'provider', 'admin'), defaultValue: 'customer' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    companyName: { type: DataTypes.STRING, allowNull: true },
    companyAddress: { type: DataTypes.STRING, allowNull: true },
    profileImage: { type: DataTypes.STRING, allowNull: true }
  }, {
    hooks: {
      beforeCreate: async (user) => { user.password = await bcrypt.hash(user.password, 12); },
      beforeUpdate: async (user) => { if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12); }
    }
  });

  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toSafeObject = function() {
    const { password, ...safe } = this.toJSON();
    return safe;
  };

  return User;
};

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('Users', 'address', {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn('Users', 'phoneNumber', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Users', 'idType', {
      type: Sequelize.ENUM('CITIZEN_ID', 'NID', 'DRIVING_LICENSE', 'PASSPORT')
    });

    await queryInterface.addColumn('Users', 'idNumber', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Users', 'dateOfBirth', {
      type: Sequelize.DATEONLY
    });
  },

  async down(queryInterface, Sequelize) {
    // rollback (important for safety)
    await queryInterface.removeColumn('Users', 'address');
    await queryInterface.removeColumn('Users', 'phoneNumber');
    await queryInterface.removeColumn('Users', 'idType');
    await queryInterface.removeColumn('Users', 'idNumber');
    await queryInterface.removeColumn('Users', 'dateOfBirth');
  }
};
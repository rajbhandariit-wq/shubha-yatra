const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'shubha_yatra',
    'postgres',
    'postgres123',
    {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        logging: false
    }
);

module.exports = sequelize;

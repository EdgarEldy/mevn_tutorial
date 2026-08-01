const { Sequelize } = require('sequelize');
const env = require('./env');

const database = env.nodeEnv === 'test' ? env.db.nameTest : env.db.name;

const sequelize = new Sequelize(database, env.db.username, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: false,
});

module.exports = sequelize;

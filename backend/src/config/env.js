require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'mevn_db',
    nameTest: process.env.DB_NAME_TEST || 'mevn_db_test',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql',
  },
  jwtSecret: process.env.JWT_SECRET || 'change_me',
};

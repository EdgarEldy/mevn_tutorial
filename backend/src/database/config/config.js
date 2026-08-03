require('dotenv').config();

const base = {
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
};

module.exports = {
  development: { ...base, database: process.env.DB_NAME || 'mevn_db' },
  test: { ...base, database: process.env.DB_NAME_TEST || 'mevn_db_test' },
  production: { ...base, database: process.env.DB_NAME || 'mevn_db' },
};

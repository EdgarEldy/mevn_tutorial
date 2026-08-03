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
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  activationTokenTtlHours: parseInt(process.env.ACTIVATION_TOKEN_TTL_HOURS, 10) || 24,
  resetTokenTtlHours: parseInt(process.env.RESET_TOKEN_TTL_HOURS, 10) || 1,
  smtp: {
    host: process.env.SMTP_HOST || '127.0.0.1',
    port: parseInt(process.env.SMTP_PORT, 10) || 1025,
  },
  mailFrom: process.env.MAIL_FROM || 'no-reply@mevn-tutorial.test',
  // Stripped of a trailing slash so URL-building call sites can safely do
  // `${frontendUrl}/path` without risking a double slash.
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, ''),
};

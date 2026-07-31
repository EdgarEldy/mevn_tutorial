const app = require('./app');
const env = require('./config/env');
const sequelize = require('./config/database');

async function start() {
  try {
    await sequelize.authenticate();
    app.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (err) {
    console.error('Unable to connect to the database:', err.message);
    process.exit(1);
  }
}

start();

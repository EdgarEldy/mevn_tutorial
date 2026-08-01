const http = require('http');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const app = require('./app');
const env = require('./config/env');
const sequelize = require('./config/database');
const mountGraphQL = require('./graphql/mountGraphQL');

async function start() {
  try {
    await sequelize.authenticate();

    const httpServer = http.createServer(app);

    await mountGraphQL(app.v1, [ApolloServerPluginDrainHttpServer({ httpServer })]);

    await new Promise((resolve) => httpServer.listen(env.port, resolve));
    console.log(`Server listening on port ${env.port}`);
    console.log(`GraphQL endpoint: http://localhost:${env.port}/api/v1/graphql`);
  } catch (err) {
    console.error('Unable to start the server:', err.message);
    process.exit(1);
  }
}

start();

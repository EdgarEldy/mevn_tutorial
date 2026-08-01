'use strict';

const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const schema = require('./schema');
const buildContext = require('./authContext');

// Single source of truth for turning a schema into a running Apollo Server and
// mounting it on an Express router at '/graphql'. Used by both server.js and
// the GraphQL integration test, so a mistake in this wiring can't silently
// diverge between the two and go uncaught.
async function mountGraphQL(router, plugins = []) {
  const apolloServer = new ApolloServer({ ...schema, plugins });
  await apolloServer.start();
  router.use('/graphql', expressMiddleware(apolloServer, { context: buildContext }));
  return apolloServer;
}

module.exports = mountGraphQL;

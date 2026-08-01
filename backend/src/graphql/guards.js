'use strict';

const { GraphQLError } = require('graphql');

function requireAuth(context) {
  if (!context.user) {
    throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return context.user;
}

function requireRole(context, role) {
  const user = requireAuth(context);
  const hasRole = (user.roles || []).some((r) => r.role_name === role);
  if (!hasRole) {
    throw new GraphQLError('Insufficient permissions.', { extensions: { code: 'FORBIDDEN' } });
  }
  return user;
}

module.exports = { requireAuth, requireRole };

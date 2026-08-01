'use strict';

const bcrypt = require('bcryptjs');
const { User, Role } = require('../../src/database/models');

async function ensureRole(roleName) {
  const [role] = await Role.findOrCreate({ where: { role_name: roleName } });
  return role;
}

// Bypasses the register/activate email flow on purpose - these are pre-activated
// fixtures for exercising RBAC on other modules' integration tests, not auth's own
// flow (which gets its own dedicated integration test).
async function createUserWithRole(roleName, overrides = {}) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = overrides.email || `${roleName}-${unique}@example.com`;
  const password = overrides.password || 'password123';
  const hashed = await bcrypt.hash(password, 4); // low cost factor - this only needs to be test-fast, not production-secure

  const user = await User.create({
    first_name: overrides.first_name || 'Test',
    last_name: overrides.last_name || 'User',
    email,
    password: hashed,
    enabled: true,
    account_locked: false,
  });

  const role = await ensureRole(roleName);
  await user.addRole(role.id);

  return { user, email, password };
}

async function loginAndGetToken(app, request, email, password) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.token;
}

module.exports = { ensureRole, createUserWithRole, loginAndGetToken };

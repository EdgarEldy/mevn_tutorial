import mysql from 'mysql2/promise'

const API_URL = 'http://localhost:3001/api/v1'
const MAILHOG_URL = 'http://localhost:8025'

// Direct DB access is the only way to grant the admin role: there's no admin-creation
// endpoint, and registration always defaults to the 'user' role (see auth.service.js's
// register()). Reuses the same env vars as the backend itself (see backend/.env / ci.yml's
// frontend job), with the same local-dev defaults backend/.env documents, so this works
// unmodified both locally and in CI without any e2e-specific configuration.
function dbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'mevn_db',
  }
}

// MailHog's raw body is quoted-printable encoded, which soft-wraps long lines with a
// trailing '=', so a token spanning a wrap needs decoding before a regex can match it as
// one contiguous string.
function decodeQuotedPrintable(body) {
  return body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Fetches the most recent message addressed to `email` and pulls a token out of a link
// matching `pathPrefix` (e.g. '/auth/activate/'). Filtering by recipient (rather than
// just grabbing the single latest message) matters because Playwright runs test files
// in parallel workers, so multiple tests can be registering accounts and sending mail
// through the same MailHog instance at close to the same time.
//
// Polls for up to 5 seconds instead of fetching once: the backend awaits the SMTP send
// before its HTTP response resolves (see auth.service.js's register()), so the message
// has been handed to MailHog by the time the frontend's "Check your email" confirmation
// appears - but MailHog accepting a message over SMTP and that message being indexed and
// queryable through its own HTTP API aren't the same instant, and the gap between them
// was wide enough to fail this lookup outright on a CI runner's more limited resources
// (never reproduced locally, where MailHog is a long-running, already-warm container).
export async function extractTokenFromLatestEmailTo(email, pathPrefix) {
  const deadline = Date.now() + 5000
  let lastCheckedCount = 0
  while (Date.now() < deadline) {
    const response = await fetch(`${MAILHOG_URL}/api/v2/messages?limit=50`)
    const data = await response.json()
    lastCheckedCount = data.items.length
    const message = data.items.find((item) => item.Content.Headers.To?.[0] === email)
    if (message) {
      const decoded = decodeQuotedPrintable(message.Content.Body)
      const match = decoded.match(new RegExp(`${pathPrefix}([a-zA-Z0-9]+)`))
      return match[1]
    }
    await sleep(250)
  }
  throw new Error(`No MailHog message found addressed to ${email} (checked the ${lastCheckedCount} most recent).`)
}

// Registers a fresh admin user against the real backend, activates it via the real
// mailbox, grants the admin role directly in the DB, and logs in - mirroring, as a
// permanent committed fixture, the manual verification steps this project has used by
// hand throughout every earlier CRUD feature branch. Returns the token plus a cleanup
// function so tests can leave the DB as they found it.
export async function createAdminSession() {
  const email = `e2e-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
  const password = 'Password123'

  const registerResponse = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: 'E2E', last_name: 'Admin', email, password }),
  })
  const registerBody = await registerResponse.json()
  const userId = registerBody.data.id

  const activationToken = await extractTokenFromLatestEmailTo(email, '/auth/activate/')
  await fetch(`${API_URL}/auth/activate/${activationToken}`)

  const connection = await mysql.createConnection(dbConfig())
  try {
    const [[adminRole]] = await connection.query("SELECT id FROM roles WHERE role_name = 'admin'")
    await connection.query(
      'INSERT INTO role_user (user_id, role_id, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
      [userId, adminRole.id],
    )
  } finally {
    await connection.end()
  }

  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginBody = await loginResponse.json()
  const { token, user } = loginBody.data

  async function cleanup() {
    const cleanupConnection = await mysql.createConnection(dbConfig())
    try {
      await cleanupConnection.query('DELETE FROM role_user WHERE user_id = ?', [userId])
      await cleanupConnection.query('DELETE FROM users WHERE id = ?', [userId])
    } finally {
      await cleanupConnection.end()
    }
  }

  return { token, user, userId, cleanup }
}

// Deletes a user created directly through the register UI (not via createAdminSession(),
// which already returns its own cleanup()), so tests that exercise the registration flow
// itself don't leave test accounts behind in the database.
export async function deleteUserByEmail(email) {
  const connection = await mysql.createConnection(dbConfig())
  try {
    const [[user]] = await connection.query('SELECT id FROM users WHERE email = ?', [email])
    if (!user) return
    await connection.query('DELETE FROM role_user WHERE user_id = ?', [user.id])
    await connection.query('DELETE FROM users WHERE id = ?', [user.id])
  } finally {
    await connection.end()
  }
}

// Seeds localStorage with the token and user before any app script runs, so the app
// boots already authenticated instead of racing a post-load login. auth.store.js reads
// both keys (see setSession()): the token alone would leave isAdmin false, since role
// data only ever comes from the login response body, never the JWT itself.
export async function applySession(page, session) {
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    { token: session.token, user: session.user },
  )
}

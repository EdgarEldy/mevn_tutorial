# MEVN Tutorial

A hands-on walkthrough of building a full-stack CRUD application with **Express 5 / Node.js** (backend) and **Vue 3** (frontend), organized into Git branches that progressively cover the key concepts of the stack — with **MySQL 8** and **Sequelize ORM**, and completed with **JWT authentication** and **RBAC**.

The data model follows this EER schema: `categories` → `products` → `orders` ← `customers`. A separate `users` table with `roles` and `permissions` handles authentication.

This document is the **complete specification** of the project: it is meant to be followed branch by branch.

Repository: https://github.com/EdgarEldy/mevn_tutorial

## Table of contents

- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Auth model (EER_AUTH)](#auth-model-eer_auth)
- [Branching strategy](#branching-strategy)
- [Project structure](#project-structure)
- [Standard response format](#standard-response-format)
- [Git commit convention](#git-commit-convention)
- [feature/api/core-architecture](#featureapicore-architecture)
- [feature/api/categories](#featureapicategories)
- [feature/api/products](#featureapiproducts)
- [feature/api/customers](#featureapicustomers)
- [feature/api/orders](#featureapiorders)
- [feature/api/auth](#featureapiauth)
- [feature/frontend/core-architecture](#featurefrontendcore-architecture)
- [feature/frontend/categories](#featurefrontendcategories)
- [feature/frontend/products](#featurefrontendproducts)
- [feature/frontend/customers](#featurefrontendcustomers)
- [feature/frontend/orders](#featurefrontendorders)
- [feature/frontend/auth](#featurefrontendauth)
- [Order of work](#order-of-work)
- [Code conventions](#code-conventions)
- [Implementation lessons](#implementation-lessons)
- [How to follow this tutorial](#how-to-follow-this-tutorial)

---

## Tech stack

### Backend

| Component | Choice | Version |
|---|---|---|
| Runtime | Node.js | 20+ (LTS) |
| Framework | Express | ^5.1.0 |
| Database | MySQL | 8.0 |
| ORM | Sequelize | ^6.37.1 |
| Migrations & Seeders | Sequelize CLI | ^6.6.2 |
| Validation | express-validator | ^7.2.1 |
| CORS | cors | ^2.8.6 |
| GraphQL (orders only) | Apollo Server + @as-integrations/express5 + graphql | ^5.0.0 / ^1.1.2 / ^16.9.0 |
| Authentication | jsonwebtoken + bcryptjs | ^9.0.2 / ^3.0.2 |
| Email (dev) | nodemailer + MailHog | ^6.9.16 |
| Environment | dotenv | ^16.4.7 |
| Tests | Jest + Supertest | ^29.7.0 / ^7.0.0 |
| Dev server | nodemon | ^3.1.9 |
| Package manager | yarn | 1.22.22 |

### Frontend

| Component | Choice | Version |
|---|---|---|
| Framework | Vue | ^3.4.x (Composition API, `<script setup>`) |
| Build tool | Vite | ^5.x (already scaffolded) |
| Routing | Vue Router | ^4.x (already scaffolded) |
| State | Pinia | ^2.x (already scaffolded) |
| UI | Vuetify 3 (Material Design) | ^3.x — to add |
| HTTP client | axios | ^1.x — to add |
| Form validation | VeeValidate + yup | ^4.x / ^1.x — to add |
| Notifications | vue-toastification | ^2.x — to add |
| PDF export | jsPDF + jspdf-autotable | ^4.x / ^5.x — to add |
| Unit tests | Vitest + @vue/test-utils | already scaffolded |
| E2E tests | Playwright | to add |
| Package manager | npm | already scaffolded with `package-lock.json` |

Vuetify was picked for its Material Design system and its `v-data-table` component, which anchors the generic reusable `DataTable.vue` list pattern reused by every feature. axios was picked over bare `fetch` for its centralized config and interceptor support, used to attach the JWT and handle 401s in one place. None of this is set in stone — if a later branch finds a better fit, swap it and update this table.

`feature/api/core-architecture` already has `sequelize`, `mysql2`, and `sequelize-cli` installed at the backend root (raw `sequelize init` output — `config/config.json`, `models/index.js`, not yet reorganized). That branch's own task list below builds on top of that, reorganizing it into `src/`, rather than discarding and redoing it from scratch.

---

## Data model

### Business data

```
categories (id, category_name)
    │ 1
    │
    │ N
products (id, category_id FK, product_name, unit_price)
    │ 1
    │
    │ N
orders (id, customer_id FK, product_id FK, quantity, total)
    │ N
    │
    │ 1
customers (id, first_name, last_name, telephone, email, address)
```

### Column details

**categories**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| category_name | VARCHAR(255) | NOT NULL |

**products**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| category_id | BIGINT | FK → categories.id, NOT NULL, ON DELETE RESTRICT |
| product_name | VARCHAR(255) | NOT NULL |
| unit_price | FLOAT | NOT NULL |

**customers**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| first_name | VARCHAR(255) | |
| last_name | VARCHAR(255) | |
| telephone | VARCHAR(50) | |
| email | VARCHAR(255) | |
| address | VARCHAR(255) | |

Every column except `id` is nullable — `POST /api/v1/customers` with an empty body is valid. `email` has no database-level `UNIQUE` constraint — nothing stops two customers from sharing an email unless a migration here deliberately adds one.

**orders**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| customer_id | BIGINT | FK → customers.id, NOT NULL, ON DELETE RESTRICT |
| product_id | BIGINT | FK → products.id, NOT NULL, ON DELETE RESTRICT |
| quantity | INT | NOT NULL |
| total | DOUBLE | computed = quantity × unit_price |

---

## Auth model (EER_AUTH)

The authentication and authorization system uses the following tables:

```
users ──< role_user >── roles ──< role_permission >── permissions
  │
  ├──< blacklisted_tokens
  ├──< activation_tokens
  └──< password_reset_tokens
```

**users**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| first_name | VARCHAR(50) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | bcryptjs hash |
| enabled | BOOLEAN | NOT NULL, default false |
| account_locked | BOOLEAN | NOT NULL, default false |

**roles**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| role_name | VARCHAR(50) | NOT NULL, UNIQUE |

**permissions**

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| resource | VARCHAR(50) | NOT NULL |
| action | VARCHAR(50) | NOT NULL |

**role_user** (pivot)

| Column | Type | Constraints |
|---|---|---|
| user_id | BIGINT | FK → users.id, CASCADE |
| role_id | BIGINT | FK → roles.id, CASCADE |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

**role_permission** (pivot)

| Column | Type | Constraints |
|---|---|---|
| role_id | BIGINT | FK → roles.id, CASCADE |
| permission_id | BIGINT | FK → permissions.id, CASCADE |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

> **Get this right from the first migration.** The two pivot tables above must have
> `createdAt`/`updatedAt` columns from the very first migration. Sequelize's `belongsToMany`
> association expects timestamp columns on the through table by default; omitting them breaks
> `user.addRole(roleId)` with `Unknown column 'createdAt' in 'field list'` on **every single
> registration** — a bug that goes undetected until something actually exercises the
> association, which is exactly why an integration test must cover registration against a real
> database from day one. See [Implementation lessons](#implementation-lessons).

**activation_tokens** (timestamps: false)

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| user_id | BIGINT | FK → users.id, CASCADE |
| token | VARCHAR(255) | |
| created_at | DATETIME | NOT NULL |
| expires_at | DATETIME | |
| validated_at | DATETIME | |

**blacklisted_tokens** (timestamps: false)

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| user_id | BIGINT | FK → users.id, SET NULL (nullable) |
| token | VARCHAR(768) | NOT NULL |
| jti | VARCHAR(255) | UNIQUE |
| blacklisted_at | DATETIME | |
| created_at | DATETIME | NOT NULL |
| expires_at | DATETIME | |

**password_reset_tokens** (timestamps: false)

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| user_id | BIGINT | FK → users.id, SET NULL (nullable) |
| token | VARCHAR(255) | NOT NULL |
| type | VARCHAR(255) | NOT NULL |
| expiry_date | DATETIME | NOT NULL |

### Authorization rules — decide explicitly, don't default silently

| Resource | GET | POST / PUT / DELETE |
|---|---|---|
| `categories`, `products` | Public | Admin role (see note) |
| `customers`, `orders` | Authenticated | Admin role (see note) |
| `auth/*` | Public | — |

**Note:** this table describes the *intended* policy, not necessarily the current
implementation status. A policy table like this is only useful if it stays honest — if
role-gating is ever implemented only in the frontend UI (hiding buttons for non-admins)
without a real backend `authorize(role)` middleware, that's a courtesy, not a security
boundary, and this table must say so explicitly rather than implying enforcement that doesn't
exist. Before starting `feature/api/auth`, decide explicitly — and record the decision in this
README — whether this repo implements backend `authorize(role)` middleware on these routes for
real, or knowingly defers it.

---

## Branching strategy

| Branch | Role |
|---|---|
| `master` | Stable, production-ready. No direct commits — merges only from `develop`. |
| `develop` | Integration branch. All `feature/*` branches merge here. |
| `feature/api/core-architecture` | Technical foundation: `src/` structure, config, deps, shared utils, error middleware. |
| `feature/api/categories` | `Category` module: model, migration, seeder, repository, service, controller, routes, validation, tests. |
| `feature/api/products` | `Product` module with FK to `Category`. |
| `feature/api/customers` | `Customer` module. |
| `feature/api/orders` | `Order` module with business logic (total calculation). |
| `feature/api/auth` | JWT auth: register, activate, login, logout, forgot-password, reset-password, RBAC, real email delivery. |
| `feature/frontend/core-architecture` | Vue 3 base: Vite app, Vue Router, Pinia, Vuetify shell, axios service layer. |
| `feature/frontend/categories` | Categories feature: service, list/form components, lazy route. |
| `feature/frontend/products` | Products feature. |
| `feature/frontend/customers` | Customers feature. |
| `feature/frontend/orders` | Orders feature with automatic total display. |
| `feature/frontend/auth` | Login/Register pages, axios interceptor, route guard. |

Each feature branch ends with a Pull Request to `develop`. Each PR must include atomic commits (one per file) and passing unit + integration tests. See [Order of work](#order-of-work) for the merge/promotion rule.

---

## Project structure

### Backend (`backend/src/`)

```
src/
├── server.js                      ← entry point
├── app.js                         ← Express factory, versioned sub-router
├── config/
│   ├── env.js                     ← single source for all process.env reads
│   └── database.js                ← runtime Sequelize instance
├── database/
│   ├── config/config.js           ← sequelize-cli config (reads .env)
│   ├── models/index.js            ← auto-loader (fs.readdirSync)
│   ├── models/                    ← one file per entity
│   ├── repositories/               ← ONLY layer that touches the DB
│   ├── migrations/
│   └── seeders/
├── modules/
│   └── <resource>/
│       ├── <resource>.routes.js
│       ├── <resource>.controller.js
│       ├── <resource>.service.js
│       └── <resource>.validation.js
├── middlewares/
│   ├── error.middleware.js
│   └── auth.middleware.js         ← JWT verify + jti blacklist check
└── shared/utils/
    ├── apiResponse.js
    ├── catchAsync.js
    └── mailer.js                  ← nodemailer wrapper (added in feature/api/auth)
```

**Request flow:** `Route → auth.middleware (optional) → validation → Controller → Service → Repository → DB`

**Versioned router:** all API endpoints live under `/api/v1/` via a sub-router mounted in `app.js`:

```js
const v1 = express.Router();
v1.use('/auth',       require('./modules/auth/auth.routes'));
v1.use('/categories', require('./modules/categories/category.routes'));
// ...
app.use('/api/v1', v1);
```

### Frontend (`frontend/src/`)

Core/shared/features split, translated into Vue idioms. **File naming differs deliberately
between component and non-component files**: Vue Single-File Components use PascalCase
filenames per the official Vue style guide (`CategoryList.vue`, not `category-list.vue`);
non-component JS files (services, stores, route files) stay kebab-case, matching common Vue
project convention.

```
src/
├── main.js                        ← app bootstrap (createApp, pinia, router, vuetify)
├── App.vue                        ← root component (Vuetify nav-drawer shell)
├── router/
│   └── index.js                   ← top-level routes (lazy-loaded features via dynamic import)
├── stores/
│   ├── auth.store.js              ← Pinia store: session state (user, isAuthenticated, isAdmin)
│   └── ...
├── services/
│   ├── api.service.js             ← axios instance, base URL + interceptors (parallel to ApiService)
│   └── auth-interceptor.js        ← attaches JWT, handles 401 (parallel to jwtInterceptor)
├── router/guards/
│   └── auth.guard.js              ← navigation guard (parallel to authGuard)
├── components/                    ← shared, reusable across features
│   ├── AppSidebar.vue
│   ├── AppTopbar.vue
│   ├── AppFooter.vue
│   ├── DataTable.vue              ← generic table: client-side search, pagination, PDF export
│   └── ConfirmDialog.vue
├── views/
│   └── HomeView.vue                ← placeholder landing page for '/' (already scaffolded)
└── features/
    ├── categories/
    │   ├── categories.routes.js
    │   ├── services/category.service.js
    │   ├── components/CategoryList.vue
    │   ├── components/CategoryForm.vue
    │   └── pages/CategoriesPage.vue
    ├── products/
    ├── customers/
    ├── orders/
    └── auth/
```

`DataTable.vue` is built once during `feature/frontend/core-architecture` and reused by every
later feature's list view instead of each branch hand-rolling search/pagination/export again.

---

## Standard response format

All API endpoints return a consistent JSON envelope:

```json
{ "success": true,  "message": "Categories retrieved.", "data": [...] }
{ "success": false, "message": "Validation failed.", "errors": [...] }
```

Implemented in `backend/src/shared/utils/apiResponse.js`.

HTTP status codes follow REST conventions: `200` for success, `201` for creation, `404` for not found, `409` for conflict, `422` for validation failures, `401`/`403` for auth errors.

---

## Git commit convention

All commits follow **Conventional Commits**.

### Format

```
<type>(<scope>): <short summary>

<body: what was done and why>
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or file |
| `fix` | Bug fix |
| `refactor` | Code change that is neither a bug fix nor a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Tooling, config, CI, deps |
| `ci` | CI/CD pipeline changes |

### Atomic commit rule

> **One commit per file added or modified.** Never group unrelated files in a single commit.

### Example commit

```
feat(config): add src/config/env.js to centralize environment variables

Reading process.env directly in multiple files leads to scattered defaults
and makes it impossible to see at a glance what variables the application
expects.

env.js is the single source of truth: every process.env read happens here,
with explicit defaults and type coercions (parseInt for numeric values).
All other modules import from this file instead of process.env.
```

---

## feature/api/core-architecture

**Goal:** Transform the flat express-generator scaffold into the production-ready modular architecture, building on the sequelize/mysql2/sequelize-cli work already installed on this branch.

### Files to create

| File | Purpose |
|---|---|
| `backend/.env.example` | Template for required environment variables |
| `backend/.sequelizerc` | Points sequelize-cli to `src/database/` |
| `backend/package.json` | Updated: Express 5, Sequelize, all deps, yarn scripts |
| `src/config/env.js` | Centralized `process.env` reads with defaults |
| `src/config/database.js` | Runtime Sequelize instance |
| `src/database/config/config.js` | sequelize-cli config (reads `.env`), replaces the raw `config/config.json` already on this branch |
| `src/database/models/index.js` | Auto-loader for Sequelize models, replaces the raw one already on this branch |
| `src/shared/utils/apiResponse.js` | Standard response envelope |
| `src/shared/utils/catchAsync.js` | Async error propagation wrapper |
| `src/middlewares/error.middleware.js` | Global error handler |
| `src/middlewares/auth.middleware.js` | JWT protect skeleton |
| `src/app.js` | Express factory with middleware stack and versioned sub-router |
| `src/server.js` | Entry point with DB connection guard |

### Files removed

Old express-generator scaffold: root `app.js`, `bin/`, `routes/`, `public/`, root-level `models/`, `config/config.json`.

### Checklist

- [x] `yarn install` succeeds
- [x] `yarn dev` starts without error
- [x] `GET http://localhost:3001` returns a response
- [x] `yarn test:unit` passes (4 suites, 17 tests)

---

## feature/api/categories

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/categories` | List all categories |
| GET | `/api/v1/categories/:id` | Get one category |
| POST | `/api/v1/categories` | Create a category |
| PUT | `/api/v1/categories/:id` | Update a category |
| DELETE | `/api/v1/categories/:id` | Delete a category |

### Files (one commit each)

`category.js` (model) → migration → seeder → `category.repository.js` → `category.validation.js` → `category.service.js` → `category.controller.js` → `category.routes.js` → unit tests → integration tests

### Checklist

- [x] All 5 endpoints return the standard response envelope
- [x] `POST` returns `201`; missing `category_name` returns `422`
- [x] `GET /:id` returns `404` for unknown id
- [x] Unit tests pass (7 suites, 29 tests)
- [x] Integration tests pass (`sequelize.sync({ force: true })` in `beforeAll`, 9 tests)

---

## feature/api/products

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/products` | List all products (includes category) |
| GET | `/api/v1/products/:id` | Get one product (includes category) |
| POST | `/api/v1/products` | Create a product |
| PUT | `/api/v1/products/:id` | Update a product |
| DELETE | `/api/v1/products/:id` | Delete a product |

**Extra:** `GET /api/v1/products` and `GET /api/v1/products/:id` eager-load the associated `Category`. `POST`'s response does not include the nested `category` (the create path doesn't re-fetch with the association) — the Vue product form needs to know this when deciding whether to trust the create response or reload the list.

### Checklist

- [x] Nested `category` object present on GET responses
- [x] `POST` with non-existent `category_id` returns `404` (and so does `PUT` when `category_id` is provided and doesn't exist)
- [x] Unit and integration tests pass (8 suites / 39 unit tests, 2 suites / 20 integration tests)

---

## feature/api/customers

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/customers` | List all customers |
| GET | `/api/v1/customers/:id` | Get one customer |
| POST | `/api/v1/customers` | Create a customer (any/all fields may be omitted) |
| PUT | `/api/v1/customers/:id` | Update a customer |
| DELETE | `/api/v1/customers/:id` | Delete a customer |

Every field except `id` is nullable — validation is `.optional()` + format checks only (`isEmail()` for email, `isLength()` for the string fields), never `notEmpty()`.

### Checklist

- [x] `POST {}` (empty body) succeeds and creates an all-null customer
- [x] `POST` with invalid email format returns `422`
- [x] Unit and integration tests pass (9 suites / 47 unit tests, 3 suites / 30 integration tests)

---

## feature/api/orders

**Decision (recorded, not left open):** orders are exposed over **both REST and GraphQL**, not
REST-only. `GET/POST/PUT/DELETE /api/v1/orders` stay fully functional; `/api/v1/graphql`
(Apollo Server 5 + `@as-integrations/express5`) adds an orders-only GraphQL schema on top,
reusing the same `order.service.js` from both the REST controller and the GraphQL resolvers.
`feature/frontend/orders` consumes the GraphQL endpoint, not REST — see that section.

### REST endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/orders` | List all orders (includes customer + product + category) |
| GET | `/api/v1/orders/:id` | Get one order |
| POST | `/api/v1/orders` | Create an order (`total` computed automatically) |
| PUT | `/api/v1/orders/:id` | Update an order (`total` recomputed) |
| DELETE | `/api/v1/orders/:id` | Delete an order |

### GraphQL schema (`/api/v1/graphql`)

| Operation | Name | Description |
|---|---|---|
| Query | `orders` | List all orders |
| Query | `order(id)` | Single order |
| Mutation | `createOrder(input)` | Create an order (`total` computed automatically) |
| Mutation | `updateOrder(id, input)` | Update an order (`total` recomputed) |
| Mutation | `deleteOrder(id)` | Delete an order |

### Business logic

`total = quantity × product.unit_price` — computed in the service layer on create and update, shared by both the REST controller and the GraphQL resolvers. The client never sends `total`; any client-supplied value is silently ignored, never trusted.

### Checklist

- [ ] `POST` with unknown `product_id` returns `404` (REST) / `createOrder` rejects an unknown `product_id` (GraphQL)
- [ ] `POST` without `quantity` returns `422`
- [ ] Response `total` matches `quantity × unit_price` on both REST and GraphQL
- [ ] Nested `customer`, `product`, and `product.category` present on responses (both REST and GraphQL)
- [ ] Unit and integration tests pass, including a GraphQL integration test (not just REST)

---

## feature/api/auth

Full JWT authentication — register, account activation, login, logout, password reset — with **real email delivery from the start** (see the lessons section below for why this matters).

### Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Create account, email an activation link, return the safe user (no token, no password) |
| GET | `/api/v1/auth/activate/:token` | No | Activate account |
| POST | `/api/v1/auth/login` | No | Returns JWT + user (with roles) |
| POST | `/api/v1/auth/logout` | Bearer JWT | Blacklists the current JWT |
| POST | `/api/v1/auth/forgot-password` | No | Email a reset link if the account exists; **identical response either way** — don't let the response shape differ based on whether the account exists (see lessons below) |
| POST | `/api/v1/auth/reset-password` | No | Consume token, set new password |

### Files (one commit each)

Migrations (8, including `createdAt`/`updatedAt` on the two pivot tables from the start) → Models (6) → Seeders (2) → Repositories (5) → `shared/utils/mailer.js` → `auth.middleware.js` → `auth.validation.js` → `auth.service.js` → `auth.controller.js` → `auth.routes.js` → `app.js` (mount) → unit tests → integration tests (including MailHog-backed email assertions, from this branch's first commit, not as a later fix)

### Seeders

- `20240101000004-seed-roles.js` — 2 roles: `admin`, `user`
- `20240101000005-seed-permissions.js` — 20 permissions: 5 resources × 4 actions (create, read, update, delete)

### Middleware (`auth.middleware.js`)

```
1. Extract Bearer token from Authorization header → 401 if missing
2. jwt.verify(token, JWT_SECRET) → 401 if invalid or expired
3. blacklistedTokenRepository.findByJti(decoded.jti) → 401 if found
4. userRepository.findById(decoded.id) → 401 if not found
5. Check user.enabled → 403 if false
6. Check user.account_locked → 403 if true
7. Attach req.user, req.token, req.tokenDecoded → next()
```

### Email delivery (`shared/utils/mailer.js`)

Build this from day one — do not build a placeholder that returns the activation/reset token
directly in the API response "until email is wired up later." A thin `nodemailer` wrapper
(`SMTP_HOST`/`SMTP_PORT`/`MAIL_FROM` in `.env`, defaults pointing at
[MailHog](https://github.com/mailhog/MailHog) on `127.0.0.1:1025`) sends a real email whose
link points at `FRONTEND_URL` (the Vue app, default `http://localhost:5173` — Vite's default
port). `register`/`forgot-password` never put the token in the response
body. View "sent" mail in dev at MailHog's UI, `http://localhost:8025`.

### Checklist

- [ ] `POST /register` sends an activation email (verified via MailHog's HTTP API in the integration test) and returns the safe user (no token, no password)
- [ ] `GET /activate/:token` sets `enabled = true` on the user
- [ ] `POST /login` on inactive account returns `403`; on success returns `user.roles` populated
- [ ] `POST /logout` + subsequent request with same token returns `401`
- [ ] `POST /forgot-password` sends a reset email only when the account exists, but returns the byte-identical response either way (own integration test asserting this explicitly)
- [ ] `POST /reset-password` with expired token returns `400`
- [ ] Unit tests (`tests/unit/auth.service.test.js`) and integration tests (`tests/integration/auth.test.js`, including real MailHog verification) pass from this branch's first PR, not bolted on afterward

---

## feature/frontend/core-architecture

**Goal:** Turn the bare `create-vue` scaffold into the production-ready base: Vuetify shell, Pinia stores, axios service layer, Vue Router with lazy-loaded feature routes. No feature UI (categories/products/customers/orders/auth) is built here — each gets its own branch — this branch is the technical foundation only.

### Tasks

- [ ] Add Vuetify 3 (`vuetify`, `@mdi/font` for icons), remove/replace the default `create-vue` starter styling (`base.css`/`main.css` from the scaffold, `HelloWorld.vue`/`TheWelcome.vue`/`WelcomeItem.vue` placeholder components)
- [ ] Add `axios`, `vee-validate` + `yup`, `vue-toastification`, `jspdf` + `jspdf-autotable`
- [ ] Add `services/api.service.js`: axios instance with `baseURL` from an env var (Vite's `import.meta.env.VITE_API_URL`, default `http://localhost:3001/api/v1`), returning the full `{ success, message, data?, errors? }` envelope unmodified so feature services can still surface `message`/`errors` — the same "don't unwrap in the shared layer" rule applies to every feature service built on top of it
- [ ] Add `stores/auth.store.js` (Pinia) and `router/guards/auth.guard.js` as functional placeholders (both read/check a `localStorage` token; nothing sets one until `feature/frontend/auth`)
- [ ] Add `services/auth-interceptor.js`: axios request/response interceptor wiring, attaches the token if present (placeholder until `feature/frontend/auth` makes it real)
- [ ] Rebuild `App.vue` as a Vuetify `v-navigation-drawer` + `v-app-bar` shell, composing `components/{AppSidebar,AppTopbar,AppFooter}.vue`
- [ ] Add a minimal `views/HomeView.vue` placeholder landing page for `/` (the scaffolded one can mostly stay, strip the default Vite/Vue starter content)
- [ ] Add `components/DataTable.vue`: a generic table (Vuetify `v-data-table` under the hood) with client-side search, pagination (`v-data-table`'s built-in), and PDF export (`jsPDF` + `jspdf-autotable`, dynamically imported) — meant to be reused by every future feature list view instead of each branch rebuilding search/pagination/export from scratch
- [ ] Set up Playwright for end-to-end tests alongside Vitest for unit tests
- [ ] Vitest unit tests for every new component/service/guard/interceptor
- [ ] Code review pass (no CRITICAL findings after fixes)

### Checklist

- [ ] `npm install` succeeds
- [ ] `npm run dev` serves the Vuetify shell (sidebar/topbar/footer/home) without console errors
- [ ] `npm run build` succeeds
- [ ] `npm run test:unit` passes
- [ ] Playwright e2e passes

---

## feature/frontend/categories

First complete vertical slice on top of `feature/frontend/core-architecture`: Category CRUD using VeeValidate, a Vuetify `v-dialog` form, and the shared `DataTable.vue`.

### Endpoints consumed

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/categories` | List all categories |
| POST | `/api/v1/categories` | Create a category |
| PUT | `/api/v1/categories/:id` | Update a category |
| DELETE | `/api/v1/categories/:id` | Delete a category |

### Tasks

- [ ] Add `features/categories/services/category.service.js`: wraps the shared api service against `/categories`, unwraps the envelope for callers, owns the `vue-toastification` success/error feedback for this resource
- [ ] Add `components/ConfirmDialog.vue` (shared): a generic yes/no `v-dialog`, introduced here for the delete confirmation and meant to be reused by products/customers/orders
- [ ] Add `features/categories/components/CategoryForm.vue`: `v-dialog` content with a VeeValidate form (`category_name`, required + max 255 chars, mirroring `category.validation.js`), pre-filled in edit mode
- [ ] Add `features/categories/components/CategoryList.vue`: thin wrapper configuring the shared `DataTable.vue` (single `category_name` column, edit/delete row actions)
- [ ] Add `features/categories/pages/CategoriesPage.vue`: route-level page owning the list state (a `ref`/reactive array), opening the form dialog for create/edit and the confirm dialog for delete, reloading the list after every successful mutation
- [ ] Add `features/categories/categories.routes.js` (dynamic `import()`) and wire it into `router/index.js` under `/categories`
- [ ] Add the Categories link to `components/AppSidebar.vue`
- [ ] Vitest unit tests for the service, both dialog components, the list component, and the page component
- [ ] Code review pass

### Checklist

- [ ] `npm run build` succeeds
- [ ] `npm run test:unit` passes
- [ ] Manual check: create, edit, delete, search, and PDF export against the running backend

---

## feature/frontend/products

Second vertical slice, same CRUD pattern as categories plus the codebase's one sanctioned cross-feature import: the product form needs a category dropdown.

### Endpoints consumed

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/products` | List all products (nested `category` included) |
| POST | `/api/v1/products` | Create a product (response has no nested `category`) |
| PUT | `/api/v1/products/:id` | Update a product (nested `category` included) |
| DELETE | `/api/v1/products/:id` | Delete a product |

### Tasks

- [ ] Add `features/products/services/product.service.js`: same shape as `category.service.js`, wraps `/products`
- [ ] Add `features/products/components/ProductForm.vue`: VeeValidate form (`product_name` required + max 255, `unit_price` required + min 0, `category_id` required) mirroring `product.validation.js`. Loads categories via the categories feature's service (the one sanctioned cross-feature import) and adds an async validator on `category_id` re-checking the selected id against the loaded list, guarding against a category deleted between page load and submit
- [ ] Add `features/products/components/ProductList.vue`: shared `DataTable.vue` wrapper (name/category/unit price columns) with a computed product count; category name read straight off the row (already resolved by the backend), falling back to "Uncategorized" for a freshly created row (see the products endpoint note above — the create response has no nested category)
- [ ] Add `features/products/pages/ProductsPage.vue`: same page-level pattern as categories
- [ ] Add `features/products/products.routes.js` and wire it into `router/index.js` under `/products`; add the Products link to the sidebar
- [ ] Vitest unit tests for the service, form component (including the async validator and a guard against submitting while it's still pending), list component, and page component
- [ ] Code review pass

### Checklist

- [ ] `npm run build` succeeds
- [ ] `npm run test:unit` passes
- [ ] Manual check: create, edit, delete (including the category dropdown and its async validation) against the running backend

---

## feature/frontend/customers

Third vertical slice, same CRUD pattern as categories/products but with the opposite validation shape: every field is optional at the backend, so the frontend form has no required-field validators at all, only format/length checks.

### Endpoints consumed

| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/customers` | List all customers |
| POST | `/api/v1/customers` | Create a customer (any/all fields may be omitted) |
| PUT | `/api/v1/customers/:id` | Update a customer |
| DELETE | `/api/v1/customers/:id` | Delete a customer |

### Tasks

- [ ] Add `features/customers/services/customer.service.js`: same shape as the others, wraps `/customers`
- [ ] Add `features/customers/components/CustomerForm.vue`: VeeValidate form with no required-field rule anywhere, only format checks (email, a permissive telephone pattern), matching the backend's fully-optional validation
- [ ] **Before wiring the submit handler, read the lesson below about stripping blank fields** — do not send unfilled fields as empty strings
- [ ] Add `features/customers/components/CustomerList.vue`: shared `DataTable.vue` wrapper (name/email/telephone columns), each falling back to a placeholder instead of rendering `null`/empty for an unset field
- [ ] Add `features/customers/pages/CustomersPage.vue`: same page-level pattern as categories/products
- [ ] Add `features/customers/customers.routes.js` and wire it into `router/index.js` under `/customers`; add the Customers link to the sidebar
- [ ] Vitest unit tests for the service, form component (including the blank-fields stripping), list component, and page component
- [ ] Code review pass

### Checklist

- [ ] `npm run build` succeeds
- [ ] `npm run test:unit` passes
- [ ] Manual check: create a customer with only some fields filled in, edit, delete, against the running backend

---

## feature/frontend/orders

Fourth vertical slice: a form with two cross-feature dropdowns and a live computed total.

**Decision (recorded, see `feature/api/orders` above):** this feature consumes orders over
**GraphQL**, not REST — `feature/api/orders` exposes `/api/v1/graphql` specifically for this.

### GraphQL operations consumed

| Operation | Name | Description |
|---|---|---|
| Query | `orders` | List all orders |
| Query | `order(id)` | Single order |
| Mutation | `createOrder(input)` | Create an order |
| Mutation | `updateOrder(id, input)` | Update an order |
| Mutation | `deleteOrder(id)` | Delete an order |

### Tasks

- [ ] Add `services/graphql.service.js` (shared, in `services/`): a thin POST wrapper around `/api/v1/graphql`, the GraphQL counterpart to `api.service.js`. Treats a non-empty `errors` array as the primary failure signal instead of HTTP status, since Apollo Server returns 200 even when a resolver throws
- [ ] Add `features/orders/services/order.service.js`: uses `graphql.service.js` instead of `api.service.js`, otherwise the same unwrap + toast + rethrow shape as the other feature services
- [ ] Add `features/orders/components/OrderForm.vue`: two cross-feature dropdowns (customer, product, reusing the existing customer/product services). A `computed()` `total` derived from the selected product's `unit_price` × `quantity` mirrors the server-side calculation live, before the order is even submitted — this is a good showcase for Vue's `computed()` for deriving reactive state
- [ ] Add `features/orders/components/OrderList.vue`: shared `DataTable.vue` wrapper (customer/product/quantity/total columns, each falling back if customer/product is ever null) plus a computed total revenue
- [ ] Add `features/orders/pages/OrdersPage.vue`: same page-level pattern as the other features
- [ ] Add `features/orders/orders.routes.js` and wire it into `router/index.js`; add the Orders link to the sidebar
- [ ] Vitest unit tests for the service, form component (including the computed total), list component, and page component
- [ ] Code review pass

### Checklist

- [ ] `npm run build` succeeds
- [ ] `npm run test:unit` passes
- [ ] Manual check: create/edit/delete an order (including the live total) against the running backend

---

## feature/frontend/auth

Fifth and final frontend slice: real authentication replaces the placeholders left by `feature/frontend/core-architecture`, plus role-gated UI retrofitted into all four earlier features.

### Scope decision to make explicitly before starting (don't default silently)

Decide and record here: is backend RBAC route enforcement (an `authorize(role)` middleware on
categories/products/customers/orders) being implemented for real in this repo's
`feature/api/*` branches, or is this branch frontend-only (route guard + UI-only role gating,
no backend enforcement)? See the note under
[Auth model → Authorization rules](#auth-model-eer_auth) above. Whichever is chosen, the
README and the code comments on every `isAdmin`-style check must say so accurately — don't
let a UI-only courtesy check read as if it were a real security boundary, and don't let a
`README` table imply enforcement that was never built.

### Tasks

- [ ] Add `stores/auth.store.js` (Pinia): real session state (`user`, `isAuthenticated`, `isAdmin`), persists `token`+`user` to `localStorage` (there is no `GET /auth/me` to re-fetch role data after a reload — the JWT payload itself carries no role info, only `{ id, email, jti }`; the only source of role data is the `roles` array in the login response body), and owns `logout()` (always clears the local session even if the backend call fails)
- [ ] Rewire the router guard and axios interceptor placeholders to use the real store; the interceptor should also clear the session and redirect to `/login` on a 401
- [ ] Add `features/auth/`: an `auth.service.js` (register/activate/login/forgotPassword/resetPassword against `/auth`), and five pages/views (login, register, activate, forgot-password, reset-password)
- [ ] Since the backend emails the activation/reset link directly from `feature/api/auth`'s first commit (see the lesson below), these pages never receive a token to build a link from — `register`/`forgot-password` should show a plain "check your email" confirmation, nothing more
- [ ] Add a shared password-match validator (VeeValidate custom rule or yup `.test()`), reused by the register and reset-password forms
- [ ] Wire real login/logout state into `components/AppTopbar.vue`
- [ ] Add the route guard to the categories/products/customers/orders routes
- [ ] Retrofit `isAdmin`-gated UI into all four existing features' list and page components — or skip this entirely if the scope decision above chose real backend enforcement instead of UI-only gating; don't do both without saying so
- [ ] Vitest unit tests for every new/changed file
- [ ] Code review pass

### Checklist

- [ ] `npm run build` succeeds
- [ ] `npm run test:unit` passes
- [ ] The full backend flow (register → MailHog receives the activation email → activate → login → forgot-password → MailHog receives the reset email → reset-password → login with the new password) manually verified end-to-end against a live backend
- [ ] Manual click-through of the Vue pages themselves (register/login/forgot/reset and the isAdmin-gated UI, if applicable) in an actual browser

---

## Order of work

```
master
└── develop
    ├── feature/api/core-architecture       ← 1st
    ├── feature/api/categories              ← 2nd
    ├── feature/api/products                ← 3rd
    ├── feature/api/customers               ← 4th
    ├── feature/api/orders                  ← 5th
    ├── feature/api/auth                    ← 6th  (last backend)
    ├── feature/frontend/core-architecture  ← 7th
    ├── feature/frontend/categories         ← 8th
    ├── feature/frontend/products           ← 9th
    ├── feature/frontend/customers          ← 10th
    ├── feature/frontend/orders             ← 11th
    └── feature/frontend/auth               ← 12th (last frontend)
```

**Rule:** Each branch is merged to `develop` only after:
1. All unit tests pass (`yarn test:unit` / `npm run test:unit`)
2. All integration tests pass (backend, `yarn test:integration`) or the app builds cleanly (frontend, `npm run build`)
3. No CRITICAL findings from the `code-reviewer` agent

Never merge `develop` into a feature branch that's still in progress — rebase instead if it needs to pick up changes. `develop` is promoted to `master` as a separate, explicit step once all 12 branches are in, not automatically after each merge.

---

## Code conventions

### Naming

| Layer | Convention | Example |
|---|---|---|
| Backend files | kebab-case | `category.service.js` |
| Backend functions | camelCase | `getAllCategories` |
| Backend variables | camelCase | `categoryId` |
| DB columns | snake_case | `category_name` |
| Routes | kebab-case | `/api/v1/reset-password` |
| Vue SFC filenames | PascalCase | `CategoryList.vue` |
| Vue non-component files (services, stores, routes) | kebab-case | `category.service.js`, `auth.store.js` |

Vue component filenames use PascalCase per the official Vue style guide's recommendation for multi-word SFC names, while non-component files stay kebab-case — this distinction is intentional, not an inconsistency to "fix."

### Error propagation

All async route handlers are wrapped in `catchAsync()`. Services throw plain `Error` objects with a `statusCode` property. The global `error.middleware.js` catches everything.

### No `total` from client

The `total` field on orders is always computed server-side. Any `total` value sent by the client is silently ignored.

---

## Implementation lessons

Concrete pitfalls to watch for, kept here so they aren't rediscovered the hard way:

1. **Pivot table timestamps.** `role_user`/`role_permission` must have `createdAt`/`updatedAt`
   columns from their very first migration (see [Auth model](#auth-model-eer_auth) above).
   Sequelize's `belongsToMany` expects them by default; omitting them breaks
   `user.addRole(roleId)` — and therefore every registration — with no error until someone
   actually tries to assign a role through the association, which an auth integration test
   would catch immediately if one exists, and won't catch at all if one doesn't.

2. **Write the auth integration test on day one.** The bug above went undetected for a long
   time specifically because `feature/api/auth` shipped with unit tests but no integration
   test hitting a real database. Don't repeat that gap: `tests/integration/auth.test.js`
   should exist from this branch's first PR, not as a follow-up.

3. **Real email from the start, not a "return the token" placeholder.** Building
   `register`/`forgot-password` to return the activation/reset token directly in the API
   response "for now, until email is wired up" creates a contract that a frontend gets built
   against, and then has to be reworked (backend AND frontend, two separate PRs) once real
   email delivery is added later. Build the `nodemailer` + MailHog wiring in the same PR as
   the rest of `feature/api/auth`.

4. **Don't let a response's shape leak whether an account exists.** An early version of
   `forgot-password` returned a different JSON shape depending on whether the email matched
   an account, even though the message text was already deliberately generic — the shape
   itself was still an oracle. Response shape must be identical for both cases; only the side
   effect (an email sent or not) may differ.

5. **A route-reuse pitfall with SPA routers and preloaded data.** If any route ends up reusing
   a component instance across navigations to structurally-similar URLs, reading route params
   in a one-time lifecycle hook instead of reactively can silently show stale data on the
   second navigation. Read route data reactively wherever a route can be revisited with
   different params without a full component remount.

6. **CI needs every service the tests need.** If a CI pipeline is set up for this repo and the
   auth integration tests depend on MailHog, the CI job needs a MailHog service container
   alongside MySQL from the moment those tests are added — not after discovering, via a failed
   run, that every integration test in the same process timed out waiting on an unreachable
   SMTP connection.

7. **Don't gate CI jobs on `head_commit.modified`/`.added` to skip unaffected stacks.** That
   field isn't reliably populated for merge commits, and pushes to `develop`/`master` will
   silently show as "skipped" instead of a real pass/fail result. If CI needs to skip
   unaffected work, use a path-diff action built for the purpose, or just always run both jobs.

8. **The "Authorization rules" table is a policy, not a status report.** Write it as what the
   system is *supposed* to do, and keep the actual implementation status honestly in sync with
   it — including explicitly saying so when enforcement is deferred, same as the note under
   [Auth model](#auth-model-eer_auth) above requires.

---

## How to follow this tutorial

1. Read this document in full before writing any code for a branch.
2. Checkout `feature/api/core-architecture` — read the commits in order with `git log --oneline`.
3. For each commit, read the full body with `git show <hash>` to understand the WHY.
4. Move to the next feature branch and repeat.
5. The frontend branches (`feature/frontend/*`) can be followed independently after completing all backend branches.

**Start the backend:**
```bash
cd backend
cp .env.example .env   # fill in your MySQL credentials, and SMTP_*/FRONTEND_URL once feature/api/auth exists
yarn install
yarn dev               # http://localhost:3001
```

**Start the frontend:**
```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

**Run database migrations and seeders:**
```bash
cd backend
yarn db:migrate
yarn db:seed
```

**Run tests:**
```bash
cd backend
yarn test:unit
yarn test:integration
```

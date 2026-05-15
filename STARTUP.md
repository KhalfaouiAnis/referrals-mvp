# First-run startup guide

Follow these steps **in order** every time you set up on a new machine or after a fresh clone.

---

## 1. Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | https://nodejs.org |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| Docker Desktop | any | https://www.docker.com/products/docker-desktop |

---

## 2. Install dependencies

```bash
# From repo root — installs all three workspaces at once
pnpm install
```

---

## 3. Start infrastructure (Postgres + Redis + MinIO)

```bash
docker compose -f docker-compose.dev.yml up -d
```

Wait ~10 seconds for Postgres to be healthy, then verify:

```bash
docker compose -f docker-compose.dev.yml ps
# All three services should show "healthy" or "running"
```

MinIO console is available at **http://localhost:9001**
Login: `referrals_minio` / `referrals_secret`

---

## 4. Configure environment

```bash
# Copy the example — defaults work for local dev with the docker-compose above
cp .env.example .env
```

---

## 5. Build the shared package  ← REQUIRED before running the API

The API imports `@referrals/shared` from its compiled `dist/`. You must build it once:

```bash
pnpm build:shared
```

> **Why?** Vite (web) reads `@referrals/shared` directly from TypeScript source and
> handles compilation itself. NestJS (API) uses the TypeScript compiler which needs
> the compiled `.js` + `.d.ts` files. You only need to re-run `build:shared` when
> you change something inside `packages/shared/src/`.

---

## 6. Run database migrations

```bash
pnpm migration:run
```

---

## 7. Seed the database (optional but recommended)

```bash
pnpm seed
```

Creates 8 users, 10 patients, and 50+ referrals across all workflow statuses.

---

## 8. Start the development servers

Open **two terminals**:

**Terminal 1 — API** (http://localhost:3000)
```bash
pnpm dev:api
```

> `pnpm dev:api` automatically runs `pnpm build:shared` first, then `nest start --watch`.

**Terminal 2 — Web** (http://localhost:5173)
```bash
pnpm dev:web
```

Or start both with one command (requires `concurrently`):
```bash
pnpm dev
```

---

## 9. Log in

Visit **http://localhost:5173** and log in with:

| Role | Email | Password |
|---|---|---|
| Physician | sarah.chen@clinic.com | password123 |
| Admin staff | admin@clinic.com | password123 |
| Specialist | j.hartley@cardiology.com | password123 |

Swagger API docs: **http://localhost:3000/api/docs**

---

## Common errors and fixes

### `Cannot find module '@referrals/shared'`
**Cause:** Shared package hasn't been compiled yet.
**Fix:** `pnpm build:shared`

### `connect ECONNREFUSED 127.0.0.1:5432`
**Cause:** Postgres container isn't running.
**Fix:** `docker compose -f docker-compose.dev.yml up -d`

### `relation "referrals" does not exist`
**Cause:** Migrations haven't been run yet.
**Fix:** `pnpm migration:run`

### Web page shows blank or can't connect
**Cause:** API isn't running, or Vite dev server isn't started.
**Fix:** Make sure both `pnpm dev:api` and `pnpm dev:web` are running in separate terminals.

### `EADDRINUSE: address already in use :::3000`
**Cause:** Something else is on port 3000.
**Fix:** `npx kill-port 3000` or change `API_PORT` in `.env`.

---

## Rebuilding after shared changes

If you edit anything in `packages/shared/src/`:

```bash
# Rebuild shared, then restart the API
pnpm build:shared
# The API will hot-reload automatically via nest --watch
```

The web app (Vite) picks up shared changes automatically without rebuilding.

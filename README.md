# Referrals MVP

A production-ready healthcare referral management system built with NestJS, React, PostgreSQL, and Redis.

## Architecture

```
referrals/
├── packages/shared/   TypeScript enums, types, workflow constants (source of truth)
├── apps/api/          NestJS backend — REST + WebSocket + BullMQ workers
└── apps/web/          React + Vite frontend — MUI, React Query, Zustand
└── k8s                Kubernetes deployments
└── scripts            helper scripts to deploy infrastructure on minikube locally on windows
```

## Tech stack

| Layer | Technology |
|---|---|
| Backend | NestJS, TypeORM, PostgreSQL |
| Queue | BullMQ + Redis |
| Auth | JWT (passport-jwt) |
| Frontend | React 19, Vite, MUI v7, MUI DataGrid |
| Data fetching | TanStack React Query v5 |
| Forms | react-hook-form + Zod |
| State | Zustand |
| Charts | Recharts |
| Real-time | Socket.io |
| Container | Docker + docker-compose |

---

## Quick start

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Docker + docker-compose

### 1. Clone and install

```bash
git clone https://github.com/KhalfaouiAnis/referrals-mvp.git && cd referrals
cp .env.example .env
pnpm install
```

### 2. Start infrastructure

```bash
# Start Postgres + Redis + minio only (for local dev)
docker-compose up -d
```

### 3. Run migrations + seed

```bash
pnpm migration:run
pnpm seed
```

### 4. Start dev servers

```bash
# Terminal 1 — API (http://localhost:3000)
pnpm dev:api

# Terminal 2 — Web (http://localhost:5173)
pnpm dev:web
```

### 5. Full stack with Docker

```bash
docker-compose up --build
# API   → http://localhost:3000
# Web   → http://localhost:5173
# Minio → http://localhost:9000
# Swagger → http://localhost:3000/api/docs
```

---

## Default credentials (seed data)

| Role               | Email                    | Password    |
|--------------------|--------------------------|-------------|
| Physician          | sarah.chen@clinic.com    | password123 |
| Nurse Practitioner | priya.patel@clinic.com   | password123 |
| Specialist         | j.hartley@cardiology.com | password123 |
| Admin              | admin@clinic.com         | password123 |

---

## Workflow state machine

Valid transitions (defined in `packages/shared/src/constants/workflow.constants.ts`):

```
INTAKE → CLINICAL_PREP (requires: patientId, clinicalReason, icd10Codes, priority)
CLINICAL_PREP → AUTHORIZATION (requires: specialistId)
AUTHORIZATION → READY_TO_SUBMIT | AUTH_DENIED
READY_TO_SUBMIT → SUBMITTED
SUBMITTED → SCHEDULING
SCHEDULING → CLOSED
AUTH_DENIED → AUTHORIZATION (appeal) | CANCELLED
Any step → CANCELLED
```

All transitions go through `ReferralWorkflowService.advanceStatus()`, which:
1. Validates the transition + field guards
2. Updates status atomically in a DB transaction
3. Marks step rows as COMPLETE/IN_PROGRESS
4. Writes an immutable audit log entry
5. Enqueues BullMQ jobs for notifications and follow-up timers

---

## API reference

Full Swagger docs available at `/api/docs` when the server is running.

### Key endpoints

```
POST   /api/v1/auth/login
GET    /api/v1/referrals              ?page=1&limit=25&status=INTAKE&priority=URGENT
POST   /api/v1/referrals
GET    /api/v1/referrals/:id
PATCH  /api/v1/referrals/:id/advance  { targetStatus, reason }
POST   /api/v1/referrals/:id/notes    { body }
POST   /api/v1/referrals/:id/documents (multipart/form-data)
DELETE /api/v1/referrals/:id/documents/:docId
POST   /api/v1/referrals/bulk         { referralIds, action, payload }
GET    /api/v1/referrals/export       (CSV download)
GET    /api/v1/analytics/dashboard
GET    /api/v1/patients               ?search=Alice&limit=10
```

---

## Database migrations

```bash
# Generate a new migration after entity changes
pnpm migration:generate --name=YourMigrationName

# Run pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert
```

---

## Environment variables

See `.env.example` for all variables. Key ones:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=referrals
POSTGRES_PASSWORD=referrals_secret
POSTGRES_DB=referrals_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

---

## RBAC

| Action          | PHYSICIAN | NP  | ADMIN_STAFF | SPECIALIST |
|-----------------|-----------|-----|-------------|------------|
| Create referral |     ✅    | ✅ |      ❌     |    ❌     |
| Advance status  |     ✅    | ✅ |      ✅     |    ✅     |
| Add note        |     ✅    | ✅ |      ✅     |    ✅     |
| Upload document |     ✅    | ✅ |      ✅     |    ✅     |
| Bulk actions    |     ❌    | ❌ |      ✅     |    ❌     |
| View analytics  |     ✅    | ✅ |      ✅     |    ❌     |

---

## Minikube deployment (local Kubernetes)

### Prerequisites
- [minikube](https://minikube.sigs.k8s.io/docs/start/) ≥ 1.33
- [kubectl](https://kubernetes.io/docs/tasks/tools/) ≥ 1.29
- Docker Desktop (or equivalent)

### One-command deploy

```bash
# From repo root — builds images inside minikube, applies all manifests, seeds DB
./scripts/minikube-deploy.ps1 || double click the .bat file
```

The script:
1. Starts minikube with 4 CPUs / 6 GB RAM and enables the **nginx ingress** and **ingress-dns** addons
2. Points Docker to minikube's internal registry and builds `referrals-api:latest` and `referrals-web:latest`
3. Applies all manifests in order (namespace → secrets → infra → app → ingress)
4. Waits for each rollout to complete before proceeding
5. Adds `referrals.local` and `minio.referrals.local` to `/etc/hosts`
6. Runs the seed script inside the running API pod

### URLs after deploy

|    Service    |                  URL                 |
|---------------|--------------------------------------|
| Web app       | http://referrals.local               |
| Swagger docs  | http://referrals.local/api/docs      |
| MinIO console | http://minio.referrals.local         |
| Health check  | http://referrals.local/api/v1/health |

### Useful kubectl commands

```bash
# Watch all pods
kubectl get pods -n referrals -w

# Tail API logs
kubectl logs -n referrals -l app=api -f

# Tail BullMQ worker logs
kubectl logs -n referrals -l app=api -f --container api

# Open minikube dashboard
minikube dashboard

# Restart API after image rebuild
docker build -t referrals-api:latest -f apps/api/Dockerfile .
kubectl rollout restart deployment/api -n referrals

# Teardown (keeps minikube cluster)
./scripts/minikube-teardown.ps1
```

### K8s manifest structure

```
k8s/
├── namespace.yaml         referrals namespace
├── configmap.yaml         non-secret env vars (hosts, ports, bucket names)
├── secrets.yaml           passwords + JWT secret (use Sealed Secrets in prod)
├── ingress.yaml           nginx ingress — routes referrals.local
├── postgres/
│   ├── deployment.yaml    postgres:17-alpine + ClusterIP service
│   └── persistent-volume-claim.yaml  1 Gi RWO PVC
├── redis/
│   └── deployment.yaml    redis:7-alpine + ClusterIP service
├── minio/
│   ├── deployment.yaml    minio/minio:latest + ClusterIP service (ports 9000 + 9001)
│   └── persistent-volume-claim.yaml  1 Gi RWO PVC
├── api/
│   └── deployment.yaml    1 replica + init container (migrations) + ClusterIP
└── web/
    └── deployment.yaml    1 replica nginx SPA + ClusterIP
```

### Ingress routing

```
referrals.local/api/*        → api-service:3000   (NestJS REST)
referrals.local/socket.io/*  → api-service:3000   (WebSocket)
referrals.local/*            → web-service:80     (React SPA)
minio.referrals.local/*      → minio-service:9001 (MinIO console)
```

---

## MinIO (document storage)

All clinical documents are stored in MinIO — an S3-compatible object store.

- **Bucket**: `referrals-documents` (auto-created on API startup via `onModuleInit`)
- **Object key format**: `referrals/{referralId}/{uuid}.{ext}`
- **Access**: always via short-lived **pre-signed URLs** (1-hour TTL) — objects are never public
- **Max upload size**: 25 MB; allowed MIME types: PDF, JPEG, PNG, WEBP, DOC, DOCX
- **Swap for AWS S3**: change `MINIO_ENDPOINT` to your S3 endpoint and set real credentials — no code changes needed (same AWS SDK)

```env
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=referrals_minio
MINIO_SECRET_KEY=referrals_secret
MINIO_BUCKET=referrals-documents
MINIO_USE_SSL=false
```

1. File storage defaults to local disk (`./uploads`). Swap `LocalStorageProvider` for an S3 provider in production.
2. Email/SMS notifications log to console in development. Wire `EmailChannel` / `SmsChannel` with real credentials.
3. Insurance authorization is simulated — no live EDI/payer API integration.
4. `synchronize: false` — always use migrations; never let TypeORM auto-sync the schema in production.

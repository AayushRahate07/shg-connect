# SHGConnect PostgreSQL Synchronization Server

Persistent PostgreSQL-backed synchronization service for SHGConnect offline-first Progressive Web Application.

> **Architecture Notice**: Increment 5 replaces the Increment 4 client-side in-memory mock synchronization server (`mockSyncServer.ts`) with a persistent PostgreSQL synchronization backend while preserving all client-side offline-first guarantees (`LOCAL COMMIT ≠ REMOTE SYNC`).

---

## Technical Architecture

```text
Offline PWA Client (IndexedDB outbox)
        ↓ HTTP (VITE_SYNC_SERVER_URL=http://localhost:4000)
Express Sync API (server/src/app.ts)
        ↓ PostgreSQL Transaction (BEGIN ... COMMIT)
┌─────────────────────────────────────────────────────────┐
│ 1. Multi-Tenant Scoping (WHERE shg_id = $1)            │
│ 2. Idempotency Check (processed_operations.op_id)      │
│ 3. Row-Level OCC Locking (SELECT ... FOR UPDATE)        │
│ 4. Atomic Domain Mutation (server_members/loans/info)  │
│ 5. Sequence Generator (nextval('server_seq_generator')) │
│ 6. Processed Op Persistence (processed_operations)      │
│ 7. Server Operation Log (server_operation_log)          │
└─────────────────────────────────────────────────────────┘
```

---

## Setup & Running

### Prerequisites
- Node.js 18+ & npm
- PostgreSQL 15+ (or Docker)

### Quickstart via Docker Compose
```bash
cd server
docker-compose up -d
npm install
npm run dev
```

### Manual Database Setup
```bash
createdb shgconnect
psql postgresql://postgres:postgres@localhost:5432/shgconnect -f schema.sql
npm install
npm run dev
```

---

## API Endpoints

### 1. `POST /api/v1/sync/push`
Headers: `X-SHG-ID`, `X-Device-ID`  
Body: `SyncPushRequest` (`shgId`, `deviceId`, `operations[]`)

Processes push batch in a single PostgreSQL transaction. Returns `SyncPushResponse` containing operation ACKs.

### 2. `POST /api/v1/sync/pull`
Headers: `X-SHG-ID`, `X-Device-ID`  
Body: `SyncPullRequest` (`shgId`, `deviceId`, `lastServerSeq`, `batchSize`)

Returns visible `ServerOperation`s ordered by ascending `serverSeq` for the specified SHG.

### 3. `GET /health`
Response: `{ "status": "ok", "timestamp": "..." }`

---

## Security Boundaries & Scope Limitations

Authentication and authorization infrastructure (JWT, OAuth, HMAC signatures) are outside the scope of Increment 5. Protocol headers (`X-SHG-ID`, `X-Device-ID`) provide tenant and device context only.

<div align="center">

# SHGCONNECT

### Offline-First Digital Ledger & Synchronization Platform for Self-Help Groups

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge\&logo=node.js\&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge\&logo=postgresql\&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge\&logo=docker\&logoColor=white)](https://www.docker.com/)

</div>

---

## 📌 Overview

**SHGConnect** is an offline-first Progressive Web App for managing records and day-to-day operations of Self-Help Groups (SHGs).

It provides digital workflows for:

* Savings
* Loans and repayments
* Attendance
* Meetings
* Cash reconciliation
* Audit records
* UPI / UTR settlement tracking

The client stores data locally using **IndexedDB** and synchronizes with a **PostgreSQL backend** when connectivity is available.

The system is designed around the separation of:

```text
LOCAL COMMIT  ≠  REMOTE SYNC
```

---

# 🏛️ System Architecture

```text
                         OFFLINE CLIENT PWA

┌─────────────────────────────────────────────────────────────────────┐
│                     React + Vite + TypeScript                      │
│                                                                     │
│       Member / Animator UI     │     Meeting Workflows             │
├─────────────────────────────────────────────────────────────────────┤
│                       IndexedDB + Web Crypto                       │
│                                                                     │
│ Members │ Loans │ Meetings │ Ledger │ Audit Trail │ Outbox Queue   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                         Push / Pull Sync
                                │
                    X-SHG-ID │ X-Device-ID │ opId
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NODE.JS + EXPRESS SERVER                        │
│                                                                     │
│                 Atomic PostgreSQL Transactions                     │
├─────────────────────────────────────────────────────────────────────┤
│                         PostgreSQL 15                              │
│                                                                     │
│ Sequence Generator │ Idempotency │ Operation Log │ SHG State       │
└─────────────────────────────────────────────────────────────────────┘
```

---

# ✨ Key Features

### 📖 Digital Passbook

Digital records for common SHG operations:

* Savings
* Loan disbursal
* EMI repayment
* Attendance
* Meeting resolutions
* Transaction filtering
* Printing / PDF export

### 📊 Panchasutra Tracking

Tracks five operational indicators:

| Indicator                | Maximum |
| ------------------------ | ------: |
| Regular Meetings         |      20 |
| Regular Savings          |      20 |
| Internal Lending         |      20 |
| Timely Loan Recovery     |      20 |
| Transparent Book-keeping |      20 |
| **Total**                | **100** |

The resulting score is used for the application's operational grading workflow.

### 🔐 2-of-3 Meeting Quorum

Meeting sessions require approval from at least two of:

```text
President
Secretary
Treasurer
```

PIN-based authorization is incorporated into the meeting's cryptographic record.

### 🔗 Cryptographic Audit Trail

Uses the Web Crypto API for:

* SHA-256 hash chains
* Merkle session roots
* Checkpoint fingerprints
* Quorum proofs

### 💰 Cash Reconciliation

Physical cash can be entered by denomination:

```text
₹500  ₹200  ₹100  ₹50  ₹20  ₹10  Coins
```

The system compares the counted cash against the expected ledger balance.

### 📱 UPI & UTR

Supports:

* UPI intent links
* QR payment initiation
* UTR capture
* Digital settlement
* Cash fallback

### 🛡️ Encrypted Backups

Local state can be exported and restored through encrypted JSON snapshots using:

```text
AES-256-GCM
PBKDF2
SHA-256
Web Crypto API
```

---

# 🔄 Offline-First Synchronization

```text
                  LOCAL DEVICE
                       │
                       ▼
                ┌─────────────┐
                │  IndexedDB  │
                └──────┬──────┘
                       │
                       ▼
                 Outbox Queue
                       │
                 Network Available
                       │
                       ▼
                POST /sync/push
                       │
                       ▼
              PostgreSQL Transaction
                       │
                       ▼
             Server Operation Log
                       │
                       ▼
                POST /sync/pull
                       │
                       ▼
                 Local Database
```

### Synchronization mechanisms

* Operation-level idempotency using `opId`
* Monotonic server sequence numbers
* Entity versioning
* PostgreSQL row-level locking
* Canonical server operation log
* Explicit conflict resolution

### Conflict Resolution

```text
              CONFLICT
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
 ACCEPT_REMOTE  KEEP_LOCAL  RETRY_MERGED
```

---

# 🧩 Tech Stack

| Layer                | Technologies                                 |
| -------------------- | -------------------------------------------- |
| **Frontend**         | React 18, Vite 6, TypeScript 5               |
| **Styling**          | Tailwind CSS                                 |
| **Icons**            | Lucide                                       |
| **PWA**              | Workbox                                      |
| **Local Storage**    | IndexedDB v3                                 |
| **Cryptography**     | Web Crypto API, AES-256-GCM, SHA-256, PBKDF2 |
| **Audio**            | Web Speech API, Web Audio API                |
| **Backend**          | Node.js, Express, TypeScript                 |
| **Database**         | PostgreSQL 15                                |
| **Database Driver**  | `pg`                                         |
| **Testing**          | Vitest                                       |
| **Containerization** | Docker, Docker Compose                       |

---

# 📂 Project Structure

```text
shg-connect/
│
├── README.md
├── SHGConnect_Implementation_Report.txt
│
├── shgconnect-pwa/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   │
│   └── src/
│       ├── types/
│       │   ├── shg.ts
│       │   └── sync.ts
│       │
│       ├── services/
│       │   ├── db.ts
│       │   ├── syncApi.ts
│       │   ├── syncCoordinator.ts
│       │   ├── mockSyncServer.ts
│       │   ├── cryptoBackup.ts
│       │   └── hashChain.ts
│       │
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── SyncStatusPill.tsx
│       │   ├── ConflictResolutionModal.tsx
│       │   ├── PanchasutraAuditCard.tsx
│       │   ├── MeetingWizard.tsx
│       │   └── BackupRestoreModal.tsx
│       │
│       └── App.tsx
│
└── server/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── docker-compose.yml
    ├── Dockerfile
    ├── schema.sql
    │
    └── src/
        ├── app.ts
        ├── server.ts
        ├── db.ts
        │
        ├── types/
        │   └── sync.ts
        │
        ├── services/
        │   └── syncService.ts
        │
        ├── routes/
        │   └── sync.ts
        │
        ├── middleware/
        │   └── errorHandler.ts
        │
        └── tests/
            └── sync.integration.test.ts
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* **Node.js 18+**
* **npm 9+**
* **PostgreSQL 15+** or Docker

---

## 1. Clone Repository

```bash
git clone https://github.com/AayushRahate07/shg-connect.git
cd shg-connect
```

---

## 2. Start the Frontend

```bash
cd shgconnect-pwa
npm install
npm run dev
```

The PWA will be available at:

```text
http://localhost:5173
```

### Production Build

```bash
npm run build
```

---

## 3. Start the Backend

Open another terminal:

```bash
cd shg-connect/server
npm install
```

### Start PostgreSQL

Using Docker:

```bash
docker-compose up -d
```

Or use an existing PostgreSQL 15+ installation and configure the environment variables using:

```text
.env.example
```

### Start Server

```bash
npm run dev
```

The API will run at:

```text
http://localhost:4000
```

### Production Build

```bash
npm run build
npm start
```

---

# 🧪 Verification

The project includes client-side synchronization invariant tests and server-side PostgreSQL integration tests.

### Client

```bash
cd shgconnect-pwa

npx tsx -e "import { runSyncInvariantTests } from './src/services/__tests__/sync.test.ts'; runSyncInvariantTests().then(console.log);"
```

```text
16 / 16 Invariant Tests Passed
```

### Server

```bash
cd server
npm test
```

```text
16 / 16 Integration Tests Passed
```

The server suite covers atomic push/pull behavior, idempotency, optimistic concurrency, sequence ordering, and tenant isolation.

---

# 🌐 API Reference

## `POST /api/v1/sync/push`

Pushes a batch of locally generated operations to the server.

**Headers**

```text
X-SHG-ID
X-Device-ID
```

**Response states**

```text
ACKNOWLEDGED
CONFLICT
REJECTED
```

---

## `POST /api/v1/sync/pull`

Retrieves operations after the device's last known server sequence.

**Request**

```text
shgId
deviceId
lastServerSeq
batchSize
```

Operations are returned in ascending `server_seq` order.

---

## `GET /health`

Returns backend health status.

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

# 🔭 Development Scope

Current development focuses on:

* Offline-first client workflows
* Local ledger persistence
* Client/server synchronization
* Conflict handling
* Cryptographic audit records
* SHG operational workflows
* PostgreSQL-backed persistence

---

# 📜 License

Distributed under the **MIT License**.

See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

ㆍ SHGCONNECT ㆍ AAYUSH RAHATE ㆍ

</div>

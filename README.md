<div align="center">

# SHGCONNECT

### Offline-First Digital Ledger for Self-Help Groups

[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TypeScript-blue.svg)](shgconnect-pwa)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20PostgreSQL-indigo.svg)](server)
[![Tests](https://img.shields.io/badge/Tests-16%2F16%20Client%20%7C%2016%2F16%20Server-emerald.svg)](#-verification)

</div>

---

## 📌 Overview

**SHGConnect** is an offline-first Progressive Web App for managing records and day-to-day operations of Self-Help Groups (SHGs).

It provides a digital alternative to paper-based records for:

* Savings
* Loans and repayments
* Attendance
* Meetings
* Cash reconciliation
* Audit records

The application stores data locally using **IndexedDB** and synchronizes with a PostgreSQL backend when connectivity is available.

---

## 🏛️ System Architecture

```text
                         OFFLINE CLIENT

┌──────────────────────────────────────────────────────────────┐
│                  React + Vite + TypeScript                   │
│                                                              │
│       Member / Animator UI       Meeting Workflows           │
├──────────────────────────────────────────────────────────────┤
│                    IndexedDB + Web Crypto                    │
│                                                              │
│ Members │ Loans │ Meetings │ Ledger │ Audit │ Outbox Queue  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                         Push / Pull Sync
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    NODE + EXPRESS API                        │
├──────────────────────────────────────────────────────────────┤
│                       PostgreSQL 15                           │
│                                                              │
│ Sequence Generator │ Operation Log │ Idempotency │ SHG Data │
└──────────────────────────────────────────────────────────────┘
```

The client and server maintain separate responsibilities, with local persistence handled independently from remote synchronization.

---

# ✨ Features

### 1. 📖 Digital Passbook

Records common SHG transactions and activities:

* Savings
* Loan disbursal
* EMI repayment
* Attendance
* Meeting resolutions

The ledger can also be filtered and printed for record keeping.

---

### 2. 📊 Panchasutra Tracking

The application tracks five operational indicators:

| Indicator                | Score |
| ------------------------ | ----: |
| Regular Meetings         |    20 |
| Regular Savings          |    20 |
| Internal Lending         |    20 |
| Timely Loan Recovery     |    20 |
| Transparent Book-keeping |    20 |

These contribute to a **0–100 operational score** and corresponding group grading.

---

### 3. 🔐 Meeting Quorum

Meeting finalization uses a **2-of-3 officer approval** model involving:

```text
President
Secretary
Treasurer
```

At least two officers must provide their PIN before the meeting session is finalized.

---

### 4. 🔗 Audit Trail

Meeting and ledger activity can be represented using a SHA-256 based hash chain.

```text
Block N
   │
   ├── Data
   ├── Previous Hash
   └── Session Proof
          │
          ▼
       SHA-256
          │
          ▼
       Block N+1
```

Session roots and checkpoint fingerprints are also generated for audit references.

---

### 5. 💰 Cash Reconciliation

The cash workflow allows users to enter physical denominations:

```text
₹500  ₹200  ₹100  ₹50  ₹20  ₹10  Coins
```

The counted amount is compared against the expected ledger balance to identify discrepancies.

---

### 6. 📱 UPI & UTR

Supports:

* UPI intent links
* QR-based payment initiation
* UTR reference capture
* Cash settlement fallback

---

### 7. 🛡️ Encrypted Backups

Local application state can be exported and restored through encrypted JSON snapshots.

Encryption uses:

* AES-256-GCM
* PBKDF2
* SHA-256
* Web Crypto API

---

# 🔄 Synchronization

SHGConnect follows an offline-first synchronization model.

```text
Local Operation
      │
      ▼
   IndexedDB
      │
      ▼
 Outbox Queue
      │
      ▼
  Push to Server
      │
      ▼
 PostgreSQL
      │
      ▼
 Operation Log
      │
      ▼
 Pull Changes
      │
      ▼
 Local Database
```

### Conflict Handling

The synchronization layer uses:

* Operation IDs for idempotency
* Server sequence numbers
* Entity versioning
* PostgreSQL row-level locking
* Explicit conflict resolution

Conflicts can be handled through:

```text
ACCEPT_REMOTE
KEEP_LOCAL
RETRY_MERGED
```

---

# 🧪 Verification

### Client

```text
16 / 16 Invariant Tests Passed
```

### Server

```text
16 / 16 Integration Tests Passed
```

The tests cover synchronization behavior including atomic transactions, idempotency, concurrency handling, sequence ordering, and tenant isolation.

---

# 🛠️ Tech Stack

| Layer            | Technologies                   |
| ---------------- | ------------------------------ |
| **Frontend**     | React 18, Vite 6, TypeScript 5 |
| **Styling**      | Tailwind CSS                   |
| **Storage**      | IndexedDB                      |
| **Cryptography** | Web Crypto API                 |
| **Backend**      | Node.js, Express, TypeScript   |
| **Database**     | PostgreSQL 15                  |
| **Testing**      | Vitest                         |
| **Deployment**   | Docker, Docker Compose         |

---

# 📂 Repository Structure

```text
shg-connect/
│
├── shgconnect-pwa/
│   └── src/
│       ├── types/
│       ├── services/
│       │   ├── db.ts
│       │   ├── syncApi.ts
│       │   ├── syncCoordinator.ts
│       │   ├── cryptoBackup.ts
│       │   └── hashChain.ts
│       │
│       ├── components/
│       │   ├── MeetingWizard.tsx
│       │   ├── PanchasutraAuditCard.tsx
│       │   ├── ConflictResolutionModal.tsx
│       │   └── BackupRestoreModal.tsx
│       │
│       └── App.tsx
│
├── server/
│   ├── schema.sql
│   └── src/
│       ├── services/
│       │   └── syncService.ts
│       ├── routes/
│       │   └── sync.ts
│       └── tests/
│
├── SHGConnect_Implementation_Report.txt
└── README.md
```

---

# 🚀 Quickstart

### Client

```bash
git clone https://github.com/AayushRahate07/shg-connect.git
cd shg-connect/shgconnect-pwa

npm install
npm run dev
```

Client runs on:

```text
http://localhost:5173
```

### Server

```bash
cd ../server

npm install
docker-compose up -d
npm run dev
```

Server runs on:

```text
http://localhost:4000
```

---

# 🌐 API

### `POST /api/v1/sync/push`

Pushes local operations to the server.

### `POST /api/v1/sync/pull`

Retrieves operations after a specified server sequence.

### `GET /health`

Returns server health status.

---

# 📄 License

Distributed under the **MIT License**.

---

<div align="center">

ㆍ SHGCONNECT ㆍ AAYUSH RAHATE ㆍ

</div>

<div align="center">

# 🌿 SHGCONNECT

### Grassroots Offline-First Trust Ledger & Operating System for Self-Help Groups (SHGs)

[![PWA](https://img.shields.io/badge/PWA-Offline--First-1A6B4A?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Web Crypto](https://img.shields.io/badge/Security-Web_Crypto_API-E8720C?style=for-the-badge&logo=shield&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
[![NABARD Aligned](https://img.shields.io/badge/Domain-NABARD_%2F_DAY--NRLM-145739?style=for-the-badge&logo=target&logoColor=white)](https://nrlm.gov.in/)

---

## 📖 Table of Contents

- [📌 The Problem: Why SHGConnect?](#-the-problem-why-shgconnect)
- [✨ The "WOW!" Factors (Niche Engineering & Domain Depth)](#-the-wow-factors-niche-engineering--domain-depth)
- [👥 4-Tier Role-Based Operational Access (RBAC)](#-4-tier-role-based-operational-access-rbac)
- [🏛️ Architectural Overview](#️-architectural-overview)
- [🔄 Offline Synchronization Protocol](#-offline-synchronization-protocol)
- [🔐 Cryptographic Integrity & Checkpoint Proofs](#-cryptographic-integrity--checkpoint-proofs)
- [📊 NABARD Panchasutra & Credit Appraisal Engine](#-nabard-panchasutra--credit-appraisal-engine)
- [🧩 Technology Stack](#-technology-stack)
- [📂 Repository File Map](#-repository-file-map)
- [🚀 Quickstart & Installation](#-quickstart--installation)
- [🧪 Invariant Testing & Backend Verification](#-invariant-testing--backend-verification)
- [🌐 RESTful Sync API Specification](#-restful-sync-api-specification)
- [🏛️ Federation Hierarchy & Privacy](#️-federation-hierarchy--privacy)
- [📜 License & Attribution](#-license--attribution)

---

## 📌 The Problem: Why SHGConnect?

Across rural India, more than **8 million Self-Help Groups (SHGs)** under **NABARD** and the **National Rural Livelihoods Mission (DAY-NRLM)** mobilize over ₹1.5 lakh crore in internal savings and bank loans. They are the backbone of rural financial inclusion.

Yet, they face a severe digital trilemma:

1. **Physical Paper Fragility & Fraud**: Traditional meeting registers (*Vahi*) suffer from ink damage, termite infestation, lost pages, and single-point manipulation by corrupt scribes or intermediaries.
2. **The Cloud Connectivity Trap**: Mainstream fintech apps require constant 4G/5G connections. When connectivity drops inside rural concrete community halls (*Gram Panchayat Bhavans*), meetings grind to a halt.
3. **The Blockchain Fallacy**: Decentralized Web3 ledgers are impractical for rural women due to prohibitive gas fees, high latency, volatile transaction costs, and seed-phrase UX barriers.

### The Solution

**SHGConnect** delivers a zero-compromise, offline-first operating system and cryptographic trust ledger. It enables SHG members and Community Resource Persons (CRPs) to conduct full meeting sessions, verify attendance, collect monthly savings quotas, disburse reducing-balance internal loans, and balance physical cash boxes **100% offline with zero latency**. When connectivity returns—hours or days later—it reconciles idempotently with an enterprise PostgreSQL backend.

---

## ✨ The "WOW!" Factors (Niche Engineering & Domain Depth)

Here are the distinctive engineering decisions and domain nuances that elevate SHGConnect beyond a standard CRUD app:

### 1. ⚡ Zero-Gas SHA-256 Block Ledger with Merkle Session Roots
Instead of relying on an expensive public blockchain, SHGConnect implements an append-only cryptographic ledger running entirely on the browser's hardware-accelerated **Web Crypto API**:
- Each transaction creates an immutable block linked to the previous block's SHA-256 digest (`prevHash`).
- All transactions finalized during a meeting session are aggregated into a **Pair-Wise Merkle Session Root**.
- **Interactive Tamper Attack Simulation**: The UI includes a built-in adversarial attack simulation (`LedgerVerifier.tsx`). With a single click, it injects a corrupted transaction into IndexedDB and demonstrates how the recomputation engine instantly detects the breach, pinpoints the exact corrupted block index, and rejects the chain.

### 2. 🧾 Human-Readable Checkpoint Fingerprints (`CHK-XXXX-XXXX-XXXX`)
A 64-character SHA-256 hexadecimal hash is unusable for a rural woman verifying an entry in a handwritten notebook. 
- SHGConnect compresses cryptographic block proofs into a 16-character alphanumeric checkpoint:  
  **`CHK-7F3A-9B21-4E80`**
- This fingerprint is easily scribbled onto physical passbooks, read over a phone call, or printed on physical slips.

### 3. 🔐 2-of-3 Multi-Signatory PIN Quorum Consensus
Financial decisions in an SHG legally cannot be made by one individual.
- SHGConnect enforces an on-device multi-signatory quorum requiring PIN authorization from at least **2 of the 3 designated Office Bearers**:
  - **President** (*Adhyaksha*)
  - **Secretary** (*Sachiv*)
  - **Treasurer** (*Koshadhyaksha*)
- PINs are salted, hashed with SHA-256, and verified locally. The resulting multi-sig digital authorization proof is permanently embedded in the block header.

### 4. 💵 Indian Currency Cash Box Denomination Reconciler
In real village meetings, collections happen in hard cash.
- Features a real-time denomination counter for **₹500, ₹200, ₹100, ₹50, ₹20, ₹10 notes and coins**.
- Instantly matches counted physical currency against expected digital ledger collections.
- Displays color-coded variance indicators (Exact Match, Shortage, or Excess) and prevents finalizing meeting blocks until the physical cash box balances.

### 5. 🔊 Web Audio API Dual-Oscillator Synthetic Rubber Stamp
In rural Indian banking, physical paper stamps (*Shikka*) provide psychological proof of finality.
- Using the **Web Audio API**, SHGConnect synthesizes an acoustic rubber stamp transient without downloading any external audio files:
  - **Click Transient**: 120 Hz to 30 Hz triangle-wave pitch drop over 80ms.
  - **Metallic Body**: 800 Hz to 100 Hz sine-wave overtone over 40ms.
- Every note counted, transaction saved, and meeting finalized gives immediate, satisfying tactile and acoustic feedback.

### 6. 🗣️ Multi-Lingual Speech Synthesis at 0.9x Rural Pace
To support members with varying literacy levels:
- Integrated with the **Web Speech API** for Marathi (`mr-IN`), Hindi (`hi-IN`), and Indian English (`en-IN`).
- Vocalizes transactions aloud at a calibrated **0.9x speed** with phonetic clarity for outdoor acoustics:  
  *"कमलाताई: ₹५०० बचत जमा झाली."* (Kamlatai: ₹500 savings deposited).

### 7. 📉 True Diminishing-Balance (Reducing Interest) Microfinance Calculator
Many commercial microfinance lenders exploit rural borrowers with confusing "flat rate" calculations.
- SHGConnect embeds a strict **reducing-balance interest engine** (1%–2% monthly) aligned with NABARD guidelines.
- Produces month-by-month schedules showing diminishing interest, principal breakdown, and closing balances, keeping lending transparent.

### 8. 🛡️ Sovereign AES-256-GCM Encrypted Backups (`.shgbk`)
No reliance on third-party cloud drives:
- Local IndexedDB state can be exported into an encrypted snapshot using **AES-256-GCM** with a **PBKDF2-derived key** (100,000 rounds, SHA-256) and a 12-byte initialization vector (IV).
- Village animators can pass encrypted `.shgbk` backup files on USB pen drives between village panchayats with zero risk of exposure if the drive is lost.

### 9. 📲 Out-of-Band SMS / WhatsApp Passbook Audit Broadcasting
Using the native **Web Share API**, the system compiles human-readable vernacular receipts containing:
- Member name, amount deposited, attendance, active loan balance, and the meeting's `CHK-XXXX-XXXX-XXXX` fingerprint.
- Dispatched to members via SMS or WhatsApp with zero SMS gateway subscription costs.

### 10. ☀️ High-Contrast Rural Ergonomics & Sunlight Readability
- Palette crafted from **Deep Banyan Green** (`#1A6B4A`), **Saffron** (`#E8720C`), and **Violet** (`#6D28D9`).
- Exceeds **WCAG AAA** contrast standards to remain legible on budget smartphones under direct rural sunlight.
- Every touch target is sized to a **minimum 48×48px bounding box** to prevent mis-taps.

---

## 👥 4-Tier Role-Based Operational Access (RBAC)

The interface and permissions automatically adapt to four operational roles:

```text
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Tier 1: MEMBER  │ Tier 2: OFFICER │ Tier 3: ANIMATOR│ Tier 4: AUDITOR │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Personal glance │ Full admin      │ Cluster view    │ Forensic audit  │
│ Savings goals   │ 4-step Meeting  │ Multi-SHG stats │ SHA-256 chain   │
│ Active loan EMI │ Cash Box count  │ Grade A/B/C list│ NABARD scoring  │
│ QR payment link │ 2-of-3 Quorum   │ Force sync out  │ Credit appraisal│
│ Print passbook  │ Tamper attack   │ Village metrics │ Bank linkage    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

1. **MEMBER**: Self-auditing view. Displays personalized greetings, passbook slips, savings milestones, active loan lifecycle steppers, and UPI payment simulation. Read-only protection against unauthorized ledger alterations.
2. **OFFICE_BEARER** (President, Secretary, Treasurer): Operational group governance. Full member directory with trust scoring (0–100), guided 4-step meeting wizard, resolution registry, cash box counter, and live tamper simulation.
3. **ANIMATOR / CRP** (Cluster Resource Person / *Prerak*): Field supervision across multiple village SHGs. High-level portfolio metrics, Grade C warning alerts, and one-click outbox sync triggers.
4. **AUDITOR / BANK LINKAGE OFFICER**: Independent compliance console. Inspects the append-only cryptographic hash chain, runs full NABARD Panchasutra operational audits, and generates bank credit-readiness appraisals.

---

## 🏛️ Architectural Overview

SHGConnect separates immediate client-side data operations from remote network synchronization.

```text
                                CLIENT APPLICATION (PWA)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               React 18 + Vite + TypeScript                             │
│                                                                                        │
│  [Member Dashboard]   [Meeting Wizard]   [Cash Box Reconciler]   [Panchasutra Visualizer]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                          Local-First Persistence & Cryptography                         │
│                                                                                        │
│   IndexedDB v3 Stores:                                                                 │
│   • members           • ledger_blocks    • transactions     • loans                    │
│   • meetings          • resolutions      • officers         • audit_trail              │
│   • outbox_queue (opId, HLC, OCC)        • deferred_remote_ops                         │
│                                                                                        │
│   Web Crypto API:                                                                      │
│   • SHA-256 Hash Chains    • Merkle Roots    • AES-256-GCM Encrypted Snapshots         │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                  HTTPS (Push / Pull Sync)
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              NODE.JS + EXPRESS BACKEND                                 │
│                                                                                        │
│   • X-SHG-ID & X-Device-ID validation                                                  │
│   • Idempotent Outbox Consumer (processed_operations table)                            │
│   • Optimistic Concurrency Control (OCC entityVersion validator)                       │
│   • Monotonic Sequence Generator (nextval('server_seq_generator'))                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                  POSTGRESQL 15 ENGINE                                  │
│                                                                                        │
│   • Atomic Transactions (BEGIN ... COMMIT) with Row-Level Locks (SELECT FOR UPDATE)   │
│   • Canonical Server Operation Log (Pull Stream Source)                                │
│   • Multi-Tenant Domain Tables: server_members, server_loans, server_group_info        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Offline Synchronization Protocol

The synchronization engine is built to guarantee convergence even over erratic rural 2G networks:

```text
      CLIENT DEVICE (Offline)                           SERVER (PostgreSQL)
  ┌─────────────────────────────┐                  ┌─────────────────────────────┐
  │ Local Action (e.g. Savings) │                  │                             │
  │              │              │                  │                             │
  │              ▼              │                  │                             │
  │   Commit to IndexedDB       │                  │                             │
  │              │              │                  │                             │
  │              ▼              │                  │                             │
  │ Queue into outbox_queue     │                  │                             │
  │ (opId, HLC, entityVersion)  │                  │                             │
  └──────────────┬──────────────┘                  └─────────────────────────────┘
                 │
           Network Returns
                 │
                 ├─── POST /api/v1/sync/push ─────► Atomic Transaction (BEGIN)
                 │    { shgId, deviceId, ops }      ├─ Idempotency Check (opId)
                 │                                  ├─ OCC Version Check (FOR UPDATE)
                 │                                  ├─ Monotonic Sequence Allocation
                 │                                  └─ COMMIT
                 │◄── 200 OK (ACK / CONFLICT) ──────┤
                 │
                 ├─── POST /api/v1/sync/pull ─────► Stream operations where
                 │    { shgId, lastServerSeq }      server_seq > lastServerSeq
                 │◄── 200 OK (server_ops stream) ───┤
                 │
  ┌──────────────┴──────────────┐
  │ Invariant 2 Check:          │
  │ If opId was born locally,   │
  │ advance sequence ONLY.      │
  │ Otherwise, apply mutation   │
  │ to local IndexedDB.         │
  └─────────────────────────────┘
```

### 3-Way Conflict Resolution
When an offline concurrent edit clashes with a remote server version:
- **`KEEP_LOCAL`**: Re-queues the local mutation with a forced version overwrite flag.
- **`ACCEPT_REMOTE`**: Discards uncommitted local drift and updates local state to the canonical server state.
- **`RETRY_MERGED`**: Merges non-conflicting fields and pushes a revised operation incrementing the remote version counter.

---

## 🔐 Cryptographic Integrity & Checkpoint Proofs

```text
GENESIS BLOCK
[Block #0] ──► SHA256(0 | "00000000" | payload) = Hash_0
                     │
                     ▼
[Block #1] ──► SHA256(1 | Hash_0 | payload)      = Hash_1
                     │
                     ▼
[Block #2] ──► SHA256(2 | Hash_1 | payload)      = Hash_2
                     │
                     ▼
  ┌────────────────────────────────────────────────────────┐
  │               MEETING SESSION FINALIZATION             │
  │                                                        │
  │ 1. Pair-Wise Merkle Session Root:                      │
  │    MerkleRoot = SHA256( Hash_1 : Hash_2 )              │
  │                                                        │
  │ 2. 2-of-3 Multi-Sig Proof:                             │
  │    Proof = SHA256( "PRESIDENT:ts | TREASURER:ts" )     │
  │                                                        │
  │ 3. Checkpoint Hash:                                    │
  │    SHA256( localIndex | prevHash | MerkleRoot | Proof )│
  │                                                        │
  │ 4. Human-Readable Fingerprint:                         │
  │    "CHK-" + Hex[0..4] + "-" + Hex[4..8] + "-" + ...    │
  │    Result: CHK-4A8E-90F1-BC32                          │
  └────────────────────────────────────────────────────────┘
```

---

## 📊 NABARD Panchasutra & Credit Appraisal Engine

Under the guidelines of the National Bank for Agriculture and Rural Development (NABARD), an SHG’s creditworthiness is audited across five fundamental operating principles (*Panchasutra*):

| # | Panchasutra Pillar | Metric Evaluated | Max Score |
|---|--------------------|------------------|:---------:|
| 1 | **Regular Meetings** (*नियमित बैठक*) | Meeting periodicity and minimum 80% quorum | 20 |
| 2 | **Regular Savings** (*नियमित बचत*) | 100% member compliance with monthly savings quota | 20 |
| 3 | **Internal Lending** (*अंतर्गत कर्जवाटप*) | Active utilization of accumulated pool for micro-loans | 20 |
| 4 | **Timely Loan Recovery** (*वेळेवर परतफेड*) | On-time EMI repayments and low default rate | 20 |
| 5 | **Transparent Bookkeeping** (*पारदर्शक हिशोब*) | Intact cryptographic ledger and balanced cash box | 20 |
| **Total** | | | **100** |

### Institutional Grade Classifications
- **Grade A (80 – 100)**: Eligible for DAY-NRLM bank loan linkage (Dose 1: 4×–8× corpus multiplier).
- **Grade B (60 – 79)**: Good operating health; recommended for internal capacity building before bank linkage.
- **Grade C (< 60)**: Attention required; alerts raised on the Cluster Animator’s portfolio dashboard.

---

## 🧩 Technology Stack

| Layer | Technologies | Key Highlights |
|---|---|---|
| **Frontend Framework** | React 18.3, TypeScript 5.6, Vite 6.0 | Fast refresh, strict type safety, zero runtime bloat |
| **Offline Storage** | HTML5 IndexedDB v3, `idb` wrappers | Transactional client stores, schema migrations |
| **PWA & Caching** | Workbox, `vite-plugin-pwa` | Pre-cached application shell, offline fallback banners |
| **Styling & Tokens** | Tailwind CSS 3.4, PostCSS, Lucide Icons | Deep Banyan Green & Saffron, 48px touch bounding targets |
| **Cryptography** | Web Crypto API (`crypto.subtle`) | SHA-256 digests, PBKDF2, AES-256-GCM authenticated encryption |
| **Sound & Speech** | Web Audio API, Web Speech API | Dual-oscillator rubber stamp click, 0.9x speed regional TTS |
| **Backend API** | Node.js 18+, Express 4.19, TypeScript | Strict CORS, centralized error handler, JSON streaming |
| **Relational Database**| PostgreSQL 15, `pg` driver | Row-level locking (`FOR UPDATE`), atomic transactions |
| **Testing Engine** | Vitest 1.6, `pg-mem` | In-memory integration testing, 16 protocol invariants |
| **Containerization** | Docker, Docker Compose | Multi-stage production builds, orchestrated DB services |

---

## 📂 Repository File Map

```text
shgconnect/
├── README.md                                 # Master project documentation
├── CHANGELOG.md                              # Detailed release and version history
├── implementation.txt                        # Architectural implementation report
│
├── shgconnect-pwa/                           # Progressive Web Application (Frontend)
│   ├── package.json
│   ├── vite.config.ts                        # PWA & Service Worker configuration
│   ├── tailwind.config.js                    # Rural accessible color palette
│   └── src/
│       ├── types/
│       │   ├── shg.ts                        # SHG domain models, RBAC, Panchasutra
│       │   └── sync.ts                       # Wire protocol and sync status interfaces
│       ├── theme/
│       │   └── tokens.ts                     # WCAG AAA color tokens & INR formatters
│       ├── i18n/
│       │   └── translations.ts               # Marathi (mr), Hindi (hi), English (en)
│       ├── services/
│       │   ├── db.ts                         # IndexedDB v3 transactional persistence
│       │   ├── hashChain.ts                  # SHA-256 chain, Merkle root, fingerprints
│       │   ├── syncCoordinator.ts            # Client sync engine & outbox coordinator
│       │   ├── syncApi.ts                    # HTTP transport layer for remote backend
│       │   ├── mockSyncServer.ts             # Stateful zero-backend mock fallback
│       │   ├── cryptoBackup.ts               # AES-256-GCM encrypted backup/restore
│       │   ├── eventBus.ts                   # In-memory domain event emitter
│       │   ├── sound.ts                      # Web Audio API rubber stamp synthesizer
│       │   ├── tts.ts                        # Web Speech API speech announcer
│       │   ├── upi.ts                        # Indian UPI intent & QR generator
│       │   └── __tests__/
│       │       └── sync.test.ts              # 16-invariant client protocol test suite
│       ├── pages/
│       │   ├── MemberDashboard.tsx           # Tier 1: Member self-audit interface
│       │   ├── OfficeBearerDashboard.tsx     # Tier 2: Office Bearer meeting console
│       │   ├── AnimatorDashboard.tsx         # Tier 3: Cluster Animator portfolio
│       │   └── AuditorDashboard.tsx          # Tier 4: Forensic auditor compliance
│       └── components/
│           ├── CashBoxReconciliation.tsx     # Rupee note denomination counter
│           ├── MeetingWizard.tsx             # 4-step meeting flow with 2-of-3 quorum
│           ├── LedgerVerifier.tsx            # Live cryptographic tamper attack engine
│           ├── LoanCalculator.tsx            # Reducing balance EMI calculator
│           ├── PanchasutraAuditCard.tsx      # Comprehensive NABARD audit card
│           ├── PassbookTable.tsx             # Full transaction ledger with block verifier
│           ├── MemberDossierModal.tsx        # Printable member financial dossiers
│           ├── ConflictResolutionModal.tsx   # 3-way conflict resolver UI
│           ├── BackupRestoreModal.tsx        # AES-GCM password-protected backup modal
│           ├── UpiPaymentModal.tsx           # UPI QR code & UTR reference capture
│           └── layout/
│               ├── AppShell.tsx              # App shell, responsive header & navigation
│               └── MobileNav.tsx             # Dynamic bottom navigation bar
│
└── server/                                   # Persistent Synchronization Backend
    ├── package.json
    ├── schema.sql                            # PostgreSQL DDL, sequences, OCC tables
    ├── Dockerfile                            # Multi-stage production container build
    ├── docker-compose.yml                    # PostgreSQL 15 container definition
    └── src/
        ├── app.ts                            # Express application setup
        ├── server.ts                         # Server entrypoint (Port 4000)
        ├── db.ts                             # PostgreSQL connection pool manager
        ├── types/sync.ts                     # Server wire protocol definitions
        ├── services/syncService.ts           # Push/Pull transactional logic with OCC
        ├── routes/sync.ts                    # Express endpoints (/push, /pull)
        └── tests/
            └── sync.integration.test.ts      # Backend integration suite (via pg-mem)
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker & Docker Compose** (or local PostgreSQL 15+)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/AayushRahate07/shg-connect.git
cd shg-connect
```

---

### Step 2: Start the Client PWA
```bash
cd shgconnect-pwa
npm install
npm run dev
```
The client PWA will start immediately at `http://localhost:5173`.  
> *Note: By default, the PWA functions completely offline using IndexedDB and its stateful mock engine—no backend required to explore!*

---

### Step 3: Start the PostgreSQL Backend

Open a second terminal window:
```bash
cd server
npm install
```

#### Option A: Launch via Docker Compose (Recommended)
```bash
docker-compose up -d
```

#### Option B: Use Existing PostgreSQL Instance
Copy the environment template and configure your credentials:
```bash
cp .env.example .env
```
Execute the DDL schema against your database:
```bash
psql -U postgres -d shgconnect -f schema.sql
```

#### Launch the API Server:
```bash
npm run dev
```
The sync backend will listen on `http://localhost:4000`.

---

## 🧪 Invariant Testing & Backend Verification

SHGConnect includes rigorous test suites for both client-side synchronization invariants and server-side PostgreSQL concurrency:

### 1. Client Protocol Invariant Suite (16 Tests)
Validates local commit isolation, idempotency caching, OCC boundary checks, cursor advancement, and conflict deferrals:
```bash
cd shgconnect-pwa
npx tsx -e "import { runSyncInvariantTests } from './src/services/__tests__/sync.test.ts'; runSyncInvariantTests().then(console.log);"
```
```text
✓ Invariant 1 : Local Commit vs Remote Sync Distinction
✓ Invariant 2 : Idempotency Key Preservation (cached ACK on duplicate opId)
✓ Invariant 3 : Monotonic Sequence Counter Independence
✓ Invariant 4 : OCC Scope Limits (Mutable entity version validation)
✓ Invariant 5 : Protected Entity Deferral (deferred_remote_ops)
✓ Invariant 6 : Durable lastServerSeq Cursor Advancement
✓ Invariant 7 : Multi-Tenant shgId Isolation
✓ Invariant 8 : Stale Crash Recovery (>60s timeout)
✓ Invariant 9 : Conflict Resolution: ACCEPT_REMOTE
✓ Invariant 10: Conflict Resolution: KEEP_LOCAL
✓ Invariant 11: Conflict Resolution: RETRY_MERGED
✓ Invariant 12: Pull stream opId consumption without re-applying mutation
✓ Invariant 13: Network OFFLINE state handling
✓ Invariant 14: Outbox Queue Ordering & HLC Timestamps
✓ Invariant 15: Audit Envelope Logging during Remote Pull Apply
✓ Invariant 16: Derived SYNCED Indicator Calculation

Result: 16 / 16 Invariant Tests Passed (100%)
```

---

### 2. Server PostgreSQL Integration Suite
Runs against an in-memory PostgreSQL engine (`pg-mem`) verifying row-level locks and atomic transactions:
```bash
cd server
npm test
```
```text
Test Files  1 passed (1)
Tests       11 passed (11)
Duration    1.24s
```

---

## 🌐 RESTful Sync API Specification

### `POST /api/v1/sync/push`
Pushes a batch of locally generated operations to the server.

**Headers:**
```http
Content-Type: application/json
X-SHG-ID: SHG-MH-SAT-2024-0089
X-Device-ID: DEV-NODE-001
```

**Request Body:**
```json
{
  "shgId": "SHG-MH-SAT-2024-0089",
  "deviceId": "DEV-NODE-001",
  "operations": [
    {
      "opId": "c3b8f1a0-1234-4567-89ab-cdef01234567",
      "shgId": "SHG-MH-SAT-2024-0089",
      "actorId": "mem-1",
      "actorRole": "TREASURER",
      "deviceId": "DEV-NODE-001",
      "hlcTimestamp": "2026-10-16T10:00:00.000Z",
      "type": "RECORD_SAVINGS",
      "entityId": "mem-1",
      "payload": {
        "amount": 500,
        "expectedVersion": 1
      }
    }
  ]
}
```

**Response (`200 OK`):**
```json
{
  "status": "SUCCESS",
  "acknowledgedOpIds": ["c3b8f1a0-1234-4567-89ab-cdef01234567"],
  "acks": [
    {
      "opId": "c3b8f1a0-1234-4567-89ab-cdef01234567",
      "status": "ACKNOWLEDGED",
      "serverSeq": 101
    }
  ]
}
```

---

### `POST /api/v1/sync/pull`
Retrieves remote operations assigned sequence numbers higher than the device's last known cursor.

**Request Body:**
```json
{
  "shgId": "SHG-MH-SAT-2024-0089",
  "deviceId": "DEV-NODE-001",
  "lastServerSeq": 100,
  "batchSize": 50
}
```

**Response (`200 OK`):**
```json
{
  "shgId": "SHG-MH-SAT-2024-0089",
  "currentServerSeq": 101,
  "operations": [
    {
      "serverSeq": 101,
      "opId": "c3b8f1a0-1234-4567-89ab-cdef01234567",
      "type": "RECORD_SAVINGS",
      "entityId": "mem-1",
      "payload": { "amount": 500 },
      "entityVersion": 2
    }
  ],
  "hasMore": false
}
```

---

## 🏛️ Federation Hierarchy & Privacy

SHGConnect models administrative boundaries in accordance with the National Rural Livelihoods Project (NRLP):

```text
State (e.g., Maharashtra)
  └── District (e.g., Satara)
        └── Block / Taluka (e.g., Karad)
              └── Gram Panchayat (e.g., Supane)
                    └── Village Organization (Gram Sangha)
                          └── Cluster Level Federation (CLF)
                                └── Self-Help Group (SHG)
```

### Banking Privacy Compliance
- Bank account numbers are permanently masked across UI and audit views:  
  **`XXXX-XXXX-4589`**
- Prevents raw bank credential theft during collaborative village meetings.

---

```text
SHGConnect | Aayush Rahate
```

<div align="center">
  <sub>Built with ❤️ for rural financial inclusion across India.</sub>
</div>

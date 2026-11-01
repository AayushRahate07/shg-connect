# Changelog

All notable changes to the **SHGConnect** project are documented in this file.
This changelog strictly reflects the features, fixes, and architecture currently implemented in the codebase.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]
- Proposed Phase 6–12 roadmap: Two-OTP attendance handshake, Add Member modal with outbox queuing, multi-SHG compound IndexedDB caching `[shgId + id]`, and client-side PDF/CSV reporting engine (detailed in `PRODUCT_IMPLEMENTATION.md`).

---

## [2.1.0] - 2026-09-23
### Added
- **PWA Installation & Connectivity Prompts**:
  - Added `InstallPrompt.tsx` supporting native browser "Add to Home Screen" PWA install flow with user dismissal memory.
  - Added `OfflineBanner.tsx` detecting `navigator.onLine` state changes to visually alert users during complete network loss.
- **Context-Aware Mobile Bottom Navigation (`MobileNav.tsx`)**:
  - Dynamically renders navigation tabs based on the active 4-tier role:
    - **Office Bearer**: `Home`, `Members`, `Loans`, `Meetings`, `More`.
    - **Member**: `Home`, `Savings`, `Loans`, `Meetings`, `More`.
    - **Animator**: `Portfolio`, `Directory`, `Sync Center`, `Settings`.
    - **Auditor**: `Overview`, `Panchasutra`, `Hash Chain Audit`, `Settings`.
  - Added active route pill highlights and micro-bounce feedback.
- **Header Dropdowns & Touch Ergonomics**:
  - Replaced cyclical role switch button with a dedicated modal dropdown menu in `Header.tsx`.
  - Added outside-click listeners and event-propagation stops to prevent touch events from leaking to underlying components on mobile screens.

### Fixed
- **Mobile Scrolling & Layout Traps**:
  - Removed aggressive `overscroll-behavior-y: none` and `overflow-x-hidden` rules from `index.css` that prevented smooth vertical scrolling on Android devices.
- **Meeting Wizard View Overcrowding**:
  - Ensured `OfficeBearerDashboard` completely unmounts background dashboard cards when the full-screen Guided Meeting Wizard is triggered.
  - Replaced the embedded full `ResolutionRegister` in Step 3 of the Wizard with an inline, streamlined Quick-Resolution input.
- **TypeScript Type Conformance**:
  - Resolved UI component prop mismatches in `Badge.tsx`, `Card.tsx`, and `Progress.tsx`, replacing legacy non-standard variants with strictly typed tokens (`green`, `saffron`, `default`).
  - Fixed argument typing in `onCompleteMeetingSession` in `App.tsx` and `OfficeBearerDashboard.tsx`.
- **Developer Hot-Reloading**:
  - Disabled `devOptions.enabled` in `vite.config.ts` to prevent Service Worker precaching from interfering with local Vite HMR updates.

---

## [2.0.0] - 2026-09-18
### Added
- **4-Tier Operational Role-Based Access Control (RBAC)**:
  - **Tier 1 (`MEMBER`)**: Self-auditing personal financial dashboard (`MemberDashboard.tsx`, `MemberHome.tsx`, `SavingsView.tsx`, `LoansView.tsx`, `MeetingsView.tsx`, `MoreMenuView.tsx`, `SavingsGoal.tsx`, `LoanLifecycleView.tsx`).
  - **Tier 2 (`OFFICE_BEARER`)**: Operational group console (`OfficeBearerDashboard.tsx`) with Member Directory, Loan Portfolio, Guided Meeting Wizard launcher, and live Tamper Attack simulation.
  - **Tier 3 (`ANIMATOR`)**: Cluster/village supervision dashboard (`AnimatorDashboard.tsx`) monitoring portfolio metrics, Grade A/B/C classifications, and sync states across multiple SHGs.
  - **Tier 4 (`AUDITOR`)**: Forensic inspection console (`AuditorDashboard.tsx`) with real-time SHA-256 chain verification, Panchasutra scoring, and DAY-NRLM credit linkage assessments.
- **Unified Application Shell (`AppShell.tsx`)**:
  - Houses the top navigation `Header.tsx`, responsive desktop `Sidebar.tsx`, and bottom `MobileNav.tsx`.
  - Global language selector (`mr` - Marathi, `hi` - Hindi, `en` - English).
  - Global Web Speech API voice assistant toggle (`tts.ts`).
  - Permanent synchronization status pill (`SyncStatusPill.tsx`).
  - Passphrase-protected encrypted backup launcher (`BackupRestoreModal.tsx`).
- **Rural Accessible Design System**:
  - Established color tokens (`tokens.ts`, `tailwind.config.js`) conforming to WCAG AAA contrast for rural outdoor sunlight readability (`#0F4C3A`, `#D97706`, `#1C1917`).
  - Standardized minimum 48px touch targets for mobile usability.
  - Indian Rupee formatters with Lakh/Crore grouping (`formatINR`).

---

## [1.5.0] - 2026-09-17
### Added
- **Persistent Node.js / PostgreSQL Synchronization Backend (`server/`)**:
  - Express 4 service (`server/src/app.ts`, `server.ts`) listening on port 4000.
  - PostgreSQL schema DDL (`server/schema.sql`) defining monotonic sequence generator (`server_seq_generator`), idempotency store (`processed_operations`), outbox stream (`server_operation_log`), and projected domain tables (`domain_members`, `domain_transactions`, `domain_loans`, `domain_meetings`).
  - Transactional Push/Pull Service (`server/src/services/syncService.ts`) with atomic transactions (`BEGIN ... COMMIT`) and row-level locking (`SELECT ... FOR UPDATE`).
  - Automated Integration Test Suite (`server/src/tests/sync.integration.test.ts`) validating 11 backend invariants against in-memory PostgreSQL (`pg-mem`).
  - Production multi-stage `Dockerfile` and `docker-compose.yml` for PostgreSQL 15.
- **Client HTTP Transport Layer**:
  - Added `syncApi.ts` connecting client `syncCoordinator.ts` to `VITE_SYNC_SERVER_URL` via standard fetch with timeout and network fallback.

---

## [1.4.0] - 2026-09-17
### Added
- **Client-Side Offline Synchronization Protocol (`syncCoordinator.ts`)**:
  - Local outbox mutation queue (`outbox_queue`) storing atomic mutation logs with UUID `opId`, Hybrid Logical Clock (`hlcTimestamp`), actor ID, and action payload.
  - Monotonic server sequence cursor (`lastServerSeq`) tracking in `sync_metadata`.
  - Conflict detection routing concurrent or version-mismatched remote operations to `deferred_remote_ops`.
  - Interactive Conflict Resolution Modal (`ConflictResolutionModal.tsx`) supporting `KEEP_LOCAL`, `ACCEPT_REMOTE`, and `RETRY_MERGED` strategies.
  - Stateful client-side mock sync fallback (`mockSyncServer.ts`) for zero-server offline development.
  - Automated client sync invariant suite (`sync.test.ts`) covering 16 protocol invariants.

---

## [1.3.0] - 2026-09-17
### Added
- **5-Tier Federation Scope Isolation (`types/shg.ts`)**:
  - Hierarchical administrative boundary metadata: State, District, Block, Gram Panchayat, Village Organization (Gram Sangha), and Cluster Level Federation (CLF).
- **Optimistic Concurrency Control (OCC)**:
  - Added explicit `entityVersion` integer counters across mutable entities (`Member`, `Loan`, `SHGGroupInfo`).
  - `ConcurrencyConflictError` thrown on version divergence during mutation apply.
- **AES-256-GCM Encrypted Backup & Restore (`cryptoBackup.ts`)**:
  - PBKDF2 key derivation (100,000 rounds, SHA-256) with client-supplied passphrases.
  - Authenticated symmetric encryption (AES-GCM, 12-byte IV).
  - Snapshot export generating password-protected `.shgbk` files containing all IndexedDB stores.
  - Rollback-safe database restore engine.
- **Banking Privacy**:
  - Account number masking (`XXXX-XXXX-4589`) to prevent raw account exposure.

---

## [1.2.0] - 2026-09-17
### Added
- **DAY-NRLM Credit Readiness Assessment Engine**:
  - Evaluates SHG operational age, corpus multipliers, and repayment rates.
  - Computes microfinance dose tiers: `INELIGIBLE_AGE`, `DOSE_1` (4x-8x), `DOSE_2`, `DOSE_3_PLUS`.
  - Formal institutional appraisal disclaimer.
- **Audit-First In-Memory Event Bus (`eventBus.ts`)**:
  - Emits domain events (`MEETING_COMMITTED`, `SAVINGS_RECORDED`, `LOAN_DISBURSED`, `EMI_REPAID`, `CASH_MISMATCH_FLAGGED`, `QUORUM_SIGNATURES_AUTHENTICATED`).
  - Decouples transaction logging from UI state side-effects.
- **Digital UPI Intent Tracking**:
  - Simulates UPI payment intent QR codes (`UpiPaymentModal.tsx`).
  - Captures 12-character alphanumeric bank reference numbers (UTR) for reconciliation.

---

## [1.1.0] - 2026-09-17
### Added
- **NABARD Panchasutra Evaluation Module (`PanchasutraVisualizer.tsx`)**:
  - Scores the 5 core SHG operational disciplines (Meetings, Savings, Lending, Recovery, Bookkeeping).
  - Classifies groups into NABARD Bank Linkage grades (Grade A, Grade B, Grade C).
- **Physical Cash Box Reconciliation Module (`CashBoxReconciliation.tsx`)**:
  - Indian currency denomination counter for ₹500, ₹200, ₹100, ₹50, ₹20, ₹10 notes and coins.
  - Calculates physical counted cash vs. digital expected ledger totals.
  - Highlights exact match or variance before meeting commitment.
- **Proceedings & Resolution Register (`ResolutionRegister.tsx`)**:
  - Logs formal SHG resolutions categorized by Livelihood, Agriculture, Medical, Education, and Penalty/Fine.
  - Captures proposer, seconder, and unanimous voting status.
- **Sound Effects Engine (`sound.ts`)**:
  - Web Audio API synthesizer generating stamp sounds, tactile clicks, and success chimes.

---

## [1.0.0] - 2026-09-17
### Added
- **Cryptographic Trust Ledger (`hashChain.ts`)**:
  - Append-only SHA-256 block ledger linking previous block hash, timestamp, member ID, transaction type, and payload.
  - Merkle root calculation for all transactions finalized in a meeting.
  - Truncated Checkpoint Fingerprint generator (`CHK-XXXX-XXXX-XXXX`) for human audit verification.
  - Live tamper attack simulation and verification tool (`LedgerVerifier.tsx`).
- **IndexedDB v3 Persistence Engine (`db.ts`)**:
  - Transactional browser storage for `members`, `ledger_blocks`, `transactions`, `meetings`, `resolutions`, `outbox_queue`, `audit_trail`, `officers`, `loans`, `sync_metadata`, and `group_info`.
  - Automatic migration from legacy LocalStorage keys.
- **Guided 4-Step Meeting Wizard (`MeetingWizard.tsx`)**:
  - Step 1: Member attendance roll call.
  - Step 2: Monthly savings collection with Web Speech API audio announcements.
  - Step 3: Loan disbursal and resolution motions.
  - Step 4: 2-of-3 Multi-Officer PIN quorum consensus.
- **Full Transaction Passbook (`PassbookTable.tsx`)**:
  - Complete chronological transaction ledger with filter tabs and block-level hash verification.
- **Reducing-Balance Loan Calculator (`LoanCalculator.tsx`)**:
  - Calculates monthly microfinance EMIs, interest totals, and payoff timelines.

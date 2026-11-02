<div align="center">

# SHGCONNECT

### Local-First Microfinance OS & Cryptographic Ledger for Rural SHGs

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![IndexedDB](https://img.shields.io/badge/Storage-IndexedDB_v4-success?style=for-the-badge&logo=databricks&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![WebCrypto](https://img.shields.io/badge/Security-SHA--256_RFC6962-critical?style=for-the-badge&logo=open-access&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

[Live Demo](https://shg-connect-in.vercel.app/#)  •  [मराठी माहितीपत्रक](README.mr.md)  •  [Architecture](#4-technical-architecture)  •  [Testing Guide](#how-to-test-live-multi-device-meeting-3-phones-on-wi-fi)

</div>

---

## What is SHGConnect?

In rural India, 10 to 15 women form a Self-Help Group (बचत गट) to pool small monthly savings, collect loan repayments, issue emergency loans, and keep physical cash in a metal box. 

Traditionally, one person (secretary or animator) writes everything in handwritten paper registers. This leads to common problems:
- Calculation errors during long meetings.
- Lack of transparency (members often don't know their exact balance or interest paid).
- Torn, lost, or locked registers.
- Discrepancies between what was written in the book and what is physically in the cash box.
- Poor or zero internet connectivity in village meeting halls.

**SHGConnect** solves these problems directly. It is an installable web app (PWA) that works **100% offline** on entry-level Android smartphones. It can be used by a single leader on one phone, or connected across multiple members' phones during a live meeting using an instant **Handshake OTP** to verify every rupee before it is recorded.

---

## 1. 4-Tier Role-Based Dashboard Access

SHGConnect structures access across 4 distinct functional tiers arranged side-by-side to guarantee strict segregation of duties:

```mermaid
flowchart LR
    subgraph Col1["Tier 1: Member (सभासद)"]
        direction TB
        M1["Personal Passbook"]
        M2["Live Handshake OTP"]
        M3["Dynamic UPI QR"]
        M4["EMI Repayment Radar"]
    end

    subgraph Col2["Tier 2: Lead (गट प्रमुख)"]
        direction TB
        L1["Host Live Room"]
        L2["4-Step Meeting Conductor"]
        L3["Cash Box Note Counter"]
        L4["Single-Writer Master Lease"]
    end

    subgraph Col3["Tier 3: Animator (अधिकारी)"]
        direction TB
        A1["Multi-SHG Portfolio"]
        A2["Attendance Health Radar"]
        A3["Offline .shgbk Backups"]
        A4["Member Onboarding"]
    end

    subgraph Col4["Tier 4: Auditor (लेखापरीक्षक)"]
        direction TB
        U1["SHA-256 Chain Verifier"]
        U2["Merkle Root Audit"]
        U3["Panchasutra Score 0-100"]
        U4["One-Click Compliance Export"]
    end

    Col1 --- Col2 --- Col3 --- Col4
```

### Role Breakdown

| Tier & Role | Core View | Primary Capabilities |
| :--- | :--- | :--- |
| **Tier 1: Member** | `MemberDashboard.tsx` | **Read-Only Passbook & Meeting Client.** Individual savings balances, EMI schedules, 4-digit room join, and live cash OTP verification. |
| **Tier 2: Lead** | `OfficeBearerDashboard.tsx` | **Operational Meeting Console.** Room broadcast, single-writer ledger write lease, physical note denomination counter, and dual PIN sign-off. |
| **Tier 3: Animator** | `AnimatorDashboard.tsx` | **Village Cluster Oversight.** Cross-group portfolio monitoring (5–20 SHGs), `.shgbk` device backups, and health grading. |
| **Tier 4: Auditor** | `AuditorDashboard.tsx` | **Institutional Compliance.** Read-only forensic ledger inspection, SHA-256 chain verification, and automated NABARD Panchasutra grading. |

---

## 2. How Physical Cash is Verified

Software cannot roll back rupee notes once handed out of a cash box. SHGConnect uses a horizontal two-stage verification pipeline to reconcile physical cash against digital records:

```mermaid
flowchart LR
    subgraph L1["Stage 1: Mutual Handshake OTP"]
        direction TB
        S1["Leader enters ₹500"] --> S2["Dynamic OTP pushed to Member"]
        S2 --> S3["Member reads code to Leader"] --> S4["Leader enters code to lock"]
    end

    subgraph L2["Stage 2: Cash Box Denomination Tally"]
        direction TB
        C1["Count physical currency notes"] --> C2["App computes: Expected vs Counted"]
        C2 --> C3{"Variance = 0?"}
        C3 -->|Yes| C4["Meeting Closed & Signed"]
        C3 -->|No| C5["Shortfall Warning Block"]
    end

    L1 ==>|Cash Verified| L2
```

### 1. The Mutual Handshake OTP (Preventing Typing Errors & Disputes)
- When the leader enters an amount (e.g. ₹500) and hits Save, the app **does not** immediately save it.
- A dynamic 4-digit OTP is pushed directly to that specific member's phone over the local connection.
- The member's phone displays:
  > **बचत रक्कम पडताळणी (Savings Verification)**  
  > प्रमुखांनी तुमची बचत नोंदवली: **₹५००**  
  > रक्कम बरोबर असल्यास हा कोड प्रमुखाला सांगा: **`[ 7 7 7 4 ]`**
- The member physically hands the cash and reads out the code. Once typed by the leader, the transaction is permanently locked.

### 2. Cash Box Note Counter (Preventing Physical Cash Loss)
At the end of the meeting, the secretary enters the actual count of paper notes:
- Counts ₹500, ₹200, ₹100, ₹50, ₹20, ₹10 notes and coins.
- Formula enforced:
  $$\text{Expected Total} = \text{Opening Balance} + \text{Savings Collected} + \text{Loan EMIs Collected} - \text{Loans Disbursed}$$
- If physical cash is ₹11,200 but the ledger says ₹11,400, a warning banner highlights a **₹200 shortfall** before anyone can exit.

---

## 3. Complete Feature Catalog

```mermaid
mindmap
  root((SHGConnect))
    Live Meetings
      4-Digit Room Code
      Real-Time Member Roster
      Mutual Handshake OTP
      Instant Digital Receipts
    Offline Conductor
      4-Step Meeting Wizard
      Attendance Checklist
      Cash Box<br/>Note Counter
      Biometric / PIN Quorum
    Financial Ledger
      Member Passbooks
      Loan EMI Schedules
      Panchasutra Compliance Radar
      UPI QR Intent Deep-links
    Safety & Security
      SHA-256 Hash Chain
      Single-Writer Master Lease
      Encrypted Backup .shgbk
      Operation Freeze on Conflict
```

---

## 4. Technical Architecture

A local-first architecture engineered for zero-connectivity environments with optional upstream reconciliation:

```mermaid
flowchart LR
    subgraph Client["PWA Client Layer"]
        direction TB
        P1["React 18 UI"]
        P2["IndexedDB v4 Storage"]
        P3["Web Crypto API"]
    end

    subgraph Broker["Local Engine (Port 3000)"]
        direction TB
        B1["meetingRoomPlugin"]
        B2["SSE Real-Time Stream"]
        B3["In-Memory State Map"]
    end

    subgraph Cloud["Cloud Sync (Port 4000)"]
        direction TB
        C1["Express Gateway"]
        C2["PostgreSQL Database"]
        C3["Row-Level Locks"]
    end

    Client <==>|HTTP / SSE| Broker
    Client -.->|Idempotent Outbox Sync| Cloud
```

- **Offline-First PWA:** Uses Service Workers with 10MB asset caching (`workbox`). Loads instantly without network.
- **Persistent Storage:** Requests `navigator.storage.persist()` on boot so Android Chrome never clears group records under low storage.
- **Audio Fallback Engine:** If an Android Go phone lacks Devanagari text-to-speech voice packs, the app uses the Web Audio API to synthesize melodic chimes (cash deposit chime, loan approval fanfare, warning buzz).

---

## 5. Verification & Test Results

The codebase includes an automated invariant verification harness:

```text
[PASS] Invariant 1 : Local Commit vs Remote Sync Distinction
[PASS] Invariant 2 : Idempotency Key Preservation (Cached ACK on duplicate push)
[PASS] Invariant 3 : Monotonic Sequence Counter Independence
[PASS] Invariant 4 : OCC Scope Limits (Entity version validation)
[PASS] Invariant 5 : Protected Entity Deferral (deferred_remote_ops)
[PASS] Invariant 6 : Durable lastServerSeq Cursor Advancement
[PASS] Invariant 7 : Multi-Tenant shgId Isolation
[PASS] Invariant 8 : Stale Crash Recovery (>60s timeout)
[PASS] Invariant 9 : Conflict Resolution: ACCEPT_REMOTE
[PASS] Invariant 10: Conflict Resolution: KEEP_LOCAL
[PASS] Invariant 11: Conflict Resolution: RETRY_MERGED
[PASS] Invariant 12: Pull stream opId sequence consumption
[PASS] Invariant 13: Network OFFLINE State Handling
[PASS] Invariant 14: Outbox Queue Ordering & HLC Timestamps
[PASS] Invariant 15: Audit Envelope Logging during Remote Pull Apply
[PASS] Invariant 16: Derived SYNCED Indicator Calculation (ONLINE + IDLE + pending=0)

Valid Chain Verification : PASS (All SHA-256 blocks valid, Merkle root intact)
Tamper Simulation Attack : PASS (Altering block 0 amount from ₹500 to ₹50,000 
                                 immediately detected at index 0)
```

---

## 6. Getting Started & Testing

### Prerequisites
- Node.js (version 18 or newer)
- npm

### Installation & Build

```bash
# Clone the repository
git clone https://github.com/AayushRahate07/shg-connect.git
cd shgconnect/shgconnect-pwa

# Install dependencies
npm install

# Build production assets (TypeScript check + Vite bundle)
npm run build

# Start server bound to all network interfaces
npm run dev -- --host 0.0.0.0 --port 3000
```

---

## How to Test Live Multi-Device Meeting (3 Phones on Wi-Fi)

1. Find your host computer's local Wi-Fi IP address (e.g. `192.168.1.15` or `10.225.150.173`).
2. Connect your computer and phones to the same Wi-Fi router or mobile hotspot.
3. Open `http://<YOUR_IP>:3000` in the browser on all 3 devices.

### Step-by-Step Test:
1. **On Phone 1 (Leader):**
   - Log in as **गट प्रमुख (SHG Lead)**.
   - Click **`📡 थेट बैठक सुरू करा (Start Live Meeting)`**.
   - Note the **4-digit room code** on the screen (e.g. `9757`).
2. **On Phones 2 & 3 (Members):**
   - Log in as **सभासद (Member)** (e.g. Sunita / Anita).
   - Tap the **बैठका (Meetings)** tab at the bottom $\rightarrow$ click **`📡 थेट बैठक कक्ष • बैठकीत सामील व्हा`**.
   - Enter `9757`.
3. **Verify Attendance & Physical Cash Handshake:**
   - Phone 1 immediately shows both members appear with green **Online** badges.
   - On Phone 1, enter `500` for Phone 2 and tap **`नोंदवा (Save)`**.
   - Phone 2 chimes and displays the **Mutual Handshake Sheet**:
     $$\text{₹५०० बचत} \quad\longrightarrow\quad \text{पडताळणी कोड: } [\mathbf{7774}]$$
   - Phone 1 prompts for the code. Type `7774` and hit confirm.
   - Both phones play a celebratory stamp sound, Phone 2 receives a **Verified ✅** badge, and the meeting cash box updates in real time.

---

<div align="center">

### SHGCONNECT | AAYUSH RAHATE

</div>

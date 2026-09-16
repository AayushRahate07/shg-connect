export type Role = 'MEMBER' | 'ANIMATOR' | 'TREASURER';

export type OfficerRole = 'PRESIDENT' | 'SECRETARY' | 'TREASURER';

export interface OfficerSignature {
  role: OfficerRole;
  signedAt: string;
  officerName: string;
}

export type TransactionType = 'ATTENDANCE' | 'SAVINGS' | 'LOAN_DISBURSAL' | 'EMI_REPAYMENT' | 'PENALTY' | 'RESOLUTION';

export type PaymentMode = 'CASH' | 'UPI_INTENT';
export type SettlementStatus = 'SETTLED_CASH' | 'PENDING_BANK_RECONCILIATION' | 'SETTLED_DIGITAL_UTR';

export interface FederationScope {
  state: string;
  district: string;
  block: string;
  gramPanchayat: string;
  villageOrganization?: string; // Village Organization / Gram Sangha
  clfName?: string;             // Cluster Level Federation
}

export interface SHGGroupInfo {
  id: string;                   // e.g., "SHG-MH-SAT-2024-0089"
  name: string;
  formationDate: string;
  federation: FederationScope;
  bankDetails: {
    accountNumberMasked: string; // e.g., "XXXX-XXXX-4589" (No raw account numbers)
    ifscCode: string;
    branchName: string;
  };
  entityVersion: number;        // Explicitly named entityVersion for OCC
  updatedAt: string;
}

export interface Member {
  id: string;
  shgId?: string;
  name: string;
  nameRegional: string;
  phone: string;
  role: Role;
  totalSavings: number;
  activeLoanBalance: number;
  trustScore: number;
  upiVpa?: string;
  avatarColor: string;
  joinedDate?: string;
  occupation?: string;
  entityVersion: number;        // OCC version
}

export interface Transaction {
  id: string;
  shgId?: string;
  index: number;
  timestamp: string;
  memberId: string;
  memberName: string;
  type: TransactionType;
  amount: number;
  notes?: string;
  prevHash: string;
  hash: string;
  signatories?: OfficerSignature[];
  signatureProof?: string;
  checkpointFingerprint?: string;
  paymentMode?: PaymentMode;
  settlementStatus?: SettlementStatus;
  utrReference?: string; // 12-character alphanumeric bank reference
}

export interface Loan {
  id: string;
  shgId?: string;
  memberId: string;
  memberName: string;
  principal: number;
  interestRateMonthly: number; // e.g. 1.5%
  tenureMonths: number;
  totalPaid: number;
  remainingBalance: number;
  status: 'ACTIVE' | 'REQUESTED' | 'REPAID' | 'REJECTED';
  dateDisbursed: string;
  entityVersion: number;        // OCC version
}

export interface Meeting {
  id: string;
  date: string;
  meetingNumber: number;
  totalSavingsCollected: number;
  totalEmiCollected: number;
  totalDisbursed: number;
  attendanceRecord: Record<string, boolean>; // memberId -> boolean
  signatories?: OfficerSignature[];
  blockHash?: string;
  merkleRoot?: string;
  checkpointFingerprint?: string;
}

export interface OperationLog {
  opId: string;                  // UUID v4 (idempotency key)
  shgId: string;
  actorId: string;
  actorRole: 'ANIMATOR' | 'PRESIDENT' | 'SECRETARY' | 'TREASURER';
  deviceId: string;
  hlcTimestamp: string;          // Hybrid Logical Clock (e.g., ISO-Counter format)
  type: 'COMMIT_MEETING' | 'RECORD_SAVINGS' | 'DISBURSE_LOAN' | 'REPAY_EMI' | 'PASS_RESOLUTION';
  entityId: string;
  payload: Record<string, any>;
  prevOpHash: string;            // SHA-256 chained strictly to previous device operation
  syncStatus: 'PENDING' | 'SYNCED';
}

export interface LedgerBlock {
  id: string;                    // UUID v4
  localIndex: number;            // Local sequential index
  shgId: string;
  createdAt: string;
  prevBlockHash: string;         // SHA-256 of previous finalized meeting block
  merkleRoot: string;            // Merkle root of transaction hashes in this meeting
  checkpointHash: string;        // Full 256-bit SHA-256 checkpoint
  checkpointFingerprint: string; // Truncated display format: "CHK-XXXX-XXXX-XXXX"
  signatoryProof: string;        // Salted quorum hashes
  blockHash: string;             // Final block hash
}

export interface AuditEnvelope {
  auditId: string;               // UUID v4
  shgId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: 'TRANSACTION' | 'MEETING' | 'LOAN' | 'CONFIG';
  entityId: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any>;
  reason?: string;
  timestamp: string;
  deviceId: string;
  auditHash: string;             // Canonical SHA-256 digest
}

export interface Officer {
  id: string;                    // Unique UUID (NOT role)
  shgId: string;
  role: 'PRESIDENT' | 'SECRETARY' | 'TREASURER';
  displayName: string;
  pinHash: string;
  publicKey?: string;
  status: 'ACTIVE' | 'REVOKED';
}

export * from './sync';

export interface SyncMetadata {
  shgId: string;
  deviceId: string;
  lastServerSeq: number;
  lastSyncAt: string | null;
  lastAcknowledgedOpId: string | null;
  schemaVersion: number;
}

export interface NRLMCreditAssessment {
  shgAgeMonths: number;
  panchasutraHealthScore: number;     // 0-100 operational index
  eligibleCorpus: number;             // Savings + retained earnings/interest
  activeRepaymentRate: number;        // Percentage (0-100)
  recommendedDose: 'INELIGIBLE_AGE' | 'DOSE_1' | 'DOSE_2' | 'DOSE_3_PLUS';
  estimatedCreditLimit: number;
  appraisalDisclaimer: string;
}

export interface EventContext {
  shgId: string;
  actorId: string;
  actorRole: 'ANIMATOR' | 'PRESIDENT' | 'SECRETARY' | 'TREASURER';
  deviceId: string;
}

export type DomainEvent =
  | { type: 'MEETING_COMMITTED'; payload: { meetingId: string; blockId: string; totalSavings: number; totalDisbursed: number } }
  | { type: 'SAVINGS_RECORDED'; payload: { memberId: string; amount: number; paymentMode: PaymentMode; settlementStatus: SettlementStatus; utrReference?: string } }
  | { type: 'LOAN_DISBURSED'; payload: { memberId: string; amount: number; purpose: string } }
  | { type: 'EMI_REPAID'; payload: { memberId: string; principal: number; interest: number } }
  | { type: 'CASH_MISMATCH_FLAGGED'; payload: { expected: number; physicalCounted: number; variance: number } }
  | { type: 'QUORUM_SIGNATURES_AUTHENTICATED'; payload: { officerRoles: string[]; sessionHash: string } };

export interface ChainVerificationBlockResult {
  index: number;
  expectedHash: string;
  actualHash: string;
  status: 'VALID' | 'CORRUPTED';
  payloadSummary: string;
  merkleRoot?: string;
  checkpointFingerprint?: string;
}

export interface ChainVerificationResult {
  isValid: boolean;
  invalidBlockIndex: number | null;
  verifiedBlocksCount: number;
  blocks: ChainVerificationBlockResult[];
}

export type SupportedLanguage = 'mr' | 'hi' | 'en';

// Module 1: NABARD Panchasutra Score Model
export interface PanchasutraScore {
  regularMeetingsScore: number; // 0-20
  regularSavingsScore: number;  // 0-20
  internalLendingScore: number; // 0-20
  timelyRecoveryScore: number;  // 0-20
  transparentBooksScore: number;// 0-20
  totalScore: number;           // 0-100
  bankGrade: 'Grade A' | 'Grade B' | 'Grade C';
  loanEligibilityInr: number;
}

// Module 2: Cash Box State Model
export interface CashBoxDenominations {
  n500: number;
  n200: number;
  n100: number;
  n50: number;
  n20: number;
  n10: number;
  coins: number;
}

export interface CashBoxState {
  denominations: CashBoxDenominations;
  totalCountedCash: number;
  digitalExpectedCash: number;
  discrepancy: number;
  isBalanced: boolean;
}

// Module 3: Proceedings Resolution Model
export type ResolutionCategory = 'LIVELIHOOD' | 'AGRICULTURE' | 'MEDICAL_EMERGENCY' | 'EDUCATION' | 'PENALTY_FINE';

export interface Resolution {
  id: string;
  resolutionNumber: number;
  date: string;
  title: string;
  category: ResolutionCategory;
  description: string;
  proposedBy: string;
  secondedBy: string;
  approvedUnanimously: boolean;
}

// Officer PIN state model
export interface OfficerCredentials {
  role: OfficerRole;
  name: string;
  nameRegional: string;
  pinHash: string; // SHA-256 hash of PIN
  defaultPin: string;
}

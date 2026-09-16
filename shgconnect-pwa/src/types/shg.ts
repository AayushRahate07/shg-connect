export type Role = 'MEMBER' | 'ANIMATOR' | 'TREASURER';

export type OfficerRole = 'PRESIDENT' | 'SECRETARY' | 'TREASURER';

export interface OfficerSignature {
  role: OfficerRole;
  signedAt: string;
  officerName: string;
}

export type TransactionType = 'ATTENDANCE' | 'SAVINGS' | 'LOAN_DISBURSAL' | 'EMI_REPAYMENT' | 'PENALTY' | 'RESOLUTION';

export interface Member {
  id: string;
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
}

export interface Transaction {
  id: string;
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
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  principal: number;
  interestRateMonthly: number; // e.g. 1.5%
  tenureMonths: number;
  totalPaid: number;
  remainingBalance: number;
  status: 'ACTIVE' | 'REQUESTED' | 'REPAID' | 'REJECTED';
  dateDisbursed: string;
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
}

export interface ChainVerificationBlockResult {
  index: number;
  expectedHash: string;
  actualHash: string;
  status: 'VALID' | 'CORRUPTED';
  payloadSummary: string;
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

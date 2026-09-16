export type Role = 'MEMBER' | 'ANIMATOR' | 'TREASURER';

export type TransactionType = 'ATTENDANCE' | 'SAVINGS' | 'LOAN_DISBURSAL' | 'EMI_REPAYMENT' | 'PENALTY';

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

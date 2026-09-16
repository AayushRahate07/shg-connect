import { Member, Transaction, Loan, Meeting, OfficerRole, OfficerCredentials } from '../types/shg';
import { computeBlockHash, calculateSHA256 } from './hashChain';

const STORAGE_KEYS = {
  MEMBERS: 'shg_connect_members_v1',
  TRANSACTIONS: 'shg_connect_transactions_v1',
  LOANS: 'shg_connect_loans_v1',
  MEETINGS: 'shg_connect_meetings_v1',
  GROUP_INFO: 'shg_connect_group_info_v1',
  OFFICERS: 'shg_connect_officers_v1'
};

export interface GroupInfo {
  name: string;
  nameRegional: string;
  shgCode: string;
  village: string;
  district: string;
  monthlyPoolRate: number; // e.g. 500
  totalGroupFund: number;
}

export const INITIAL_GROUP: GroupInfo = {
  name: "Mahila Pragati Bachat Gat",
  nameRegional: "महिला प्रगति बचत गट",
  shgCode: "SHG-MH-2024-884",
  village: "Shirwal",
  district: "Satara",
  monthlyPoolRate: 500,
  totalGroupFund: 84500
};

// Default 3 Officers Credentials with default PINs ("1111", "2222", "3333")
export const DEFAULT_OFFICERS: OfficerCredentials[] = [
  {
    role: 'PRESIDENT',
    name: 'Sunita-bai Deshmukh',
    nameRegional: 'सुनिताबाई देशमुख (अध्यक्ष)',
    pinHash: '0e7517141fb53f21ee439b355b5a1d0a520954f91e4b096d24669aa5ab7a856f',
    defaultPin: '1111'
  },
  {
    role: 'SECRETARY',
    name: 'Anita-tai Shinde',
    nameRegional: 'अनिताताई शिंदे (सचिव)',
    pinHash: 'edee29f882543b956620b26d0fc0e7314715d92c9704e6fe84a6c42a2223788a',
    defaultPin: '2222'
  },
  {
    role: 'TREASURER',
    name: 'Kamal-tai Patil',
    nameRegional: 'कमलताई पाटील (खजिनदार)',
    pinHash: '1134a654e58b8ef4d6d6c6a7e04f0390a19e5d99b1a0e3678512530a6f80a311',
    defaultPin: '3333'
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: "mem-1",
    name: "Kamal-tai Patil",
    nameRegional: "कमलताई पाटील",
    phone: "9823011223",
    role: "TREASURER",
    totalSavings: 18500,
    activeLoanBalance: 0,
    trustScore: 98,
    upiVpa: "kamalpatil@upi",
    avatarColor: "bg-amber-500"
  },
  {
    id: "mem-2",
    name: "Sunita-bai Deshmukh",
    nameRegional: "सुनिताबाई देशमुख",
    phone: "9422033445",
    role: "ANIMATOR",
    totalSavings: 21000,
    activeLoanBalance: 12000,
    trustScore: 95,
    upiVpa: "sunitabai@okicici",
    avatarColor: "bg-emerald-600"
  },
  {
    id: "mem-3",
    name: "Anita-tai Shinde",
    nameRegional: "अनिताताई शिंदे",
    phone: "9765088990",
    role: "MEMBER",
    totalSavings: 14500,
    activeLoanBalance: 5000,
    trustScore: 92,
    upiVpa: "anitashinde@ybl",
    avatarColor: "bg-blue-600"
  },
  {
    id: "mem-4",
    name: "Meena-bai Jadhav",
    nameRegional: "मीनाबाई जाधव",
    phone: "9890122334",
    role: "MEMBER",
    totalSavings: 16000,
    activeLoanBalance: 0,
    trustScore: 90,
    upiVpa: "meenajadhav@paytm",
    avatarColor: "bg-purple-600"
  },
  {
    id: "mem-5",
    name: "Rukmini-tai Kulkarni",
    nameRegional: "रुक्मिणीताई कुलकर्णी",
    phone: "9158044556",
    role: "MEMBER",
    totalSavings: 14500,
    activeLoanBalance: 0,
    trustScore: 88,
    upiVpa: "rukminitai@upi",
    avatarColor: "bg-rose-600"
  }
];

export const INITIAL_LOANS: Loan[] = [
  {
    id: "loan-101",
    memberId: "mem-2",
    memberName: "Sunita-bai Deshmukh",
    principal: 20000,
    interestRateMonthly: 1.5,
    tenureMonths: 10,
    totalPaid: 8000,
    remainingBalance: 12000,
    status: 'ACTIVE',
    dateDisbursed: "2024-05-15"
  },
  {
    id: "loan-102",
    memberId: "mem-3",
    memberName: "Anita-tai Shinde",
    principal: 10000,
    interestRateMonthly: 1.5,
    tenureMonths: 6,
    totalPaid: 5000,
    remainingBalance: 5000,
    status: 'ACTIVE',
    dateDisbursed: "2024-06-10"
  }
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: "meet-1",
    date: "2024-07-05",
    meetingNumber: 12,
    totalSavingsCollected: 2500,
    totalEmiCollected: 3000,
    totalDisbursed: 0,
    attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true }
  },
  {
    id: "meet-2",
    date: "2024-08-05",
    meetingNumber: 13,
    totalSavingsCollected: 2500,
    totalEmiCollected: 3000,
    totalDisbursed: 10000,
    attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": false, "mem-5": true }
  }
];

/**
 * Validates officer PIN against stored SHA-256 hash or default PIN string
 */
export async function verifyOfficerPin(role: OfficerRole, enteredPin: string): Promise<boolean> {
  const officersStr = localStorage.getItem(STORAGE_KEYS.OFFICERS);
  const officers: OfficerCredentials[] = officersStr ? JSON.parse(officersStr) : DEFAULT_OFFICERS;
  const officer = officers.find(o => o.role === role) || DEFAULT_OFFICERS.find(o => o.role === role);
  if (!officer) return false;

  const cleanPin = enteredPin.trim();
  if (cleanPin === officer.defaultPin) return true;

  const hash = await calculateSHA256(cleanPin);
  return hash === officer.pinHash || cleanPin === officer.defaultPin;
}

/**
 * Initializes and retrieves local state
 */
export async function seedInitialDataIfNeeded(): Promise<{
  group: GroupInfo;
  members: Member[];
  transactions: Transaction[];
  loans: Loan[];
  meetings: Meeting[];
  officers: OfficerCredentials[];
}> {
  let groupStr = localStorage.getItem(STORAGE_KEYS.GROUP_INFO);
  let membersStr = localStorage.getItem(STORAGE_KEYS.MEMBERS);
  let txStr = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  let loansStr = localStorage.getItem(STORAGE_KEYS.LOANS);
  let meetingsStr = localStorage.getItem(STORAGE_KEYS.MEETINGS);
  let officersStr = localStorage.getItem(STORAGE_KEYS.OFFICERS);

  if (!groupStr || !membersStr || !txStr) {
    const genesisTime = "2024-06-01T10:00:00.000Z";
    const genesisPrevHash = "GENESIS_BLOCK_00000000000000000000000000000000";
    
    const initialTxs: Transaction[] = [];

    // Block 0: Genesis
    const b0Payload = "mem-1:Kamal-tai Patil:SAVINGS:500:Genesis Monthly Pool Deposit:SIGNERS=[PRESIDENT,TREASURER]:SALT=proof_genesis";
    const b0Hash = await computeBlockHash(0, genesisPrevHash, genesisTime, b0Payload);
    initialTxs.push({
      id: "tx-0",
      index: 0,
      timestamp: genesisTime,
      memberId: "mem-1",
      memberName: "Kamal-tai Patil",
      type: 'SAVINGS',
      amount: 500,
      notes: "Genesis Monthly Pool Deposit",
      prevHash: genesisPrevHash,
      hash: b0Hash,
      signatories: [
        { role: 'PRESIDENT', signedAt: genesisTime, officerName: 'Sunita-bai Deshmukh' },
        { role: 'TREASURER', signedAt: genesisTime, officerName: 'Kamal-tai Patil' }
      ],
      signatureProof: 'proof_genesis'
    });

    // Block 1: Sunita-bai Savings
    const b1Time = "2024-06-01T10:05:00.000Z";
    const b1Payload = "mem-2:Sunita-bai Deshmukh:SAVINGS:500:Monthly Savings Deposit:SIGNERS=[PRESIDENT,SECRETARY]:SALT=proof_b1";
    const b1Hash = await computeBlockHash(1, b0Hash, b1Time, b1Payload);
    initialTxs.push({
      id: "tx-1",
      index: 1,
      timestamp: b1Time,
      memberId: "mem-2",
      memberName: "Sunita-bai Deshmukh",
      type: 'SAVINGS',
      amount: 500,
      notes: "Monthly Savings Deposit",
      prevHash: b0Hash,
      hash: b1Hash,
      signatories: [
        { role: 'PRESIDENT', signedAt: b1Time, officerName: 'Sunita-bai Deshmukh' },
        { role: 'SECRETARY', signedAt: b1Time, officerName: 'Anita-tai Shinde' }
      ],
      signatureProof: 'proof_b1'
    });

    // Save defaults
    localStorage.setItem(STORAGE_KEYS.GROUP_INFO, JSON.stringify(INITIAL_GROUP));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTxs));
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(INITIAL_LOANS));
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(INITIAL_MEETINGS));
    localStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(DEFAULT_OFFICERS));

    return {
      group: INITIAL_GROUP,
      members: INITIAL_MEMBERS,
      transactions: initialTxs,
      loans: INITIAL_LOANS,
      meetings: INITIAL_MEETINGS,
      officers: DEFAULT_OFFICERS
    };
  }

  return {
    group: JSON.parse(groupStr),
    members: JSON.parse(membersStr),
    transactions: JSON.parse(txStr),
    loans: loansStr ? JSON.parse(loansStr) : INITIAL_LOANS,
    meetings: meetingsStr ? JSON.parse(meetingsStr) : INITIAL_MEETINGS,
    officers: officersStr ? JSON.parse(officersStr) : DEFAULT_OFFICERS
  };
}

export function saveMembers(members: Member[]): void {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
}

export function saveTransactions(txs: Transaction[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
}

export function saveLoans(loans: Loan[]): void {
  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
}

export function saveMeetings(meetings: Meeting[]): void {
  localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
}

export function resetToDemoData(): void {
  localStorage.removeItem(STORAGE_KEYS.GROUP_INFO);
  localStorage.removeItem(STORAGE_KEYS.MEMBERS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.LOANS);
  localStorage.removeItem(STORAGE_KEYS.MEETINGS);
  localStorage.removeItem(STORAGE_KEYS.OFFICERS);
}

export function exportLedgerData(): string {
  const exportPayload = {
    app: "SHGConnect",
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    group: localStorage.getItem(STORAGE_KEYS.GROUP_INFO) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUP_INFO)!) : INITIAL_GROUP,
    members: localStorage.getItem(STORAGE_KEYS.MEMBERS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS)!) : INITIAL_MEMBERS,
    transactions: localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)!) : [],
    loans: localStorage.getItem(STORAGE_KEYS.LOANS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.LOANS)!) : INITIAL_LOANS,
    meetings: localStorage.getItem(STORAGE_KEYS.MEETINGS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.MEETINGS)!) : INITIAL_MEETINGS,
    officers: localStorage.getItem(STORAGE_KEYS.OFFICERS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFICERS)!) : DEFAULT_OFFICERS
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function importLedgerData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);

    if (!data || (!data.members && !data.shg_members) || (!data.transactions && !data.shg_transactions)) {
      console.error("Invalid SHGConnect backup JSON structure");
      return false;
    }

    const groupData = data.group || INITIAL_GROUP;
    const membersData = data.members || data.shg_members || [];
    const transactionsData = data.transactions || data.shg_transactions || [];
    const loansData = data.loans || data.shg_loans || [];
    const meetingsData = data.meetings || data.shg_meetings || [];
    const officersData = data.officers || DEFAULT_OFFICERS;

    localStorage.setItem(STORAGE_KEYS.GROUP_INFO, JSON.stringify(groupData));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(membersData));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactionsData));
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loansData));
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetingsData));
    localStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(officersData));

    return true;
  } catch (err) {
    console.error("Failed to parse backup JSON file:", err);
    return false;
  }
}

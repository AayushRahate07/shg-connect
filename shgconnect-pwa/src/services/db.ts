import {
  Member,
  Transaction,
  Loan,
  Meeting,
  OfficerRole,
  OfficerCredentials,
  Resolution,
  OperationLog,
  LedgerBlock,
  AuditEnvelope,
  Officer,
  SyncMetadata,
  SHGGroupInfo,
  FederationScope,
  DeferredRemoteOperation,
  Role,
  GroupInfo
} from '../types/shg';
import { computeBlockHash, calculateSHA256, generateCheckpointFingerprint } from './hashChain';
import { DEMO_ASSIGNED_GROUPS, DEMO_MEMBERS, DEMO_LOANS, DEMO_MEETINGS } from './demoData';
import {
  SEED_GROUPS,
  ALL_SEED_USERS,
  SEED_MEMBERS_BY_SHG,
  SEED_LOANS_BY_SHG,
  SEED_MEETINGS_BY_SHG,
  ALL_SEED_TRANSACTIONS
} from '../data/seedData';

const DB_NAME = 'SHGConnectDB';
const DB_VERSION = 4;

const LEGACY_STORAGE_KEYS = {
  MEMBERS: 'shg_connect_members_v1',
  TRANSACTIONS: 'shg_connect_transactions_v1',
  LOANS: 'shg_connect_loans_v1',
  MEETINGS: 'shg_connect_meetings_v1',
  GROUP_INFO: 'shg_connect_group_info_v1',
  OFFICERS: 'shg_connect_officers_v1'
};

export class ConcurrencyConflictError extends Error {
  readonly code = 'CONCURRENCY_CONFLICT';
  constructor(entityName: string, expected: number, actual: number) {
    super(`Concurrency conflict on ${entityName}: expected version ${expected}, found ${actual}`);
    this.name = 'ConcurrencyConflictError';
  }
}

let currentActiveShgId = "SHG-MH-NGP-2024-0010";

export function getCurrentShgId(): string {
  return currentActiveShgId;
}

export function setCurrentShgId(shgId: string): void {
  currentActiveShgId = shgId;
}

export const INITIAL_GROUP_INFO: SHGGroupInfo = {
  id: "SHG-MH-SAT-2024-0089",
  name: "Savitri Mahila Bachat Gat",
  formationDate: "2024-01-15",
  federation: {
    state: "Maharashtra",
    district: "Satara",
    block: "Khandala",
    gramPanchayat: "Shirwal Prabhag",
    villageOrganization: "Shirwal Gram Sangha",
    clfName: "Khandala Mahila Cluster Federation"
  },
  bankDetails: {
    accountNumberMasked: "XXXX-XXXX-4589",
    ifscCode: "MAHB0000124",
    branchName: "Bank of Maharashtra, Shirwal"
  },
  entityVersion: 1,
  updatedAt: "2026-09-17T00:00:00.000Z"
};

export type { GroupInfo };

export const INITIAL_GROUP: GroupInfo = SEED_GROUPS[0] || {
  name: "Krantijyoti Savitribai Phule Mahila Bachat Gat",
  nameRegional: "क्रांतीज्योती सावित्रीबाई फुले महिला बचत गट",
  shgCode: "SHG-MH-NGP-2024-0010",
  village: "Bori, Hingna",
  district: "Nagpur",
  monthlyPoolRate: 300,
  totalGroupFund: 68400,
  federation: INITIAL_GROUP_INFO.federation
};

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

export const INITIAL_MEMBERS: Member[] = DEMO_MEMBERS;
export const INITIAL_LOANS: Loan[] = DEMO_LOANS;
export const INITIAL_MEETINGS: Meeting[] = DEMO_MEETINGS;

let dbInstancePromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstancePromise) return dbInstancePromise;

  dbInstancePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = request.result;
      const tx = (request.transaction || (event.currentTarget as any)?.transaction) as IDBTransaction | null;

      let membersStore: IDBObjectStore;
      if (!db.objectStoreNames.contains('members')) {
        membersStore = db.createObjectStore('members', { keyPath: 'id' });
      } else {
        membersStore = tx!.objectStore('members');
      }
      if (!membersStore.indexNames.contains('by_shg_and_id')) {
        membersStore.createIndex('by_shg_and_id', ['shgId', 'id'], { unique: false });
      }

      if (!db.objectStoreNames.contains('ledger_blocks')) {
        const store = db.createObjectStore('ledger_blocks', { keyPath: 'id' });
        store.createIndex('localIndex', 'localIndex', { unique: false });
      }

      let txStore: IDBObjectStore;
      if (!db.objectStoreNames.contains('transactions')) {
        txStore = db.createObjectStore('transactions', { keyPath: 'id' });
      } else {
        txStore = tx!.objectStore('transactions');
      }
      if (!txStore.indexNames.contains('by_shg_and_id')) {
        txStore.createIndex('by_shg_and_id', ['shgId', 'id'], { unique: false });
      }

      let meetingsStore: IDBObjectStore;
      if (!db.objectStoreNames.contains('meetings')) {
        meetingsStore = db.createObjectStore('meetings', { keyPath: 'id' });
      } else {
        meetingsStore = tx!.objectStore('meetings');
      }
      if (!meetingsStore.indexNames.contains('by_shg_and_id')) {
        meetingsStore.createIndex('by_shg_and_id', ['shgId', 'id'], { unique: false });
      }

      if (!db.objectStoreNames.contains('resolutions')) {
        db.createObjectStore('resolutions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('outbox_queue')) {
        db.createObjectStore('outbox_queue', { keyPath: 'opId' });
      }
      if (!db.objectStoreNames.contains('audit_trail')) {
        db.createObjectStore('audit_trail', { keyPath: 'auditId' });
      }
      if (!db.objectStoreNames.contains('officers')) {
        db.createObjectStore('officers', { keyPath: 'id' });
      }

      let loansStore: IDBObjectStore;
      if (!db.objectStoreNames.contains('loans')) {
        loansStore = db.createObjectStore('loans', { keyPath: 'id' });
      } else {
        loansStore = tx!.objectStore('loans');
      }
      if (!loansStore.indexNames.contains('by_shg_and_id')) {
        loansStore.createIndex('by_shg_and_id', ['shgId', 'id'], { unique: false });
      }

      if (!db.objectStoreNames.contains('sync_metadata')) {
        db.createObjectStore('sync_metadata', { keyPath: 'shgId' });
      }
      if (!db.objectStoreNames.contains('group_info')) {
        db.createObjectStore('group_info', { keyPath: 'shgCode' });
      }
      if (!db.objectStoreNames.contains('deferred_remote_ops')) {
        const deferredStore = db.createObjectStore('deferred_remote_ops', { keyPath: 'id' });
        deferredStore.createIndex('shgId', 'shgId', { unique: false });
        deferredStore.createIndex('status', 'status', { unique: false });
        deferredStore.createIndex('opId', 'opId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbInstancePromise = null;
      reject(request.error);
    };
  });

  return dbInstancePromise;
}

/**
 * Generic IDB Helper: getAll from store
 */
async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic IDB Helper: putAll into store
 */
async function putAllIntoStore<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Rollback-Safe LocalStorage Migration & Initial Data Seeding
 */
export async function seedInitialDataIfNeeded(): Promise<{
  group: GroupInfo;
  members: Member[];
  transactions: Transaction[];
  loans: Loan[];
  meetings: Meeting[];
  officers: OfficerCredentials[];
}> {
  const db = await openDatabase();
  const migrationStatus = localStorage.getItem('shg_migration_status');

  let members = await getAllFromStore<Member>('members');
  let transactions = await getAllFromStore<Transaction>('transactions');
  let loans = await getAllFromStore<Loan>('loans');
  let meetings = await getAllFromStore<Meeting>('meetings');
  let groupList = await getAllFromStore<GroupInfo>('group_info');

  if (members.length === 0 || migrationStatus !== 'COMPLETED') {
    try {
      // Check legacy localStorage
      const legacyGroupStr = localStorage.getItem(LEGACY_STORAGE_KEYS.GROUP_INFO);
      const legacyMembersStr = localStorage.getItem(LEGACY_STORAGE_KEYS.MEMBERS);
      const legacyTxStr = localStorage.getItem(LEGACY_STORAGE_KEYS.TRANSACTIONS);
      const legacyLoansStr = localStorage.getItem(LEGACY_STORAGE_KEYS.LOANS);
      const legacyMeetingsStr = localStorage.getItem(LEGACY_STORAGE_KEYS.MEETINGS);

      const groupData: GroupInfo = legacyGroupStr ? JSON.parse(legacyGroupStr) : INITIAL_GROUP;
      const membersData: Member[] = legacyMembersStr ? JSON.parse(legacyMembersStr) : INITIAL_MEMBERS;
      const loansData: Loan[] = legacyLoansStr ? JSON.parse(legacyLoansStr) : INITIAL_LOANS;
      const meetingsData: Meeting[] = legacyMeetingsStr ? JSON.parse(legacyMeetingsStr) : INITIAL_MEETINGS;

      let txData: Transaction[] = [];
      if (legacyTxStr) {
        txData = JSON.parse(legacyTxStr);
      } else {
        const genesisTime = "2026-09-18T10:00:00.000Z";
        const genesisPrevHash = "GENESIS_BLOCK_00000000000000000000000000000000";
        
        const b0Payload = "mem-1:Kamal-tai Patil:SAVINGS:500:Monthly Savings Deposit:SIGNERS=[PRESIDENT,TREASURER]:SALT=proof_genesis";
        const b0Hash = await computeBlockHash(0, genesisPrevHash, genesisTime, b0Payload);
        const b0Fingerprint = generateCheckpointFingerprint(b0Hash);

        const b1Time = "2026-08-18T10:00:00.000Z";
        const b1Payload = "mem-1:Kamal-tai Patil:SAVINGS:500:Monthly Savings Deposit:SIGNERS=[PRESIDENT,SECRETARY]:SALT=proof_b1";
        const b1Hash = await computeBlockHash(1, b0Hash, b1Time, b1Payload);
        const b1Fingerprint = generateCheckpointFingerprint(b1Hash);

        const b2Time = "2026-07-18T10:00:00.000Z";
        const b2Payload = "mem-1:Kamal-tai Patil:SAVINGS:500:Monthly Savings Deposit:SIGNERS=[PRESIDENT,TREASURER]:SALT=proof_b2";
        const b2Hash = await computeBlockHash(2, b1Hash, b2Time, b2Payload);
        const b2Fingerprint = generateCheckpointFingerprint(b2Hash);

        const b3Time = "2024-01-15T10:00:00.000Z";
        const b3Payload = "mem-1:Kamal-tai Patil:SAVINGS:17000:Initial Balance:SIGNERS=[PRESIDENT,TREASURER]:SALT=proof_b3";
        const b3Hash = await computeBlockHash(3, b2Hash, b3Time, b3Payload);
        const b3Fingerprint = generateCheckpointFingerprint(b3Hash);

        txData = [
          {
            id: "tx-0",
            index: 0,
            timestamp: genesisTime,
            memberId: "mem-1",
            memberName: "Kamal-tai Patil",
            type: 'SAVINGS',
            amount: 500,
            notes: "मासिक बचत जमा",
            prevHash: genesisPrevHash,
            hash: b0Hash,
            signatories: [
              { role: 'PRESIDENT', signedAt: genesisTime, officerName: 'Sunita-bai Deshmukh' },
              { role: 'TREASURER', signedAt: genesisTime, officerName: 'Kamal-tai Patil' }
            ],
            signatureProof: 'proof_genesis',
            checkpointFingerprint: b0Fingerprint
          },
          {
            id: "tx-1",
            index: 1,
            timestamp: b1Time,
            memberId: "mem-1",
            memberName: "Kamal-tai Patil",
            type: 'SAVINGS',
            amount: 500,
            notes: "मासिक बचत जमा",
            prevHash: b0Hash,
            hash: b1Hash,
            signatories: [
              { role: 'PRESIDENT', signedAt: b1Time, officerName: 'Sunita-bai Deshmukh' },
              { role: 'SECRETARY', signedAt: b1Time, officerName: 'Anita-tai Shinde' }
            ],
            signatureProof: 'proof_b1',
            checkpointFingerprint: b1Fingerprint
          },
          {
            id: "tx-2",
            index: 2,
            timestamp: b2Time,
            memberId: "mem-1",
            memberName: "Kamal-tai Patil",
            type: 'SAVINGS',
            amount: 500,
            notes: "मासिक बचत जमा",
            prevHash: b1Hash,
            hash: b2Hash,
            signatories: [
              { role: 'PRESIDENT', signedAt: b2Time, officerName: 'Sunita-bai Deshmukh' },
              { role: 'TREASURER', signedAt: b2Time, officerName: 'Kamal-tai Patil' }
            ],
            signatureProof: 'proof_b2',
            checkpointFingerprint: b2Fingerprint
          },
          {
            id: "tx-3",
            index: 3,
            timestamp: b3Time,
            memberId: "mem-1",
            memberName: "Kamal-tai Patil",
            type: 'SAVINGS',
            amount: 17000,
            notes: "आरंभिक बचत जमा (Initial Balance)",
            prevHash: b2Hash,
            hash: b3Hash,
            signatories: [
              { role: 'PRESIDENT', signedAt: b3Time, officerName: 'Sunita-bai Deshmukh' },
              { role: 'TREASURER', signedAt: b3Time, officerName: 'Kamal-tai Patil' }
            ],
            signatureProof: 'proof_b3',
            checkpointFingerprint: b3Fingerprint
          }
        ];
      }

      // Perform IDB Migration inside a single atomic transaction
      const tx = db.transaction(
        ['members', 'transactions', 'loans', 'meetings', 'group_info', 'sync_metadata', 'officers'],
        'readwrite'
      );

      membersData.forEach(m => tx.objectStore('members').put(m));
      txData.forEach(t => tx.objectStore('transactions').put(t));
      loansData.forEach(l => tx.objectStore('loans').put(l));
      meetingsData.forEach(m => tx.objectStore('meetings').put(m));
      tx.objectStore('group_info').put(groupData);
      DEMO_ASSIGNED_GROUPS.forEach(g => tx.objectStore('group_info').put(g));

      // Officers data
      const officerRecords: Officer[] = DEFAULT_OFFICERS.map(o => ({
        id: `off-${o.role.toLowerCase()}`,
        shgId: groupData.shgCode,
        role: o.role,
        displayName: o.name,
        pinHash: o.pinHash,
        status: 'ACTIVE'
      }));
      officerRecords.forEach(o => tx.objectStore('officers').put(o));

      // Sync metadata
      const syncMeta: SyncMetadata = {
        shgId: groupData.shgCode,
        deviceId: `dev-${Math.random().toString(36).substring(2, 9)}`,
        lastSyncAt: null,
        lastServerSeq: 1,
        lastAcknowledgedOpId: null,
        schemaVersion: 3
      };
      tx.objectStore('sync_metadata').put(syncMeta);

      await new Promise<void>((res, rej) => {
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });

      localStorage.setItem('shg_migration_status', 'COMPLETED');

      members = membersData;
      transactions = txData;
      loans = loansData;
      meetings = meetingsData;
      groupList = [groupData];
    } catch (err) {
      console.error("IDB migration failed:", err);
      localStorage.setItem('shg_migration_status', 'FAILED');
    }
  }

  // Verify that all 6 groups, members, transactions, Officer Tier 3, and Auditor Tier 4 are seeded in IndexedDB
  const seedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('shg_seed_v7_dynamic_member_data') : null;
  if (seedKey !== 'COMPLETED' || groupList.length < 6 || members.length < 80 || transactions.length < 50) {
    try {
      const tx = db.transaction(['group_info', 'members', 'loans', 'meetings', 'transactions'], 'readwrite');
      SEED_GROUPS.forEach(g => tx.objectStore('group_info').put(g));
      ALL_SEED_USERS.forEach(m => tx.objectStore('members').put(m));
      Object.values(SEED_LOANS_BY_SHG).flat().forEach(l => tx.objectStore('loans').put(l));
      Object.values(SEED_MEETINGS_BY_SHG).flat().forEach(m => tx.objectStore('meetings').put(m));
      ALL_SEED_TRANSACTIONS.forEach(t => tx.objectStore('transactions').put(t));
      await new Promise<void>((res, rej) => {
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('shg_seed_v7_dynamic_member_data', 'COMPLETED');
      }
      groupList = await getAllFromStore<GroupInfo>('group_info');
      members = await getAllFromStore<Member>('members');
      loans = await getAllFromStore<Loan>('loans');
      meetings = await getAllFromStore<Meeting>('meetings');
      transactions = await getAllFromStore<Transaction>('transactions');
    } catch (e) {
      console.error('Failed to seed 6 SHG groups & 88 users into IndexedDB:', e);
    }
  }

  const targetShgId = getCurrentShgId();
  const activeGroup = groupList.find(g => g.shgCode === targetShgId) || groupList[0] || INITIAL_GROUP;
  const activeMembers = members.filter(m => (m.shgId || 'SHG-MH-NGP-2024-0010') === activeGroup.shgCode);
  const activeLoans = loans.filter(l => (l.shgId || 'SHG-MH-NGP-2024-0010') === activeGroup.shgCode);
  const activeMeetings = meetings.filter(m => (m.shgId || 'SHG-MH-NGP-2024-0010') === activeGroup.shgCode || !m.shgId);

  return {
    group: activeGroup,
    members: activeMembers.length > 0 ? activeMembers : members.slice(0, 10),
    transactions,
    loans: activeLoans,
    meetings: activeMeetings,
    officers: DEFAULT_OFFICERS
  };
}

/**
 * Transactional Mutation Queue Logger:
 * Appends OperationLog to outbox_queue and AuditEnvelope to audit_trail
 */
export async function queueMutation(opInput: Omit<OperationLog, 'prevOpHash' | 'syncStatus'>): Promise<void> {
  const db = await openDatabase();
  const queue = await getAllFromStore<OperationLog>('outbox_queue');
  const lastOp = queue.length > 0 ? queue[queue.length - 1] : null;

  const prevOpHash = lastOp 
    ? await calculateSHA256(`${lastOp.prevOpHash}:${lastOp.opId}:${lastOp.hlcTimestamp}`)
    : "GENESIS_OP_HASH_00000000000000000000000000000000";

  const fullOp: OperationLog = {
    ...opInput,
    prevOpHash,
    syncStatus: 'PENDING'
  };

  const auditContent = `${opInput.opId}:${opInput.type}:${opInput.entityId}:${JSON.stringify(opInput.payload)}`;
  const auditHash = await calculateSHA256(auditContent);

  const auditRecord: AuditEnvelope = {
    auditId: `aud-${opInput.opId}`,
    shgId: opInput.shgId,
    actorId: opInput.actorId,
    actorRole: opInput.actorRole,
    action: opInput.type,
    entityType: 'TRANSACTION',
    entityId: opInput.entityId,
    oldValue: null,
    newValue: opInput.payload,
    timestamp: opInput.hlcTimestamp,
    deviceId: opInput.deviceId,
    auditHash
  };

  const tx = db.transaction(['outbox_queue', 'audit_trail'], 'readwrite');
  tx.objectStore('outbox_queue').put(fullOp);
  tx.objectStore('audit_trail').put(auditRecord);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Validates officer PIN against stored credentials
 */
export async function verifyOfficerPin(role: OfficerRole, enteredPin: string): Promise<boolean> {
  const officerList = await getAllFromStore<Officer>('officers');
  const matchedOfficer = officerList.find(o => o.role === role);
  
  const cleanPin = enteredPin.trim();
  const defaultOfficer = DEFAULT_OFFICERS.find(o => o.role === role);
  if (defaultOfficer && cleanPin === defaultOfficer.defaultPin) {
    return true;
  }

  const hash = await calculateSHA256(cleanPin);
  if (matchedOfficer && matchedOfficer.pinHash === hash) {
    return true;
  }

  return defaultOfficer ? (hash === defaultOfficer.pinHash || cleanPin === defaultOfficer.defaultPin) : false;
}

// Asynchronous Getters & Setters
export async function getMembers(): Promise<Member[]> {
  return await getAllFromStore<Member>('members');
}

export async function saveMembers(members: Member[]): Promise<void> {
  await putAllIntoStore('members', members);
}

export async function getTransactions(): Promise<Transaction[]> {
  return await getAllFromStore<Transaction>('transactions');
}

export async function saveTransactions(txs: Transaction[]): Promise<void> {
  await putAllIntoStore('transactions', txs);
}

export async function getLoans(): Promise<Loan[]> {
  return await getAllFromStore<Loan>('loans');
}

export async function saveLoans(loans: Loan[]): Promise<void> {
  await putAllIntoStore('loans', loans);
}

export async function getMeetings(): Promise<Meeting[]> {
  return await getAllFromStore<Meeting>('meetings');
}

export async function saveMeetings(meetings: Meeting[]): Promise<void> {
  await putAllIntoStore('meetings', meetings);
}

export async function getResolutions(): Promise<Resolution[]> {
  return await getAllFromStore<Resolution>('resolutions');
}

export async function saveResolutions(resolutions: Resolution[]): Promise<void> {
  await putAllIntoStore('resolutions', resolutions);
}

export async function getLedgerBlocks(): Promise<LedgerBlock[]> {
  return await getAllFromStore<LedgerBlock>('ledger_blocks');
}

export async function saveLedgerBlocks(blocks: LedgerBlock[]): Promise<void> {
  await putAllIntoStore('ledger_blocks', blocks);
}

export async function getOutboxQueue(): Promise<OperationLog[]> {
  return await getAllFromStore<OperationLog>('outbox_queue');
}

export async function getAuditTrail(): Promise<AuditEnvelope[]> {
  return await getAllFromStore<AuditEnvelope>('audit_trail');
}

/**
 * Atomic Optimistic Concurrency Control (OCC) Check-and-Write Helper
 */
export async function updateEntityWithOCC<T extends { id: string; entityVersion: number }>(
  storeName: 'members' | 'loans' | 'group_info',
  id: string,
  expectedVersion: number,
  mutator: (current: T) => Omit<T, 'entityVersion'>
): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.get(id);

    req.onsuccess = () => {
      const record = req.result as T;
      if (!record) {
        tx.abort();
        return reject(new Error(`Record with id ${id} not found in store ${storeName}`));
      }
      const currentVersion = record.entityVersion || 1;
      if (currentVersion !== expectedVersion) {
        tx.abort();
        return reject(new ConcurrencyConflictError(storeName, expectedVersion, currentVersion));
      }
      const mutated = mutator(record);
      const updatedRecord: T = {
        ...(mutated as any),
        id,
        entityVersion: expectedVersion + 1
      };
      store.put(updatedRecord);
    };

    tx.oncomplete = () => {
      const fetchReq = db.transaction(storeName, 'readonly').objectStore(storeName).get(id);
      fetchReq.onsuccess = () => resolve(fetchReq.result as T);
      fetchReq.onerror = () => reject(fetchReq.error);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveAuditEnvelope(audit: AuditEnvelope): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audit_trail', 'readwrite');
    const store = tx.objectStore('audit_trail');
    store.put(audit);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function resetToDemoData(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(
    ['members', 'transactions', 'loans', 'meetings', 'resolutions', 'outbox_queue', 'audit_trail', 'ledger_blocks'],
    'readwrite'
  );

  tx.objectStore('members').clear();
  tx.objectStore('transactions').clear();
  tx.objectStore('loans').clear();
  tx.objectStore('meetings').clear();
  tx.objectStore('resolutions').clear();
  tx.objectStore('outbox_queue').clear();
  tx.objectStore('audit_trail').clear();
  tx.objectStore('ledger_blocks').clear();

  localStorage.removeItem('shg_migration_status');
  localStorage.removeItem('shg_seed_v4_88users');
  localStorage.removeItem('shg_7groups_seeded_v2');

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  await seedInitialDataIfNeeded();
}

export async function exportLedgerData(): Promise<string> {
  const members = await getMembers();
  const transactions = await getTransactions();
  const loans = await getLoans();
  const meetings = await getMeetings();
  const resolutions = await getResolutions();
  const auditTrail = await getAuditTrail();
  const groupList = await getAllFromStore<GroupInfo>('group_info');

  const exportPayload = {
    app: "SHGConnect",
    version: "2.0.0",
    exportedAt: new Date().toISOString(),
    group: groupList.length > 0 ? groupList[0] : INITIAL_GROUP,
    members,
    transactions,
    loans,
    meetings,
    resolutions,
    auditTrail
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function importLedgerData(jsonStr: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonStr);

    if (!data || (!data.members && !data.shg_members) || (!data.transactions && !data.shg_transactions)) {
      console.error("Invalid SHGConnect backup JSON structure");
      return false;
    }

    const membersData = data.members || data.shg_members || [];
    const transactionsData = data.transactions || data.shg_transactions || [];
    const loansData = data.loans || data.shg_loans || [];
    const meetingsData = data.meetings || data.shg_meetings || [];
    const resolutionsData = data.resolutions || [];

    if (membersData.length > 0) await saveMembers(membersData);
    if (transactionsData.length > 0) await saveTransactions(transactionsData);
    if (loansData.length > 0) await saveLoans(loansData);
    if (meetingsData.length > 0) await saveMeetings(meetingsData);
    if (resolutionsData.length > 0) await saveResolutions(resolutionsData);

    return true;
  } catch (err) {
    console.error("Failed to parse backup JSON file:", err);
    return false;
  }
}

export async function getDeferredRemoteOps(shgId?: string): Promise<DeferredRemoteOperation[]> {
  const targetShgId = shgId || getCurrentShgId();
  const allOps = await getAllFromStore<DeferredRemoteOperation>('deferred_remote_ops');
  return allOps.filter(op => op.shgId === targetShgId && op.status === 'DEFERRED');
}

export async function saveDeferredRemoteOp(op: DeferredRemoteOperation): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deferred_remote_ops', 'readwrite');
    const store = tx.objectStore('deferred_remote_ops');
    store.put(op);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteDeferredRemoteOp(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deferred_remote_ops', 'readwrite');
    const store = tx.objectStore('deferred_remote_ops');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSyncMetadata(shgId?: string): Promise<SyncMetadata | null> {
  const targetShgId = shgId || getCurrentShgId();
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_metadata', 'readonly');
    const store = tx.objectStore('sync_metadata');
    const req = store.get(targetShgId);
    req.onsuccess = () => resolve((req.result as SyncMetadata) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_metadata', 'readwrite');
    const store = tx.objectStore('sync_metadata');
    store.put(metadata);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateOutboxOpStatus(opId: string, syncStatus: 'PENDING' | 'SYNCED'): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox_queue', 'readwrite');
    const store = tx.objectStore('outbox_queue');
    const req = store.get(opId);
    req.onsuccess = () => {
      const op = req.result as OperationLog;
      if (op) {
        op.syncStatus = syncStatus;
        store.put(op);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Registers a new SHG Member offline, appends to IndexedDB, and queues mutation for sync (Phase 6.2)
 */
export async function addMember(
  data: {
    name: string;
    nameRegional: string;
    phone: string;
    role: Role;
    occupation?: string;
    initialSavings: number;
    shgId?: string;
  }
): Promise<Member> {
  const targetShgId = data.shgId || getCurrentShgId();
  const avatarColors = ['bg-amber-500', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600'];
  const allMembers = await getMembers();
  const shgMembers = allMembers.filter(m => (m as any).shgId === targetShgId);

  const newMember: Member = {
    id: `mem-${Date.now()}`,
    shgId: targetShgId,
    name: data.name,
    nameRegional: data.nameRegional,
    phone: data.phone,
    role: data.role,
    totalSavings: data.initialSavings || 0,
    activeLoanBalance: 0,
    trustScore: 90,
    occupation: data.occupation,
    joinedDate: new Date().toISOString().split('T')[0],
    avatarColor: avatarColors[shgMembers.length % avatarColors.length],
    entityVersion: 1
  };

  const updatedMembers = [...allMembers, newMember];
  await saveMembers(updatedMembers);

  await queueMutation({
    opId: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    shgId: targetShgId,
    actorId: 'animator-1',
    actorRole: 'ANIMATOR',
    deviceId: 'dev-pwa-local',
    hlcTimestamp: `${new Date().toISOString()}-0001`,
    type: 'RECORD_SAVINGS',
    entityId: newMember.id,
    payload: { memberName: newMember.name, role: newMember.role, initialSavings: data.initialSavings }
  });

  return newMember;
}

/**
 * Multi-SHG Local IndexedDB Cache helper (Phase 9)
 * Retrieves all stored SHG groups cached locally
 */
export async function getAllCachedGroups(): Promise<GroupInfo[]> {
  const groups = await getAllFromStore<GroupInfo>('group_info');
  if (groups.length >= 7) return groups;
  await seedInitialDataIfNeeded();
  return await getAllFromStore<GroupInfo>('group_info');
}

export async function getMembersByShg(shgId?: string): Promise<Member[]> {
  const targetShgId = shgId || getCurrentShgId();
  const allMembers = await getAllFromStore<Member>('members');
  return allMembers.filter(m => (m.shgId || 'SHG-MH-SAT-2024-0089') === targetShgId);
}

export async function getLoansByShg(shgId?: string): Promise<Loan[]> {
  const targetShgId = shgId || getCurrentShgId();
  const allLoans = await getAllFromStore<Loan>('loans');
  return allLoans.filter(l => (l.shgId || 'SHG-MH-SAT-2024-0089') === targetShgId);
}

export async function saveGroupInfo(group: GroupInfo): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('group_info', 'readwrite');
    const store = tx.objectStore('group_info');
    store.put(group);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Persists a newly created SHG and registers its founding lead member.
 */
export async function saveNewShgGroup(group: GroupInfo, leadMember: Member): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['group_info', 'members', 'officers'], 'readwrite');
    tx.objectStore('group_info').put(group);
    tx.objectStore('members').put(leadMember);
    
    // Register officer record for President
    const officerRecord: Officer = {
      id: `off-pres-${group.shgCode}`,
      shgId: group.shgCode,
      role: 'PRESIDENT',
      displayName: leadMember.name,
      pinHash: '0e7517141fb53f21ee439b355b5a1d0a520954f91e4b096d24669aa5ab7a856f',
      status: 'ACTIVE'
    };
    tx.objectStore('officers').put(officerRecord);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Tier 3 Officer Action: Reassign leadership roles (President/Lead, Treasurer, Secretary) among members of an SHG
 */
export async function updateShgLeadership(
  shgCode: string,
  assignments: {
    presidentMemberId: string;
    treasurerMemberId: string;
    secretaryMemberId?: string;
  }
): Promise<Member[]> {
  const db = await openDatabase();
  const allMembers = await getAllFromStore<Member>('members');
  const groupMembers = allMembers.filter(m => (m.shgId || 'SHG-MH-SAT-2024-0089') === shgCode);

  const updatedGroupMembers = groupMembers.map(m => {
    if (m.id === assignments.presidentMemberId) {
      return { ...m, role: 'OFFICE_BEARER' as Role };
    }
    return { ...m, role: 'MEMBER' as Role };
  });

  const updatedAllMembers = allMembers.map(m => {
    const matched = updatedGroupMembers.find(gm => gm.id === m.id);
    return matched || m;
  });

  const presMember = groupMembers.find(m => m.id === assignments.presidentMemberId);
  const treasMember = groupMembers.find(m => m.id === assignments.treasurerMemberId);
  const secMember = assignments.secretaryMemberId ? groupMembers.find(m => m.id === assignments.secretaryMemberId) : null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['members', 'officers'], 'readwrite');
    const membersStore = tx.objectStore('members');
    updatedAllMembers.forEach(m => membersStore.put(m));

    const officersStore = tx.objectStore('officers');
    if (presMember) {
      officersStore.put({
        id: `off-pres-${shgCode}`,
        shgId: shgCode,
        role: 'PRESIDENT',
        displayName: presMember.name,
        pinHash: '0e7517141fb53f21ee439b355b5a1d0a520954f91e4b096d24669aa5ab7a856f',
        status: 'ACTIVE'
      });
    }
    if (treasMember) {
      officersStore.put({
        id: `off-treas-${shgCode}`,
        shgId: shgCode,
        role: 'TREASURER',
        displayName: treasMember.name,
        pinHash: '1134a654e58b8ef4d6d6c6a7e04f0390a19e5d99b1a0e3678512530a6f80a311',
        status: 'ACTIVE'
      });
    }
    if (secMember) {
      officersStore.put({
        id: `off-sec-${shgCode}`,
        shgId: shgCode,
        role: 'SECRETARY',
        displayName: secMember.name,
        pinHash: 'edee29f882543b956620b26d0fc0e7314715d92c9704e6fe84a6c42a2223788a',
        status: 'ACTIVE'
      });
    }

    tx.oncomplete = () => resolve(updatedAllMembers);
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveScheduledMeeting(scheduled: {
  shgId: string;
  date: string;
  time: string;
  venue: string;
  agenda: string;
  scheduledBy?: string;
}): Promise<GroupInfo | null> {
  const db = await openDatabase();
  const tx = db.transaction(['group_info'], 'readwrite');
  const store = tx.objectStore('group_info');

  return new Promise((resolve, reject) => {
    const req = store.get(scheduled.shgId);
    req.onsuccess = () => {
      const group: GroupInfo = req.result;
      if (group) {
        group.nextMeeting = {
          date: scheduled.date,
          time: scheduled.time,
          venue: scheduled.venue,
          agenda: scheduled.agenda,
          scheduledBy: scheduled.scheduledBy
        };
        store.put(group);
      }
    };
    tx.oncomplete = async () => {
      try {
        localStorage.setItem(`shg_next_meeting_${scheduled.shgId}`, JSON.stringify(scheduled));
      } catch {}
      const groups = await getAllFromStore<GroupInfo>('group_info');
      const updated = groups.find(g => g.shgCode === scheduled.shgId) || null;
      resolve(updated);
    };
    tx.onerror = () => reject(tx.error);
  });
}





import type { MembershipRequest } from '../types/shg';

const MEMBERSHIP_REQUESTS_STORAGE_KEY = 'shg_membership_requests_v1';

export const INITIAL_DEMO_MEMBERSHIP_REQUESTS: MembershipRequest[] = [
  {
    id: 'req-seed-001',
    shgId: 'SHG-MH-SAT-2024-0089',
    shgName: 'सावित्री महिला बचत गट',
    district: 'Satara',
    village: 'Shirwal',
    name: 'अनिता रमेश पाटील',
    nameRegional: 'अनिता रमेश पाटील',
    phone: '9890122334',
    occupation: 'शिवणकाम व शिलाई काम',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notes: 'नवीन सभासद अर्ज - सावित्री महिला बचत गट'
  },
  {
    id: 'req-seed-002',
    shgId: 'SHG-MH-SAT-2024-0090',
    shgName: 'जिजाऊ महिला बचत गट',
    district: 'Satara',
    village: 'Lonand',
    name: 'प्रिया शरद जगताप',
    nameRegional: 'प्रिया शरद जगताप',
    phone: '9765432109',
    occupation: 'दुग्ध व्यवसाय व संकलन',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    notes: 'नवीन सभासद अर्ज - जिजाऊ महिला बचत गट'
  },
  {
    id: 'req-seed-003',
    shgId: 'SHG-MH-SAT-2024-0089',
    shgName: 'सावित्री महिला बचत गट',
    district: 'Satara',
    village: 'Shirwal',
    name: 'रुपाली विकास देशमुख',
    nameRegional: 'रुपाली विकास देशमुख',
    phone: '9822334455',
    occupation: 'कृषी प्रक्रिया व भाजीपाला विक्री',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    notes: 'नवीन सभासद अर्ज - सावित्री महिला बचत गट'
  }
];

export function getMembershipRequests(): MembershipRequest[] {
  try {
    if (typeof localStorage === 'undefined') return INITIAL_DEMO_MEMBERSHIP_REQUESTS;
    const raw = localStorage.getItem(MEMBERSHIP_REQUESTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEMBERSHIP_REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_MEMBERSHIP_REQUESTS));
      return INITIAL_DEMO_MEMBERSHIP_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(MEMBERSHIP_REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_MEMBERSHIP_REQUESTS));
      return INITIAL_DEMO_MEMBERSHIP_REQUESTS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load membership requests:', e);
    return INITIAL_DEMO_MEMBERSHIP_REQUESTS;
  }
}

export function saveMembershipRequest(req: MembershipRequest): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = getMembershipRequests();
    const updated = [req, ...current.filter(r => r.id !== req.id)];
    localStorage.setItem(MEMBERSHIP_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shg_requests_updated'));
    }
  } catch (e) {
    console.error('Failed to save membership request:', e);
  }
}

export function updateMembershipRequestStatus(id: string, status: 'APPROVED' | 'REJECTED'): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = getMembershipRequests();
    const updated = current.map(r => r.id === id ? { ...r, status } : r);
    localStorage.setItem(MEMBERSHIP_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shg_requests_updated'));
    }
  } catch (e) {
    console.error('Failed to update membership request status:', e);
  }
}

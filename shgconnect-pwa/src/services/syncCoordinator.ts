import {
  NetworkState,
  SyncState,
  DerivedSyncStatus,
  OperationLog,
  SyncMetadata,
  DeferredRemoteOperation,
  ConflictResolutionChoice,
  AuditEnvelope
} from '../types/shg';
import {
  getCurrentShgId,
  getSyncMetadata,
  saveSyncMetadata,
  getOutboxQueue,
  updateOutboxOpStatus,
  getDeferredRemoteOps,
  saveDeferredRemoteOp,
  deleteDeferredRemoteOp,
  getMembers,
  saveMembers,
  getLoans,
  saveLoans,
  saveAuditEnvelope,
  queueMutation
} from './db';
import { mockSyncServer } from './mockSyncServer';

type SyncListener = (state: {
  networkState: NetworkState;
  syncState: SyncState;
  derivedStatus: DerivedSyncStatus;
  pendingCount: number;
  deferredCount: number;
  lastSyncAt: string | null;
}) => void;

class SyncCoordinator {
  private deviceId: string;
  private networkState: NetworkState;
  private syncState: SyncState = 'IDLE';
  private lastSyncAt: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private isInitialized = false;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.networkState = typeof navigator !== 'undefined' && navigator.onLine === false ? 'OFFLINE' : 'ONLINE';

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.networkState = 'ONLINE';
        this.notifyListeners();
        this.syncNow();
      });
      window.addEventListener('offline', () => {
        this.networkState = 'OFFLINE';
        this.notifyListeners();
      });
    }
  }

  private getOrCreateDeviceId(): string {
    if (typeof localStorage === 'undefined') return 'device-node-spec';
    let id = localStorage.getItem('shg_device_id');
    if (!id) {
      id = `DEV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      localStorage.setItem('shg_device_id', id);
    }
    return id;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const shgId = getCurrentShgId();
    let meta = await getSyncMetadata(shgId);
    if (!meta) {
      meta = {
        shgId,
        deviceId: this.deviceId,
        lastServerSeq: 0,
        lastSyncAt: null,
        lastAcknowledgedOpId: null,
        schemaVersion: 3
      };
      await saveSyncMetadata(meta);
    }

    this.lastSyncAt = meta.lastSyncAt;

    // Crash Recovery check: > 60s stale lock
    await this.recoverFromStaleCrash(shgId, meta);
    this.notifyListeners();
  }

  private async recoverFromStaleCrash(shgId: string, meta: SyncMetadata): Promise<void> {
    if (meta.lastSyncAt) {
      const elapsed = Date.now() - new Date(meta.lastSyncAt).getTime();
      if (elapsed > 60000) {
        // Stale lock detected, reset to IDLE
        this.syncState = 'IDLE';
      }
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notifyCurrentState(listener);
    return () => this.listeners.delete(listener);
  }

  private async notifyCurrentState(listener?: SyncListener): Promise<void> {
    const shgId = getCurrentShgId();
    const outbox = await getOutboxQueue();
    const pending = outbox.filter(op => op.shgId === shgId && op.syncStatus === 'PENDING');
    const deferred = await getDeferredRemoteOps(shgId);

    const derivedStatus = this.computeDerivedStatus(pending.length, deferred.length);
    const payload = {
      networkState: this.networkState,
      syncState: this.syncState,
      derivedStatus,
      pendingCount: pending.length,
      deferredCount: deferred.length,
      lastSyncAt: this.lastSyncAt
    };

    if (listener) {
      listener(payload);
    } else {
      this.listeners.forEach(cb => cb(payload));
    }
  }

  private notifyListeners(): void {
    this.notifyCurrentState();
  }

  public computeDerivedStatus(pendingCount: number, deferredCount: number): DerivedSyncStatus {
    if (this.networkState === 'OFFLINE') return 'OFFLINE';
    if (deferredCount > 0 || this.syncState === 'CONFLICT') return 'CONFLICT';
    if (this.syncState === 'SYNCING') return 'SYNCING';
    if (this.syncState === 'ERROR') return 'ERROR';
    if (pendingCount > 0) return 'PENDING';
    return 'SYNCED';
  }

  public async syncNow(): Promise<void> {
    if (this.networkState === 'OFFLINE') {
      this.notifyListeners();
      return;
    }
    if (this.syncState === 'SYNCING') return;

    this.syncState = 'SYNCING';
    this.notifyListeners();

    try {
      const shgId = getCurrentShgId();
      await this.pushPendingOperations(shgId);
      await this.pullRemoteOperations(shgId);

      this.lastSyncAt = new Date().toISOString();
      const meta = (await getSyncMetadata(shgId)) || {
        shgId,
        deviceId: this.deviceId,
        lastServerSeq: 0,
        lastSyncAt: null,
        lastAcknowledgedOpId: null,
        schemaVersion: 3
      };
      meta.lastSyncAt = this.lastSyncAt;
      await saveSyncMetadata(meta);

      const deferred = await getDeferredRemoteOps(shgId);
      this.syncState = deferred.length > 0 ? 'CONFLICT' : 'IDLE';
    } catch (err) {
      console.error('Sync failed:', err);
      this.syncState = 'ERROR';
    } finally {
      this.notifyListeners();
    }
  }

  private async pushPendingOperations(shgId: string): Promise<void> {
    const allOutbox = await getOutboxQueue();
    const pendingOps = allOutbox.filter(op => op.shgId === shgId && op.syncStatus === 'PENDING');

    if (pendingOps.length === 0) return;

    const response = await mockSyncServer.pushOperations({
      shgId,
      deviceId: this.deviceId,
      operations: pendingOps
    });

    if (response.acknowledgedOpIds && response.acknowledgedOpIds.length > 0) {
      for (const opId of response.acknowledgedOpIds) {
        await updateOutboxOpStatus(opId, 'SYNCED');
      }
    }

    if (response.failedOperations && response.failedOperations.length > 0) {
      console.warn('Some operations failed push validation:', response.failedOperations);
      this.syncState = 'ERROR';
    }
  }

  private async pullRemoteOperations(shgId: string): Promise<void> {
    let meta = await getSyncMetadata(shgId);
    const lastServerSeq = meta?.lastServerSeq || 0;

    const pullRes = await mockSyncServer.pullOperations({
      shgId,
      deviceId: this.deviceId,
      lastServerSeq
    });

    if (!pullRes.operations || pullRes.operations.length === 0) {
      return;
    }

    const outbox = await getOutboxQueue();
    const localOpIds = new Set(outbox.filter(op => op.shgId === shgId).map(op => op.opId));

    let maxSeqConsumed = lastServerSeq;

    for (const serverOp of pullRes.operations) {
      maxSeqConsumed = Math.max(maxSeqConsumed, serverOp.serverSeq);

      // INVARIANT 2: If opId is already known locally, consume sequence ONLY and skip domain mutation!
      if (localOpIds.has(serverOp.opId)) {
        continue;
      }

      // Check if local entity is protected by pending mutations
      const isProtected = outbox.some(
        op => op.shgId === shgId && op.syncStatus === 'PENDING' && op.entityId === serverOp.entityId
      );

      if (isProtected) {
        // Defer remote operation
        const deferredOp: DeferredRemoteOperation = {
          id: `DEF-${Math.random().toString(36).substring(2, 9)}`,
          shgId,
          serverSeq: serverOp.serverSeq,
          opId: serverOp.opId,
          entityType: serverOp.type.includes('MEMBER') || serverOp.type.includes('SAVINGS') ? 'member' : 'loan',
          entityId: serverOp.entityId,
          remotePayload: serverOp.payload,
          localPayload: { note: 'Protected by local pending mutation' },
          remoteVersion: serverOp.entityVersion,
          localVersion: serverOp.entityVersion - 1,
          conflictDetectedAt: new Date().toISOString(),
          status: 'DEFERRED'
        };
        await saveDeferredRemoteOp(deferredOp);
        this.syncState = 'CONFLICT';
        continue;
      }

      // Safe to apply remote operation atomically
      await this.applyRemoteOperation(serverOp);
    }

    // Atomically advance lastServerSeq cursor
    meta = meta || {
      shgId,
      deviceId: this.deviceId,
      lastServerSeq: 0,
      lastSyncAt: this.lastSyncAt,
      lastAcknowledgedOpId: null,
      schemaVersion: 3
    };
    meta.lastServerSeq = maxSeqConsumed;
    await saveSyncMetadata(meta);
  }

  private async applyRemoteOperation(op: any): Promise<void> {
    if (op.type === 'RECORD_SAVINGS' || op.type === 'UPDATE_MEMBER') {
      const members = await getMembers();
      const target = members.find(m => m.id === op.entityId);
      if (target) {
        if (op.payload.amount) target.totalSavings += op.payload.amount;
        target.entityVersion = op.entityVersion;
        await saveMembers(members);
      }
    } else if (op.type === 'DISBURSE_LOAN' || op.type === 'REPAY_EMI') {
      const loans = await getLoans();
      const target = loans.find(l => l.id === op.entityId);
      if (target) {
        if (op.payload.remainingBalance !== undefined) target.remainingBalance = op.payload.remainingBalance;
        target.entityVersion = op.entityVersion;
        await saveLoans(loans);
      }
    }

    // Audit envelope for remote apply
    const audit: AuditEnvelope = {
      auditId: `AUD-REMOTE-${Math.random().toString(36).substring(2, 9)}`,
      shgId: op.shgId,
      actorId: op.actorId,
      actorRole: op.actorRole,
      action: `REMOTE_PULL_APPLY_${op.type}`,
      entityType: 'TRANSACTION',
      entityId: op.entityId,
      oldValue: null,
      newValue: op.payload,
      reason: `Applied remote server sequence #${op.serverSeq}`,
      timestamp: new Date().toISOString(),
      deviceId: op.deviceId,
      auditHash: `HASH-PULL-${op.serverSeq}`
    };
    await saveAuditEnvelope(audit);
  }

  public async resolveConflict(deferredId: string, choice: ConflictResolutionChoice): Promise<void> {
    const shgId = getCurrentShgId();
    const deferredOps = await getDeferredRemoteOps(shgId);
    const target = deferredOps.find(op => op.id === deferredId);

    if (!target) return;

    if (choice === 'ACCEPT_REMOTE') {
      await this.applyRemoteOperation({
        type: 'RECORD_SAVINGS',
        entityId: target.entityId,
        payload: target.remotePayload,
        entityVersion: target.remoteVersion,
        serverSeq: target.serverSeq,
        shgId,
        actorId: 'REMOTE_SERVER',
        actorRole: 'ANIMATOR',
        deviceId: 'REMOTE_DEVICE'
      });
    } else if (choice === 'KEEP_LOCAL') {
      // Re-queue local mutation to force server overwrite
      await queueMutation({
        opId: `OP-OVERWRITE-${Math.random().toString(36).substring(2, 9)}`,
        shgId,
        actorId: 'ANIMATOR-LOCAL',
        actorRole: 'ANIMATOR',
        deviceId: this.deviceId,
        hlcTimestamp: new Date().toISOString(),
        type: 'RECORD_SAVINGS',
        entityId: target.entityId,
        payload: { ...target.localPayload, overwriteRemote: true }
      });
    } else if (choice === 'RETRY_MERGED') {
      const mergedPayload = { ...target.remotePayload, ...target.localPayload };
      await this.applyRemoteOperation({
        type: 'RECORD_SAVINGS',
        entityId: target.entityId,
        payload: mergedPayload,
        entityVersion: target.remoteVersion + 1,
        serverSeq: target.serverSeq,
        shgId,
        actorId: 'ANIMATOR-LOCAL',
        actorRole: 'ANIMATOR',
        deviceId: 'REMOTE_DEVICE'
      });
    }

    await deleteDeferredRemoteOp(deferredId);
    const remaining = await getDeferredRemoteOps(shgId);
    if (remaining.length === 0) {
      this.syncState = 'IDLE';
    }
    this.notifyListeners();
  }
}

export const syncCoordinator = new SyncCoordinator();

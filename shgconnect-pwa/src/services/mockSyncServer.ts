import {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullRequest,
  SyncPullResponse,
  ServerOperation,
  OperationAck,
  OperationLog
} from '../types/shg';

interface ServerEntityState {
  version: number;
  data: Record<string, any>;
}

class MockSyncServer {
  private serverSeqMap: Map<string, number> = new Map(); // shgId -> serverSeq
  private operationsMap: Map<string, ServerOperation[]> = new Map(); // shgId -> ops
  private entityStore: Map<string, Map<string, ServerEntityState>> = new Map(); // shgId -> (entityKey -> state)
  private idempotencyCache: Map<string, OperationAck> = new Map(); // opId -> Ack

  constructor() {
    this.initDefaultState();
  }

  private initDefaultState() {
    const defaultShg = 'SHG-MH-SAT-2024-0089';
    this.serverSeqMap.set(defaultShg, 100);
    this.operationsMap.set(defaultShg, []);
    const shgEntities = new Map<string, ServerEntityState>();
    
    // Seed server entity versions (e.g. member 1, 2, 3 at version 1)
    shgEntities.set('member:mem-1', { version: 1, data: { id: 'mem-1', totalSavings: 18500 } });
    shgEntities.set('member:mem-2', { version: 1, data: { id: 'mem-2', totalSavings: 21000 } });
    shgEntities.set('member:mem-3', { version: 1, data: { id: 'mem-3', totalSavings: 14500 } });
    
    this.entityStore.set(defaultShg, shgEntities);
  }

  public resetState() {
    this.serverSeqMap.clear();
    this.operationsMap.clear();
    this.entityStore.clear();
    this.idempotencyCache.clear();
    this.initDefaultState();
  }

  public async pushOperations(req: SyncPushRequest): Promise<SyncPushResponse> {
    const { shgId, deviceId, operations } = req;

    if (!this.operationsMap.has(shgId)) {
      this.operationsMap.set(shgId, []);
      this.serverSeqMap.set(shgId, 0);
      this.entityStore.set(shgId, new Map());
    }

    const shgOps = this.operationsMap.get(shgId)!;
    let currentSeq = this.serverSeqMap.get(shgId) || 0;
    const shgEntities = this.entityStore.get(shgId)!;

    const acknowledgedOpIds: string[] = [];
    const acks: OperationAck[] = [];
    const failedOperations: Array<{ opId: string; reason: string }> = [];

    for (const op of operations) {
      // Check Idempotency Cache FIRST
      if (this.idempotencyCache.has(op.opId)) {
        const existingAck = this.idempotencyCache.get(op.opId)!;
        acks.push({
          opId: op.opId,
          serverSeq: existingAck.serverSeq,
          status: 'DUPLICATE',
          reason: 'Operation already processed previously'
        });
        acknowledgedOpIds.push(op.opId);
        continue;
      }

      // OCC Check for mutable entities
      const entityType = this.extractEntityType(op.type);
      const entityKey = `${entityType}:${op.entityId}`;
      const existingEntity = shgEntities.get(entityKey);

      let newVersion = 1;
      if (existingEntity) {
        const expectedVersion = op.payload?.expectedVersion ?? op.payload?.entityVersion;
        if (expectedVersion !== undefined && expectedVersion !== existingEntity.version) {
          failedOperations.push({
            opId: op.opId,
            reason: `OCC Conflict: Server version is ${existingEntity.version}, but pushed payload expected version ${expectedVersion}`
          });
          continue;
        }
        newVersion = existingEntity.version + 1;
      }

      // Advance monotonic sequence
      currentSeq += 1;
      this.serverSeqMap.set(shgId, currentSeq);

      // Mutate server entity
      shgEntities.set(entityKey, {
        version: newVersion,
        data: { ...(existingEntity?.data || {}), ...op.payload, entityVersion: newVersion }
      });

      const serverOp: ServerOperation = {
        serverSeq: currentSeq,
        opId: op.opId,
        shgId,
        actorId: op.actorId,
        actorRole: op.actorRole,
        deviceId,
        hlcTimestamp: op.hlcTimestamp,
        type: op.type,
        entityId: op.entityId,
        payload: op.payload,
        entityVersion: newVersion
      };

      shgOps.push(serverOp);

      const ack: OperationAck = {
        opId: op.opId,
        serverSeq: currentSeq,
        status: 'ACKNOWLEDGED'
      };

      this.idempotencyCache.set(op.opId, ack);
      acks.push(ack);
      acknowledgedOpIds.push(op.opId);
    }

    const responseStatus = failedOperations.length === 0 ? 'SUCCESS' : (acknowledgedOpIds.length > 0 ? 'PARTIAL' : 'ERROR');

    return {
      status: responseStatus,
      acknowledgedOpIds,
      serverSeq: currentSeq,
      acks,
      failedOperations: failedOperations.length > 0 ? failedOperations : undefined
    };
  }

  public async pullOperations(req: SyncPullRequest): Promise<SyncPullResponse> {
    const { shgId, lastServerSeq } = req;
    const currentSeq = this.serverSeqMap.get(shgId) || 0;
    const shgOps = this.operationsMap.get(shgId) || [];

    // Return ops strictly greater than lastServerSeq
    const newOps = shgOps.filter(op => op.serverSeq > lastServerSeq);

    return {
      shgId,
      currentServerSeq: currentSeq,
      operations: newOps
    };
  }

  public injectRemoteServerOperation(shgId: string, op: Omit<ServerOperation, 'serverSeq'>): ServerOperation {
    if (!this.operationsMap.has(shgId)) {
      this.operationsMap.set(shgId, []);
      this.serverSeqMap.set(shgId, 0);
      this.entityStore.set(shgId, new Map());
    }

    const currentSeq = (this.serverSeqMap.get(shgId) || 0) + 1;
    this.serverSeqMap.set(shgId, currentSeq);

    const fullOp: ServerOperation = {
      ...op,
      serverSeq: currentSeq
    };

    const shgOps = this.operationsMap.get(shgId)!;
    shgOps.push(fullOp);

    const entityType = this.extractEntityType(op.type);
    const entityKey = `${entityType}:${op.entityId}`;
    const shgEntities = this.entityStore.get(shgId)!;
    shgEntities.set(entityKey, {
      version: op.entityVersion,
      data: op.payload
    });

    return fullOp;
  }

  private extractEntityType(opType: string): string {
    if (opType.includes('MEMBER') || opType.includes('SAVINGS')) return 'member';
    if (opType.includes('LOAN') || opType.includes('EMI')) return 'loan';
    return 'group_info';
  }
}

export const mockSyncServer = new MockSyncServer();

export type OperationAckStatus = 'ACKNOWLEDGED' | 'CONFLICT' | 'REJECTED';

export interface OperationAck {
  opId: string;
  status: OperationAckStatus;
  serverSeq?: number;
  conflictDetails?: Record<string, any>;
  errorMessage?: string;
}

export interface ClientOperationLog {
  opId: string;
  shgId: string;
  actorId: string;
  actorRole: string;
  deviceId: string;
  hlcTimestamp: string;
  type: string;
  entityId: string;
  payload: Record<string, any>;
  prevOpHash?: string;
  syncStatus?: string;
}

export interface SyncPushRequest {
  shgId: string;
  deviceId: string;
  operations: ClientOperationLog[];
}

export interface SyncPushResponse {
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  acknowledgedOpIds: string[];
  serverSeq?: number;
  failedOperations?: Array<{ opId: string; reason: string }>;
  acks: OperationAck[];
}

export interface SyncPullRequest {
  shgId: string;
  deviceId: string;
  lastServerSeq: number;
  batchSize?: number;
}

export interface ServerOperation {
  serverSeq: number;
  opId: string;
  shgId: string;
  actorId: string;
  actorRole: string;
  deviceId: string;
  hlcTimestamp: string;
  type: string;
  entityType?: string;
  entityId: string;
  payload: Record<string, any>;
  entityVersion: number;
  committedAt?: string;
}

export interface SyncPullResponse {
  shgId: string;
  currentServerSeq: number;
  latestServerSeq: number;
  operations: ServerOperation[];
  hasMore: boolean;
}

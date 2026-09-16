import { OperationLog } from './shg';

export type NetworkState = 'ONLINE' | 'OFFLINE';

export type SyncState = 'IDLE' | 'SYNCING' | 'CONFLICT' | 'ERROR';

export type DerivedSyncStatus = 'SYNCED' | 'PENDING' | 'SYNCING' | 'CONFLICT' | 'OFFLINE' | 'ERROR';

export type OperationAckStatus = 'ACKNOWLEDGED' | 'CONFLICT' | 'REJECTED';

export interface OperationAck {
  opId: string;
  status: OperationAckStatus;
  serverSeq?: number;
  conflictDetails?: Record<string, any>;
  errorMessage?: string;
}

export interface SyncPushRequest {
  shgId: string;
  deviceId: string;
  operations: OperationLog[];
}

export interface SyncPushResponse {
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  acknowledgedOpIds: string[];
  serverSeq?: number;
  failedOperations?: Array<{ opId: string; reason: string }>;
  acks?: OperationAck[];
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
  entityId: string;
  payload: Record<string, any>;
  entityVersion: number;
}

export interface SyncPullResponse {
  shgId: string;
  currentServerSeq: number;
  latestServerSeq?: number;
  operations: ServerOperation[];
  hasMore?: boolean;
}

export type DeferredOperationStatus = 'DEFERRED' | 'RESOLVED';

export interface DeferredRemoteOperation {
  id: string; // UUID v4
  shgId: string;
  serverSeq: number;
  opId: string;
  entityType: 'member' | 'loan' | 'group_info';
  entityId: string;
  remotePayload: Record<string, any>;
  localPayload: Record<string, any>;
  remoteVersion: number;
  localVersion: number;
  conflictDetectedAt: string;
  status: DeferredOperationStatus;
}

export type ConflictResolutionChoice = 'ACCEPT_REMOTE' | 'KEEP_LOCAL' | 'RETRY_MERGED';

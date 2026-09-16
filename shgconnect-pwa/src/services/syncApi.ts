import {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullRequest,
  SyncPullResponse
} from '../types/sync';
import { mockSyncServer } from './mockSyncServer';

const SERVER_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SYNC_SERVER_URL) ||
  'http://localhost:4000';

export class SyncApi {
  private baseUrl: string;

  constructor(baseUrl: string = SERVER_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public async push(req: SyncPushRequest): Promise<SyncPushResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SHG-ID': req.shgId,
          'X-Device-ID': req.deviceId
        },
        body: JSON.stringify(req)
      });

      if (!response.ok) {
        throw new Error(`HTTP push failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Physical sync server push failed, using local mock sync fallback:', error);
      return await mockSyncServer.pushOperations(req);
    }
  }

  public async pull(req: SyncPullRequest): Promise<SyncPullResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/sync/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SHG-ID': req.shgId,
          'X-Device-ID': req.deviceId
        },
        body: JSON.stringify(req)
      });

      if (!response.ok) {
        throw new Error(`HTTP pull failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Physical sync server pull failed, using local mock sync fallback:', error);
      return await mockSyncServer.pullOperations(req);
    }
  }
}

export const syncApi = new SyncApi();

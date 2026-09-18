import { getClient } from '../db';
import {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullRequest,
  SyncPullResponse,
  OperationAck,
  ServerOperation,
  ClientOperationLog
} from '../types/sync';

export class SyncService {
  public static async processPush(
    req: SyncPushRequest,
    reqShgIdHeader?: string
  ): Promise<SyncPushResponse> {
    const activeShgId = reqShgIdHeader || req.shgId;
    if (!activeShgId || !req.deviceId || !Array.isArray(req.operations)) {
      throw new Error('INVALID_PUSH_PAYLOAD: shgId, deviceId, and operations array are required');
    }

    const client = await getClient();
    const acknowledgedOpIds: string[] = [];
    const acks: OperationAck[] = [];
    const failedOperations: Array<{ opId: string; reason: string }> = [];

    try {
      await client.query('BEGIN');
      try {
        await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      } catch (e) {
        // Isolation level fallback for compliant SQL drivers
      }

      for (const op of req.operations) {
        // Step A: Tenant Validation
        if (op.shgId !== activeShgId) {
          const errorMessage = `Tenant mismatch: operation shgId (${op.shgId}) does not match request shgId (${activeShgId})`;
          await client.query(
            `INSERT INTO processed_operations (op_id, shg_id, status, server_seq, error_message)
             VALUES ($1, $2, 'REJECTED', NULL, $3)
             ON CONFLICT (op_id) DO NOTHING`,
            [op.opId, activeShgId, errorMessage]
          );
          acks.push({
            opId: op.opId,
            status: 'REJECTED',
            errorMessage
          });
          failedOperations.push({ opId: op.opId, reason: errorMessage });
          continue;
        }

        // Step B: Server-Side Idempotency Check
        const existingRes = await client.query(
          `SELECT status, server_seq, conflict_details, error_message
           FROM processed_operations
           WHERE op_id = $1 AND shg_id = $2`,
          [op.opId, activeShgId]
        );

        if (existingRes.rows.length > 0) {
          const row = existingRes.rows[0];
          const ackStatus = row.status as 'ACKNOWLEDGED' | 'CONFLICT' | 'REJECTED';
          const ack: OperationAck = {
            opId: op.opId,
            status: ackStatus,
            serverSeq: row.server_seq ? Number(row.server_seq) : undefined,
            conflictDetails: row.conflict_details,
            errorMessage: row.error_message
          };
          acks.push(ack);
          if (ackStatus === 'ACKNOWLEDGED') {
            acknowledgedOpIds.push(op.opId);
          } else {
            failedOperations.push({ opId: op.opId, reason: row.error_message || 'Previously failed operation' });
          }
          continue;
        }

        // Step C: Determine Entity Category & OCC Logic
        const entityType = this.resolveEntityType(op.type);
        const isMutableEntity = entityType === 'member' || entityType === 'loan' || entityType === 'group_info';

        let conflictDetected = false;
        let conflictDetails: Record<string, any> | undefined;
        let newEntityVersion = 1;

        if (isMutableEntity) {
          if (entityType === 'member') {
            const rowRes = await client.query(
              `SELECT entity_version, data FROM server_members WHERE shg_id = $1 AND id = $2 FOR UPDATE`,
              [activeShgId, op.entityId]
            );

            if (rowRes.rows.length > 0) {
              const currentVersion = Number(rowRes.rows[0].entity_version);
              const expectedVersion = op.payload?.expectedVersion ?? op.payload?.entityVersion;

              if (expectedVersion !== undefined && Number(expectedVersion) !== currentVersion) {
                conflictDetected = true;
                conflictDetails = {
                  entityId: op.entityId,
                  expectedEntityVersion: expectedVersion,
                  serverEntityVersion: currentVersion,
                  serverPayload: rowRes.rows[0].data
                };
              } else {
                newEntityVersion = currentVersion + 1;
                const updatedData = { ...rowRes.rows[0].data, ...op.payload, entityVersion: newEntityVersion };
                await client.query(
                  `UPDATE server_members SET name = $1, entity_version = $2, data = $3, updated_at = NOW() WHERE shg_id = $4 AND id = $5`,
                  [op.payload.name || rowRes.rows[0].data.name || '', newEntityVersion, updatedData, activeShgId, op.entityId]
                );
              }
            } else {
              newEntityVersion = 1;
              const initialData = { ...op.payload, entityVersion: 1 };
              await client.query(
                `INSERT INTO server_members (shg_id, id, name, entity_version, data) VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (shg_id, id) DO UPDATE SET name = EXCLUDED.name, entity_version = EXCLUDED.entity_version, data = EXCLUDED.data, updated_at = NOW()`,
                [activeShgId, op.entityId, op.payload.name || '', 1, initialData]
              );
            }
          } else if (entityType === 'loan') {
            const rowRes = await client.query(
              `SELECT entity_version, data FROM server_loans WHERE shg_id = $1 AND id = $2 FOR UPDATE`,
              [activeShgId, op.entityId]
            );

            if (rowRes.rows.length > 0) {
              const currentVersion = Number(rowRes.rows[0].entity_version);
              const expectedVersion = op.payload?.expectedVersion ?? op.payload?.entityVersion;

              if (expectedVersion !== undefined && Number(expectedVersion) !== currentVersion) {
                conflictDetected = true;
                conflictDetails = {
                  entityId: op.entityId,
                  expectedEntityVersion: expectedVersion,
                  serverEntityVersion: currentVersion,
                  serverPayload: rowRes.rows[0].data
                };
              } else {
                newEntityVersion = currentVersion + 1;
                const updatedData = { ...rowRes.rows[0].data, ...op.payload, entityVersion: newEntityVersion };
                await client.query(
                  `UPDATE server_loans SET entity_version = $1, data = $2, updated_at = NOW() WHERE shg_id = $3 AND id = $4`,
                  [newEntityVersion, updatedData, activeShgId, op.entityId]
                );
              }
            } else {
              newEntityVersion = 1;
              const initialData = { ...op.payload, entityVersion: 1 };
              await client.query(
                `INSERT INTO server_loans (shg_id, id, entity_version, data) VALUES ($1, $2, $3, $4)
                 ON CONFLICT (shg_id, id) DO UPDATE SET entity_version = EXCLUDED.entity_version, data = EXCLUDED.data, updated_at = NOW()`,
                [activeShgId, op.entityId, 1, initialData]
              );
            }
          } else if (entityType === 'group_info') {
            const rowRes = await client.query(
              `SELECT entity_version, data FROM server_group_info WHERE shg_id = $1 FOR UPDATE`,
              [activeShgId]
            );

            if (rowRes.rows.length > 0) {
              const currentVersion = Number(rowRes.rows[0].entity_version);
              const expectedVersion = op.payload?.expectedVersion ?? op.payload?.entityVersion;

              if (expectedVersion !== undefined && Number(expectedVersion) !== currentVersion) {
                conflictDetected = true;
                conflictDetails = {
                  entityId: op.entityId,
                  expectedEntityVersion: expectedVersion,
                  serverEntityVersion: currentVersion,
                  serverPayload: rowRes.rows[0].data
                };
              } else {
                newEntityVersion = currentVersion + 1;
                const updatedData = { ...rowRes.rows[0].data, ...op.payload, entityVersion: newEntityVersion };
                await client.query(
                  `UPDATE server_group_info SET entity_version = $1, data = $2, updated_at = NOW() WHERE shg_id = $3`,
                  [newEntityVersion, updatedData, activeShgId]
                );
              }
            } else {
              newEntityVersion = 1;
              const initialData = { ...op.payload, entityVersion: 1 };
              await client.query(
                `INSERT INTO server_group_info (shg_id, entity_version, data) VALUES ($1, $2, $3)
                 ON CONFLICT (shg_id) DO UPDATE SET entity_version = EXCLUDED.entity_version, data = EXCLUDED.data, updated_at = NOW()`,
                [activeShgId, 1, initialData]
              );
            }
          }
        }

        // Handle OCC Conflict Result
        if (conflictDetected) {
          await client.query(
            `INSERT INTO processed_operations (op_id, shg_id, status, server_seq, conflict_details)
             VALUES ($1, $2, 'CONFLICT', NULL, $3)
             ON CONFLICT (op_id) DO NOTHING`,
            [op.opId, activeShgId, conflictDetails]
          );

          acks.push({
            opId: op.opId,
            status: 'CONFLICT',
            conflictDetails
          });
          failedOperations.push({ opId: op.opId, reason: `OCC Conflict: expected ${conflictDetails?.expectedEntityVersion}, found ${conflictDetails?.serverEntityVersion}` });
          continue;
        }

        // Step D: Successful Mutation - Allocate Global Monotonic Sequence & Insert Outbox Log
        const seqRes = await client.query(`SELECT nextval('server_seq_generator') as assigned_seq`);
        const assignedSeq = Number(seqRes.rows[0].assigned_seq);

        try {
          await client.query(
            `INSERT INTO processed_operations (op_id, shg_id, status, server_seq)
             VALUES ($1, $2, 'ACKNOWLEDGED', $3)`,
            [op.opId, activeShgId, assignedSeq]
          );
        } catch (insertErr: any) {
          if (insertErr.code === '23505' || insertErr.message?.includes('duplicate key')) {
            const existing = await client.query(
              `SELECT status, server_seq, conflict_details, error_message FROM processed_operations WHERE op_id = $1`,
              [op.opId]
            );
            if (existing.rows.length > 0) {
              const row = existing.rows[0];
              acks.push({
                opId: op.opId,
                status: row.status,
                serverSeq: row.server_seq ? Number(row.server_seq) : undefined,
                conflictDetails: row.conflict_details,
                errorMessage: row.error_message
              });
              if (row.status === 'ACKNOWLEDGED') acknowledgedOpIds.push(op.opId);
              continue;
            }
          }
          throw insertErr;
        }

        await client.query(
          `INSERT INTO server_operation_log 
           (server_seq, op_id, shg_id, actor_id, actor_role, device_id, hlc_timestamp, entity_type, entity_id, entity_version, type, payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (op_id) DO NOTHING`,
          [
            assignedSeq,
            op.opId,
            activeShgId,
            op.actorId || 'UNKNOWN_ACTOR',
            op.actorRole || 'ANIMATOR',
            op.deviceId || req.deviceId,
            op.hlcTimestamp || new Date().toISOString(),
            entityType,
            op.entityId,
            newEntityVersion,
            op.type,
            op.payload || {}
          ]
        );

        acks.push({
          opId: op.opId,
          status: 'ACKNOWLEDGED',
          serverSeq: assignedSeq
        });
        acknowledgedOpIds.push(op.opId);
      }

      await client.query('COMMIT');

      let responseStatus: 'SUCCESS' | 'PARTIAL' | 'ERROR' = 'SUCCESS';
      if (acknowledgedOpIds.length === 0 && failedOperations.length > 0) {
        responseStatus = 'ERROR';
      } else if (failedOperations.length > 0) {
        responseStatus = 'PARTIAL';
      }

      const maxServerSeq = acks.reduce((max, a) => Math.max(max, a.serverSeq || 0), 0);

      return {
        status: responseStatus,
        acknowledgedOpIds,
        serverSeq: maxServerSeq > 0 ? maxServerSeq : undefined,
        acks,
        failedOperations: failedOperations.length > 0 ? failedOperations : undefined
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public static async processPull(
    req: SyncPullRequest,
    reqShgIdHeader?: string
  ): Promise<SyncPullResponse> {
    const activeShgId = reqShgIdHeader || req.shgId;
    if (!activeShgId) {
      throw new Error('INVALID_PULL_PAYLOAD: shgId is required');
    }

    const lastServerSeq = Number(req.lastServerSeq) || 0;
    const batchSize = Math.min(Math.max(Number(req.batchSize) || 50, 1), 100);

    const client = await getClient();
    try {
      await client.query('BEGIN');
      try {
        await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      } catch (e) {
        // Isolation level fallback for compliant SQL drivers
      }

      const logRes = await client.query(
        `SELECT server_seq, op_id, shg_id, actor_id, actor_role, device_id, hlc_timestamp, entity_type, entity_id, entity_version, type, payload, committed_at
         FROM server_operation_log
         WHERE shg_id = $1 AND server_seq > $2
         ORDER BY server_seq ASC
         LIMIT $3`,
        [activeShgId, lastServerSeq, batchSize]
      );

      const maxRes = await client.query(
        `SELECT MAX(server_seq) as max_seq FROM server_operation_log WHERE shg_id = $1`,
        [activeShgId]
      );

      await client.query('COMMIT');

      const operations: ServerOperation[] = logRes.rows.map(r => ({
        serverSeq: Number(r.server_seq),
        opId: r.op_id,
        shgId: r.shg_id,
        actorId: r.actor_id,
        actorRole: r.actor_role,
        deviceId: r.device_id,
        hlcTimestamp: r.hlc_timestamp,
        type: r.type,
        entityType: r.entity_type,
        entityId: r.entity_id,
        payload: r.payload,
        entityVersion: Number(r.entity_version),
        committedAt: r.committed_at
      }));

      const latestServerSeq = maxRes.rows[0].max_seq ? Number(maxRes.rows[0].max_seq) : lastServerSeq;
      const currentServerSeq = operations.length > 0 ? operations[operations.length - 1].serverSeq : lastServerSeq;
      const hasMore = operations.length === batchSize;

      return {
        shgId: activeShgId,
        currentServerSeq,
        latestServerSeq,
        operations,
        hasMore
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private static resolveEntityType(opType: string): string {
    const upper = (opType || '').toUpperCase();
    if (upper.includes('MEMBER') || upper.includes('SAVINGS')) return 'member';
    if (upper.includes('LOAN') || upper.includes('EMI')) return 'loan';
    if (upper.includes('GROUP') || upper.includes('CONFIG')) return 'group_info';
    return 'append_only';
  }
}

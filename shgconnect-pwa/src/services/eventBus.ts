import { DomainEvent, EventContext, AuditEnvelope } from '../types/shg';
import { saveAuditEnvelope } from './db';
import { calculateSHA256 } from './hashChain';
import { sound } from './sound';

type EventHandler<T extends DomainEvent['type']> = (
  event: Extract<DomainEvent, { type: T }>,
  context: EventContext
) => void | Promise<void>;

class EventBusService {
  private handlers: Map<string, Array<EventHandler<any>>> = new Map();

  /**
   * Registers an event handler listener for a specific DomainEvent type
   */
  public on<T extends DomainEvent['type']>(type: T, handler: EventHandler<T>): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  /**
   * Emits a DomainEvent after enforcing the Critical Audit-First Invariant
   */
  public async emit(event: DomainEvent, context: EventContext): Promise<void> {
    // 1. Context validation
    if (!context || !context.shgId || !context.actorId || !context.actorRole || !context.deviceId) {
      throw new Error("Invalid EventContext: shgId, actorId, actorRole, and deviceId are required.");
    }

    // 2. Map into AuditEnvelope
    const timestamp = new Date().toISOString();
    const auditId = `aud-evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const payloadAny = event.payload as any;
    const entityId = payloadAny.meetingId || payloadAny.memberId || payloadAny.blockId || 'entity-0';
    const entityType = event.type === 'MEETING_COMMITTED' ? 'MEETING' : 'TRANSACTION';

    const auditContent = `${auditId}:${event.type}:${entityId}:${JSON.stringify(event.payload)}`;
    const auditHash = await calculateSHA256(auditContent);

    const envelope: AuditEnvelope = {
      auditId,
      shgId: context.shgId,
      actorId: context.actorId,
      actorRole: context.actorRole,
      action: event.type,
      entityType,
      entityId,
      oldValue: null,
      newValue: event.payload,
      timestamp,
      deviceId: context.deviceId,
      auditHash
    };

    // 3. Await audit persistence BEFORE firing handlers
    await saveAuditEnvelope(envelope);

    // 4. Trigger event-specific Web Audio API sound synthesis
    if (event.type === 'MEETING_COMMITTED' || event.type === 'SAVINGS_RECORDED') {
      sound.playStampSound();
    }

    // 5. Execute registered listeners
    const listenerList = this.handlers.get(event.type) || [];
    for (const handler of listenerList) {
      try {
        await handler(event, context);
      } catch (err) {
        console.error(`Error executing event listener for ${event.type}:`, err);
      }
    }
  }
}

export const eventBus = new EventBusService();

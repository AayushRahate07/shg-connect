// Live Meeting Room service — talks to the in-memory server in vite.config.ts
// Works over the internet (ngrok / any public URL) as long as the dev server is running.

export interface LiveMember {
  memberId: string;
  memberName: string;
  phone: string;
  attended: boolean;
  savings: number;
  joinedAt: string;
  verified?: boolean;
  pendingSavings?: { amount: number; otp: string; timestamp: number };
}

export interface LiveMeetingRoom {
  code: string;
  shgId: string;
  shgName: string;
  leadName: string;
  startedAt: string;
  status: 'OPEN' | 'COMPLETED';
  members: Record<string, LiveMember>;
  totalPool: number;
  completedAt?: string;
}

const BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LIVE_MEETING_SERVER_URL)
  ? (import.meta as any).env.VITE_LIVE_MEETING_SERVER_URL.replace(/\/+$/, '')
  : '';

export const liveMeetingApi = {
  /** Lead: create a new meeting room */
  async start(shgId: string, shgName: string, leadId: string, leadName: string): Promise<{ ok: boolean; code: string; room: LiveMeetingRoom }> {
    const res = await fetch(`${BASE}/api/meeting/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shgId, shgName, leadId, leadName }),
    });
    return res.json();
  },

  /** Member: join an existing meeting by 4-digit code */
  async join(code: string, memberId: string, memberName: string, phone: string): Promise<{ ok: boolean; room?: LiveMeetingRoom; error?: string }> {
    const res = await fetch(`${BASE}/api/meeting/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, memberName, phone }),
    });
    return res.json();
  },

  /** Lead: initiate savings amount for a member (triggers dynamic handshake OTP on member screen) */
  async initiateSavings(code: string, memberId: string, amount: number): Promise<{ ok: boolean; memberId?: string; amount?: number; otp?: string; error?: string }> {
    const res = await fetch(`${BASE}/api/meeting/${code}/savings/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, amount }),
    });
    return res.json();
  },

  /** Lead: submit member's handshake OTP to verify and commit physical cash handover */
  async verifySavings(code: string, memberId: string, otp: string): Promise<{ ok: boolean; totalPool?: number; members?: Record<string, LiveMember>; error?: string }> {
    const res = await fetch(`${BASE}/api/meeting/${code}/savings/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, otp }),
    });
    return res.json();
  },

  /** Cancel pending savings handshake */
  async cancelSavings(code: string, memberId: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${BASE}/api/meeting/${code}/savings/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    return res.json();
  },

  /** Direct fallback savings update */
  async recordSavings(code: string, memberId: string, amount: number): Promise<{ ok: boolean; totalPool: number }> {
    const res = await fetch(`${BASE}/api/meeting/${code}/savings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, amount }),
    });
    return res.json();
  },

  /** Lead: complete the meeting */
  async complete(code: string): Promise<{ ok: boolean; room: LiveMeetingRoom }> {
    const res = await fetch(`${BASE}/api/meeting/${code}/complete`, {
      method: 'POST',
    });
    return res.json();
  },

  /** Fetch current room state */
  async getRoom(code: string): Promise<{ ok: boolean; room?: LiveMeetingRoom; error?: string }> {
    const res = await fetch(`${BASE}/api/meeting/${code}`);
    return res.json();
  },

  /** Subscribe to real-time SSE events from the meeting room.
   *  Returns an EventSource. Caller is responsible for .close() on unmount.
   */
  subscribe(code: string, handlers: {
    onSnapshot?: (room: LiveMeetingRoom) => void;
    onMemberJoined?: (data: { memberId: string; memberName: string; members: Record<string, LiveMember> }) => void;
    onSavingsUpdated?: (data: { memberId: string; amount: number; totalPool: number; members: Record<string, LiveMember> }) => void;
    onSavingsHandshakeInitiated?: (data: { memberId: string; memberName: string; amount: number; otp: string }) => void;
    onSavingsVerified?: (data: { memberId: string; memberName: string; amount: number; totalPool: number; members: Record<string, LiveMember> }) => void;
    onSavingsCancelled?: (data: { memberId: string }) => void;
    onMeetingCompleted?: (room: LiveMeetingRoom) => void;
  }): EventSource {
    const es = new EventSource(`${BASE}/api/meeting/${code}/stream`);
    es.addEventListener('snapshot', (e: MessageEvent) => handlers.onSnapshot?.(JSON.parse(e.data)));
    es.addEventListener('member_joined', (e: MessageEvent) => handlers.onMemberJoined?.(JSON.parse(e.data)));
    es.addEventListener('savings_updated', (e: MessageEvent) => handlers.onSavingsUpdated?.(JSON.parse(e.data)));
    es.addEventListener('savings_handshake_initiated', (e: MessageEvent) => handlers.onSavingsHandshakeInitiated?.(JSON.parse(e.data)));
    es.addEventListener('savings_verified', (e: MessageEvent) => handlers.onSavingsVerified?.(JSON.parse(e.data)));
    es.addEventListener('savings_cancelled', (e: MessageEvent) => handlers.onSavingsCancelled?.(JSON.parse(e.data)));
    es.addEventListener('meeting_completed', (e: MessageEvent) => handlers.onMeetingCompleted?.(JSON.parse(e.data)));
    return es;
  },
};

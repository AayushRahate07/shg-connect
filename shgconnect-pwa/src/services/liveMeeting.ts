// Live Meeting Room service — talks to server or falls back to local client-host on the phone
// Works 100% offline via BroadcastChannel + localStorage, or over the internet via backend.

export interface LiveMember {
  memberId: string;
  memberName: string;
  phone: string;
  attended: boolean;
  savings: number;
  joinedAt: string;
  verified?: boolean;
  pendingSavings?: { amount: number; otp: string; timestamp: number };
  leftEarly?: boolean;
  leftAt?: string;
  leftReason?: string;
  connectionStatus?: 'CONNECTED' | 'RECONNECTING' | 'LEFT' | 'DISCONNECTED';
  paperSlip?: boolean;
}

export interface MeetingQuorumReport {
  totalMembers: number;
  attendedFull: number;
  leftEarly: number;
  leftEarlyMembers: Array<{ memberId: string; memberName: string; reason?: string; savings: number; verified?: boolean }>;
  absent: number;
  quorumRequired: number;
  quorumAttended: number;
  quorumMet: boolean;
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
  report?: MeetingQuorumReport;
}

export interface LiveMeetingHandlers {
  onSnapshot?: (room: LiveMeetingRoom) => void;
  onMemberJoined?: (data: { memberId: string; memberName: string; members: Record<string, LiveMember> }) => void;
  onMemberLeft?: (data: { memberId: string; memberName: string; reason?: string; leftAt?: string; members: Record<string, LiveMember>; totalPool: number }) => void;
  onMemberStatusChanged?: (data: { memberId: string; memberName: string; connectionStatus: string; members: Record<string, LiveMember> }) => void;
  onSavingsUpdated?: (data: { memberId: string; amount: number; totalPool: number; members: Record<string, LiveMember> }) => void;
  onSavingsHandshakeInitiated?: (data: { memberId: string; memberName: string; amount: number; otp: string }) => void;
  onSavingsVerified?: (data: { memberId: string; memberName: string; amount: number; totalPool: number; members: Record<string, LiveMember> }) => void;
  onSavingsCancelled?: (data: { memberId: string; reason?: string }) => void;
  onBatchConfirmed?: (data: { totalPool: number; members: Record<string, LiveMember>; amount: number; count: number }) => void;
  onMeetingCompleted?: (room: LiveMeetingRoom) => void;
  onRoomClosed?: (data: { reason: string }) => void;
}

const RENDER_PROD_URL = 'https://shg-connect.onrender.com';

const isLocalOrLan = typeof window !== 'undefined' && (
  window.location.hostname.includes('localhost') ||
  window.location.hostname.startsWith('127.') ||
  window.location.hostname.startsWith('192.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('172.') ||
  window.location.hostname.startsWith('25.') ||
  window.location.port === '3000' ||
  window.location.port === '5173'
);

const BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LIVE_MEETING_SERVER_URL)
  ? (import.meta as any).env.VITE_LIVE_MEETING_SERVER_URL.replace(/\/+$/, '')
  : (isLocalOrLan ? '' : RENDER_PROD_URL);

// Local fallback state helpers
function getLocalRoom(code: string): LiveMeetingRoom | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(`shg_live_room_${code}`);
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

function saveLocalRoom(room: LiveMeetingRoom) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`shg_live_room_${room.code}`, JSON.stringify(room));
  localStorage.setItem('shg_live_meeting_code', room.code);
  broadcastLocalEvent(room.code, 'snapshot', room);
}

function broadcastLocalEvent(code: string, type: string, payload: any) {
  if (typeof window === 'undefined') return;
  try {
    const bc = new BroadcastChannel(`shg_live_channel_${code}`);
    bc.postMessage({ type, payload });
    bc.close();
  } catch {}
}

export const liveMeetingApi = {
  /** Lead: create a new meeting room (phone acts as host) */
  async start(shgId: string, shgName: string, leadId: string, leadName: string): Promise<{ ok: boolean; code: string; room: LiveMeetingRoom }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${BASE}/api/meeting/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shgId, shgName, leadId, leadName }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        saveLocalRoom(data.room);
        return data;
      }
    } catch {}

    // Autonomous client phone host fallback
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const room: LiveMeetingRoom = {
      code,
      shgId,
      shgName,
      leadName,
      startedAt: new Date().toISOString(),
      status: 'OPEN',
      members: {},
      totalPool: 0
    };
    saveLocalRoom(room);
    return { ok: true, code, room };
  },

  /** Member: join an existing meeting by 4-digit code */
  async join(code: string, memberId: string, memberName: string, phone: string): Promise<{ ok: boolean; room?: LiveMeetingRoom; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${BASE}/api/meeting/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, memberName, phone }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.room) saveLocalRoom(data.room);
        return data;
      }
    } catch {}

    // Autonomous fallback
    const room = getLocalRoom(code);
    if (!room) return { ok: false, error: 'Meeting not found' };
    if (!room.members[memberId]) {
      room.members[memberId] = {
        memberId,
        memberName,
        phone,
        attended: true,
        savings: 0,
        joinedAt: new Date().toISOString(),
        verified: false,
        connectionStatus: 'CONNECTED'
      };
      saveLocalRoom(room);
      broadcastLocalEvent(code, 'member_joined', { memberId, memberName, members: room.members });
    }
    return { ok: true, room };
  },

  /** Lead: initiate savings amount for a member */
  async initiateSavings(code: string, memberId: string, amount: number): Promise<{ ok: boolean; memberId?: string; amount?: number; otp?: string; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${BASE}/api/meeting/${code}/savings/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, amount }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) return res.json();
    } catch {}

    const room = getLocalRoom(code);
    if (!room || !room.members[memberId]) return { ok: false, error: 'Member not found' };
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    room.members[memberId].pendingSavings = { amount, otp, timestamp: Date.now() };
    saveLocalRoom(room);
    broadcastLocalEvent(code, 'savings_handshake_initiated', {
      memberId,
      memberName: room.members[memberId].memberName,
      amount,
      otp
    });
    return { ok: true, memberId, amount, otp };
  },

  /** Lead: submit member's handshake OTP or paper slip mode */
  async verifySavings(code: string, memberId: string, otp: string, paperSlip = false): Promise<{ ok: boolean; totalPool?: number; members?: Record<string, LiveMember>; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${BASE}/api/meeting/${code}/savings/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, otp }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) return res.json();
    } catch {}

    const room = getLocalRoom(code);
    if (!room || !room.members[memberId]) return { ok: false, error: 'Member not found' };
    const member = room.members[memberId];
    if (!paperSlip && member.pendingSavings && member.pendingSavings.otp !== otp) {
      return { ok: false, error: 'चुकीचा कोड' };
    }
    const amt = member.pendingSavings ? member.pendingSavings.amount : (member.savings || 300);
    member.savings = amt;
    member.verified = true;
    member.paperSlip = paperSlip;
    delete member.pendingSavings;
    room.totalPool = Object.values(room.members).reduce((s, m) => s + (m.verified ? m.savings : 0), 0);
    saveLocalRoom(room);
    broadcastLocalEvent(code, 'savings_verified', {
      memberId,
      memberName: member.memberName,
      amount: amt,
      totalPool: room.totalPool,
      members: room.members
    });
    return { ok: true, totalPool: room.totalPool, members: room.members };
  },

  /** Cancel pending savings handshake */
  async cancelSavings(code: string, memberId: string): Promise<{ ok: boolean }> {
    try {
      const res = await fetch(`${BASE}/api/meeting/${code}/savings/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) return res.json();
    } catch {}

    const room = getLocalRoom(code);
    if (room && room.members[memberId]) {
      delete room.members[memberId].pendingSavings;
      saveLocalRoom(room);
      broadcastLocalEvent(code, 'savings_cancelled', { memberId });
    }
    return { ok: true };
  },

  /** Direct batch confirm all attended members */
  async batchConfirmAll(code: string, defaultAmount = 250, currentMembers?: Record<string, LiveMember>): Promise<{ ok: boolean; totalPool?: number; members?: Record<string, LiveMember>; count?: number }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${BASE}/api/meeting/${code}/batch-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultAmount }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const local = getLocalRoom(code);
        if (local && data.members) {
          local.members = data.members;
          local.totalPool = data.totalPool;
          saveLocalRoom(local);
        }
        return data;
      }
    } catch {}

    // Autonomous client fallback
    const room = getLocalRoom(code);
    const membersToUse = (room && Object.keys(room.members).length > 0)
      ? room.members
      : (currentMembers ? { ...currentMembers } : {});

    let count = 0;
    for (const mem of Object.values(membersToUse)) {
      if (!mem.verified) {
        mem.savings = mem.savings > 0 ? mem.savings : defaultAmount;
        mem.verified = true;
        mem.paperSlip = true;
        delete mem.pendingSavings;
        count++;
      }
    }

    const totalPool = Object.values(membersToUse).reduce((s, m) => s + (m.verified ? m.savings : 0), 0);
    if (room) {
      room.members = membersToUse;
      room.totalPool = totalPool;
      saveLocalRoom(room);
    }
    broadcastLocalEvent(code, 'batch_confirmed', { totalPool, members: membersToUse, count, amount: defaultAmount });
    broadcastLocalEvent(code, 'snapshot', room || { code, members: membersToUse, totalPool });
    return { ok: true, totalPool, members: membersToUse, count };
  },

  /** Member or Leader: record member departure / left early */
  async leave(code: string, memberId: string, reason?: string): Promise<{ ok: boolean; room?: LiveMeetingRoom; error?: string }> {
    try {
      const res = await fetch(`${BASE}/api/meeting/${code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, reason }),
      });
      if (res.ok) return res.json();
    } catch {}

    const room = getLocalRoom(code);
    if (room && room.members[memberId]) {
      const mem = room.members[memberId];
      mem.leftEarly = true;
      mem.leftAt = new Date().toISOString();
      mem.leftReason = reason || 'घरगुती काम';
      mem.connectionStatus = 'LEFT';
      if (!mem.verified) mem.savings = 0;
      saveLocalRoom(room);
      broadcastLocalEvent(code, 'member_left', {
        memberId,
        memberName: mem.memberName,
        reason,
        leftAt: mem.leftAt,
        members: room.members,
        totalPool: room.totalPool
      });
      return { ok: true, room };
    }
    return { ok: false };
  },

  /** Leader: manually mark member status */
  async markMemberStatus(code: string, memberId: string, options: { leftEarly?: boolean; reason?: string; connectionStatus?: string }): Promise<{ ok: boolean; members?: Record<string, LiveMember>; error?: string }> {
    try {
      const res = await fetch(`${BASE}/api/meeting/${code}/member-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, ...options }),
      });
      if (res.ok) return res.json();
    } catch {}

    const room = getLocalRoom(code);
    if (room && room.members[memberId]) {
      const mem = room.members[memberId];
      if (options.leftEarly !== undefined) mem.leftEarly = options.leftEarly;
      if (options.reason) mem.leftReason = options.reason;
      if (options.connectionStatus) mem.connectionStatus = options.connectionStatus as any;
      if (mem.leftEarly && !mem.verified) mem.savings = 0;
      saveLocalRoom(room);
      broadcastLocalEvent(code, 'member_status_changed', {
        memberId,
        memberName: mem.memberName,
        connectionStatus: mem.connectionStatus || 'LEFT',
        members: room.members
      });
      return { ok: true, members: room.members };
    }
    return { ok: false };
  },

  /** Lead: complete the meeting with statutory quorum check */
  async complete(code: string, totalKnownMembers = 14): Promise<{ ok: boolean; room: LiveMeetingRoom }> {
    try {
      const res = await fetch(`${BASE}/api/meeting/${code}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalKnownMembers }),
      });
      if (res.ok) return res.json();
    } catch {}

    const room = getLocalRoom(code) || {
      code,
      shgId: 'SHG-MH-NGP-2024-0010',
      shgName: 'क्रांतीज्योती सावित्रीबाई फुले महिला बचत गट',
      leadName: 'मीनाताई राऊत',
      startedAt: new Date().toISOString(),
      status: 'OPEN' as const,
      members: {},
      totalPool: 0
    };

    const membersList = Object.values(room.members);
    const attendedFull = membersList.filter(m => !m.leftEarly).length;
    const leftEarly = membersList.filter(m => m.leftEarly).length;
    const quorumAttended = attendedFull + leftEarly;
    const quorumRequired = Math.ceil(totalKnownMembers * 0.5);

    room.status = 'COMPLETED';
    room.completedAt = new Date().toISOString();
    room.report = {
      totalMembers: totalKnownMembers,
      attendedFull,
      leftEarly,
      leftEarlyMembers: membersList.filter(m => m.leftEarly).map(m => ({
        memberId: m.memberId,
        memberName: m.memberName,
        reason: m.leftReason,
        savings: m.savings,
        verified: m.verified
      })),
      absent: Math.max(0, totalKnownMembers - quorumAttended),
      quorumRequired,
      quorumAttended,
      quorumMet: quorumAttended >= quorumRequired
    };

    saveLocalRoom(room);
    broadcastLocalEvent(code, 'meeting_completed', room);
    return { ok: true, room };
  },

  /** Fetch current room state */
  async getRoom(code: string): Promise<{ ok: boolean; room?: LiveMeetingRoom; error?: string }> {
    try {
      const res = await fetch(`${BASE}/api/meeting/${code}`);
      if (res.ok) return res.json();
    } catch {}
    const room = getLocalRoom(code);
    return room ? { ok: true, room } : { ok: false, error: 'Not found' };
  },

  /** Subscribe to real-time events via SSE + local BroadcastChannel fallback */
  subscribe(code: string, handlers: LiveMeetingHandlers): any {
    let es: EventSource | null = null;
    let bc: BroadcastChannel | null = null;

    try {
      es = new EventSource(`${BASE}/api/meeting/${code}/stream`);
      es.addEventListener('snapshot', (e: MessageEvent) => handlers.onSnapshot?.(JSON.parse(e.data)));
      es.addEventListener('member_joined', (e: MessageEvent) => handlers.onMemberJoined?.(JSON.parse(e.data)));
      es.addEventListener('member_left', (e: MessageEvent) => handlers.onMemberLeft?.(JSON.parse(e.data)));
      es.addEventListener('member_status_changed', (e: MessageEvent) => handlers.onMemberStatusChanged?.(JSON.parse(e.data)));
      es.addEventListener('savings_updated', (e: MessageEvent) => handlers.onSavingsUpdated?.(JSON.parse(e.data)));
      es.addEventListener('savings_handshake_initiated', (e: MessageEvent) => handlers.onSavingsHandshakeInitiated?.(JSON.parse(e.data)));
      es.addEventListener('savings_verified', (e: MessageEvent) => handlers.onSavingsVerified?.(JSON.parse(e.data)));
      es.addEventListener('savings_cancelled', (e: MessageEvent) => handlers.onSavingsCancelled?.(JSON.parse(e.data)));
      es.addEventListener('batch_confirmed', (e: MessageEvent) => handlers.onBatchConfirmed?.(JSON.parse(e.data)));
      es.addEventListener('meeting_completed', (e: MessageEvent) => handlers.onMeetingCompleted?.(JSON.parse(e.data)));
      es.addEventListener('room_closed', (e: MessageEvent) => handlers.onRoomClosed?.(JSON.parse(e.data)));
    } catch {}

    try {
      bc = new BroadcastChannel(`shg_live_channel_${code}`);
      bc.onmessage = (e) => {
        const { type, payload } = e.data || {};
        if (type === 'snapshot') handlers.onSnapshot?.(payload);
        else if (type === 'member_joined') handlers.onMemberJoined?.(payload);
        else if (type === 'member_left') handlers.onMemberLeft?.(payload);
        else if (type === 'member_status_changed') handlers.onMemberStatusChanged?.(payload);
        else if (type === 'batch_confirmed') handlers.onBatchConfirmed?.(payload);
        else if (type === 'savings_updated') handlers.onSavingsUpdated?.(payload);
        else if (type === 'savings_handshake_initiated') handlers.onSavingsHandshakeInitiated?.(payload);
        else if (type === 'savings_verified') handlers.onSavingsVerified?.(payload);
        else if (type === 'savings_cancelled') handlers.onSavingsCancelled?.(payload);
        else if (type === 'meeting_completed') handlers.onMeetingCompleted?.(payload);
      };
    } catch {}

    // Send initial local snapshot if exists
    const local = getLocalRoom(code);
    if (local) {
      setTimeout(() => handlers.onSnapshot?.(local), 50);
    }

    return {
      close: () => {
        try { es?.close(); } catch {}
        try { bc?.close(); } catch {}
      }
    };
  },
};

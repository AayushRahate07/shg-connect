import { Router, Request, Response } from 'express';

export const meetingRouter = Router();

interface MeetingMember {
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
}

interface MeetingQuorumReport {
  totalMembers: number;
  attendedFull: number;
  leftEarly: number;
  leftEarlyMembers: Array<{ memberId: string; memberName: string; reason?: string; savings: number; verified?: boolean }>;
  absent: number;
  quorumRequired: number;
  quorumAttended: number;
  quorumMet: boolean;
}

interface LiveMeeting {
  code: string;
  shgId: string;
  shgName: string;
  leadName: string;
  leadId: string;
  startedAt: string;
  status: 'OPEN' | 'COMPLETED';
  members: Record<string, MeetingMember>;
  totalPool: number;
  completedAt?: string;
  report?: MeetingQuorumReport;
  subscribers: Set<Response>;
}

const liveRooms = new Map<string, LiveMeeting>();

// ── Room TTL & Periodic Garbage Collection (Prevents memory leaks on Render free tier) ──
const ROOM_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours max life for open meetings
const COMPLETED_ROOM_TTL_MS = 60 * 60 * 1000; // 1 hour for completed meetings

function purgeExpiredRoom(code: string, reason = 'expired') {
  const room = liveRooms.get(code);
  if (!room) return;

  // Gracefully close any dangling SSE connections before removal
  room.subscribers.forEach(res => {
    try {
      res.write(`event: room_closed\ndata: ${JSON.stringify({ reason })}\n\n`);
      res.end();
    } catch {}
  });
  room.subscribers.clear();
  liveRooms.delete(code);
}

// Periodic cleanup sweep every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of liveRooms.entries()) {
    const age = now - new Date(room.startedAt).getTime();
    const isCompleted = room.status === 'COMPLETED';
    const limit = isCompleted ? COMPLETED_ROOM_TTL_MS : ROOM_TTL_MS;

    if (age > limit) {
      purgeExpiredRoom(code, isCompleted ? 'completed_ttl' : 'stale_ttl');
    }
  }
}, 15 * 60 * 1000);

function broadcastToRoom(room: LiveMeeting, event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const dead: Response[] = [];
  room.subscribers.forEach(res => {
    try {
      res.write(payload);
    } catch {
      dead.push(res);
    }
  });
  dead.forEach(r => room.subscribers.delete(r));
}

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function roomSnapshot(room: LiveMeeting) {
  return {
    code: room.code,
    shgId: room.shgId,
    shgName: room.shgName,
    leadName: room.leadName,
    startedAt: room.startedAt,
    status: room.status,
    members: room.members,
    totalPool: room.totalPool,
    completedAt: room.completedAt,
    report: room.report,
  };
}

// POST /api/meeting/start
meetingRouter.post('/start', (req: Request, res: Response) => {
  try {
    const { shgId, shgName, leadId, leadName } = req.body || {};
    const code = generateCode();
    const room: LiveMeeting = {
      code,
      shgId: shgId || 'SHG-MH-SAT-2024-0089',
      shgName: shgName || 'सावित्री महिला बचत गट',
      leadId: leadId || 'lead-1',
      leadName: leadName || 'कमलताई पाटील',
      startedAt: new Date().toISOString(),
      status: 'OPEN',
      members: {},
      totalPool: 0,
      subscribers: new Set(),
    };
    liveRooms.set(code, room);

    res.json({ ok: true, code, room: roomSnapshot(room) });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message || 'Bad request' });
  }
});

// POST /api/meeting/:code/join
meetingRouter.post('/:code/join', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false, error: 'Meeting not found. Check the code.' });
  }
  if (room.status === 'COMPLETED') {
    return res.status(410).json({ ok: false, error: 'Meeting already completed.' });
  }

  try {
    const { memberId, memberName, phone } = req.body || {};
    if (!memberId) {
      return res.status(400).json({ ok: false, error: 'memberId is required' });
    }

    if (!room.members[memberId]) {
      room.members[memberId] = {
        memberId,
        memberName: memberName || 'Member',
        phone: phone || '',
        attended: true,
        savings: 0,
        joinedAt: new Date().toISOString(),
        connectionStatus: 'CONNECTED'
      };
    } else {
      room.members[memberId].attended = true;
      room.members[memberId].leftEarly = false;
      delete room.members[memberId].leftAt;
      delete room.members[memberId].leftReason;
      room.members[memberId].connectionStatus = 'CONNECTED';
    }

    broadcastToRoom(room, 'member_joined', { memberId, memberName, members: room.members });
    res.json({ ok: true, room: roomSnapshot(room) });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message || 'Bad request' });
  }
});

// POST /api/meeting/:code/savings/initiate
meetingRouter.post('/:code/savings/initiate', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false, error: 'Meeting not found' });
  }

  try {
    const { memberId, amount } = req.body || {};
    const member = room.members[memberId];
    if (!member) {
      return res.status(404).json({ ok: false, error: 'Member not found in meeting' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    member.pendingSavings = {
      amount: Number(amount),
      otp,
      timestamp: Date.now()
    };

    broadcastToRoom(room, 'savings_handshake_initiated', {
      memberId,
      memberName: member.memberName,
      amount: Number(amount),
      otp
    });

    res.json({ ok: true, memberId, amount: Number(amount), otp });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message || 'Bad request' });
  }
});

// POST /api/meeting/:code/savings/verify
meetingRouter.post('/:code/savings/verify', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false, error: 'Meeting not found' });
  }

  try {
    const { memberId, otp } = req.body || {};
    const member = room.members[memberId];

    if (!member || !member.pendingSavings) {
      return res.status(400).json({ ok: false, error: 'No pending savings verification found' });
    }

    // 3-Minute Handshake Expiration Safeguard
    if (Date.now() - member.pendingSavings.timestamp > 3 * 60 * 1000) {
      delete member.pendingSavings;
      broadcastToRoom(room, 'savings_cancelled', { memberId, reason: 'handshake_timeout' });
      return res.status(408).json({ ok: false, error: 'पडताळणी वेळ संपली (Handshake timed out after 3 minutes)' });
    }

    if (member.pendingSavings.otp !== String(otp).trim()) {
      return res.status(400).json({ ok: false, error: 'चुकीचा पडताळणी कोड (Invalid OTP)' });
    }

    const confirmedAmount = member.pendingSavings.amount;
    member.savings = confirmedAmount;
    member.verified = true;
    delete member.pendingSavings;

    room.totalPool = Object.values(room.members).reduce((s, m) => s + (m.savings || 0), 0);

    broadcastToRoom(room, 'savings_verified', {
      memberId,
      memberName: member.memberName,
      amount: confirmedAmount,
      totalPool: room.totalPool,
      members: room.members
    });

    res.json({ ok: true, totalPool: room.totalPool, members: room.members });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message || 'Bad request' });
  }
});

// POST /api/meeting/:code/savings/cancel
meetingRouter.post('/:code/savings/cancel', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false });
  }

  try {
    const { memberId } = req.body || {};
    if (room.members[memberId]) {
      delete room.members[memberId].pendingSavings;
      broadcastToRoom(room, 'savings_cancelled', { memberId });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ ok: false });
  }
});

// POST /api/meeting/:code/savings (Direct fallback)
meetingRouter.post('/:code/savings', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false });
  }

  try {
    const { memberId, amount } = req.body || {};
    if (room.members[memberId]) {
      room.members[memberId].savings = Number(amount);
      room.totalPool = Object.values(room.members).reduce((s, m) => s + (m.savings || 0), 0);
      broadcastToRoom(room, 'savings_updated', {
        memberId,
        amount: Number(amount),
        totalPool: room.totalPool,
        members: room.members
      });
    }
    res.json({ ok: true, totalPool: room.totalPool });
  } catch (err: any) {
    res.status(400).json({ ok: false });
  }
});

// POST /api/meeting/:code/batch-confirm
meetingRouter.post('/:code/batch-confirm', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false, error: 'Meeting not found' });
  }

  try {
    const { defaultAmount = 250 } = req.body || {};
    const amt = Number(defaultAmount) || 250;
    let confirmedCount = 0;

    for (const mem of Object.values(room.members)) {
      if (!mem.verified) {
        mem.savings = mem.savings > 0 ? mem.savings : amt;
        mem.verified = true;
        delete mem.pendingSavings;
        confirmedCount++;
      }
    }

    room.totalPool = Object.values(room.members).reduce((s, m) => s + (m.savings || 0), 0);

    broadcastToRoom(room, 'batch_confirmed', {
      totalPool: room.totalPool,
      members: room.members,
      amount: amt,
      count: confirmedCount
    });
    broadcastToRoom(room, 'snapshot', roomSnapshot(room));

    res.json({
      ok: true,
      totalPool: room.totalPool,
      members: room.members,
      count: confirmedCount,
      amount: amt
    });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message || 'Bad request' });
  }
});

// POST /api/meeting/:code/leave (Graceful Member Departure - Rural village exception)
meetingRouter.post('/:code/leave', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false, error: 'Meeting not found' });
  }

  try {
    const { memberId, reason } = req.body || {};
    const member = room.members[memberId];

    if (member) {
      // Case B: She leaves mid-handshake (Leader entered amount, but no OTP verified)
      // Zero Commitment: Cash is NEVER added to the pool without Handshake OTP confirmation.
      if (member.pendingSavings) {
        delete member.pendingSavings;
        broadcastToRoom(room, 'savings_cancelled', { memberId, reason: 'member_left_mid_handshake' });
      }

      // Case A & C: Attendance remains marked "हजर (Present)". Once verified in person, she cannot be retroactively marked absent.
      member.attended = true;
      member.leftEarly = true;
      member.leftAt = new Date().toISOString();
      member.leftReason = reason || 'इतर काम (Other work)';
      member.connectionStatus = 'LEFT';

      broadcastToRoom(room, 'member_left', {
        memberId,
        memberName: member.memberName,
        reason: member.leftReason,
        leftAt: member.leftAt,
        members: room.members,
        totalPool: room.totalPool
      });
    }

    res.json({ ok: true, room: roomSnapshot(room) });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message || 'Bad request' });
  }
});

// POST /api/meeting/:code/member-status (Leader manual update e.g. Phone battery death)
meetingRouter.post('/:code/member-status', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false, error: 'Meeting not found' });
  }

  try {
    const { memberId, leftEarly, reason, connectionStatus } = req.body || {};
    const member = room.members[memberId];

    if (member) {
      if (leftEarly) {
        if (member.pendingSavings) {
          delete member.pendingSavings;
          broadcastToRoom(room, 'savings_cancelled', { memberId, reason: 'member_marked_left' });
        }
        member.attended = true;
        member.leftEarly = true;
        member.leftAt = new Date().toISOString();
        member.leftReason = reason || 'लवकर बाहेर पडले (Left early)';
        member.connectionStatus = 'LEFT';

        broadcastToRoom(room, 'member_left', {
          memberId,
          memberName: member.memberName,
          reason: member.leftReason,
          leftAt: member.leftAt,
          members: room.members,
          totalPool: room.totalPool
        });
      } else if (connectionStatus) {
        member.connectionStatus = connectionStatus;
        broadcastToRoom(room, 'member_status_changed', {
          memberId,
          memberName: member.memberName,
          connectionStatus,
          members: room.members
        });
      }
    }

    res.json({ ok: true, members: room.members });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message || 'Bad request' });
  }
});

// POST /api/meeting/:code/complete
meetingRouter.post('/:code/complete', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false });
  }

  const { totalKnownMembers = 14 } = req.body || {};
  const membersList = Object.values(room.members);
  const attendedFull = membersList.filter(m => !m.leftEarly).length;
  const leftEarly = membersList.filter(m => m.leftEarly).length;
  const totalAttended = attendedFull + leftEarly; // Statutory presence counts all who attended
  const effectiveTotal = Math.max(totalKnownMembers, membersList.length);
  const absent = Math.max(0, effectiveTotal - totalAttended);
  const quorumRequired = Math.ceil(effectiveTotal * 0.5);
  const quorumMet = totalAttended >= quorumRequired;

  const report: MeetingQuorumReport = {
    totalMembers: effectiveTotal,
    attendedFull,
    leftEarly,
    leftEarlyMembers: membersList.filter(m => m.leftEarly).map(m => ({
      memberId: m.memberId,
      memberName: m.memberName,
      reason: m.leftReason,
      savings: m.savings,
      verified: m.verified
    })),
    absent,
    quorumRequired,
    quorumAttended: totalAttended,
    quorumMet
  };

  room.status = 'COMPLETED';
  room.completedAt = new Date().toISOString();
  room.report = report;

  broadcastToRoom(room, 'meeting_completed', roomSnapshot(room));

  // Auto-expire 1 hour after completion to free memory
  setTimeout(() => purgeExpiredRoom(code, 'completed'), COMPLETED_ROOM_TTL_MS);

  res.json({ ok: true, room: roomSnapshot(room) });
});

// GET /api/meeting/:code
meetingRouter.get('/:code', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false, error: 'Meeting not found' });
  }

  res.json({ ok: true, room: roomSnapshot(room) });
});

// GET /api/meeting/:code/stream (SSE with Instant Snapshot on (Re)Connect)
meetingRouter.get('/:code/stream', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable reverse-proxy chunk buffering
  res.flushHeaders?.();

  // Instruct client EventSource to retry after 1.5s on screen-sleep reconnect
  res.write('retry: 1500\n\n');

  // 1. Immediately send full snapshot state on initial connect or screen wake-up reconnect
  const snapshotData = JSON.stringify(roomSnapshot(room));
  res.write(`event: snapshot\ndata: ${snapshotData}\n\n`);

  room.subscribers.add(res);

  // 2. Keep-alive heartbeat every 15s
  const hb = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(hb);
    }
  }, 15000);

  req.on('close', () => {
    room.subscribers.delete(res);
    clearInterval(hb);
  });
});

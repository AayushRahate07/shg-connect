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
  subscribers: Set<Response>;
}

const liveRooms = new Map<string, LiveMeeting>();

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

    // Expire after 6 hours
    setTimeout(() => liveRooms.delete(code), 6 * 60 * 60 * 1000);

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
        joinedAt: new Date().toISOString()
      };
    } else {
      room.members[memberId].attended = true;
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

// POST /api/meeting/:code/complete
meetingRouter.post('/:code/complete', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).json({ ok: false });
  }

  room.status = 'COMPLETED';
  room.completedAt = new Date().toISOString();
  broadcastToRoom(room, 'meeting_completed', roomSnapshot(room));
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

// GET /api/meeting/:code/stream (SSE)
meetingRouter.get('/:code/stream', (req: Request, res: Response) => {
  const code = req.params.code;
  const room = liveRooms.get(code);

  if (!room) {
    return res.status(404).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send current state immediately on connect
  res.write(`event: snapshot\ndata: ${JSON.stringify(roomSnapshot(room))}\n\n`);

  room.subscribers.add(res);

  // Heartbeat every 20s
  const hb = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(hb);
    }
  }, 20000);

  req.on('close', () => {
    room.subscribers.delete(res);
    clearInterval(hb);
  });
});

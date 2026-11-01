import React, { useState, useEffect, useRef } from 'react';
import { SupportedLanguage } from '../../types/shg';
import { Member } from '../../types/shg';
import { liveMeetingApi, LiveMeetingRoom, LiveMember } from '../../services/liveMeeting';
import { tts } from '../../services/tts';
import { sound } from '../../services/sound';
import {
  Radio, Users, IndianRupee, CheckCircle2, Loader2,
  Copy, Check, AlertCircle, Flag, ShieldCheck, KeyRound, Sparkles
} from 'lucide-react';

interface Props {
  shgId: string;
  shgName: string;
  leadId: string;
  leadName: string;
  knownMembers: Member[];
  language: SupportedLanguage;
  onComplete: (room: LiveMeetingRoom) => void;
  onCancel: () => void;
}

interface VerifyModalState {
  open: boolean;
  memberId: string;
  memberName: string;
  amount: number;
  expectedOtp: string;
  otpInput: string;
  error: string;
  loading: boolean;
}

export const LeadLiveMeeting: React.FC<Props> = ({
  shgId, shgName, leadId, leadName, knownMembers, language, onComplete, onCancel
}) => {
  const isMr = language === 'mr';
  const t = (mr: string, en: string) => isMr ? mr : en;

  const [phase, setPhase] = useState<'STARTING' | 'LIVE' | 'COMPLETING'>('STARTING');
  const [room, setRoom] = useState<LiveMeetingRoom | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingsInputs, setSavingsInputs] = useState<Record<string, string>>({});
  const [verifyModal, setVerifyModal] = useState<VerifyModalState>({
    open: false,
    memberId: '',
    memberName: '',
    amount: 0,
    expectedOtp: '',
    otpInput: '',
    error: '',
    loading: false
  });
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => { esRef.current?.close(); }, []);

  const attachSubscription = (roomCode: string) => {
    esRef.current?.close();
    const es = liveMeetingApi.subscribe(roomCode, {
      onSnapshot: r => {
        setRoom(r);
        setVerifyModal(prev => {
          if (prev.open && prev.memberId && !r.members[prev.memberId]?.pendingSavings) {
            return { ...prev, open: false };
          }
          return prev;
        });
      },
      onMemberJoined: ({ memberName, members }) => {
        setRoom(prev => prev ? { ...prev, members } : prev);
        sound.playStampSound();
        tts.speak(t(`${memberName} सामील झाले`, `${memberName} joined`));
      },
      onSavingsUpdated: ({ members, totalPool }) => {
        setRoom(prev => prev ? { ...prev, members, totalPool } : prev);
      },
      onSavingsVerified: ({ memberName, amount, members, totalPool }) => {
        setRoom(prev => prev ? { ...prev, members, totalPool } : prev);
        sound.playStampSound();
        tts.speak(t(`${memberName} यांची ₹${amount} बचत पडताळली`, `Verified ₹${amount} savings for ${memberName}`));
      },
      onSavingsCancelled: ({ memberId }) => {
        setRoom(prev => {
          if (!prev || !prev.members[memberId]) return prev;
          const updatedMembers = { ...prev.members };
          delete updatedMembers[memberId].pendingSavings;
          return { ...prev, members: updatedMembers };
        });
        setVerifyModal(prev => (prev.open && prev.memberId === memberId ? { ...prev, open: false } : prev));
      },
      onRoomClosed: () => {
        setError(t('बैठक समाप्त झाली किंवा वेळ संपली.', 'Meeting ended or session expired.'));
      }
    });
    esRef.current = es;
    return es;
  };

  // Immediate state resynchronization when leader phone wakes up from sleep
  useEffect(() => {
    const handleWakeSync = async () => {
      if (document.visibilityState === 'visible' && room?.code && phase === 'LIVE') {
        try {
          const res = await liveMeetingApi.getRoom(room.code);
          if (res.ok && res.room) {
            setRoom(res.room);
            setVerifyModal(prev => {
              if (prev.open && prev.memberId && !res.room!.members[prev.memberId]?.pendingSavings) {
                return { ...prev, open: false };
              }
              return prev;
            });
          }
        } catch {}

        if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
          attachSubscription(room.code);
        }
      }
    };

    document.addEventListener('visibilitychange', handleWakeSync);
    window.addEventListener('focus', handleWakeSync);
    return () => {
      document.removeEventListener('visibilitychange', handleWakeSync);
      window.removeEventListener('focus', handleWakeSync);
    };
  }, [room?.code, phase]);

  // Auto-start the room on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await liveMeetingApi.start(shgId, shgName, leadId, leadName);
        if (!res.ok) { setError('Failed to start meeting room'); return; }
        setRoom(res.room);
        setPhase('LIVE');
        attachSubscription(res.code);
      } catch {
        setError(t('सर्व्हरशी जोडणी अयशस्वी. Dev सर्व्हर सुरू आहे का?', 'Could not connect. Is the dev server running?'));
      }
    })();
  }, []);

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavingsChange = (memberId: string, val: string) => {
    setSavingsInputs(prev => ({ ...prev, [memberId]: val.replace(/\D/g, '') }));
  };

  // Step 1: Leader enters amount and initiates handshake
  const handleInitiateSavings = async (memberId: string) => {
    if (!room) return;
    const amount = parseInt(savingsInputs[memberId] || '0', 10);
    if (!amount || amount <= 0) return;
    const memberName = room.members[memberId]?.memberName || 'सभासद';

    try {
      const res = await liveMeetingApi.initiateSavings(room.code, memberId, amount);
      if (res.ok && res.otp) {
        setVerifyModal({
          open: true,
          memberId,
          memberName,
          amount,
          expectedOtp: res.otp,
          otpInput: '',
          error: '',
          loading: false
        });
        sound.playStampSound();
        tts.speak(t(`${memberName} यांच्या फोनवर पडताळणी कोड पाठवला`, `Handshake code sent to ${memberName}`));
      } else {
        setError(res.error || 'Failed to initiate verification');
      }
    } catch {
      setError(t('पडताळणी सुरू करता आली नाही.', 'Could not initiate handshake.'));
    }
  };

  // Step 2: Leader submits member's handshake OTP
  const handleConfirmOtp = async () => {
    if (!room || !verifyModal.memberId) return;
    if (verifyModal.otpInput.trim().length !== 4) {
      setVerifyModal(prev => ({ ...prev, error: t('कृपया ४-अंकी कोड टाका', 'Please enter 4-digit code') }));
      return;
    }

    setVerifyModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await liveMeetingApi.verifySavings(room.code, verifyModal.memberId, verifyModal.otpInput);
      if (res.ok) {
        sound.playStampSound();
        setVerifyModal(prev => ({ ...prev, open: false, loading: false }));
        // Clear input for this member
        setSavingsInputs(prev => ({ ...prev, [verifyModal.memberId]: '' }));
      } else {
        setVerifyModal(prev => ({ ...prev, loading: false, error: res.error || t('चुकीचा कोड. पुन्हा तपासा.', 'Invalid code. Check again.') }));
      }
    } catch {
      setVerifyModal(prev => ({ ...prev, loading: false, error: t('पडताळणी अयशस्वी.', 'Verification failed.') }));
    }
  };

  const handleCancelHandshake = async () => {
    if (room && verifyModal.memberId) {
      await liveMeetingApi.cancelSavings(room.code, verifyModal.memberId);
    }
    setVerifyModal(prev => ({ ...prev, open: false }));
  };

  const handleComplete = async () => {
    if (!room) return;
    setPhase('COMPLETING');
    const res = await liveMeetingApi.complete(room.code);
    if (res.ok) {
      sound.playStampSound();
      tts.speak(t('बैठक पूर्ण झाली', 'Meeting completed'));
      onComplete(res.room);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl p-6 border border-rose-200 space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-sm text-rose-700 font-bold text-center">{error}</p>
          <button onClick={onCancel} className="w-full py-2 bg-stone-100 text-stone-700 rounded-xl text-sm font-bold">
            {t('परत जा', 'Go Back')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'STARTING' || !room) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  const members = Object.values(room.members);

  return (
    <div className="min-h-screen bg-stone-50 pb-8 relative">

      {/* 🛡️ LEADER HANDSHAKE VERIFICATION MODAL */}
      {verifyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-emerald-500 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-emerald-50">
              <KeyRound className="w-6 h-6 text-emerald-700" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                {t('🛡️ रक्कम पडताळणी कोड (Mutual Handshake)', '🛡️ Mutual Amount Verification')}
              </span>
              <h3 className="text-base font-black text-stone-900 mt-2">
                {verifyModal.memberName}
              </h3>
              <div className="text-3xl font-black text-emerald-700">
                ₹{verifyModal.amount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-stone-600 font-medium">
                {t('सभासदांच्या मोबाईल स्क्रीनवर दिसणारा ४-अंकी कोड विचारा आणि येथे टाका:', 'Ask member for the 4-digit code shown on their screen:')}
              </p>
            </div>

            {/* OTP Input */}
            <div className="space-y-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={verifyModal.otpInput}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setVerifyModal(prev => ({ ...prev, otpInput: val, error: '' }));
                }}
                placeholder="• • • •"
                className="w-full text-center text-3xl font-black tracking-[0.5em] py-3 bg-stone-50 border-2 border-emerald-500 rounded-xl outline-none text-stone-900 focus:ring-4 focus:ring-emerald-100"
                autoFocus
              />

              {/* Quick assist demo chip */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setVerifyModal(prev => ({ ...prev, otpInput: prev.expectedOtp }))}
                  className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{t(`सभासद कोड: ${verifyModal.expectedOtp} (येथे भरा)`, `Member Code: ${verifyModal.expectedOtp} (Auto-fill)`)}</span>
                </button>
              </div>

              {verifyModal.error && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <p className="text-xs text-rose-700 font-semibold">{verifyModal.error}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleConfirmOtp}
                disabled={verifyModal.otpInput.length !== 4 || verifyModal.loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                {verifyModal.loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>{t('पडताळत आहे...', 'Verifying...')}</span></>
                ) : (
                  <><Check className="w-4 h-4" /><span>{t('सत्यापित करा व जमा करा', 'Verify & Deposit')}</span></>
                )}
              </button>

              <button
                onClick={handleCancelHandshake}
                className="w-full text-xs text-stone-500 hover:text-stone-700 font-bold py-2"
              >
                {t('रद्द करा', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-emerald-800 px-4 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-300 text-xs font-black uppercase tracking-wide">{t('थेट बैठक', 'Live Meeting')}</span>
        </div>
        <h1 className="text-white text-lg font-black">{shgName}</h1>
        <p className="text-emerald-300 text-xs font-medium mt-0.5">{t('प्रमुख', 'Led by')}: {leadName}</p>

        {/* Big Code Display */}
        <div className="mt-5 bg-white/10 border border-white/20 rounded-2xl p-5 text-center space-y-2">
          <p className="text-emerald-200 text-[11px] font-black uppercase tracking-widest">{t('बैठक कोड — सभासदांना सांगा', 'Meeting Code — Share with members')}</p>
          <div className="text-5xl font-black text-white tracking-[0.3em]">{room.code}</div>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? t('कॉपी झाले!', 'Copied!') : t('कोड कॉपी करा', 'Copy Code')}
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Stats Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 grid grid-cols-2 divide-x divide-stone-100">
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-stone-900">{members.length}</p>
            <p className="text-[10px] text-stone-500 font-bold">{t('सामील', 'Joined')}</p>
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IndianRupee className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-stone-900">₹{room.totalPool.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-stone-500 font-bold">{t('एकूण जमा', 'Pool')}</p>
          </div>
        </div>

        {/* Members Waiting / Savings Entry */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div className="p-4 border-b border-stone-100">
            <p className="text-xs font-black text-stone-700 uppercase tracking-wider">{t('उपस्थित सभासद', 'Present Members')}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">{t('रक्कम नोंदवून सभासदाच्या स्क्रीनवरील कोडने पडताळा', 'Enter amount & verify with code from member phone')}</p>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Radio className="w-8 h-8 text-stone-300 mx-auto animate-pulse" />
              <p className="text-sm text-stone-400 font-medium">{t('सभासदांची प्रतीक्षा आहे...', 'Waiting for members to join...')}</p>
              <p className="text-xs text-stone-300">{t('कोड शेअर करा: ' + room.code, 'Share code: ' + room.code)}</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {members.map(m => (
                <div key={m.memberId} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-stone-800">{m.memberName}</span>
                    </div>
                    {m.verified ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                        <Check className="w-3 h-3 text-emerald-700" />
                        ₹{m.savings.toLocaleString('en-IN')} {t('पडताळले', 'verified')}
                      </span>
                    ) : m.savings > 0 ? (
                      <span className="text-xs bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                        ₹{m.savings.toLocaleString('en-IN')}
                      </span>
                    ) : null}
                  </div>

                  {/* Savings Input & Handshake Trigger */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-bold">₹</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={savingsInputs[m.memberId] ?? (m.savings > 0 ? m.savings.toString() : '')}
                        onChange={e => handleSavingsChange(m.memberId, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleInitiateSavings(m.memberId);
                        }}
                        placeholder={t('बचत रक्कम (उदा. ५००)', 'Amount (e.g. 500)')}
                        className="w-full pl-7 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500"
                      />
                    </div>

                    {m.pendingSavings ? (
                      <button
                        onClick={() => {
                          setVerifyModal({
                            open: true,
                            memberId: m.memberId,
                            memberName: m.memberName,
                            amount: m.pendingSavings!.amount,
                            expectedOtp: m.pendingSavings!.otp,
                            otpInput: '',
                            error: '',
                            loading: false
                          });
                        }}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1 animate-pulse"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{t('कोड टाका', 'Enter OTP')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInitiateSavings(m.memberId)}
                        disabled={!savingsInputs[m.memberId]}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-black rounded-xl transition flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t('नोंदवा', 'Save')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complete Meeting */}
        {members.length > 0 && (
          <button
            onClick={handleComplete}
            disabled={phase === 'COMPLETING'}
            className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
          >
            {phase === 'COMPLETING'
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t('पूर्ण करत आहे...', 'Completing...')}</>
              : <><Flag className="w-4 h-4 text-amber-300" />{t('बैठक पूर्ण करा', 'Complete Meeting')}</>}
          </button>
        )}

        <button onClick={onCancel} className="w-full text-xs text-stone-400 font-semibold text-center py-2">
          {t('रद्द करा', 'Cancel')}
        </button>
      </div>
    </div>
  );
};

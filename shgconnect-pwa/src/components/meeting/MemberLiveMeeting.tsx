import React, { useState, useEffect, useRef } from 'react';
import { SupportedLanguage } from '../../types/shg';
import { liveMeetingApi, LiveMeetingRoom, BASE } from '../../services/liveMeeting';
import { tts } from '../../services/tts';
import { sound } from '../../services/sound';
import {
  CheckCircle2, Users, IndianRupee, Loader2,
  LogOut, Radio, ArrowRight, AlertCircle, Wifi, ShieldCheck, Check,
  Clock, Sparkles, X
} from 'lucide-react';

interface Props {
  memberId: string;
  memberName: string;
  phone: string;
  language: SupportedLanguage;
  onLeave: () => void;
}

type Phase = 'ENTER_CODE' | 'JOINING' | 'LIVE' | 'COMPLETED' | 'ERROR';

export const MemberLiveMeeting: React.FC<Props> = ({ memberId, memberName, phone, language, onLeave }) => {
  const isMr = language === 'mr';
  const [phase, setPhase] = useState<Phase>('ENTER_CODE');
  const [code, setCode] = useState('');
  const [room, setRoom] = useState<LiveMeetingRoom | null>(null);
  const [error, setError] = useState('');
  const [pendingHandshake, setPendingHandshake] = useState<{ amount: number; otp: string } | null>(null);
  const [showVerifiedToast, setShowVerifiedToast] = useState<{ amount: number } | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('बालक रडत आहे (Child crying)');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // Monitor network connection drop / recovery
  useEffect(() => {
    const handleOffline = () => {
      setIsReconnecting(true);
      if (code) {
        liveMeetingApi.markMemberStatus(code, memberId, { connectionStatus: 'DISCONNECTED' }).catch(() => {});
      }
    };
    const handleOnline = () => {
      setIsReconnecting(false);
      if (code) {
        liveMeetingApi.markMemberStatus(code, memberId, { connectionStatus: 'CONNECTED' }).catch(() => {});
      }
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [code, memberId]);

  // ── Intercept Android/Browser Back Button & Tab Close / Navigation ─────────
  useEffect(() => {
    if (phase !== 'LIVE' || !room?.code) return;

    // Push dummy state to capture physical or browser back button
    window.history.pushState({ inMeeting: true }, '');

    const handlePopState = () => {
      // User tapped hardware Back or browser Back button:
      // Show clean Leave confirmation modal instead of silently quitting!
      setShowLeaveModal(true);
      // Re-push state so next back also doesn't abruptly close app
      window.history.pushState({ inMeeting: true }, '');
    };

    // When tab is closed, refreshed, or switched away
    const handleUnloadDeparture = () => {
      // Use sendBeacon or keepalive fetch so the server reliably receives departure
      const payload = JSON.stringify({
        memberId,
        reason: isMr ? 'टॅब बंद केला / मागे गेले' : 'Closed tab / Back'
      });
      const leaveUrl = `${BASE}/api/meeting/${room.code}/leave`;
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(leaveUrl, blob);
      } else {
        fetch(leaveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pagehide', handleUnloadDeparture);
    window.addEventListener('beforeunload', handleUnloadDeparture);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pagehide', handleUnloadDeparture);
      window.removeEventListener('beforeunload', handleUnloadDeparture);
    };
  }, [phase, room?.code, memberId, isMr]);

  // Cleanup SSE on unmount
  useEffect(() => () => { esRef.current?.close(); }, []);

  const t = (mr: string, en: string) => isMr ? mr : en;

  const attachSubscription = (roomCode: string) => {
    esRef.current?.close();
    const es = liveMeetingApi.subscribe(roomCode, {
      onSnapshot: (r) => {
        setRoom(prev => {
          const wasVerified = prev?.members[memberId]?.verified;
          const isNowVerified = r.members[memberId]?.verified;
          if (!wasVerified && isNowVerified) {
            setShowVerifiedToast({ amount: r.members[memberId].savings || 0 });
            sound.playStampSound();
            tts.speak(isMr ? `आपली ₹${r.members[memberId].savings || 0} बचत जमा झाली` : `Your savings is verified`);
            setTimeout(() => setShowVerifiedToast(null), 6000);
          }
          return r;
        });
        setIsReconnecting(false);
        if (r.status === 'COMPLETED') {
          setPhase('COMPLETED');
        }
        if (r.members[memberId]?.pendingSavings) {
          setPendingHandshake(r.members[memberId].pendingSavings!);
        } else {
          setPendingHandshake(null);
        }
      },
      onMemberJoined: ({ members }) => setRoom(prev => prev ? { ...prev, members } : prev),
      onMemberLeft: (data) => {
        setRoom(prev => prev ? { ...prev, members: data.members, totalPool: data.totalPool } : prev);
        if (data.memberId === memberId) {
          sound.playStampSound();
          tts.speak(t('आपण बैठकीतून बाहेर पडला आहात. उपस्थिती सुरक्षित आहे.', 'You have left the meeting. Attendance is saved.'));
        }
      },
      onMemberStatusChanged: (data) => {
        setRoom(prev => prev ? { ...prev, members: data.members } : prev);
      },
      onSavingsUpdated: ({ members, totalPool }) => {
        setRoom(prev => prev ? { ...prev, members, totalPool } : prev);
      },
      onSavingsHandshakeInitiated: (data) => {
        if (data.memberId === memberId) {
          setPendingHandshake({ amount: data.amount, otp: data.otp });
          sound.playStampSound();
          tts.speak(t(
            `बचत पडताळणी. प्रमुखाने ${data.amount} रुपये नोंदवले. पडताळणी कोड ${data.otp.split('').join(' ')}`,
            `Savings verification. Leader recorded ${data.amount} rupees. Verification code is ${data.otp}`
          ));
        }
      },
      onSavingsVerified: (data) => {
        setRoom(prev => prev ? { ...prev, members: data.members, totalPool: data.totalPool } : prev);
        if (data.memberId === memberId) {
          setPendingHandshake(null);
          setShowVerifiedToast({ amount: data.amount });
          sound.playStampSound();
          tts.speak(t(`${data.amount} रुपयांची बचत पडताळली आणि जमा झाली`, `Savings of ${data.amount} rupees verified and deposited`));
          setTimeout(() => setShowVerifiedToast(null), 5000);
        }
      },
      onBatchConfirmed: (data) => {
        setRoom(prev => prev ? { ...prev, members: data.members, totalPool: data.totalPool } : prev);
        const myRec = data.members[memberId];
        if (myRec?.verified) {
          setPendingHandshake(null);
          setShowVerifiedToast({ amount: myRec.savings || data.amount });
          sound.playStampSound();
          tts.speak(isMr ? `आपली ₹${myRec.savings || data.amount} बचत प्रमुखांनी मंजूर केली` : `Your savings of ₹${myRec.savings || data.amount} is approved`);
          setTimeout(() => setShowVerifiedToast(null), 6000);
        }
      },
      onSavingsCancelled: (data) => {
        if (data.memberId === memberId) {
          setPendingHandshake(null);
        }
      },
      onMeetingCompleted: (r) => {
        setRoom(r);
        setPhase('COMPLETED');
        sound.playStampSound();
        tts.speak(t('बैठक पूर्ण झाली. आपली उपस्थिती व बचत नोंदवली गेली.', 'Meeting completed. Your attendance and savings are recorded.'));
      },
      onRoomClosed: () => {
        setError(t('बैठक समाप्त झाली किंवा वेळ संपली.', 'Meeting ended or session expired.'));
        setPhase('COMPLETED');
      },
    }, memberId);

    es.onerror = () => {
      setIsReconnecting(true);
    };

    esRef.current = es;
    return es;
  };

  // Immediate state resynchronization when mobile screen wakes up from sleep
  useEffect(() => {
    const handleWakeSync = async () => {
      if (document.visibilityState === 'visible' && code && phase === 'LIVE') {
        try {
          const res = await liveMeetingApi.getRoom(code);
          if (res.ok && res.room) {
            setRoom(res.room);
            if (res.room.status === 'COMPLETED') {
              setPhase('COMPLETED');
            }
            if (res.room.members[memberId]?.pendingSavings) {
              setPendingHandshake(res.room.members[memberId].pendingSavings!);
            } else {
              setPendingHandshake(null);
            }
          }
        } catch {}

        if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
          attachSubscription(code);
        }
      }
    };

    document.addEventListener('visibilitychange', handleWakeSync);
    window.addEventListener('focus', handleWakeSync);
    return () => {
      document.removeEventListener('visibilitychange', handleWakeSync);
      window.removeEventListener('focus', handleWakeSync);
    };
  }, [code, phase, memberId]);

  const handleJoin = async () => {
    if (code.length !== 4) return;
    setPhase('JOINING');
    setError('');
    try {
      const res = await liveMeetingApi.join(code, memberId, memberName, phone);
      if (!res.ok || !res.room) {
        setError(res.error || t('बैठक सापडली नाही. कोड तपासा.', 'Meeting not found. Check the code.'));
        setPhase('ENTER_CODE');
        return;
      }
      setRoom(res.room);
      if (res.room.status === 'COMPLETED') { setPhase('COMPLETED'); return; }

      if (res.room.members[memberId]?.pendingSavings) {
        setPendingHandshake(res.room.members[memberId].pendingSavings!);
      }

      attachSubscription(code);
      setPhase('LIVE');
      sound.playStampSound();
      tts.speak(t('बैठकीत सामील झालात. उपस्थिती नोंदवली.', 'Joined the meeting. Attendance marked.'));
    } catch {
      setError(t('सर्व्हरशी जोडणी अयशस्वी.', 'Could not connect to server.'));
      setPhase('ENTER_CODE');
    }
  };

  const handleConfirmLeave = async () => {
    if (!room) {
      onLeave();
      return;
    }
    setIsLeaving(true);
    try {
      await liveMeetingApi.leave(room.code, memberId);
    } catch {}
    esRef.current?.close();
    sound.playStampSound();
    tts.speak(isMr ? 'बैठकीतून बाहेर पडलात.' : 'Left meeting.');
    setIsLeaving(false);
    setShowLeaveModal(false);
    onLeave();
  };

  const myRecord = room?.members?.[memberId];

  // ── ENTER CODE ─────────────────────────────────────────────────────────────
  if (phase === 'ENTER_CODE' || phase === 'JOINING') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-xl border border-stone-200 p-6 space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-lg flex items-center justify-center mx-auto border border-emerald-100">
              <Radio className="w-6 h-6 text-emerald-800" />
            </div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight">
              {t('थेट बैठकीत सामील व्हा', 'Join Live Meeting')}
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              {t('गट प्रमुखांनी दिलेला ४-अंकी बैठक कोड टाका', 'Enter the 4-digit code given by your Lead')}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1 text-center">
                {t('बैठक कोड (४ अंक)', 'Meeting Code')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                placeholder="• • • •"
                className="w-full text-center text-3xl font-black tracking-[0.4em] py-3 bg-stone-50 border-2 border-stone-300 focus:border-emerald-700 rounded-lg outline-none text-stone-900 transition"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-700 font-semibold">{error}</p>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={code.length !== 4 || phase === 'JOINING'}
              className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
            >
              {phase === 'JOINING' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>{t('जोडत आहे...', 'Joining...')}</span></>
              ) : (
                <><span>{t('सामील व्हा (Join Meeting)', 'Join Meeting')}</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          <button
            onClick={onLeave}
            className="w-full text-xs text-stone-500 hover:text-stone-800 font-bold text-center py-1"
          >
            {t('← मागे जा', '← Go Back')}
          </button>
        </div>
      </div>
    );
  }

  // ── LIVE MEETING (REFINED MINIMAL HIGH-IMPACT PHONE UI) ────────────────────
  if (phase === 'LIVE' && room) {
    const memberCount = Object.keys(room.members).length;
    const verifiedCount = Object.values(room.members).filter(m => m.verified).length;

    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 p-3.5 sm:p-5 flex flex-col gap-3.5 max-w-md mx-auto relative select-none">

        {/* 🛡️ DYNAMIC MUTUAL HANDSHAKE OTP MODAL (MINIMAL HIGH IMPACT) */}
        {pendingHandshake && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-lg p-6 shadow-2xl border border-stone-200 space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto border border-emerald-100">
                <ShieldCheck className="w-7 h-7 text-emerald-800" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {t('थेट रक्कम पडताळणी', 'Mutual Amount Verification')}
                </span>
                <h3 className="text-sm font-bold text-stone-600 mt-1.5">
                  {t('प्रमुखांनी तुमची बचत रक्कम नोंदवली:', 'Leader recorded your savings:')}
                </h3>
                <div className="text-3xl font-black text-stone-900 py-0.5">
                  ₹{pendingHandshake.amount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-stone-500 font-semibold">
                  {t('रक्कम बरोबर असल्यास हा कोड प्रमुखाला सांगा:', 'If amount is correct, read this code to Leader:')}
                </p>
              </div>

              {/* High Contrast Legible OTP Box */}
              <div className="bg-stone-900 text-amber-300 p-4 rounded-lg border border-stone-800 shadow-inner">
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-0.5">
                  {t('पडताळणी हँडशेक कोड', 'HANDSHAKE OTP')}
                </p>
                <div className="text-4xl sm:text-5xl font-black tracking-[0.3em] font-mono text-center text-amber-300">
                  {pendingHandshake.otp}
                </div>
              </div>

              <p className="text-[11px] text-stone-500 font-medium">
                {t('प्रमुखांनी हा कोड टाकल्यावरच रक्कम तुमच्या खात्यात जमा होईल.', 'Amount will be deposited only when Leader enters this OTP.')}
              </p>

              <button
                onClick={async () => {
                  if (room) await liveMeetingApi.cancelSavings(room.code, memberId);
                  setPendingHandshake(null);
                }}
                className="w-full py-2.5 text-xs text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 rounded-xl transition"
              >
                {t('रक्कम चुकीची आहे (नाकारा)', 'Wrong Amount (Reject)')}
              </button>
            </div>
          </div>
        )}

        {/* Verified Success Toast */}
        {showVerifiedToast && (
          <div className="bg-emerald-800 text-white p-3.5 rounded-lg shadow-lg border border-emerald-700 flex items-center justify-between animate-in slide-in-from-top">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-black">{t('पडताळणी यशस्वी! ✅', 'Verified Successfully! ✅')}</p>
                <p className="text-[11px] text-emerald-100">
                  {t(`₹${showVerifiedToast.amount} बचत अधिकृत जमा झाली.`, `₹${showVerifiedToast.amount} savings verified & deposited.`)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🚪 Simple Leave Confirmation Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200 shrink-0">
                    <LogOut className="w-5 h-5 text-rose-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900 leading-tight">
                      {isMr ? 'बैठक सोडायची आहे का?' : 'Leave Meeting?'}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                      {isMr ? 'तुम्ही थेट बैठकीतून बाहेर पडू शकता.' : 'Are you sure you want to leave the meeting?'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status reassurance */}
              {myRecord?.verified ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                    {isMr
                      ? `आपली ₹${myRecord.savings.toLocaleString('en-IN')} बचत आणि उपस्थिती सुरक्षित नोंदवली आहे.`
                      : `Your ₹${myRecord.savings.toLocaleString('en-IN')} savings and attendance are safely recorded.`}
                  </p>
                </div>
              ) : (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-stone-700 font-medium leading-relaxed">
                    {isMr
                      ? 'आपली बैठकीतील उपस्थिती नोंदवलेली राहील.'
                      : 'Your meeting attendance remains recorded.'}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmLeave}
                  disabled={isLeaving}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  {isLeaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isMr ? 'बाहेर पडत आहे...' : 'Leaving...'}</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isMr ? 'होय, बाहेर पडा' : 'Leave Meeting'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="w-full text-xs text-stone-500 hover:text-stone-800 font-bold py-1.5 text-center cursor-pointer"
                >
                  {isMr ? 'नाही, बैठकीत रहा' : 'Stay in Meeting'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Reconnecting Status Banner ── */}
        {isReconnecting && (
          <div className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              <span>{isMr ? 'पुन्हा जोडत आहे...' : 'Reconnecting network...'}</span>
            </span>
            <span className="text-[10px] uppercase font-mono font-bold bg-amber-200/70 px-2 py-0.5 rounded-md">
              auto-resync
            </span>
          </div>
        )}

        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
              {t('थेट बैठक (LIVE)', 'Live Meeting')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-stone-200/80 text-stone-800 text-xs font-black px-2.5 py-1 rounded-xl">
              #{room.code}
            </span>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              title={t('बाहेर पडा', 'Exit')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── SHG Context Header Card ── */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-lg p-4 border border-emerald-200/70 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {t('बचत गट व प्रमुख', 'SHG Group & Lead')}
          </span>
          <h2 className="text-base font-black text-stone-900 leading-snug">
            {room.shgName}
          </h2>
          <p className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
            <span>{t('गट प्रमुख:', 'Lead:')} {room.leadName}</span>
          </p>
        </div>

        {/* ── Hero Live Pool Card (High Impact, Legible) ── */}
        <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 rounded-lg p-5 border border-emerald-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-800" />
              <span>{t('आजचा एकूण जमा निधी', 'Total Pool Collected')}</span>
            </span>
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {verifiedCount}/{memberCount} {t('पडताळले', 'Verified')}
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            ₹{room.totalPool.toLocaleString('en-IN')}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-xs">
            <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 uppercase block">{t('माझी उपस्थिती', 'My Attendance')}</span>
              <span className="text-xs font-black text-emerald-700 flex items-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" />
                <span>{myRecord?.leftEarly ? t('हजर (लवकर बाहेर)', 'Present (Left Early)') : t('उपस्थित (Present)', 'Present')}</span>
              </span>
            </div>
            <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 uppercase block">{t('माझी बचत', 'My Savings')}</span>
              <span className="text-xs font-black text-stone-900 block mt-0.5">
                {myRecord?.savings ? `₹${myRecord.savings.toLocaleString('en-IN')}` : (myRecord?.leftEarly ? '₹०' : t('नोंदणी बाकी', 'Pending'))}
              </span>
            </div>
          </div>
        </div>

        {/* ── Member Roster Roster ── */}
        <div className="bg-white rounded-lg p-4 border border-stone-200/90 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-stone-500" />
              <span>{t('उपस्थित सभासद', 'Active Members')} ({memberCount})</span>
            </span>
            <span className="text-[10px] text-stone-400 font-semibold flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>{t('थेट जोडणी', 'Live')}</span>
            </span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {Object.values(room.members).map(m => {
              const isMe = m.memberId === memberId;
              return (
                <div key={m.memberId} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      isMe ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {m.memberName.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${isMe ? 'font-black text-emerald-900' : 'font-bold text-stone-800'}`}>
                        {m.memberName} {isMe ? t('(मी)', '(Me)') : ''}
                      </p>
                      <p className="text-[10px] text-stone-400 font-medium truncate">
                        {m.leftEarly
                          ? (m.verified ? (isMr ? 'लवकर बाहेर पडली' : 'Left early')
                                        : t(`लवकर गेल्या (बिनबचत)`, `Left early (No deposit)`))
                          : (m.verified ? t('पडताळणी पूर्ण', 'Verified') : t('उपस्थित', 'Present'))}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-stone-900 block">
                      {m.savings > 0 ? `₹${m.savings.toLocaleString('en-IN')}` : (m.leftEarly ? '₹०' : '—')}
                    </span>
                    {m.leftEarly ? (
                      <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-0.5">
                        <span>{t('लवकर गेली', 'Left Early')}</span>
                      </span>
                    ) : m.verified ? (
                      <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>{t('जमा', 'Done')}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-stone-400">
                        {t('प्रतीक्षा', 'Waiting')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={() => setShowLeaveModal(true)}
          className="w-full py-2.5 text-xs text-stone-500 hover:text-stone-800 font-bold text-center"
        >
          {t('← बैठक सोडा (Leave Meeting)', '← Leave Meeting')}
        </button>
      </div>
    );
  }

  // ── COMPLETED ──────────────────────────────────────────────────────────────
  if (phase === 'COMPLETED' && room) {
    const myRecord = room.members[memberId];
    const memberCount = Object.keys(room.members).length;

    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 p-4 flex flex-col gap-4 max-w-md mx-auto">
        <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm text-center space-y-2 mt-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-lg flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-7 h-7 text-emerald-800" />
          </div>
          <h2 className="text-lg font-black text-stone-900">{t('बैठक यशस्वीरीत्या पूर्ण!', 'Meeting Completed!')}</h2>
          <p className="text-xs font-semibold text-stone-500">{room.shgName}</p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg border border-stone-200 shadow-xs divide-y divide-stone-100 text-xs">
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-stone-500 font-bold">{t('माझी उपस्थिती', 'My Attendance')}</span>
            <span className="font-black text-emerald-800 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{myRecord?.leftEarly ? t('उपस्थित (लवकर गेले)', 'Present (Left Early)') : t('उपस्थित', 'Present')}</span>
            </span>
          </div>
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-stone-500 font-bold">{t('माझी बचत जमा', 'My Savings Deposited')}</span>
            <span className="font-black text-stone-900 text-sm">
              {myRecord?.verified ? `₹${myRecord.savings.toLocaleString('en-IN')}` : '₹० (काही नाही)'}
            </span>
          </div>
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-stone-500 font-bold">{t('एकूण गट जमा निधी', 'Total Group Pool')}</span>
            <span className="font-black text-stone-900 text-sm">₹{room.totalPool.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-stone-500 font-bold">{t('एकूण उपस्थित सभासद', 'Members Present')}</span>
            <span className="font-bold text-stone-800">{memberCount}</span>
          </div>
        </div>

        <button
          onClick={onLeave}
          className="w-full bg-[#14532D] hover:bg-emerald-900 active:scale-[0.98] text-white font-black py-3 rounded-lg text-xs shadow-md transition"
        >
          {t('डॅशबोर्डवर परत जा', 'Back to Dashboard')}
        </button>
      </div>
    );
  }

  return null;
};

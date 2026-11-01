import React, { useState, useEffect, useRef } from 'react';
import { SupportedLanguage } from '../../types/shg';
import { liveMeetingApi, LiveMeetingRoom } from '../../services/liveMeeting';
import { tts } from '../../services/tts';
import { sound } from '../../services/sound';
import {
  CheckCircle2, Users, IndianRupee, Loader2,
  LogOut, Radio, ArrowRight, AlertCircle, Wifi, ShieldCheck, Check
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
  const esRef = useRef<EventSource | null>(null);

  // Cleanup SSE on unmount
  useEffect(() => () => { esRef.current?.close(); }, []);

  const t = (mr: string, en: string) => isMr ? mr : en;

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

      // Check if there is already a pending handshake for this member
      if (res.room.members[memberId]?.pendingSavings) {
        setPendingHandshake(res.room.members[memberId].pendingSavings!);
      }

      // Subscribe to live updates
      const es = liveMeetingApi.subscribe(code, {
        onSnapshot: (r) => {
          setRoom(r);
          if (r.members[memberId]?.pendingSavings) {
            setPendingHandshake(r.members[memberId].pendingSavings!);
          }
        },
        onMemberJoined: ({ members }) => setRoom(prev => prev ? { ...prev, members } : prev),
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
      });
      esRef.current = es;
      setPhase('LIVE');
      sound.playStampSound();
      tts.speak(t('बैठकीत सामील झालात. उपस्थिती नोंदवली.', 'Joined the meeting. Attendance marked.'));
    } catch {
      setError(t('सर्व्हरशी जोडणी अयशस्वी.', 'Could not connect to server.'));
      setPhase('ENTER_CODE');
    }
  };

  const myRecord = room?.members?.[memberId];

  // ── ENTER CODE ─────────────────────────────────────────────────────────────
  if (phase === 'ENTER_CODE' || phase === 'JOINING') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200 p-6 space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6 text-emerald-700" />
            </div>
            <h2 className="text-base font-black text-stone-900">{t('थेट बैठकीत सामील व्हा', 'Join Live Meeting')}</h2>
            <p className="text-xs text-stone-500 font-medium">{t('गट प्रमुखांकडून ४-अंकी बैठक कोड मिळवा', 'Get the 4-digit code from your SHG Lead')}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">{t('बैठक कोड', 'Meeting Code')}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                placeholder="1234"
                className="w-full text-center text-3xl font-black tracking-[0.5em] py-3 bg-stone-50 border-2 border-stone-300 focus:border-emerald-600 rounded-xl outline-none text-stone-900"
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-700 font-semibold">{error}</p>
              </div>
            )}
            <button
              onClick={handleJoin}
              disabled={code.length !== 4 || phase === 'JOINING'}
              className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition"
            >
              {phase === 'JOINING'
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>{t('जोडत आहे...', 'Joining...')}</span></>
                : <><span>{t('बैठकीत सामील व्हा', 'Join Meeting')}</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          <button onClick={onLeave} className="w-full text-xs text-stone-400 hover:text-stone-600 font-semibold text-center">
            {t('परत जा', 'Go Back')}
          </button>
        </div>
      </div>
    );
  }

  // ── LIVE MEETING ───────────────────────────────────────────────────────────
  if (phase === 'LIVE' && room) {
    const memberCount = Object.keys(room.members).length;
    return (
      <div className="min-h-screen bg-emerald-900 p-4 flex flex-col gap-4 relative">

        {/* 🛡️ DYNAMIC MUTUAL HANDSHAKE OTP MODAL */}
        {pendingHandshake && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-emerald-500 space-y-4 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-bounce">
                <ShieldCheck className="w-8 h-8 text-emerald-700" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  {t('🛡️ थेट रक्कम पडताळणी', '🛡️ Mutual Amount Verification')}
                </span>
                <h3 className="text-base font-black text-stone-900 mt-2">
                  {t('प्रमुखांनी तुमची बचत रक्कम नोंदवली:', 'Leader recorded your savings:')}
                </h3>
                <div className="text-4xl font-black text-emerald-700 py-1">
                  ₹{pendingHandshake.amount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  {t('रक्कम बरोबर असल्यास हा कोड प्रमुखाला सांगा:', 'If amount is correct, share this code with the Leader:')}
                </p>
              </div>

              {/* Glowing OTP Box */}
              <div className="bg-stone-900 text-amber-400 p-4 rounded-2xl border-2 border-amber-500/50 shadow-inner">
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">
                  {t('पडताळणी हँडशेक कोड', 'HANDSHAKE OTP')}
                </p>
                <div className="text-5xl font-black tracking-[0.3em] font-mono text-center text-amber-300">
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

        {/* Verified Success Alert */}
        {showVerifiedToast && (
          <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl border border-emerald-400 flex items-center justify-between animate-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-black">{t('पडताळणी यशस्वी! ✅', 'Verified Successfully! ✅')}</p>
                <p className="text-xs text-emerald-100">
                  {t(`₹${showVerifiedToast.amount} बचत अधिकृत जमा झाली.`, `₹${showVerifiedToast.amount} savings verified & deposited.`)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-xs font-black uppercase tracking-wide">{t('थेट बैठक', 'Live Meeting')}</span>
          </div>
          <div className="bg-emerald-800 rounded-xl px-3 py-1">
            <span className="text-emerald-200 text-xs font-black">कोड: {room.code}</span>
          </div>
        </div>

        {/* SHG Name */}
        <div className="bg-emerald-800/60 rounded-2xl p-4 border border-emerald-700">
          <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider">{t('बचत गट', 'Self-Help Group')}</p>
          <h2 className="text-white text-base font-black">{room.shgName}</h2>
          <p className="text-emerald-300 text-xs font-medium mt-0.5">{t('प्रमुख', 'Lead')}: {room.leadName}</p>
        </div>

        {/* My Status */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-[10px] text-stone-500 font-bold uppercase">{t('माझी उपस्थिती', 'My Attendance')}</p>
              <p className="text-sm font-black text-emerald-800">{t('✓ नोंदवली (Present)', '✓ Confirmed (Present)')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="flex items-center gap-1 mb-1">
                <IndianRupee className="w-3 h-3 text-amber-600" />
                <span className="text-[10px] text-stone-500 font-bold uppercase">{t('माझी बचत', 'My Savings')}</span>
              </div>
              <p className="text-xl font-black text-stone-900">
                {myRecord?.savings ? `₹${myRecord.savings.toLocaleString('en-IN')}` : t('प्रतीक्षा...', 'Pending...')}
              </p>
              {myRecord?.verified && (
                <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <Check className="w-3 h-3" /> {t('पडताळले (Verified)', 'Verified')}
                </span>
              )}
            </div>
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="flex items-center gap-1 mb-1">
                <Users className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] text-stone-500 font-bold uppercase">{t('उपस्थित', 'Present')}</span>
              </div>
              <p className="text-xl font-black text-stone-900">{memberCount}</p>
            </div>
          </div>
        </div>

        {/* Total Pool */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-amber-700 font-bold uppercase">{t('एकूण जमा', 'Total Pool Today')}</p>
            <p className="text-2xl font-black text-amber-900">₹{room.totalPool.toLocaleString('en-IN')}</p>
          </div>
          <IndianRupee className="w-8 h-8 text-amber-400" />
        </div>

        {/* Member list */}
        <div className="bg-white rounded-2xl p-4 space-y-2">
          <p className="text-[11px] font-black text-stone-600 uppercase tracking-wider">{t('उपस्थित सभासद', 'Present Members')}</p>
          {Object.values(room.members).map(m => (
            <div key={m.memberId} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className={`text-sm font-bold ${m.memberId === memberId ? 'text-emerald-800' : 'text-stone-700'}`}>
                  {m.memberName} {m.memberId === memberId ? t('(मी)', '(Me)') : ''}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-stone-700 block">
                  {m.savings > 0 ? `₹${m.savings.toLocaleString('en-IN')}` : '—'}
                </span>
                {m.verified && (
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                    {t('पडताळले', 'Verified')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-emerald-400/60 text-xs">
          <Wifi className="w-3 h-3" />
          <span>{t('थेट अद्यतन सुरू', 'Live updates active')}</span>
        </div>

        <button onClick={onLeave} className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold py-2">
          <LogOut className="w-3 h-3" />
          {t('बैठक सोडा', 'Leave Meeting')}
        </button>
      </div>
    );
  }

  // ── COMPLETED ──────────────────────────────────────────────────────────────
  if (phase === 'COMPLETED' && room) {
    const myRecord = room.members[memberId];
    const memberCount = Object.keys(room.members).length;
    return (
      <div className="min-h-screen bg-stone-50 p-4 flex flex-col gap-4">
        {/* Receipt Header */}
        <div className="bg-emerald-800 rounded-2xl p-6 text-center space-y-2 mt-4">
          <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto" />
          <h2 className="text-white text-lg font-black">{t('बैठक पूर्ण!', 'Meeting Completed!')}</h2>
          <p className="text-emerald-200 text-sm font-medium">{room.shgName}</p>
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
          <div className="p-4 flex justify-between items-center">
            <span className="text-xs text-stone-500 font-bold">{t('उपस्थिती', 'Attendance')}</span>
            <span className="text-sm font-black text-emerald-700">{t('✓ उपस्थित', '✓ Present')}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-xs text-stone-500 font-bold">{t('माझी बचत', 'My Savings')}</span>
            <span className="text-sm font-black text-stone-900">
              {myRecord?.savings ? `₹${myRecord.savings.toLocaleString('en-IN')}` : '—'}
            </span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-xs text-stone-500 font-bold">{t('एकूण जमा', 'Group Pool')}</span>
            <span className="text-sm font-black text-amber-700">₹{room.totalPool.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-xs text-stone-500 font-bold">{t('उपस्थित सभासद', 'Members Present')}</span>
            <span className="text-sm font-black text-stone-900">{memberCount}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-xs text-stone-500 font-bold">{t('बैठक संपली', 'Completed At')}</span>
            <span className="text-xs font-bold text-stone-600">
              {room.completedAt ? new Date(room.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        </div>

        {/* All members who attended */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2">
          <p className="text-[11px] font-black text-stone-500 uppercase tracking-wider mb-3">{t('उपस्थित सभासद', 'All Present Members')}</p>
          {Object.values(room.members).map(m => (
            <div key={m.memberId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className={`text-sm font-semibold ${m.memberId === memberId ? 'text-emerald-800 font-black' : 'text-stone-700'}`}>
                  {m.memberName}
                </span>
              </div>
              <span className="text-xs text-stone-500 font-bold">
                {m.savings > 0 ? `₹${m.savings.toLocaleString('en-IN')}` : '—'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onLeave}
          className="w-full bg-emerald-800 text-white font-black py-3 rounded-xl text-sm"
        >
          {t('डॅशबोर्डवर परत जा', 'Back to Dashboard')}
        </button>
      </div>
    );
  }

  return null;
};

import React, { useState, useEffect, useRef } from 'react';
import { SupportedLanguage } from '../../types/shg';
import { Member } from '../../types/shg';
import { liveMeetingApi, LiveMeetingRoom, LiveMember } from '../../services/liveMeeting';
import { tts } from '../../services/tts';
import { sound } from '../../services/sound';
import {
  Radio, Users, IndianRupee, CheckCircle2, Loader2,
  Copy, Check, AlertCircle, Flag, ShieldCheck, KeyRound,
  ArrowRight, X, Clock, LogOut, UserX, FileCheck
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
    otpInput: '',
    error: '',
    loading: false
  });

  const [markLeftModal, setMarkLeftModal] = useState<{ open: boolean; memberId: string; memberName: string; reason: string }>({
    open: false,
    memberId: '',
    memberName: '',
    reason: 'बालक रडत आहे (Child crying)'
  });

  const [showCompleteQuorumModal, setShowCompleteQuorumModal] = useState(false);
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
      onMemberLeft: ({ memberName, reason, members, totalPool }) => {
        setRoom(prev => prev ? { ...prev, members, totalPool } : prev);
        sound.playStampSound();
        tts.speak(t(`${memberName} लवकर बाहेर पडल्या (${reason || 'इतर काम'})`, `${memberName} left early (${reason || 'Other'})`));
      },
      onMemberStatusChanged: ({ members }) => {
        setRoom(prev => prev ? { ...prev, members } : prev);
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

  const setPresetAmount = (memberId: string, amt: number) => {
    setSavingsInputs(prev => ({ ...prev, [memberId]: amt.toString() }));
  };

  // Step 1: Leader enters amount and initiates handshake
  const handleInitiateSavings = async (memberId: string) => {
    if (!room) return;
    const amount = parseInt(savingsInputs[memberId] || '0', 10);
    if (!amount || amount <= 0) return;
    const memberName = room.members[memberId]?.memberName || 'सभासद';

    try {
      const res = await liveMeetingApi.initiateSavings(room.code, memberId, amount);
      if (res.ok) {
        setVerifyModal({
          open: true,
          memberId,
          memberName,
          amount,
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

  const handleConfirmMarkLeft = async () => {
    if (!room || !markLeftModal.memberId) return;
    try {
      await liveMeetingApi.markMemberStatus(room.code, markLeftModal.memberId, {
        leftEarly: true,
        reason: markLeftModal.reason
      });
      setMarkLeftModal({ open: false, memberId: '', memberName: '', reason: '' });
      sound.playStampSound();
      tts.speak(t(`${markLeftModal.memberName} यांची लवकर बाहेर पडल्याची नोंद झाली`, `Marked ${markLeftModal.memberName} as left early`));
    } catch {
      setError(t('नोंद अद्ययावत करता आली नाही.', 'Could not update status.'));
    }
  };

  const handleComplete = () => {
    if (!room) return;
    setShowCompleteQuorumModal(true);
  };

  const handleFinalizeComplete = async () => {
    if (!room) return;
    setShowCompleteQuorumModal(false);
    setPhase('COMPLETING');
    const membersList = Object.values(room.members);
    const totalCount = Math.max(knownMembers.length, membersList.length, 14);
    const res = await liveMeetingApi.complete(room.code, totalCount);
    if (res.ok) {
      sound.playStampSound();
      tts.speak(t('बैठक अधिकृतरीत्या पूर्ण झाली व सील केली गेली', 'Meeting officially completed and sealed'));
      onComplete(res.room);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-lg p-6 border border-rose-200 shadow-xl space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-sm text-rose-700 font-bold text-center">{error}</p>
          <button onClick={onCancel} className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition">
            {t('परत जा', 'Go Back')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'STARTING' || !room) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-800" />
      </div>
    );
  }

  const members = Object.values(room.members);
  const verifiedCount = members.filter(m => m.verified).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-8 relative select-none">

      {/* 🛡️ LEADER HANDSHAKE VERIFICATION MODAL (MINIMAL CLEAN PHONE UI) */}
      {verifyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-lg p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center border border-emerald-100">
                  <KeyRound className="w-4 h-4 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-stone-900">{t('रक्कम पडताळणी कोड', 'Verify Handshake OTP')}</h3>
                  <p className="text-[10px] text-stone-500 font-semibold">{verifyModal.memberName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelHandshake}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Case B: Member Disconnected / Left Mid-Handshake Alert */}
            {room.members[verifyModal.memberId]?.leftEarly && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 space-y-2 text-left animate-pulse">
                <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t(`⚠️ ${verifyModal.memberName} डिस्कनेक्ट झाली / लवकर बाहेर पडली`, `⚠️ ${verifyModal.memberName} disconnected / left early`)}</span>
                </div>
                <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                  {t(
                    'हँडशेक कोड पडताळला गेला नाही. जोपर्यंत कोड टाकला जात नाही, तोपर्यंत शून्य रोख रक्कम जमा होईल (Zero Commitment).',
                    'OTP is pending. Without verification, zero cash is added to the pool.'
                  )}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCancelHandshake}
                    className="flex-1 py-1.5 px-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-black shadow-xs transition"
                  >
                    {t('नोंद रद्द करा (Cancel)', 'Cancel Entry')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateSavings(verifyModal.memberId)}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold transition"
                  >
                    {t('पुन्हा प्रयत्न करा (Retry)', 'Retry')}
                  </button>
                </div>
              </div>
            )}

            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                {t('नोंदवलेली बचत रक्कम', 'Recorded Amount')}
              </span>
              <div className="text-3xl font-black text-stone-900">
                ₹{verifyModal.amount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-stone-600 font-medium">
                {t('सभासदांच्या फोनवर दिसणारा ४-अंकी कोड विचारा:', 'Ask member for 4-digit code shown on screen:')}
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
                className="w-full text-center text-3xl font-black tracking-[0.4em] py-3 bg-stone-50 border-2 border-stone-300 focus:border-emerald-700 rounded-lg outline-none text-stone-900 transition"
                autoFocus
              />

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
                className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
              >
                {verifyModal.loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>{t('पडताळत आहे...', 'Verifying...')}</span></>
                ) : (
                  <><Check className="w-4 h-4" /><span>{t('सत्यापित करा व जमा करा', 'Verify & Deposit')}</span></>
                )}
              </button>

              <button
                onClick={handleCancelHandshake}
                className="w-full text-xs text-stone-500 hover:text-stone-800 font-bold py-1 text-center"
              >
                {t('रद्द करा', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 MARK MEMBER LEFT EARLY MODAL (FOR LEADER) */}
      {markLeftModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-lg p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                  <LogOut className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-stone-900">
                    {t('लवकर बाहेर पडल्याची नोंद', 'Mark Left Early')}
                  </h3>
                  <p className="text-[10px] text-stone-500 font-semibold">{markLeftModal.memberName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMarkLeftModal({ open: false, memberId: '', memberName: '', reason: '' })}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs text-stone-600 leading-relaxed font-medium">
              {t(
                'सभासदाची उपस्थिती कायम "हजर" राहील. जर बचत पडताळलेली असेल तर ती सुरक्षित राहील; अन्यथा बचत शून्य (₹०) राहील.',
                'Attendance remains locked as "Present" for statutory quorum. Verified deposits remain committed; unverified deposits remain ₹0.'
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-700">
                {t('बाहेर पडण्याचे कारण:', 'Reason for leaving early:')}
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { mr: '👶 बालक रडत आहे', en: '👶 Child crying' },
                  { mr: '🐄 जनावरांची काळजी', en: '🐄 Livestock tending' },
                  { mr: '🪫 फोन बॅटरी संपली / बंद पडला', en: '🪫 Phone battery died' },
                  { mr: '🌾 शेती / घरगुती तातडीचे काम', en: '🌾 Farm / domestic work' },
                  { mr: '📝 इतर काम', en: '📝 Other' }
                ].map(opt => {
                  const label = isMr ? opt.mr : opt.en;
                  const isSelected = markLeftModal.reason === label;
                  return (
                    <button
                      key={opt.en}
                      type="button"
                      onClick={() => setMarkLeftModal(prev => ({ ...prev, reason: label }))}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                        isSelected
                          ? 'bg-amber-50 border-amber-600 text-amber-950 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-700" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmMarkLeft}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-black py-2.5 rounded-xl text-xs shadow-sm transition active:scale-95"
              >
                {t('नोंद जतन करा (Confirm Left Early)', 'Confirm Left Early')}
              </button>
              <button
                type="button"
                onClick={() => setMarkLeftModal({ open: false, memberId: '', memberName: '', reason: '' })}
                className="w-full text-xs text-stone-500 hover:text-stone-800 font-bold py-1 text-center"
              >
                {t('रद्द करा', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏛️ QUORUM SAFEGUARD & END-OF-MEETING AUDIT REPORT MODAL */}
      {showCompleteQuorumModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-lg p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                  <Flag className="w-4 h-4 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-stone-900">
                    {t('बैठक पूर्ण व कोरम पडताळणी', 'Quorum Safeguard & Sealing')}
                  </h3>
                  <p className="text-[10px] text-stone-500 font-semibold">{room.shgName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteQuorumModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quorum Breakdown Calculation */}
            {(() => {
              const effectiveTotal = Math.max(knownMembers.length, members.length, 14);
              const attendedFull = members.filter(m => !m.leftEarly).length;
              const leftEarly = members.filter(m => m.leftEarly).length;
              const totalAttended = attendedFull + leftEarly;
              const absent = Math.max(0, effectiveTotal - totalAttended);
              const quorumRequired = Math.ceil(effectiveTotal * 0.5);
              const quorumMet = totalAttended >= quorumRequired;

              return (
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-lg border text-xs ${
                    quorumMet ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}>
                    <div className="flex items-center justify-between font-black">
                      <span className="flex items-center gap-1.5">
                        {quorumMet ? <Check className="w-4 h-4 text-emerald-700" /> : <AlertCircle className="w-4 h-4 text-rose-700" />}
                        <span>{quorumMet ? t('वैधानिक कोरम पूर्ण (Quorum Met)', 'Statutory Quorum Met') : t('कोरम अपूर्ण (Quorum Not Met)', 'Quorum Not Met')}</span>
                      </span>
                      <span className="font-mono text-xs">{totalAttended}/{effectiveTotal} ({Math.round((totalAttended / effectiveTotal) * 100)}%)</span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1 font-medium leading-relaxed">
                      {t(
                        `किमान ५०% उपस्थिती आवश्यक (${quorumRequired} सभासद). बैठकीत हजर राहिलेल्या सर्व ${totalAttended} सभासदांची उपस्थिती ग्राह्य धरली आहे.`,
                        `Min 50% required (${quorumRequired} members). All ${totalAttended} members who attended in person are counted.`
                      )}
                    </p>
                  </div>

                  {/* Summary Breakdown Table */}
                  <div className="bg-stone-50 rounded-lg border border-stone-200 p-3 divide-y divide-stone-200/70 text-xs">
                    <div className="py-1.5 flex justify-between items-center font-bold text-stone-700">
                      <span>{t('एकूण सभासद संख्या', 'Total Members')}</span>
                      <span className="font-black text-stone-900">{effectiveTotal}</span>
                    </div>
                    <div className="py-1.5 flex justify-between items-center text-stone-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                        <span>{t('पूर्ण बैठक उपस्थित', 'Attended Full Meeting')}</span>
                      </span>
                      <span className="font-black text-emerald-800">{attendedFull}</span>
                    </div>
                    <div className="py-1.5 flex justify-between items-center text-stone-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                        <span>{t('लवकर बाहेर पडले', 'Left Early')}</span>
                      </span>
                      <span className="font-black text-amber-800">
                        {leftEarly} {leftEarly > 0 ? `(${members.filter(m => m.leftEarly).map(m => m.memberName).join(', ')})` : ''}
                      </span>
                    </div>
                    <div className="py-1.5 flex justify-between items-center text-stone-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-stone-300 inline-block"></span>
                        <span>{t('अनुपस्थित', 'Absent')}</span>
                      </span>
                      <span className="font-black text-stone-500">{absent}</span>
                    </div>
                    <div className="pt-2 flex justify-between items-center font-black text-stone-900">
                      <span>{t('आजचा एकूण जमा निधी', 'Total Cash Pool')}</span>
                      <span className="text-sm font-black text-emerald-900">₹{room.totalPool.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleFinalizeComplete}
                className="w-full bg-[#14532D] hover:bg-emerald-900 text-white font-black py-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
              >
                <Flag className="w-4 h-4 text-amber-300" />
                <span>{t('बैठक अधिकृत पूर्ण करा व सील करा', 'Confirm & Seal Meeting')}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCompleteQuorumModal(false)}
                className="w-full text-xs text-stone-500 hover:text-stone-800 font-bold py-1.5 text-center"
              >
                {t('रद्द करा / चालू ठेवा', 'Cancel / Keep Active')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="max-w-md mx-auto px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
          <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
            {t('थेट बैठक संचालन', 'Lead Meeting Control')}
          </span>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-bold text-stone-500 hover:text-stone-800"
        >
          {t('बाहेर पडा', 'Exit')}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-3 space-y-3.5">
        {/* ── Meeting Code Sharing Card (Prominent & Minimal) ── */}
        <div className="bg-gradient-to-br from-amber-50/50 via-white to-orange-50/20 rounded-lg p-5 border border-amber-200/80 shadow-2xs space-y-2 text-center">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
            {t('बैठक कोड — सभासदांना सांगा', 'Meeting Code — Share with Members')}
          </p>
          <div className="text-4xl sm:text-5xl font-black text-stone-900 tracking-[0.35em] font-mono">
            {room.code}
          </div>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
            <span>{copied ? t('कॉपी झाले!', 'Copied!') : t('कोड कॉपी करा', 'Copy Code')}</span>
          </button>
        </div>

        {/* ── Metrics Summary Card ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-sky-50/70 via-white to-blue-50/30 rounded-lg p-4 border border-sky-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              {t('उपस्थित सभासद', 'Present Members')}
            </span>
            <span className="text-2xl font-black text-stone-900 mt-1 block">
              {members.length}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
              {verifiedCount} {t('पडताळणी पूर्ण', 'Verified')}
            </span>
          </div>

          <div className="bg-gradient-to-br from-sky-50/70 via-white to-blue-50/30 rounded-lg p-4 border border-sky-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              {t('एकूण जमा निधी', 'Pool Total')}
            </span>
            <span className="text-2xl font-black text-emerald-800 mt-1 block">
              ₹{room.totalPool.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-stone-500 block mt-0.5">
              {t('थेट लेजर नोंद', 'Live committed')}
            </span>
          </div>
        </div>

        {/* ── Members Savings Entry Roster ── */}
        <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                {t('सभासद बचत संकलन', 'Member Savings Entry')}
              </h3>
              <p className="text-[10px] text-stone-400 font-semibold mt-0.5">
                {t('रक्कम नोंदवून सभासदाच्या फोनवरील कोड विचारा', 'Enter amount & ask member for code')}
              </p>
            </div>
            <span className="text-xs font-black text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg">
              {members.length} {t('सभासद', 'Members')}
            </span>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Radio className="w-8 h-8 text-stone-300 mx-auto animate-pulse" />
              <p className="text-xs text-stone-500 font-bold">
                {t('सभासदांची प्रतीक्षा आहे...', 'Waiting for members to join...')}
              </p>
              <p className="text-[11px] text-stone-400 font-medium">
                {t(`सभासदांच्या फोनमध्ये '#${room.code}' कोड टाकायला सांगा.`, `Ask members to enter '#${room.code}' on their phones.`)}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {members.map(m => (
                <div key={m.memberId} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center text-xs font-black">
                        {m.memberName.slice(0, 1)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-800">{m.memberName}</span>
                        {m.leftEarly ? (
                          <p className="text-[10px] text-amber-700 font-medium">
                            {m.verified
                              ? t(`लवकर बाहेर पडली: ${m.leftReason || 'इतर कारण'} • बचत सुरक्षित`, `Left early: ${m.leftReason || 'Reason'} • Savings safe`)
                              : t(`लवकर बाहेर पडली: ${m.leftReason || 'इतर कारण'} • बिनबचत`, `Left early: ${m.leftReason || 'Reason'} • No deposit`)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {m.leftEarly ? (
                        m.verified ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-emerald-50 text-emerald-800 font-black px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>₹{m.savings.toLocaleString('en-IN')} {t('पडताळले', 'Verified')}</span>
                            </span>
                            <span className="text-[10px] bg-amber-50 text-amber-800 font-black px-2 py-0.5 rounded-full border border-amber-200">
                              {t('लवकर गेली', 'Left Early')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] bg-stone-100 text-stone-700 font-black px-2 py-0.5 rounded-full border border-stone-200">
                            {t('लवकर गेली - बिनबचत (₹०)', 'Left Early - No Deposit (₹0)')}
                          </span>
                        )
                      ) : m.verified ? (
                        <span className="text-xs bg-emerald-50 text-emerald-800 font-black px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>₹{m.savings.toLocaleString('en-IN')} {t('पडताळले', 'Verified')}</span>
                        </span>
                      ) : m.savings > 0 ? (
                        <span className="text-xs bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                          ₹{m.savings.toLocaleString('en-IN')}
                        </span>
                      ) : null}

                      {!m.leftEarly && (
                        <button
                          type="button"
                          onClick={() => setMarkLeftModal({
                            open: true,
                            memberId: m.memberId,
                            memberName: m.memberName,
                            reason: 'बालक रडत आहे (Child crying)'
                          })}
                          className="text-[10px] text-stone-400 hover:text-amber-800 hover:bg-amber-50 px-1.5 py-0.5 rounded border border-stone-200 font-bold transition flex items-center gap-0.5"
                          title={t('लवकर बाहेर पडल्याची नोंद करा', 'Mark left early')}
                        >
                          <LogOut className="w-2.5 h-2.5" />
                          <span>{t('लवकर गेली?', 'Left early?')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Savings Input & Presets or Left Early Status Notice */}
                  {m.leftEarly ? (
                    m.verified ? (
                      <div className="text-[11px] text-emerald-900 bg-emerald-50/70 border border-emerald-200 rounded-xl py-1.5 px-3 font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{t('बचत पडताळणी पूर्ण झाली आहे (लेजरमध्ये सुरक्षित)', 'Deposit verified & committed')}</span>
                        </span>
                        <span className="font-mono font-black text-emerald-900">₹{m.savings.toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-stone-600 bg-stone-50 border border-stone-200 rounded-xl py-1.5 px-3 font-medium flex items-center justify-between">
                        <span>{t('बिनबचत लवकर बाहेर पडले (शून्य रोख नोंद)', 'Left early with no deposit')}</span>
                        <span className="font-mono font-bold text-stone-500">₹०</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-black">₹</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={savingsInputs[m.memberId] ?? (m.savings > 0 ? m.savings.toString() : '')}
                          onChange={e => handleSavingsChange(m.memberId, e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleInitiateSavings(m.memberId);
                          }}
                          placeholder={t('रक्कम (उदा. ५००)', 'Amount (e.g. 500)')}
                          className="w-full pl-7 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-black outline-none focus:border-emerald-600 focus:bg-white transition"
                        />
                      </div>

                      {/* Quick presets */}
                      <div className="hidden sm:flex items-center gap-1">
                        {[200, 300, 500].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setPresetAmount(m.memberId, amt)}
                            className="px-2 py-1.5 text-[10px] font-black text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>

                      {m.pendingSavings ? (
                        <button
                          onClick={() => {
                            setVerifyModal({
                              open: true,
                              memberId: m.memberId,
                              memberName: m.memberName,
                              amount: m.pendingSavings!.amount,
                              otpInput: '',
                              error: '',
                              loading: false
                            });
                          }}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1 shadow-sm active:scale-95"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{t('कोड टाका', 'OTP')}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInitiateSavings(m.memberId)}
                          disabled={!savingsInputs[m.memberId]}
                          className="px-3.5 py-2 bg-[#14532D] hover:bg-emerald-900 disabled:opacity-40 text-white text-xs font-black rounded-xl transition flex items-center gap-1 shadow-sm active:scale-95"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{t('नोंदवा', 'Save')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Complete Meeting Button ── */}
        {members.length > 0 && (
          <button
            onClick={handleComplete}
            disabled={phase === 'COMPLETING'}
            className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-3.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
          >
            {phase === 'COMPLETING' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>{t('पूर्ण करत आहे...', 'Completing...')}</span></>
            ) : (
              <><Flag className="w-4 h-4 text-amber-300" /><span>{t('बैठक पूर्ण करा (Complete Meeting)', 'Complete Meeting')}</span></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

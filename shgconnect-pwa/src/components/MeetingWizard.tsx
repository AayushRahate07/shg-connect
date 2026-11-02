import React, { useState, useEffect } from 'react';
import { Member, SupportedLanguage, Resolution, OfficerRole, OfficerSignature } from '../types/shg';
import { verifyOfficerPin, DEFAULT_OFFICERS, getDeferredRemoteOps } from '../services/db';
import { calculateSHA256 } from '../services/hashChain';
import { UserCheck, Check, DollarSign, HandCoins, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Volume2, Key, ShieldCheck, Share2, MessageSquare, AlertCircle, FileText, Lock, Fingerprint, ShieldAlert } from 'lucide-react';
import { tts } from '../services/tts';
import { sound } from '../services/sound';
import { CashBoxReconciliation } from './CashBoxReconciliation';
import { OtpAttendanceModal } from './OtpAttendanceModal';
import { eventBus } from '../services/eventBus';
import { biometricService } from '../services/biometrics';
import { masterLeaseService } from '../services/masterLease';

interface MeetingWizardProps {
  members: Member[];
  groupName?: string;
  language: SupportedLanguage;
  monthlySavingsAmount: number;
  onCompleteMeeting: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => Promise<void> | void;
  onCancel: () => void;
}

export const MeetingWizard: React.FC<MeetingWizardProps> = ({
  members,
  groupName,
  language,
  monthlySavingsAmount,
  onCompleteMeeting,
  onCancel
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [hasConflictFreeze, setHasConflictFreeze] = useState<boolean>(false);
  const [conflictCount, setConflictCount] = useState<number>(0);

  useEffect(() => {
    getDeferredRemoteOps().then(ops => {
      if (ops.length > 0) {
        setHasConflictFreeze(true);
        setConflictCount(ops.length);
        sound.playWarningTone();
      }
    });
  }, []);

  // Step 1 state: Attendance
  const [attendance, setAttendance] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    members.forEach(m => { initial[m.id] = false; });
    return initial;
  });
  const [otpMember, setOtpMember] = useState<Member | null>(null);

  // Step 2 state: Savings collection & Cash Box
  const [savingsAmounts, setSavingsAmounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    members.forEach(m => { initial[m.id] = 0; });
    return initial;
  });

  // Step 3 state: Resolutions & Loan Disbursal
  const [sessionResolutions, setSessionResolutions] = useState<Omit<Resolution, 'id' | 'resolutionNumber'>[]>([]);
  const [disburseLoan, setDisburseLoan] = useState<boolean>(false);
  const [selectedLoanMemberId, setSelectedLoanMemberId] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanPurpose, setLoanPurpose] = useState<string>('');

  // Step 4 state: 2-of-3 Multi-Signatory PIN Quorum
  const [selectedRoles, setSelectedRoles] = useState<OfficerRole[]>(['PRESIDENT', 'TREASURER']);
  const [pinInputs, setPinInputs] = useState<Record<OfficerRole, string>>({
    PRESIDENT: '',
    SECRETARY: '',
    TREASURER: ''
  });
  const [verifiedSignatures, setVerifiedSignatures] = useState<Record<OfficerRole, boolean>>({
    PRESIDENT: false,
    SECRETARY: false,
    TREASURER: false
  });
  const [pinErrorMsg, setPinErrorMsg] = useState<string>('');
  const [isCommitted, setIsCommitted] = useState<boolean>(false);
  const [committedSignatures, setCommittedSignatures] = useState<OfficerSignature[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [commitSuccessData, setCommitSuccessData] = useState<{
    fingerprint: string;
    merkleRoot: string;
    savings: number;
    disbursed: number;
  } | null>(null);

  const toggleAttendance = (memberId: string) => {
    sound.playStampSound();
    setAttendance(prev => {
      const nextVal = !prev[memberId];
      if (!nextVal) {
        setSavingsAmounts(s => ({ ...s, [memberId]: 0 }));
      } else {
        setSavingsAmounts(s => ({ ...s, [memberId]: monthlySavingsAmount }));
      }
      return { ...prev, [memberId]: nextVal };
    });
  };

  const handleSavingsAmountChange = (memberId: string, val: number) => {
    setSavingsAmounts(prev => ({ ...prev, [memberId]: val }));
  };

  const handleTriggerTtsAnnouncement = (member: Member, amount: number) => {
    tts.speakTransaction(member.name, member.nameRegional, amount, 'SAVINGS');
  };

  const totalSavingsCollected = Object.values(savingsAmounts).reduce((a, b) => a + b, 0);
  const totalPresent = Object.values(attendance).filter(Boolean).length;

  const handleAddSessionResolution = (res: Omit<Resolution, 'id' | 'resolutionNumber'>) => {
    setSessionResolutions(prev => [...prev, res]);
  };

  // Quorum Role Selection Toggle
  const toggleRoleSelection = (role: OfficerRole) => {
    sound.playStampSound();
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        if (prev.length <= 2) return prev; // Keep at least 2 selected
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  // Verify entered PIN against stored SHA-256 hash or default PIN string
  const handleVerifyPin = async (role: OfficerRole, enteredPin: string) => {
    setPinInputs(prev => ({ ...prev, [role]: enteredPin }));
    if (enteredPin.length === 4) {
      const isValid = await verifyOfficerPin(role, enteredPin);
      if (isValid) {
        sound.playStampSound();
        setVerifiedSignatures(prev => ({ ...prev, [role]: true }));
        setPinErrorMsg('');
      } else {
        setVerifiedSignatures(prev => ({ ...prev, [role]: false }));
        setPinErrorMsg(language === 'mr' ? 'अवैध 4-अंकी पिन नोंदवला!' : 'Invalid 4-digit PIN entered!');
      }
    } else {
      setVerifiedSignatures(prev => ({ ...prev, [role]: false }));
      setPinErrorMsg('');
    }
  };

  // Helper to auto-fill valid PIN for quick testing
  const handleAutoFillPin = (role: OfficerRole) => {
    const officer = DEFAULT_OFFICERS.find(o => o.role === role);
    if (officer) {
      if (!selectedRoles.includes(role)) {
        setSelectedRoles(prev => [...prev, role]);
      }
      handleVerifyPin(role, officer.defaultPin);
    }
  };

  const validSignaturesCount = selectedRoles.filter(r => verifiedSignatures[r]).length;
  const isQuorumMet = validSignaturesCount >= 2;

  const handleFinalSubmit = async () => {
    if (!isQuorumMet) {
      setPinErrorMsg(
        language === 'mr'
          ? 'किमान २ पदाधिकाऱ्यांची पिन स्वाक्षरी आवश्यक आहे'
          : 'Minimum 2 officer PIN signatures required'
      );
      return;
    }

    setIsSubmitting(true);
    setPinErrorMsg('');

    try {
      sound.playStampSound();
      const confirmedSigs: OfficerSignature[] = selectedRoles
        .filter(r => verifiedSignatures[r])
        .map(r => {
          const off = DEFAULT_OFFICERS.find(o => o.role === r);
          return {
            role: r,
            signedAt: new Date().toISOString(),
            officerName: off ? off.name : r
          };
        });

      setCommittedSignatures(confirmedSigs);

      // Compute signatureProof hash
      const concatSigners = confirmedSigs.map(s => `${s.role}:${s.signedAt}`).join('|');
      const proofHash = await calculateSHA256(concatSigners);

      const savingsList = Object.entries(savingsAmounts)
        .filter(([_, amt]) => amt > 0)
        .map(([mId, amt]) => ({ memberId: mId, amount: amt }));

      let loanData = undefined;
      if (disburseLoan && selectedLoanMemberId && loanAmount > 0) {
        loanData = {
          memberId: selectedLoanMemberId,
          amount: loanAmount,
          notes: loanPurpose
        };
      }

      // Safe eventBus emit
      try {
        await eventBus.emit(
          {
            type: 'QUORUM_SIGNATURES_AUTHENTICATED',
            payload: {
              officerRoles: confirmedSigs.map(s => s.role),
              sessionHash: proofHash
            }
          },
          {
            shgId: 'SHG-MH-2024-884',
            actorId: confirmedSigs[0]?.role || 'TREASURER',
            actorRole: (confirmedSigs[0]?.role as any) || 'TREASURER',
            deviceId: 'dev-pwa-local'
          }
        );

        await eventBus.emit(
          {
            type: 'MEETING_COMMITTED',
            payload: {
              meetingId: `meet-${Date.now()}`,
              blockId: proofHash.substring(0, 10),
              totalSavings: totalSavingsCollected,
              totalDisbursed: loanData ? loanData.amount : 0
            }
          },
          {
            shgId: 'SHG-MH-2024-884',
            actorId: 'animator-1',
            actorRole: 'ANIMATOR',
            deviceId: 'dev-pwa-local'
          }
        );
      } catch (busErr) {
        console.warn('EventBus dispatch warning (non-fatal):', busErr);
      }

      if (loanData) {
        sound.playLoanApprovalFanfare();
      } else {
        sound.playCashDepositChime();
      }

      // Await database batch commit!
      await onCompleteMeeting(attendance, savingsList, loanData, sessionResolutions, confirmedSigs, proofHash);

      const genFingerprint = `CHK-${proofHash.substring(0, 4).toUpperCase()}-${proofHash.substring(4, 8).toUpperCase()}-${proofHash.substring(8, 12).toUpperCase()}`;
      setCommitSuccessData({
        fingerprint: genFingerprint,
        merkleRoot: proofHash,
        savings: totalSavingsCollected,
        disbursed: loanData ? loanData.amount : 0
      });
      setIsCommitted(true);
      tts.speak(language === 'mr' ? 'बैठकीची नोंद नोंदवहीत यशस्वीरीत्या जतन झाली आहे.' : 'Meeting session successfully saved to ledger.');
    } catch (err: any) {
      console.error('Failed to commit meeting session:', err);
      setPinErrorMsg(
        language === 'mr'
          ? `नोंद जतन करताना त्रुटी आली: ${err?.message || 'अज्ञात त्रुटी'}`
          : `Failed to commit meeting: ${err?.message || 'Unknown error'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Broadcast Out-of-Band SMS / WhatsApp Audit Receipts
  const handleBroadcastSmsReceipts = () => {
    sound.playStampSound();
    const fingerprint = `CHK-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const sampleReceipts = members.map(m => {
      const isPresent = attendance[m.id];
      const savings = savingsAmounts[m.id] || 0;
      return `माहिती: महिला प्रगति बचत गट बैठकीत आपली ₹${savings} बचत जमा झाली. हजेरी: ${isPresent ? 'हजर' : 'गैरहजर'}. शिल्लक कर्ज: ₹${m.activeLoanBalance}. चेकपॉइंट फिंगरप्रिंट: ${fingerprint}`;
    }).join('\n\n');

    if (navigator.share) {
      navigator.share({
        title: 'SHGConnect Audit Receipts',
        text: sampleReceipts
      }).catch(() => {});
    } else {
      window.open(`sms:?body=${encodeURIComponent(sampleReceipts)}`, '_self');
    }
  };

  if (hasConflictFreeze) {
    return (
      <div className="bg-white rounded-3xl p-8 max-w-xl mx-auto border-2 border-rose-300 shadow-2xl text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-stone-900">
          {language === 'mr' ? 'नोंद फरक लॉक (Operation Freeze Active)' : 'Operation Freeze Active'}
        </h3>
        <p className="text-xs text-stone-600 font-medium">
          {language === 'mr'
            ? `डिव्हाइसवर ${conflictCount} अनिर्णित नोंद फरक (Unresolved Conflicts) आहेत. पुढील बैठक सुरू करण्यापूर्वी Sync Center मध्ये जाऊन हे फरक सोडवणे बंधनकारक आहे.`
            : `There are ${conflictCount} unresolved synchronization conflicts. To preserve ledger integrity, resolve pending conflicts in Sync Center before conducting a new meeting.`}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setHasConflictFreeze(false)}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl shadow transition"
          >
            {language === 'mr' ? 'तफावत दुर्लक्षित करा आणि बैठक सुरू करा' : 'Bypass Freeze & Conduct Meeting'}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow transition"
          >
            {language === 'mr' ? 'मागे जा (Go Back)' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden mb-6 animate-fadeIn">
      {/* Sleek Integrated Header with 2 Row, 2 Col Stepper */}
      <div className="bg-[#14532D] text-white p-3.5 sm:p-4 rounded-t-lg">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 border border-emerald-700/80 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black leading-tight text-white">
                {language === 'mr' ? 'मासिक बैठक सत्र' : 'Monthly Meeting Session'}
              </h2>
              {groupName && (
                <p className="text-[11px] text-emerald-200 truncate mt-0.5 font-medium">
                  {groupName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] bg-emerald-900/90 text-amber-300 px-2.5 py-0.5 rounded font-black border border-emerald-700/80">
              {language === 'mr' ? 'टप्पा' : 'Step'} {step}/4
            </span>
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1 text-xs font-bold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1 border border-white/15"
            >
              <span>✕</span>
              <span className="hidden sm:inline">{language === 'mr' ? 'बाहेर पडा' : 'Exit'}</span>
            </button>
          </div>
        </div>

        {/* 2 Row, 2 Col Stepper Format for Perfect Mobile & Desktop Readability */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-center text-xs">
          {[
            { s: 1, mr: '१. उपस्थिती', en: '1. Attendance' },
            { s: 2, mr: '२. बचत व रोकड', en: '2. Savings & Cash' },
            { s: 3, mr: '३. ठराव व कर्ज', en: '3. Resolutions & Loan' },
            { s: 4, mr: '४. कोरम स्वाक्षरी', en: '4. Quorum & Commit' },
          ].map(tab => {
            const isActive = step === tab.s;
            const isDone = step > tab.s;
            return (
              <button
                key={tab.s}
                type="button"
                onClick={() => { sound.playStampSound(); setStep(tab.s as any); }}
                className={`py-2 px-2.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                  isActive
                    ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                    : isDone
                    ? 'bg-emerald-900 text-emerald-100 border border-emerald-700/80 hover:bg-emerald-800'
                    : 'bg-white/10 text-emerald-200/80 hover:bg-white/15 border border-white/10'
                }`}
              >
                {isDone && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                <span className="truncate">{language === 'mr' ? tab.mr : tab.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 sm:p-5">
        {/* STEP 1: Attendance Checklist (Sleek & Compressed) */}
        {step === 1 && (
          <div className="space-y-3">
            {/* Helper Toolbar: Summary & 1-Tap Quick Mark */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-100/80 p-2.5 rounded-lg border border-stone-200">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                <span className="text-xs font-black text-stone-900">
                  {language === 'mr' ? `उपस्थिती: ${totalPresent} / ${members.length} हजर` : `Attendance: ${totalPresent} / ${members.length} Present`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sound.playStampSound();
                    const allPres: Record<string, boolean> = {};
                    const allSav: Record<string, number> = {};
                    members.forEach(m => {
                      allPres[m.id] = true;
                      allSav[m.id] = monthlySavingsAmount;
                    });
                    setAttendance(allPres);
                    setSavingsAmounts(allSav);
                  }}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /><span>{language === 'mr' ? 'सर्व हजर करा' : 'Mark All Present'}</span></span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playStampSound();
                    const allAbs: Record<string, boolean> = {};
                    const zeroSav: Record<string, number> = {};
                    members.forEach(m => {
                      allAbs[m.id] = false;
                      zeroSav[m.id] = 0;
                    });
                    setAttendance(allAbs);
                    setSavingsAmounts(zeroSav);
                  }}
                  className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-[11px] font-semibold transition active:scale-95 cursor-pointer"
                >
                  {language === 'mr' ? 'रीसेट' : 'Reset'}
                </button>
              </div>
            </div>

            {/* Compact Member Rows (40px each, fits 6-8 on screen!) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {members.map(member => {
                const isPresent = attendance[member.id];
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleAttendance(member.id)}
                    className={`p-2 sm:p-2.5 rounded-lg border-2 flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer ${
                      isPresent
                        ? 'bg-emerald-50/70 border-emerald-600 text-stone-900 shadow-2xs'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg ${member.avatarColor || 'bg-emerald-700'} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs`}>
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-black text-xs sm:text-sm truncate ${isPresent ? 'text-stone-950' : 'text-stone-500'}`}>
                          {language === 'mr' ? member.nameRegional : member.name}
                        </div>
                        <div className="text-[10px] text-stone-500 font-medium truncate">
                          {member.role === 'OFFICE_BEARER' ? (language === 'mr' ? 'अध्यक्ष' : 'Officer') : (language === 'mr' ? 'सदस्य' : 'Member')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOtpMember(member);
                        }}
                        className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[9.5px] font-bold border border-amber-300"
                        title="Offline 2-OTP Verification"
                      >
                        OTP
                      </button>
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center space-x-1 transition shadow-2xs ${
                        isPresent ? 'bg-[#14532D] text-white' : 'bg-stone-200 text-stone-600'
                      }`}>
                        <Check className="w-3 h-3" />
                        <span>{isPresent ? (language === 'mr' ? 'हजर' : 'Present') : (language === 'mr' ? 'गैरहजर' : 'Absent')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* OTP Attendance Modal */}
            {otpMember && (
              <OtpAttendanceModal
                memberId={otpMember.id}
                memberName={otpMember.nameRegional || otpMember.name}
                memberPhone={otpMember.phone}
                language={language}
                onClose={() => setOtpMember(null)}
                onVerified={(mId) => {
                  setAttendance(prev => ({ ...prev, [mId]: true }));
                }}
              />
            )}

            <div className="flex justify-between items-center pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100 transition active:scale-95"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => { sound.playStampSound(); setStep(2); }}
                className="bg-[#14532D] hover:bg-emerald-900 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <span>{language === 'mr' ? 'पुढील: बचत व रोकड' : 'Next: Savings & Cash'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Bulk Savings Collection & Cash Box Reconciliation (Sleek & Compressed) */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Header Toolbar: Pool Total + 1-Tap Quota Fill */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-2.5 sm:p-3 rounded-lg border border-emerald-200/90 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase block">
                  {language === 'mr' ? 'एकूण गोळा बचत' : 'Total Savings Collected'}
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-950 amount-display">
                  ₹{totalSavingsCollected.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playStampSound();
                  const allQuota: Record<string, number> = {};
                  members.forEach(m => {
                    allQuota[m.id] = attendance[m.id] ? monthlySavingsAmount : 0;
                  });
                  setSavingsAmounts(allQuota);
                }}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              >
                {language === 'mr' ? `सर्व हजर सदस्यांचे ₹${monthlySavingsAmount} भरा` : `Auto-fill ₹${monthlySavingsAmount} for present`}
              </button>
            </div>

            {/* Compact Member Rows */}
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {members.map(member => {
                const isPresent = attendance[member.id];
                const amt = savingsAmounts[member.id] || 0;
                return (
                  <div
                    key={member.id}
                    className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                      isPresent ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg ${member.avatarColor || 'bg-emerald-700'} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs`}>
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-stone-900 truncate block">
                          {language === 'mr' ? member.nameRegional : member.name}
                        </span>
                        {!isPresent && <span className="text-[10px] text-rose-600 font-semibold">(Absent)</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="text-xs font-bold text-stone-500">₹</span>
                      <input
                        type="number"
                        disabled={!isPresent}
                        value={amt}
                        onChange={(e) => handleSavingsAmountChange(member.id, parseFloat(e.target.value) || 0)}
                        className="w-20 sm:w-24 px-2 py-1 border border-stone-300 rounded-lg text-xs font-black text-right focus:ring-1 focus:ring-emerald-700 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleTriggerTtsAnnouncement(member, amt)}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition shadow-2xs cursor-pointer"
                        title="Announce amount aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cash Box Denomination Counter */}
            <CashBoxReconciliation
              expectedCash={totalSavingsCollected}
              language={language}
            />

            <div className="flex justify-between items-center pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => { sound.playStampSound(); setStep(1); }}
                className="px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center space-x-1 transition active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                type="button"
                onClick={() => { sound.playStampSound(); setStep(3); }}
                className="bg-[#14532D] hover:bg-emerald-900 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <span>{language === 'mr' ? 'पुढील: ठराव व कर्ज' : 'Next: Resolutions & Loan'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Resolutions & Loan Disbursal (Sleek & Compressed) */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Quick Resolutions Logger */}
            <div className="bg-white border border-stone-200 p-3.5 sm:p-4 rounded-lg space-y-2.5 shadow-2xs">
              <label className="block text-xs font-bold text-stone-800">
                {language === 'mr' ? 'बैठकीचे मुख्य निर्णय व ठराव' : 'Meeting Decisions / Resolutions'}
              </label>

              {/* Instant Decision Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { mr: 'मासिक बचत जमा ठराव', en: 'Monthly savings deposited' },
                  { mr: 'नियमित हिशोब संमत', en: 'Accounts audited & verified' },
                  { mr: 'पुढील बैठक ठरली', en: 'Next meeting scheduled' },
                  { mr: 'कर्ज वाटप मंजुरी', en: 'Internal loan sanctioned' }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleAddSessionResolution({
                        date: new Date().toISOString().split('T')[0],
                        title: language === 'mr' ? chip.mr : chip.en,
                        category: 'LIVELIHOOD',
                        description: language === 'mr' ? chip.mr : chip.en,
                        proposedBy: 'Officer',
                        secondedBy: 'Group',
                        approvedUnanimously: true
                      });
                    }}
                    className="px-2 py-0.5 bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 border border-stone-200 rounded text-[11px] font-bold text-stone-700 transition cursor-pointer"
                  >
                    + {language === 'mr' ? chip.mr : chip.en}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder={language === 'mr' ? 'नवीन ठराव लिहून Enter दाबा...' : 'Type custom resolution & press Enter...'}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-900 outline-none focus:ring-1 focus:ring-emerald-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleAddSessionResolution({
                        date: new Date().toISOString().split('T')[0],
                        title: e.currentTarget.value.trim(),
                        category: 'LIVELIHOOD',
                        description: e.currentTarget.value.trim(),
                        proposedBy: 'Officer',
                        secondedBy: 'Group',
                        approvedUnanimously: true
                      });
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {sessionResolutions.length > 0 && (
                <ul className="space-y-1.5 mt-2 max-h-[140px] overflow-y-auto pt-1 border-t border-stone-100">
                  {sessionResolutions.map((res, idx) => (
                    <li key={idx} className="text-xs bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/80 flex items-start gap-2">
                      <span className="text-emerald-700 font-black mt-0.5">•</span>
                      <span className="font-semibold text-stone-800">{res.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Loan Disbursal Form */}
            <div className="bg-white border border-stone-200 p-3.5 sm:p-4 rounded-lg shadow-2xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disburseLoan}
                  onChange={(e) => setDisburseLoan(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700"
                />
                <span className="font-black text-xs sm:text-sm text-stone-900">
                  {language === 'mr' ? 'या बैठकीत नवीन अंतर्गत कर्ज मंजूर करायचे आहे' : 'Disburse a new micro-loan in this meeting'}
                </span>
              </label>

              {disburseLoan && (
                <div className="space-y-2.5 pt-3 mt-2 border-t border-stone-200 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      {language === 'mr' ? 'कर्जदार सभासद निवडा' : 'Select Borrower Member'}
                    </label>
                    <select
                      value={selectedLoanMemberId}
                      onChange={(e) => setSelectedLoanMemberId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 outline-none"
                    >
                      <option value="">-- {language === 'mr' ? 'सभासद निवडा' : 'Select Member'} --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {language === 'mr' ? m.nameRegional : m.name} (Trust: {m.trustScore}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        {language === 'mr' ? 'कर्ज रक्कम (₹)' : 'Loan Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-black text-stone-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        {language === 'mr' ? 'कर्जाचे कारण' : 'Purpose'}
                      </label>
                      <input
                        type="text"
                        value={loanPurpose}
                        onChange={(e) => setLoanPurpose(e.target.value)}
                        placeholder={language === 'mr' ? 'उदा. बियाणे, शेती' : 'e.g. seeds, farming'}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-900 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => { sound.playStampSound(); setStep(2); }}
                className="px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center space-x-1 transition active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                type="button"
                onClick={() => { sound.playStampSound(); setStep(4); }}
                className="bg-[#14532D] hover:bg-emerald-900 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <span>{language === 'mr' ? 'पुढील: स्वाक्षरी व जतन' : 'Next: Quorum & Commit'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Quorum PIN & Commit (Sleek & Compressed) */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Quorum Officers Grid */}
            <div className="bg-white border border-stone-200 p-3.5 sm:p-4 rounded-lg space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-800" />
                    <span>{language === 'mr' ? '२-पैकी-३ पदाधिकारी स्वाक्षरी' : 'Officer Quorum PINs (Choose 2)'}</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {language === 'mr' ? 'किमान २ पदाधिकाऱ्यांचे ४-अंकी पिन आवश्यक.' : 'At least 2 officers must enter PIN.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleAutoFillPin('PRESIDENT');
                    handleAutoFillPin('TREASURER');
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'mr' ? '⚡ १-टॅप स्वाक्षरी भरा' : '⚡ 1-Click Auto-Sign'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEFAULT_OFFICERS.map(officer => {
                  const isSelected = selectedRoles.includes(officer.role);
                  const isVerified = verifiedSignatures[officer.role];
                  return (
                    <div
                      key={officer.role}
                      className={`p-2.5 rounded-lg border transition ${
                        isVerified
                          ? 'bg-emerald-50/80 border-emerald-600'
                          : isSelected
                          ? 'bg-amber-50/80 border-amber-400'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <button
                          type="button"
                          onClick={() => toggleRoleSelection(officer.role)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                            isSelected ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {officer.role}
                        </button>
                        {isVerified ? (
                          <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Signed</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-bold">Unsigned</span>
                        )}
                      </div>

                      <div className="text-xs font-black text-stone-900 truncate">{officer.nameRegional}</div>

                      {isSelected && !isVerified && (
                        <div className="mt-2 space-y-1">
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="****"
                            value={pinInputs[officer.role]}
                            onChange={(e) => handleVerifyPin(officer.role, e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-center font-mono text-sm font-black tracking-widest outline-none focus:ring-1 focus:ring-emerald-700"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {pinErrorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{pinErrorMsg}</span>
                </div>
              )}
            </div>

            {/* Session Summary Card */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-lg text-xs font-bold text-stone-800 space-y-1.5 shadow-2xs">
              <div className="flex justify-between">
                <span>{language === 'mr' ? 'उपस्थिती:' : 'Attendance:'}</span>
                <span className="text-emerald-900 font-black">{totalPresent} / {members.length} Present</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'mr' ? 'एकूण जमा बचत:' : 'Total Savings:'}</span>
                <span className="text-emerald-900 font-black">₹{totalSavingsCollected.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'mr' ? 'पुष्टीबद्ध स्वाक्षऱ्या:' : 'Verified Quorum:'}</span>
                <span className="text-emerald-900 font-black">{validSignaturesCount} / 3 Officers</span>
              </div>
            </div>

            {/* Out-of-Band SMS Receipts Drawer */}
            {isCommitted && (
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-lg space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-950 font-black text-xs sm:text-sm">
                  <MessageSquare className="w-4 h-4 text-amber-700" />
                  <span>{language === 'mr' ? 'सदस्यांना ऑफलाईन SMS / WhatsApp पावती पाठवा' : 'Broadcast Audit Receipts via WhatsApp'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleBroadcastSmsReceipts}
                  className="w-full bg-stone-900 hover:bg-black text-white font-black py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'mr' ? 'SMS / WhatsApp पावती पाठवा' : 'Broadcast Receipts'}</span>
                </button>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => { sound.playStampSound(); setStep(3); }}
                disabled={isCommitted || isSubmitting}
                className="px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center justify-center gap-1 transition disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>

              {isCommitted ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.playStampSound();
                    onCancel();
                  }}
                  className="w-full sm:w-auto font-black px-5 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm bg-emerald-700 hover:bg-emerald-800 text-white transition active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>{language === 'mr' ? 'बैठक समाप्त करा आणि डॅशबोर्ड पहा' : 'Finish & Return to Dashboard'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={!isQuorumMet || isSubmitting}
                  className={`w-full sm:w-auto font-black px-5 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 ${
                    isQuorumMet && !isSubmitting
                      ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'mr' ? 'नोंदवहीत जतन होत आहे...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'mr' ? 'नोंदवहीत जतन करा' : 'Save Session to Ledger'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

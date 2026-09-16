import React, { useState } from 'react';
import { Member, SupportedLanguage, Resolution, OfficerRole, OfficerSignature } from '../types/shg';
import { verifyOfficerPin, DEFAULT_OFFICERS } from '../services/db';
import { calculateSHA256 } from '../services/hashChain';
import { UserCheck, Check, DollarSign, HandCoins, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Volume2, Key, ShieldCheck, Share2, MessageSquare, AlertCircle, FileText, Lock } from 'lucide-react';
import { tts } from '../services/tts';
import { sound } from '../services/sound';
import { CashBoxReconciliation } from './CashBoxReconciliation';
import { ResolutionRegister } from './ResolutionRegister';

interface MeetingWizardProps {
  members: Member[];
  language: SupportedLanguage;
  monthlySavingsAmount: number;
  onCompleteMeeting: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => void;
  onCancel: () => void;
}

export const MeetingWizard: React.FC<MeetingWizardProps> = ({
  members,
  language,
  monthlySavingsAmount,
  onCompleteMeeting,
  onCancel
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 state: Attendance
  const [attendance, setAttendance] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    members.forEach(m => { initial[m.id] = true; });
    return initial;
  });

  // Step 2 state: Savings collection & Cash Box
  const [savingsAmounts, setSavingsAmounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    members.forEach(m => { initial[m.id] = monthlySavingsAmount; });
    return initial;
  });

  // Step 3 state: Resolutions & Loan Disbursal
  const [sessionResolutions, setSessionResolutions] = useState<Omit<Resolution, 'id' | 'resolutionNumber'>[]>([]);
  const [disburseLoan, setDisburseLoan] = useState<boolean>(false);
  const [selectedLoanMemberId, setSelectedLoanMemberId] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<number>(5000);
  const [loanPurpose, setLoanPurpose] = useState<string>('शेती/छोटे दुकान (Agri/Small Business)');

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

    onCompleteMeeting(attendance, savingsList, loanData, sessionResolutions, confirmedSigs, proofHash);
    setIsCommitted(true);
  };

  // Broadcast Out-of-Band SMS / WhatsApp Audit Receipts
  const handleBroadcastSmsReceipts = () => {
    sound.playStampSound();
    const sampleReceipts = members.map(m => {
      const isPresent = attendance[m.id];
      const savings = savingsAmounts[m.id] || 0;
      return `माहिती: महिला प्रगति बचत गट बैठकीत आपली ₹${savings} बचत जमा झाली. हजेरी: ${isPresent ? 'हजर' : 'गैरहजर'}. शिल्लक कर्ज: ₹${m.activeLoanBalance}.`;
    }).join('\n\n');

    if (navigator.share) {
      navigator.share({
        title: 'SHGConnect Meeting Audit Receipt',
        text: sampleReceipts
      }).catch(() => {});
    } else {
      const smsUri = `sms:?body=${encodeURIComponent(sampleReceipts.substring(0, 140))}`;
      window.open(smsUri, '_self');
    }
  };

  return (
    <div className="bg-[#FDFBF7] rounded-3xl shadow-2xl border-2 border-[#14532D] overflow-hidden">
      {/* Wizard Step Progress Header - Interactive Tab Buttons */}
      <div className="bg-[#14532D] text-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black flex items-center gap-2">
            ✨ {language === 'mr' ? 'मासिक बैठक सत्र (Meeting Session Mode)' : 'Monthly Meeting Session'}
          </h2>
          <span className="text-xs bg-emerald-900 text-amber-300 px-3 py-1 rounded-full font-bold border border-emerald-700">
            Step {step} of 4
          </span>
        </div>

        {/* Step Indicators - Interactive Clickable Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-black">
          <button
            onClick={() => { sound.playStampSound(); setStep(1); }}
            className={`p-2 rounded-xl border transition ${step === 1 ? 'bg-amber-400 text-amber-950 border-amber-500 shadow' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}`}
          >
            1. {language === 'mr' ? 'उपस्थिती' : 'Attendance'}
          </button>
          <button
            onClick={() => { sound.playStampSound(); setStep(2); }}
            className={`p-2 rounded-xl border transition ${step === 2 ? 'bg-amber-400 text-amber-950 border-amber-500 shadow' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}`}
          >
            2. {language === 'mr' ? 'बचत व रोकड पेटी' : 'Savings & Cash Box'}
          </button>
          <button
            onClick={() => { sound.playStampSound(); setStep(3); }}
            className={`p-2 rounded-xl border transition ${step === 3 ? 'bg-amber-400 text-amber-950 border-amber-500 shadow' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}`}
          >
            3. {language === 'mr' ? 'इतिवृत्त व कर्ज' : 'Resolutions & Loan'}
          </button>
          <button
            onClick={() => { sound.playStampSound(); setStep(4); }}
            className={`p-2 rounded-xl border transition ${step === 4 ? 'bg-amber-400 text-amber-950 border-amber-500 shadow' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}`}
          >
            4. {language === 'mr' ? 'द्वि-स्वाक्षरी व जतन' : 'Quorum & Commit'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* STEP 1: Attendance Checklist */}
        {step === 1 && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-black text-[#1C1917] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#14532D]" />
                {language === 'mr' ? '१. उपस्थिती नोंदवा (Attendance Checklist)' : 'Step 1: Attendance Checklist'}
              </h3>
              <p className="text-xs text-stone-600">
                {language === 'mr' ? 'उपस्थित असणाऱ्या सभासदांवर क्लिक करा.' : 'Tap to toggle present (green) or absent (gray).'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {members.map(member => {
                const isPresent = attendance[member.id];
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleAttendance(member.id)}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between text-left transition transform active:scale-98 ${
                      isPresent
                        ? 'bg-emerald-50/80 border-[#14532D] text-[#1C1917] shadow-xs'
                        : 'bg-[#F7F4EC] border-[#E2DDD3] text-stone-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-2xl ${member.avatarColor} text-white font-black flex items-center justify-center text-sm shadow-xs`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-[#1C1917]">
                          {language === 'mr' ? member.nameRegional : member.name}
                        </div>
                        <div className="text-xs text-stone-500 font-semibold">{member.role}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center space-x-1 ${
                      isPresent ? 'bg-[#14532D] text-white' : 'bg-stone-300 text-stone-600'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isPresent ? (language === 'mr' ? 'हजर' : 'Present') : (language === 'mr' ? 'गैरहजर' : 'Absent')}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DDD3]">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-[#E2DDD3] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                onClick={() => { sound.playStampSound(); setStep(2); }}
                className="bg-[#14532D] hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 shadow"
              >
                <span>{language === 'mr' ? 'बचत व रोकड पेटीकडे जा' : 'Next: Bulk Savings & Cash Box'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Bulk Savings Collection & Cash Box Reconciliation */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-[#1C1917] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#14532D]" />
                {language === 'mr' ? '२. मासिक बचत संकलन (Bulk Savings Collection)' : 'Step 2: Bulk Savings Collection'}
              </h3>
              <p className="text-xs text-stone-600">
                {language === 'mr' ? 'प्रत्येक सभासदाची बचत रक्कम प्रविष्ट करा आणि आवाजाद्वारे खात्री करा.' : 'Verify savings deposit amounts per member.'}
              </p>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {members.map(member => {
                const isPresent = attendance[member.id];
                const amt = savingsAmounts[member.id] || 0;
                return (
                  <div
                    key={member.id}
                    className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                      isPresent ? 'bg-white border-[#E2DDD3]' : 'bg-[#F7F4EC] border-[#E2DDD3] opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl ${member.avatarColor} text-white font-bold flex items-center justify-center text-xs shadow-xs`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-[#1C1917]">
                          {language === 'mr' ? member.nameRegional : member.name}
                        </span>
                        {!isPresent && <span className="ml-2 text-xs text-rose-600 font-bold">(Absent)</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-stone-500">₹</span>
                      <input
                        type="number"
                        disabled={!isPresent}
                        value={amt}
                        onChange={(e) => handleSavingsAmountChange(member.id, parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-1.5 border border-[#E2DDD3] rounded-xl text-sm font-extrabold text-right focus:ring-2 focus:ring-[#14532D] outline-none"
                      />
                      <button
                        onClick={() => handleTriggerTtsAnnouncement(member, amt)}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl transition shadow-xs"
                        title="Announce amount aloud via TTS"
                      >
                        <Volume2 className="w-4 h-4" />
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

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DDD3]">
              <button
                onClick={() => { sound.playStampSound(); setStep(1); }}
                className="px-4 py-2 border border-[#E2DDD3] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                onClick={() => { sound.playStampSound(); setStep(3); }}
                className="bg-[#14532D] hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 shadow"
              >
                <span>{language === 'mr' ? 'इतिवृत्त व कर्जाकडे जा' : 'Next: Resolutions & Loan'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Resolutions & Loan Disbursal */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-[#1C1917] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#14532D]" />
                {language === 'mr' ? '३. बैठक इतिवृत्त व कर्ज मंजूर (Resolutions & Loan)' : 'Step 3: Resolutions & Loan Disbursal'}
              </h3>
              <p className="text-xs text-stone-600">
                {language === 'mr' ? 'बैठकीत संमत झालेले नवीन ठराव नोंदवा आणि कर्ज मंजूर करा.' : 'Log meeting proceedings resolutions and optional micro-loan disbursal.'}
              </p>
            </div>

            {/* Proceedings Resolution Logger */}
            <ResolutionRegister
              members={members}
              resolutions={[]}
              language={language}
              onAddResolution={handleAddSessionResolution}
            />

            {/* Loan Disbursal Form */}
            <div className="bg-white border border-[#E2DDD3] p-4 rounded-2xl">
              <label className="flex items-center space-x-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={disburseLoan}
                  onChange={(e) => setDisburseLoan(e.target.checked)}
                  className="w-5 h-5 text-[#14532D] rounded focus:ring-[#14532D]"
                />
                <span className="font-extrabold text-sm text-[#1C1917]">
                  {language === 'mr' ? 'या बैठकीत नवीन कर्ज वाटप करायचे आहे' : 'Disburse a new micro-loan in this meeting'}
                </span>
              </label>

              {disburseLoan && (
                <div className="space-y-3 pt-3 border-t border-[#E2DDD3]">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {language === 'mr' ? 'कर्जदार सभासद निवडा' : 'Select Borrower Member'}
                    </label>
                    <select
                      value={selectedLoanMemberId}
                      onChange={(e) => setSelectedLoanMemberId(e.target.value)}
                      className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-2 text-sm font-bold text-[#1C1917] outline-none"
                    >
                      <option value="">-- {language === 'mr' ? 'सभासद निवडा' : 'Select Member'} --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {language === 'mr' ? m.nameRegional : m.name} (Trust Score: {m.trustScore}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {language === 'mr' ? 'कर्ज रक्कम (Loan Amount ₹)' : 'Loan Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-2 text-sm font-extrabold text-[#1C1917] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {language === 'mr' ? 'कर्जाचे कारण' : 'Purpose / Notes'}
                    </label>
                    <input
                      type="text"
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-2 text-sm font-bold text-[#1C1917] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DDD3]">
              <button
                onClick={() => { sound.playStampSound(); setStep(2); }}
                className="px-4 py-2 border border-[#E2DDD3] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                onClick={() => { sound.playStampSound(); setStep(4); }}
                className="bg-[#14532D] hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 shadow"
              >
                <span>{language === 'mr' ? 'स्वाक्षरी व जतन' : 'Next: Quorum & Commit'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: 2-of-3 Multi-Signatory Quorum PIN & Out-of-Band SMS Receipt */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-[#1C1917] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#14532D]" />
                {language === 'mr' ? '४. २-पैकी-३ पदाधिकारी द्वि-स्वाक्षरी (2-of-3 PIN Quorum Consensus)' : 'Step 4: Multi-Signatory PIN Quorum'}
              </h3>
              <p className="text-xs text-stone-600">
                {language === 'mr'
                  ? 'एकल-चालक गैरव्यवहार टाळण्यासाठी किमान २ पदाधिकाऱ्यांचे ४-अंकी पिन आवश्यक.'
                  : 'To eliminate single-operator fraud, at least 2 elected officers must enter their 4-digit PIN.'}
              </p>
            </div>

            {/* Quorum Officer Selector Badges & Quick Auto-Fill Helpers */}
            <div className="bg-white border border-[#E2DDD3] p-4 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-stone-700">
                  {language === 'mr' ? 'स्वाक्षरी करणाऱ्या २ पदाधिकाऱ्यांची निवड करा:' : 'Select Signatory Officers (Choose 2 or 3):'}
                </div>

                {/* Quick Auto-Fill Helper Badges for Easy Demo */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className="text-stone-500">Auto-Fill:</span>
                  <button
                    type="button"
                    onClick={() => handleAutoFillPin('PRESIDENT')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-2 py-0.5 rounded border border-amber-300"
                    title="Auto-fill President PIN (1111)"
                  >
                    अध्यक्ष (1111)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFillPin('TREASURER')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-2 py-0.5 rounded border border-amber-300"
                    title="Auto-fill Treasurer PIN (3333)"
                  >
                    खजिनदार (3333)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFillPin('SECRETARY')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-2 py-0.5 rounded border border-amber-300"
                    title="Auto-fill Secretary PIN (2222)"
                  >
                    सचिव (2222)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEFAULT_OFFICERS.map(officer => {
                  const isSelected = selectedRoles.includes(officer.role);
                  const isVerified = verifiedSignatures[officer.role];
                  return (
                    <div
                      key={officer.role}
                      className={`p-3 rounded-2xl border-2 transition ${
                        isVerified
                          ? 'bg-emerald-50 border-[#14532D]'
                          : isSelected
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-[#F7F4EC] border-[#E2DDD3]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <button
                          type="button"
                          onClick={() => toggleRoleSelection(officer.role)}
                          className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            isSelected ? 'bg-[#14532D] text-white' : 'bg-stone-300 text-stone-700'
                          }`}
                        >
                          {officer.role}
                        </button>
                        {isVerified ? (
                          <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Signed</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-bold">Unsigned</span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-[#1C1917] mb-2">{officer.nameRegional}</div>

                      {isSelected && (
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 mb-1">
                            {language === 'mr' ? `4-अंकी PIN (Default: ${officer.defaultPin})` : `Enter 4-Digit PIN (${officer.defaultPin})`}
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="****"
                            value={pinInputs[officer.role]}
                            onChange={(e) => handleVerifyPin(officer.role, e.target.value)}
                            className="w-full bg-white border border-[#E2DDD3] rounded-xl px-2.5 py-1.5 text-center font-mono text-base font-black tracking-widest outline-none focus:ring-2 focus:ring-[#14532D]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Error Banner */}
              {pinErrorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{pinErrorMsg}</span>
                </div>
              )}

              {!isQuorumMet && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs font-bold text-center">
                  ⚠️ किमान २ पदाधिकाऱ्यांची पिन स्वाक्षरी आवश्यक आहे (Minimum 2 officer PIN signatures required)
                </div>
              )}
            </div>

            {/* Session Summary Card */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-2 text-xs font-bold text-stone-800">
              <div className="flex justify-between">
                <span>उपस्थिती (Attendance):</span>
                <span className="text-[#14532D] font-extrabold">{totalPresent} / {members.length} Present</span>
              </div>
              <div className="flex justify-between">
                <span>एकूण जमा बचत (Savings):</span>
                <span className="text-[#14532D] font-extrabold">₹{totalSavingsCollected.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>पुष्टीबद्ध स्वाक्षऱ्या (Verified Quorum):</span>
                <span className="text-[#14532D] font-extrabold">{validSignaturesCount} / 3 Officers</span>
              </div>
            </div>

            {/* Out-of-Band SMS Audit Receipts Drawer (Visible after commit) */}
            {isCommitted && (
              <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center space-x-2 text-amber-950 font-black text-sm">
                  <MessageSquare className="w-5 h-5 text-amber-700" />
                  <span>सदस्यांना ऑफलाईन SMS / WhatsApp पावती पाठवा</span>
                </div>
                <p className="text-xs text-amber-900 font-medium">
                  कोणत्याही ऑनलाईन SMS गेटवेचा वापर न करता मोबाईल वेब शेअर API द्वारे सदस्यांना ऑडीट पावती पाठवा.
                </p>
                <button
                  onClick={handleBroadcastSmsReceipts}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow transition"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>SMS / WhatsApp पावती पाठवा (Broadcast Audit Receipts)</span>
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DDD3]">
              <button
                onClick={() => { sound.playStampSound(); setStep(3); }}
                disabled={isCommitted}
                className="px-4 py-2 border border-[#E2DDD3] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={!isQuorumMet || isCommitted}
                className={`font-black px-6 py-3 rounded-2xl text-sm flex items-center space-x-2 shadow-xl transition transform active:scale-95 ${
                  isQuorumMet && !isCommitted
                    ? 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isCommitted ? 'ब्लॉक जतन झाला! (Block Sealed)' : (language === 'mr' ? 'नोंदवहीत जतन करा (Commit Block)' : 'Save Session to Ledger')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

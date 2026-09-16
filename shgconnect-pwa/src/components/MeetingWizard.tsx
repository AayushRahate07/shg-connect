import React, { useState } from 'react';
import { Member, SupportedLanguage, Resolution } from '../types/shg';
import { UserCheck, Check, DollarSign, HandCoins, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Volume2, Coins, FileText } from 'lucide-react';
import { tts } from '../services/tts';
import { sound } from '../services/sound';
import { CashBoxReconciliation } from './CashBoxReconciliation';
import { ResolutionRegister, INITIAL_RESOLUTIONS } from './ResolutionRegister';

interface MeetingWizardProps {
  members: Member[];
  language: SupportedLanguage;
  monthlySavingsAmount: number;
  onCompleteMeeting: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[]
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
    members.forEach(m => { initial[m.id] = true; }); // Default all present
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

  const handleFinalSubmit = () => {
    sound.playStampSound();
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

    onCompleteMeeting(attendance, savingsList, loanData, sessionResolutions);
  };

  return (
    <div className="bg-[#FDFBF7] rounded-3xl shadow-2xl border-2 border-[#14532D] overflow-hidden">
      {/* Wizard Step Progress Header */}
      <div className="bg-[#14532D] text-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black flex items-center gap-2">
            ✨ {language === 'mr' ? 'मासिक बैठक सत्र (Meeting Session Mode)' : 'Monthly Meeting Session'}
          </h2>
          <span className="text-xs bg-emerald-900 text-amber-300 px-3 py-1 rounded-full font-bold border border-emerald-700">
            Step {step} of 4
          </span>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-black">
          <div className={`p-2 rounded-xl border transition ${step === 1 ? 'bg-amber-400 text-amber-950 border-amber-500' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800'}`}>
            1. {language === 'mr' ? 'उपस्थिती' : 'Attendance'}
          </div>
          <div className={`p-2 rounded-xl border transition ${step === 2 ? 'bg-amber-400 text-amber-950 border-amber-500' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800'}`}>
            2. {language === 'mr' ? 'बचत व रोकड पेटी' : 'Savings & Cash Box'}
          </div>
          <div className={`p-2 rounded-xl border transition ${step === 3 ? 'bg-amber-400 text-amber-950 border-amber-500' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800'}`}>
            3. {language === 'mr' ? 'इतिवृत्त व कर्ज' : 'Resolutions & Loan'}
          </div>
          <div className={`p-2 rounded-xl border transition ${step === 4 ? 'bg-amber-400 text-amber-950 border-amber-500' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800'}`}>
            4. {language === 'mr' ? 'सादर करा' : 'Summary'}
          </div>
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
                onClick={() => setStep(2)}
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

            {/* Module 2: Physical Cash Box Denomination Counter */}
            <CashBoxReconciliation
              expectedCash={totalSavingsCollected}
              language={language}
            />

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DDD3]">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-[#E2DDD3] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                onClick={() => setStep(3)}
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

            {/* Module 3: Proceedings Resolution Logger */}
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
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-[#E2DDD3] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="bg-[#14532D] hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 shadow"
              >
                <span>{language === 'mr' ? 'तपशील तपासा' : 'Next: Final Summary'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Final Summary & Commit Block */}
        {step === 4 && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-black text-[#1C1917] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#14532D]" />
                {language === 'mr' ? '४. बैठकीचा गोषवारा (Session Summary & SHA-256 Commit)' : 'Step 4: Final Session Summary'}
              </h3>
              <p className="text-xs text-stone-600">
                {language === 'mr' ? 'खालील तपशील तपासा आणि SHA-256 क्रिप्टोग्राफिक नोंदवहीत ब्लॉक जोडा.' : 'Review meeting details before appending to the hash chain.'}
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3 mb-6">
              <div className="flex justify-between text-xs font-bold text-stone-800">
                <span>{language === 'mr' ? 'उपस्थिती (Attendance):' : 'Attendance Rate:'}</span>
                <span className="text-[#14532D] font-extrabold">{totalPresent} / {members.length} Present</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-stone-800">
                <span>{language === 'mr' ? 'एकूण बचत (Total Savings Collected):' : 'Total Savings Collected:'}</span>
                <span className="text-[#14532D] font-extrabold">₹{totalSavingsCollected.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-stone-800">
                <span>{language === 'mr' ? 'नोंदवलेले ठराव (Resolutions Logged):' : 'Session Resolutions:'}</span>
                <span className="text-[#14532D] font-extrabold">{sessionResolutions.length} Resolutions</span>
              </div>
              {disburseLoan && selectedLoanMemberId && (
                <div className="flex justify-between text-xs font-bold text-amber-900 pt-2 border-t border-emerald-200">
                  <span>{language === 'mr' ? 'मंजूर केलेले कर्ज (Disbursed Loan):' : 'Approved Loan Disbursal:'}</span>
                  <span className="font-extrabold">₹{loanAmount.toLocaleString('en-IN')} ({loanPurpose})</span>
                </div>
              )}
            </div>

            <div className="bg-[#1C1917] text-stone-100 p-4 rounded-2xl text-xs font-mono space-y-1 mb-6">
              <div className="text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>Append-Only SHA-256 Block Commit</span>
              </div>
              <p className="text-stone-400 text-[11px]">
                Payload: {totalPresent} present, ₹{totalSavingsCollected} savings, {sessionResolutions.length} resolutions.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DDD3]">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-[#E2DDD3] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                onClick={handleFinalSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black px-6 py-3 rounded-2xl text-sm flex items-center space-x-2 shadow-xl transition transform active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{language === 'mr' ? 'नोंदवहीत जतन करा (Commit Block)' : 'Save Session to Ledger'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

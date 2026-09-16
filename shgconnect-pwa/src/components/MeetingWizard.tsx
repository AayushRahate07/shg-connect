import React, { useState } from 'react';
import { Member, SupportedLanguage, Transaction } from '../types/shg';
import { UserCheck, Check, DollarSign, HandCoins, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';
import { tts } from '../services/tts';

interface MeetingWizardProps {
  members: Member[];
  language: SupportedLanguage;
  monthlySavingsAmount: number;
  onCompleteMeeting: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string }
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

  // Step 2 state: Savings collection per member
  const [savingsAmounts, setSavingsAmounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    members.forEach(m => { initial[m.id] = monthlySavingsAmount; });
    return initial;
  });

  // Step 3 state: Loan Disbursal
  const [disburseLoan, setDisburseLoan] = useState<boolean>(false);
  const [selectedLoanMemberId, setSelectedLoanMemberId] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<number>(5000);
  const [loanPurpose, setLoanPurpose] = useState<string>('शेती/छोटे दुकान (Agri/Small Business)');

  const toggleAttendance = (memberId: string) => {
    setAttendance(prev => {
      const nextVal = !prev[memberId];
      // If setting absent, zero out savings
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

  const handleFinalSubmit = () => {
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

    onCompleteMeeting(attendance, savingsList, loanData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-700/60 overflow-hidden">
      {/* Wizard Step Progress Header */}
      <div className="bg-emerald-900 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            ✨ {language === 'mr' ? 'मासिक बैठक सत्र (Meeting Session Mode)' : 'Monthly Meeting Session'}
          </h2>
          <span className="text-xs bg-emerald-800 text-emerald-200 px-3 py-1 rounded-full font-medium border border-emerald-700">
            Step {step} of 4
          </span>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          <div className={`p-2 rounded-lg border transition ${step === 1 ? 'bg-amber-500 text-amber-950 border-amber-400' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'}`}>
            1. {language === 'mr' ? 'उपस्थिती' : 'Attendance'}
          </div>
          <div className={`p-2 rounded-lg border transition ${step === 2 ? 'bg-amber-500 text-amber-950 border-amber-400' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'}`}>
            2. {language === 'mr' ? 'बचत संकलन' : 'Bulk Savings'}
          </div>
          <div className={`p-2 rounded-lg border transition ${step === 3 ? 'bg-amber-500 text-amber-950 border-amber-400' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'}`}>
            3. {language === 'mr' ? 'कर्ज वाटप' : 'Loan Disbursal'}
          </div>
          <div className={`p-2 rounded-lg border transition ${step === 4 ? 'bg-amber-500 text-amber-950 border-amber-400' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'}`}>
            4. {language === 'mr' ? 'सादर करा' : 'Summary'}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* STEP 1: Attendance Checklist */}
        {step === 1 && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                {language === 'mr' ? '१. उपस्थिती नोंदवा (Attendance Checklist)' : 'Step 1: Attendance Checklist'}
              </h3>
              <p className="text-xs text-slate-500">
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
                    className={`p-4 rounded-xl border-2 flex items-center justify-between text-left transition transform active:scale-95 ${
                      isPresent
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-full ${member.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {language === 'mr' ? member.nameRegional : member.name}
                        </div>
                        <div className="text-xs text-slate-500">{member.role}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 ${
                      isPresent ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isPresent ? (language === 'mr' ? 'हजर' : 'Present') : (language === 'mr' ? 'गैरहजर' : 'Absent')}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                onClick={() => setStep(2)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow"
              >
                <span>{language === 'mr' ? 'बचत संकलनाकडे जा' : 'Next: Bulk Savings'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Bulk Savings Collection */}
        {step === 2 && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                {language === 'mr' ? '२. मासिक बचत संकलन (Bulk Savings Collection)' : 'Step 2: Bulk Savings Collection'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'mr' ? 'प्रत्येक सभासदाची बचत रक्कम प्रविष्ट करा आणि आवाजाद्वारे खात्री करा.' : 'Verify savings deposit amounts per member.'}
              </p>
            </div>

            <div className="space-y-3 mb-6 max-h-[380px] overflow-y-auto pr-1">
              {members.map(member => {
                const isPresent = attendance[member.id];
                const amt = savingsAmounts[member.id] || 0;
                return (
                  <div
                    key={member.id}
                    className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                      isPresent ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full ${member.avatarColor} text-white font-bold flex items-center justify-center text-xs shadow`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900">
                          {language === 'mr' ? member.nameRegional : member.name}
                        </span>
                        {!isPresent && <span className="ml-2 text-xs text-rose-500 font-semibold">(Absent)</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        disabled={!isPresent}
                        value={amt}
                        onChange={(e) => handleSavingsAmountChange(member.id, parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-1.5 border border-slate-300 rounded-xl text-sm font-bold text-right focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      {/* Audio TTS Announcement trigger button */}
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

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 mb-6 flex justify-between items-center text-xs font-bold text-amber-950">
              <span>{language === 'mr' ? 'एकूण जमा बचत (Total Savings):' : 'Total Savings Collected:'}</span>
              <span className="text-base text-emerald-800 font-black">₹{totalSavingsCollected.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow"
              >
                <span>{language === 'mr' ? 'कर्ज वाटपाकडे जा' : 'Next: Loan Disbursal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Loan Disbursal */}
        {step === 3 && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-emerald-600" />
                {language === 'mr' ? '३. कर्ज मंजूर व वाटप (Loan Disbursal)' : 'Step 3: Loan Disbursal'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'mr' ? 'या बैठकीत नवीन कर्ज मंजूर करायचे असल्यास निवड करा.' : 'Approve new micro-loan disbursal for a member.'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
              <label className="flex items-center space-x-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={disburseLoan}
                  onChange={(e) => setDisburseLoan(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="font-bold text-sm text-slate-900">
                  {language === 'mr' ? 'या बैठकीत कर्ज वाटप करायचे आहे' : 'Disburse a loan in this meeting'}
                </span>
              </label>

              {disburseLoan && (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'mr' ? 'कर्जदार सभासद निवडा' : 'Select Borrower Member'}
                    </label>
                    <select
                      value={selectedLoanMemberId}
                      onChange={(e) => setSelectedLoanMemberId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'mr' ? 'कर्ज रक्कम (Loan Amount ₹)' : 'Loan Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'mr' ? 'कर्जाचे कारण' : 'Purpose / Notes'}
                    </label>
                    <input
                      type="text"
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow"
              >
                <span>{language === 'mr' ? 'तपशील तपासा' : 'Next: Final Summary'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Final Summary & Commit Block */}
        {step === 4 && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {language === 'mr' ? '४. बैठकीचा गोषवारा (Session Summary & SHA-256 Commit)' : 'Step 4: Final Session Summary'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'mr' ? 'खालील तपशील तपासा आणि SHA-256 क्रिप्टोग्राफिक नोंदवहीत ब्लॉक जोडा.' : 'Review meeting details before appending to the hash chain.'}
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 mb-6">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>{language === 'mr' ? 'उपस्थिती (Attendance):' : 'Attendance Rate:'}</span>
                <span className="text-emerald-800 font-extrabold">{totalPresent} / {members.length} Present</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>{language === 'mr' ? 'एकूण बचत (Total Savings Collected):' : 'Total Savings Collected:'}</span>
                <span className="text-emerald-800 font-extrabold">₹{totalSavingsCollected.toLocaleString('en-IN')}</span>
              </div>
              {disburseLoan && selectedLoanMemberId && (
                <div className="flex justify-between text-xs font-bold text-amber-900 pt-2 border-t border-emerald-200">
                  <span>{language === 'mr' ? 'मंजूर केलेले कर्ज (Disbursed Loan):' : 'Approved Loan Disbursal:'}</span>
                  <span className="font-extrabold">₹{loanAmount.toLocaleString('en-IN')} ({loanPurpose})</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono space-y-1 mb-6">
              <div className="text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Append-Only SHA-256 Block Commit</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Payload: {totalPresent} present, ₹{totalSavingsCollected} savings deposit.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              <button
                onClick={handleFinalSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black px-6 py-3 rounded-xl text-sm flex items-center space-x-2 shadow-lg transition transform active:scale-95"
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

import React, { useState } from 'react';
import { Member, Loan, Transaction, SupportedLanguage, GroupInfo } from '../../types/shg';
import { formatINR } from '../../theme/tokens';
import { getGroupSettings } from '../../services/db';
import { LoanLifecycleView } from './LoanLifecycleView';
import {
  Landmark,
  Calendar,
  Percent,
  CheckCircle2,
  ArrowRight,
  IndianRupee,
  Mic,
  X,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Button } from '../ui/Button';

interface MemberLoanProps {
  member: Member;
  loans: Loan[];
  transactions: Transaction[];
  language: SupportedLanguage;
  onOpenUpiPayment?: (type: 'SAVINGS' | 'EMI_REPAYMENT', amount: number) => void;
  group?: GroupInfo | null;
}

export const MemberLoan: React.FC<MemberLoanProps> = ({
  member,
  loans,
  transactions,
  language,
  onOpenUpiPayment,
  group
}) => {
  const isMr = language === 'mr';
  const settings = getGroupSettings(group);
  const memberLoans = loans.filter(l => l.memberId === member.id);
  const activeLoan = memberLoans.find(l => l.status === 'ACTIVE') || memberLoans[0];

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState<string>('10000');
  const [loanPurpose, setLoanPurpose] = useState<string>('शेती व बियाणे');
  const [isListening, setIsListening] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const multiplier = settings.loanLimitMultiplier || 3;
  const borrowingLimit = Math.max(15000, member.totalSavings * multiplier);

  const calculateMonthlyEMI = (loan: Loan) => {
    if (!loan) return 0;
    const monthlyInterest = (loan.principal * (loan.interestRateMonthly || 1.5)) / 100;
    const principalPerMonth = loan.principal / (loan.tenureMonths || 12);
    return Math.round(principalPerMonth + monthlyInterest);
  };

  const emiAmount = activeLoan ? calculateMonthlyEMI(activeLoan) : 0;

  // Keypad helper
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setRequestedAmount('0');
      return;
    }
    if (requestedAmount === '0') {
      setRequestedAmount(val);
    } else if (requestedAmount.length < 6) {
      setRequestedAmount(requestedAmount + val);
    }
  };

  // Voice recognition simulation / Web Speech API
  const handleVoiceInput = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'mr-IN';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const match = transcript.match(/\d+/);
          if (match) {
            setRequestedAmount(match[0]);
          } else if (transcript.includes('दहा हजार')) {
            setRequestedAmount('10000');
          } else if (transcript.includes('वीस हजार')) {
            setRequestedAmount('20000');
          } else if (transcript.includes('पंचवीस हजार')) {
            setRequestedAmount('25000');
          } else if (transcript.includes('पन्नास हजार')) {
            setRequestedAmount('50000');
          }
        };
        recognition.start();
      } catch {
        setIsListening(false);
      }
    } else {
      // Toggle friendly amount cycle
      const amounts = ['5000', '10000', '15000', '20000', '25000'];
      const nextIdx = (amounts.indexOf(requestedAmount) + 1) % amounts.length;
      setRequestedAmount(amounts[nextIdx]);
    }
  };

  const handleSubmitApplication = () => {
    const amt = parseInt(requestedAmount) || 0;
    if (amt <= 0) return;
    setShowApplyModal(false);
    setSuccessToast(
      isMr
        ? `तुमचा ₹${amt.toLocaleString('en-IN')} चा कर्ज अर्ज नोंदवला गेला आहे! पुढील बैठकीत मंजुरी मिळेल.`
        : `Loan request for ₹${amt.toLocaleString('en-IN')} submitted!`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-5 pb-8 animate-fadeIn max-w-2xl mx-auto">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-800 text-white p-3.5 rounded-lg shadow-md flex items-center gap-2.5 text-xs font-bold animate-slideDown">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-stone-900 rounded-lg p-5 sm:p-6 text-white shadow-sm space-y-4 border border-amber-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center font-bold text-amber-200">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {isMr ? 'माझे कर्ज' : 'My Loan'}
              </h2>
              <p className="text-xs text-amber-200 font-medium">
                {member.nameRegional || member.name} • {isMr ? 'बचत गट अंतर्गत कर्ज' : 'SHG Internal Credit'}
              </p>
            </div>
          </div>
          {activeLoan && (
            <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
              {activeLoan.status === 'ACTIVE' ? (isMr ? 'चालू' : 'Active') : (isMr ? 'पूर्ण' : 'Repaid')}
            </span>
          )}
        </div>

        {activeLoan ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider block">
                {isMr ? 'थकीत बाकी' : 'Remaining Balance'}
              </span>
              <span className="text-2xl sm:text-3xl font-black amount-display text-white mt-1 block">
                {formatINR(activeLoan.remainingBalance)}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-3.5 border border-white/10">
              <span className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider block">
                {isMr ? 'मासिक हप्ता' : 'Monthly EMI'}
              </span>
              <span className="text-2xl sm:text-3xl font-black amount-display text-amber-300 mt-1 block">
                {formatINR(emiAmount)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-amber-100 font-medium bg-white/10 p-4 rounded-lg border border-white/10">
            {isMr
              ? 'काही नाही (तुमच्या नावावर सध्या कोणतेही थकीत कर्ज नाही).'
              : 'You currently have no active loan outstanding.'}
          </div>
        )}

        {activeLoan && onOpenUpiPayment && (
          <Button
            variant="secondary"
            className="w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-black py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 shadow-xs transition"
            onClick={() => onOpenUpiPayment('EMI_REPAYMENT', emiAmount)}
          >
            <IndianRupee className="w-4 h-4" />
            <span>
              {isMr ? `UPI ने ₹${emiAmount} हप्ता भरा` : `Pay Monthly EMI ₹${emiAmount} via UPI`}
            </span>
          </Button>
        )}
      </div>

      {/* ── Borrowing Limit & "कर्ज मागा" Card ── */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50/40 border border-emerald-200 rounded-lg p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
            {isMr ? `गटाच्या नियमांनुसार तुमची कर्ज पात्रता (${multiplier} पट बचत)` : `Eligible Borrowing Limit (${multiplier}x)`}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 amount-display mt-0.5">
            {formatINR(borrowingLimit)}
          </div>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">
            {isMr ? `व्याज दर: शेकडा दीड रुपये (१.५%) • कालावधी: १२ महिने` : `Interest Rate: 1.5% • Max Tenure: 12 months`}
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#14532D] hover:bg-emerald-900 text-white rounded-lg text-xs font-black shadow-xs transition active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <span>{isMr ? 'कर्ज मागा' : 'Request Loan'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Active Loan Lifecycle Stepper */}
      {activeLoan ? (
        <div className="space-y-4">
          <h3 className="font-extrabold text-xs text-stone-700 uppercase tracking-wider">
            {isMr ? 'कर्ज प्रगती स्थिती' : 'Loan Lifecycle'}
          </h3>
          <LoanLifecycleView loan={activeLoan} language={language} />

          {/* Details Breakdown Grid */}
          <div className="bg-white border border-stone-200/80 rounded-lg p-4 sm:p-5 shadow-2xs space-y-4">
            <h4 className="font-bold text-xs text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">
              {isMr ? 'कर्ज तपशील' : 'Loan Terms & Details'}
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-400 font-medium block">
                  {isMr ? 'मंजूर कर्ज मुद्दल' : 'Sanctioned Principal'}
                </span>
                <span className="font-bold text-stone-900 text-sm mt-0.5 block amount-display">
                  {formatINR(activeLoan.principal)}
                </span>
              </div>

              <div>
                <span className="text-stone-400 font-medium block">
                  {isMr ? 'मासिक व्याज दर' : 'Monthly Rate'}
                </span>
                <span className="font-bold text-amber-800 text-sm mt-0.5 block flex items-center gap-1">
                  <span>{isMr ? 'शेकडा दीड रुपये (१.५%)' : `${activeLoan.interestRateMonthly}% / Month`}</span>
                </span>
              </div>

              <div>
                <span className="text-stone-400 font-medium block">
                  {isMr ? 'एकूण जमा परतफेड' : 'Total Paid So Far'}
                </span>
                <span className="font-bold text-emerald-800 text-sm mt-0.5 block amount-display">
                  {formatINR(activeLoan.totalPaid)}
                </span>
              </div>

              <div>
                <span className="text-stone-400 font-medium block">
                  {isMr ? 'कर्ज वाटप दिनांक' : 'Disbursal Date'}
                </span>
                <span className="font-bold text-stone-900 text-xs mt-1 block">
                  {activeLoan.dateDisbursed}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200/80 rounded-lg p-6 text-center space-y-2 shadow-2xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto" />
          <h3 className="font-black text-stone-900 text-base">
            {isMr ? 'काही नाही (कोणतेही कर्ज थकीत नाही)' : 'Zero Active Loans'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto font-medium">
            {isMr
              ? 'तुमचे सर्व जुने कर्ज हप्ते पूर्ण भरले गेले आहेत. नवीन कर्जासाठी वरील "कर्ज मागा" बटनावर टॅप करा.'
              : 'All your previous loans have been fully repaid. Tap "Request Loan" above to apply for a new loan.'}
          </p>
        </div>
      )}

      {/* ── "कर्ज मागा" Modal with Large Keypad & Voice Input ── */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  {isMr ? 'नवीन कर्ज अर्ज' : 'Apply for Loan'}
                </h3>
                <p className="text-xs text-stone-500">
                  {isMr ? `पात्रता: कमाल ${formatINR(borrowingLimit)} पर्यंत` : `Max Limit: ${formatINR(borrowingLimit)}`}
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Big Amount Display */}
            <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-200">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                {isMr ? 'मागितलेली रक्कम' : 'Requested Amount'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#14532D] tracking-tight mt-1">
                ₹ {parseInt(requestedAmount || '0').toLocaleString('en-IN')}
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-2">
              {['5000', '10000', '20000', '30000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRequestedAmount(amt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition active:scale-95 ${
                    requestedAmount === amt
                      ? 'bg-[#14532D] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  ₹{parseInt(amt).toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* Purpose Selection */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                {isMr ? 'कर्जाचे कारण / उद्देश:' : 'Purpose of Loan:'}
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['शेती व बियाणे', 'आरोग्य / औषधोपचार', 'लहान व्यवसाय', 'मुलांचे शिक्षण'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLoanPurpose(p)}
                    className={`p-2 rounded-lg border text-left font-bold transition active:scale-95 ${
                      loanPurpose === p
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-black'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Keypad & Voice input */}
            <div className="space-y-2 pt-1 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">
                  {isMr ? 'संख्या पॅड किंवा आवाज' : 'Keypad or Voice'}
                </span>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition active:scale-95 ${
                    isListening
                      ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isListening ? (isMr ? 'ऐकत आहे...' : 'Listening...') : (isMr ? 'बोलून सांगा 🎙️' : 'Speak')}</span>
                </button>
              </div>

              {/* Large touch targets keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '00'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKeypadPress(k === '00' ? '00' : k)}
                    className="h-11 rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-900 font-black text-base shadow-2xs transition active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="w-full py-2.5 px-4 rounded-lg border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 active:scale-95 transition"
              >
                {isMr ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSubmitApplication}
                className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-emerald-900 text-white font-bold text-xs shadow-xs active:scale-95 transition"
              >
                {isMr ? 'अर्ज पाठवा' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Member, Loan, Transaction, SupportedLanguage } from '../../types/shg';
import { formatINR } from '../../theme/tokens';
import { LoanLifecycleView } from './LoanLifecycleView';
import { Landmark, Calendar, Percent, CheckCircle2, ShieldAlert, ArrowRight, IndianRupee } from 'lucide-react';
import { Button } from '../ui/Button';

interface MemberLoanProps {
  member: Member;
  loans: Loan[];
  transactions: Transaction[];
  language: SupportedLanguage;
  onOpenUpiPayment?: (type: 'SAVINGS' | 'EMI_REPAYMENT', amount: number) => void;
}

export const MemberLoan: React.FC<MemberLoanProps> = ({
  member,
  loans,
  transactions,
  language,
  onOpenUpiPayment
}) => {
  const isMr = language === 'mr';
  const isHi = language === 'hi';

  const memberLoans = loans.filter(l => l.memberId === member.id);
  const activeLoan = memberLoans.find(l => l.status === 'ACTIVE') || memberLoans[0];

  const calculateMonthlyEMI = (loan: Loan) => {
    if (!loan) return 0;
    const monthlyInterest = (loan.principal * (loan.interestRateMonthly || 1.5)) / 100;
    const principalPerMonth = loan.principal / (loan.tenureMonths || 10);
    return Math.round(principalPerMonth + monthlyInterest);
  };

  const emiAmount = activeLoan ? calculateMonthlyEMI(activeLoan) : 0;

  return (
    <div className="space-y-6 pb-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 rounded-3xl p-6 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-amber-200">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {isMr ? 'माझे कर्ज खाते (Loan Account)' : 'My Loan Account'}
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                {member.nameRegional || member.name} · SHG Internal Credit
              </p>
            </div>
          </div>
          {activeLoan && (
            <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
              {activeLoan.status}
            </span>
          )}
        </div>

        {activeLoan ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider block">
                {isMr ? 'थकीत रक्कम (Remaining)' : 'Remaining Principal'}
              </span>
              <span className="text-3xl font-black amount-display text-white mt-1 block">
                {formatINR(activeLoan.remainingBalance)}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider block">
                {isMr ? 'मासिक हप्ता (Monthly EMI)' : 'Est. Monthly EMI'}
              </span>
              <span className="text-3xl font-black amount-display text-amber-300 mt-1 block">
                {formatINR(emiAmount)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-amber-100 font-medium bg-white/10 p-4 rounded-2xl border border-white/10">
            {isMr
              ? 'तुमच्या नावावर सध्या कोणतेही थकीत कर्ज नाही.'
              : 'You currently have no active loan outstanding.'}
          </div>
        )}

        {activeLoan && onOpenUpiPayment && (
          <Button
            variant="secondary"
            className="w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow transition"
            onClick={() => onOpenUpiPayment('EMI_REPAYMENT', emiAmount)}
          >
            <IndianRupee className="w-4 h-4" />
            <span>
              {isMr
                ? `UPI द्वारे ₹${emiAmount} हप्ता भरा (Pay EMI via UPI)`
                : `Pay Monthly EMI ₹${emiAmount} via UPI`}
            </span>
          </Button>
        )}
      </div>

      {/* Active Loan Lifecycle Stepper */}
      {activeLoan ? (
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900">
            {isMr ? 'कर्ज प्रगती स्थिती (Loan Lifecycle Progress)' : 'Loan Lifecycle Progress'}
          </h3>
          <LoanLifecycleView loan={activeLoan} language={language} />

          {/* Details Breakdown Grid */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-card space-y-4">
            <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
              {isMr ? 'कर्ज तपशील' : 'Loan Terms & Details'}
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-medium block">
                  {isMr ? 'मंजूर कर्ज रक्कम' : 'Sanctioned Principal'}
                </span>
                <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                  {formatINR(activeLoan.principal)}
                </span>
              </div>

              <div>
                <span className="text-gray-400 font-medium block">
                  {isMr ? 'मासिक व्याज दर' : 'Monthly Interest Rate'}
                </span>
                <span className="font-bold text-amber-700 text-sm mt-0.5 block flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>{activeLoan.interestRateMonthly}% / Month</span>
                </span>
              </div>

              <div>
                <span className="text-gray-400 font-medium block">
                  {isMr ? 'एकूण जमा रक्कम' : 'Total Paid So Far'}
                </span>
                <span className="font-bold text-emerald-800 text-sm mt-0.5 block">
                  {formatINR(activeLoan.totalPaid)}
                </span>
              </div>

              <div>
                <span className="text-gray-400 font-medium block">
                  {isMr ? 'कर्ज मंजूर दिनांक' : 'Disbursal Date'}
                </span>
                <span className="font-bold text-gray-900 text-xs mt-1 block">
                  {activeLoan.dateDisbursed}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
          <h3 className="font-black text-gray-900 text-base">
            {isMr ? 'कोणतेही कर्ज थकीत नाही' : 'Zero Active Loans'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
            {isMr
              ? 'तुमचे सर्व जुने कर्ज हप्ते पूर्ण भरले गेले आहेत. नवीन कर्जासाठी पुढील बैठकीत अर्ज करा.'
              : 'All your previous loans have been fully repaid. You can request a new internal loan during the next SHG meeting.'}
          </p>
        </div>
      )}
    </div>
  );
};

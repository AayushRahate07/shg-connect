import React from 'react';
import { Loan, SupportedLanguage } from '../../types/shg';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { formatINR } from '../../theme/tokens';
import { Landmark, Check, Calendar, ArrowUpRight } from 'lucide-react';

interface LoanLifecycleViewProps {
  loan?: Loan;
  language: SupportedLanguage;
  onPayEmi?: () => void;
}

export const LoanLifecycleView: React.FC<LoanLifecycleViewProps> = ({
  loan,
  language,
  onPayEmi
}) => {
  const isMr = language === 'mr';

  if (!loan) {
    return (
      <Card variant="saffron" className="p-6 text-center">
        <Landmark className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <h3 className="font-bold text-stone-800 text-sm">
          {isMr ? 'काही नाही (कोणतेही कर्ज शिल्लक नाही)' : 'No Active Loan'}
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          {isMr ? 'तुमच्या नावावर बचत गटाचे कोणतेही कर्ज थकीत नाही.' : 'You currently have zero active loan balances with the group.'}
        </p>
      </Card>
    );
  }

  const steps = [
    { label: isMr ? 'अर्ज' : 'Application', done: true },
    { label: isMr ? 'मंजूर' : 'Approved', done: true },
    { label: isMr ? 'वाटप' : 'Disbursed', done: true },
    { label: isMr ? 'सुरू' : 'Active', done: loan.status === 'ACTIVE' },
    { label: isMr ? 'पूर्ण' : 'Repaid', done: loan.status === 'REPAID' }
  ];

  const totalPrincipal = loan.principal;
  const totalPaid = loan.totalPaid;
  const remaining = loan.remainingBalance;
  const progressPct = Math.round((totalPaid / totalPrincipal) * 100);

  return (
    <Card className="overflow-hidden border border-stone-200/80 rounded-lg shadow-2xs">
      <CardHeader className="bg-stone-50 border-b border-stone-200">
        <CardTitle className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-800" />
          <span>{isMr ? 'चालू कर्ज खाते' : `Active Group Loan #${loan.id}`}</span>
        </CardTitle>
        <Badge variant={loan.status === 'ACTIVE' ? 'warning' : 'success'}>
          {loan.status === 'ACTIVE' ? (isMr ? 'चालू कर्ज' : 'Active') : (isMr ? 'पूर्ण फेडलेले' : 'Repaid')}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* Lifecycle Stepper */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 text-xs font-bold">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                  step.done ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-500'
                }`}
              >
                {step.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className={`text-[10px] text-center ${step.done ? 'text-stone-900 font-extrabold' : 'text-stone-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Loan Financial Figures */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
            <span className="text-[10px] text-stone-500 font-bold uppercase block">
              {isMr ? 'शिल्लक बाकी' : 'Outstanding'}
            </span>
            <div className="text-xl font-black text-rose-700 amount-display mt-0.5">
              {formatINR(remaining)}
            </div>
          </div>
          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <span className="text-[10px] text-stone-500 font-bold uppercase block">
              {isMr ? 'मंजूर मुद्दल' : 'Original Principal'}
            </span>
            <div className="text-base font-bold text-stone-900 amount-display mt-0.5">
              {formatINR(totalPrincipal)}
            </div>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase block">
              {isMr ? 'मासिक व्याज दर' : 'Monthly Rate'}
            </span>
            <div className="text-base font-bold text-amber-900 mt-0.5">
              {isMr ? 'शेकडा दीड रुपये (१.५%)' : `${loan.interestRateMonthly || 1.5}% / month`}
            </div>
          </div>
        </div>

        {/* Repayment Progress */}
        <Progress
          value={totalPaid}
          max={totalPrincipal}
          label={isMr ? 'परतफेड प्रगती' : 'Repayment Progress'}
          sublabel={isMr ? `${progressPct}% भरले (${formatINR(totalPaid)})` : `${progressPct}% Paid (${formatINR(totalPaid)})`}
          variant="green"
        />

        {/* Action Button */}
        {loan.status === 'ACTIVE' && onPayEmi && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {isMr
                  ? `पुढील हप्ता: ${formatINR(Math.round(totalPrincipal / (loan.tenureMonths || 10)))} (बैठकीच्या दिवशी)`
                  : 'Next EMI Due on meeting day'}
              </span>
            </div>
            <button
              onClick={onPayEmi}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1"
            >
              <span>{isMr ? 'हप्ता भरा' : 'Repay EMI'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

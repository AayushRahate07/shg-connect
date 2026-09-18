import React from 'react';
import { Loan, SupportedLanguage } from '../../types/shg';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { formatINR } from '../../theme/tokens';
import { Landmark, CheckCircle, Clock, Calendar, ArrowUpRight } from 'lucide-react';

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
  if (!loan) {
    return (
      <Card variant="parchment" className="p-6 text-center">
        <Landmark className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <h3 className="font-bold text-stone-800 text-sm">No Active Loan</h3>
        <p className="text-xs text-stone-500 mt-1">You currently have zero active loan balances with the group.</p>
      </Card>
    );
  }

  const steps = [
    { label: 'Application', done: true },
    { label: 'Approved', done: true },
    { label: 'Disbursed', done: true },
    { label: 'Active', done: loan.status === 'ACTIVE' },
    { label: 'Closed', done: loan.status === 'REPAID' }
  ];

  const totalPrincipal = loan.principal;
  const totalPaid = loan.totalPaid;
  const remaining = loan.remainingBalance;
  const progressPct = Math.round((totalPaid / totalPrincipal) * 100);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-stone-50">
        <CardTitle className="text-sm">
          <Landmark className="w-4 h-4 text-emerald-700" />
          <span>Active Group Loan #{loan.id}</span>
        </CardTitle>
        <Badge variant={loan.status === 'ACTIVE' ? 'warning' : 'success'}>
          {loan.status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Lifecycle Stepper */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 text-xs font-bold">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                  step.done ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-500'
                }`}
              >
                {step.done ? '✓' : idx + 1}
              </div>
              <span className={`text-[10px] text-center ${step.done ? 'text-stone-800 font-extrabold' : 'text-stone-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Loan Financial Figures */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-stone-500 font-bold uppercase">Outstanding</span>
            <div className="text-2xl font-black text-rose-700">{formatINR(remaining)}</div>
          </div>
          <div>
            <span className="text-xs text-stone-500 font-bold uppercase">Original Principal</span>
            <div className="text-base font-bold text-stone-800">{formatINR(totalPrincipal)}</div>
          </div>
          <div>
            <span className="text-xs text-stone-500 font-bold uppercase">Monthly Rate</span>
            <div className="text-base font-bold text-stone-800">{loan.interestRateMonthly}% / month</div>
          </div>
        </div>

        {/* Repayment Progress */}
        <Progress
          value={totalPaid}
          max={totalPrincipal}
          label="Repayment Progress"
          sublabel={`${progressPct}% Paid (${formatINR(totalPaid)})`}
          variant="emerald"
        />

        {/* Action Button */}
        {loan.status === 'ACTIVE' && onPayEmi && (
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Next EMI Due: ₹1,000 (5th of Month)</span>
            </div>
            <button
              onClick={onPayEmi}
              className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-amber-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1"
            >
              <span>Repay EMI via UPI</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

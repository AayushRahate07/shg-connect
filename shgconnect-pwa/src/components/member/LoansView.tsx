import React from 'react';
import { Member, Transaction, Loan, SupportedLanguage } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { formatINR } from '../../theme/tokens';
import { Card } from '../ui/Card';
import { Landmark, ArrowUpRight, CheckCircle2, AlertCircle, Calendar, ShieldCheck, History, Check } from 'lucide-react';

interface LoansViewProps {
  member: Member;
  loans: Loan[];
  transactions: Transaction[];
  language: SupportedLanguage;
  onOpenUpiPayment: (type: 'SAVINGS' | 'EMI_REPAYMENT', defaultAmt: number) => void;
  onNavigateTab?: (tab: string) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  member,
  loans,
  transactions,
  language,
  onOpenUpiPayment,
  onNavigateTab
}) => {
  const t = translations[language] || translations.en;
  
  const memberLoans = loans.filter(l => l.memberId === member.id);
  const activeLoan = memberLoans.find(l => l.status === 'ACTIVE');
  const closedLoans = memberLoans.filter(l => l.status === 'REPAID');

  const emiTxs = transactions.filter(t => t.memberId === member.id && t.type === 'EMI_REPAYMENT');

  // Lifecycle steps definitions
  const steps = [
    { label: language === 'mr' ? 'अर्ज' : language === 'hi' ? 'आवेदन' : 'Application', done: true },
    { label: language === 'mr' ? 'मंजूर' : language === 'hi' ? 'स्वीकृत' : 'Approved', done: true },
    { label: language === 'mr' ? 'वितरित' : language === 'hi' ? 'वितरित' : 'Disbursed', done: true },
    { label: language === 'mr' ? 'सक्रिय' : language === 'hi' ? 'सक्रिय' : 'Active', done: activeLoan !== undefined, active: true },
    { label: language === 'mr' ? 'पूर्ण' : language === 'hi' ? 'पूर्ण' : 'Closed', done: activeLoan ? activeLoan.remainingBalance === 0 : false }
  ];

  const principal = activeLoan ? activeLoan.principal : 30000;
  const outstanding = member.activeLoanBalance;
  const paid = Math.max(0, principal - outstanding);
  const progressPercent = Math.min(100, Math.round((paid / principal) * 100));

  const nextDueDate = (() => {
    const d = new Date();
    d.setDate(5);
    if (d < new Date()) d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' });
  })();

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
          <Landmark className="w-6 h-6 text-[#1D5FA8]" />
          <span>{language === 'mr' ? 'माझे कर्ज' : language === 'hi' ? 'मेरा ऋण' : 'My Loans'}</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {language === 'mr' ? 'कर्ज, हप्ते आणि परतफेडीचा इतिहास' : language === 'hi' ? 'ऋण, किस्तें और पुनर्भुगतान इतिहास' : 'Loan status, EMI schedules, and repayment history'}
        </p>
      </div>

      {/* Case A: Active Loan Exists */}
      {outstanding > 0 ? (
        <div className="space-y-6">
          {/* Active Loan Hero Card */}
          <div className="bg-blue-50/20 p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-card space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {language === 'mr' ? 'सक्रिय कर्जाची शिल्लक' : language === 'hi' ? 'सक्रिय ऋण शेष' : 'Active Outstanding Loan'}
              </span>
              <span className="bg-[#FFF0E5] text-[#E8720C] border border-[#FED7AA] font-extrabold text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {language === 'mr' ? `पुढील हप्ता: ₹१,००० (${nextDueDate})` : language === 'hi' ? `अगली किस्त: ₹1,000 (${nextDueDate})` : `Next EMI: ₹1,000 (Due ${nextDueDate})`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <div>
                <div className="text-4xl sm:text-5xl font-black text-[#1D5FA8] tracking-tight amount-display">
                  {formatINR(outstanding)}
                </div>
                <div className="text-xs text-gray-500 font-medium mt-1">
                  {language === 'mr' ? `मूळ कर्ज: ${formatINR(principal)} • व्याजदर: १.५%/महिना` : language === 'hi' ? `मूल ऋण: ${formatINR(principal)} • ब्याज दर: 1.5%/माह` : `Original Principal: ${formatINR(principal)} • Interest: 1.5%/mo`}
                </div>
              </div>

              <button
                onClick={() => onOpenUpiPayment('EMI_REPAYMENT', 0)}
                className="w-full sm:w-auto bg-[#E8720C] hover:bg-[#C55E08] text-white px-6 py-3 rounded-xl text-[14px] font-bold transition flex items-center justify-center gap-2 shadow-sm min-h-[48px]"
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
                <span>{language === 'mr' ? '₹ हप्ता भरा' : language === 'hi' ? '₹ किस्त चुकाएं' : 'Repay EMI'}</span>
              </button>
            </div>

            {/* Repayment Progress Gauge */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-bold text-[#111827] mb-1.5">
                <span>{language === 'mr' ? 'परतफेडीची प्रगती' : language === 'hi' ? 'पुनर्भुगतान प्रगति' : 'Repayment Progress'}</span>
                <span>{progressPercent}% ({formatINR(paid)} {language === 'mr' ? 'भरले' : language === 'hi' ? 'भुगतान किया' : 'paid'})</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #1D5FA8 0%, #3B82F6 100%)' }}
                />
              </div>
            </div>

            {/* Loan Lifecycle Stepper */}
            <div className="pt-3 border-t border-[#E4E8EF]">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                {language === 'mr' ? 'कर्जाची स्थिती (Lifecycle Stage)' : language === 'hi' ? 'ऋण स्थिति' : 'Loan Lifecycle Stage'}
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                      step.done 
                        ? 'bg-[#1D5FA8] text-white' 
                        : step.active 
                        ? 'bg-[#E8720C] text-white ring-2 ring-[#FFF0E5]' 
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {step.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold text-[#111827] truncate max-w-full">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* EMI Repayment History Table */}
          <Card className="p-0 border border-[#E4E8EF] shadow-card rounded-2xl overflow-hidden bg-white">
            <div className="p-4 border-b border-[#E4E8EF] flex items-center justify-between bg-[#F8FAFC]">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#1D5FA8]" />
                {language === 'mr' ? 'हप्त्यांचा इतिहास' : language === 'hi' ? 'किस्तों का इतिहास' : 'EMI Repayment History'}
              </span>
            </div>

            <div className="divide-y divide-[#E4E8EF]">
              {emiTxs.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-gray-500 font-medium">
                  {language === 'mr' ? 'अजून कोणत्याही हप्त्याची नोंद नाही.' : language === 'hi' ? 'अभी कोई किस्त दर्ज नहीं है।' : 'No EMI repayments recorded yet.'}
                </div>
              ) : (
                emiTxs.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50 transition min-h-[60px]">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF0E5] text-[#E8720C] font-bold flex items-center justify-center text-xs">
                        EMI
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] text-[13px]">
                          {language === 'mr' ? 'हप्ता जमा' : language === 'hi' ? 'किस्त भुगतान' : 'EMI Paid'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium">
                          {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-[#E8720C] text-[15px] amount-display">
                        {formatINR(tx.amount)}
                      </div>
                      {tx.checkpointFingerprint && (
                        <span className="text-[10px] font-mono text-gray-400 block">{tx.checkpointFingerprint}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* Case B: No Active Loan */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E4E8EF] shadow-card text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3FF] text-[#1D5FA8] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#111827]">
              {language === 'mr' ? 'सध्या कोणतेही सक्रिय कर्ज नाही' : language === 'hi' ? 'वर्तमान में कोई सक्रिय ऋण नहीं है' : 'No Active Outstanding Loan'}
            </h3>
            <p className="text-[13px] text-gray-500 font-medium max-w-md mx-auto">
              {language === 'mr' ? 'तुमच्याकडे सध्या कोणतेही थकित कर्ज नाही. नवीन कर्जाची मागणी मासिक बैठकीत करता येते.' : language === 'hi' ? 'आपके पास वर्तमान में कोई बकाया ऋण नहीं है। नए ऋण का अनुरोध मासिक बैठक में किया जा सकता है।' : 'You currently have no active loan balance. New loan requests can be submitted during regular SHG meetings.'}
            </p>
          </div>

          {/* Display Historical Closed Loans if exist */}
          {closedLoans.length > 0 && (
            <Card className="p-0 border border-[#E4E8EF] shadow-card rounded-2xl overflow-hidden bg-white">
              <div className="p-4 border-b border-[#E4E8EF] bg-[#F8FAFC]">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#1A6B4A]" />
                  {language === 'mr' ? 'मागील कर्जांचा इतिहास' : language === 'hi' ? 'पिछला ऋण इतिहास' : 'Loan History'}
                </span>
              </div>
              <div className="divide-y divide-[#E4E8EF]">
                {closedLoans.map((loan) => (
                  <div key={loan.id} className="p-4 flex items-center justify-between text-xs min-h-[60px]">
                    <div>
                      <div className="font-bold text-[#111827] text-[13px]">
                        {language === 'mr' ? 'पूर्ण झालेले कर्ज' : language === 'hi' ? 'पूर्ण ऋण' : 'Closed Loan'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                        {language === 'mr' ? `वितरित: ${loan.dateDisbursed}` : `Disbursed: ${loan.dateDisbursed}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-[#1A6B4A] text-[15px] amount-display">{formatINR(loan.principal)}</div>
                      <span className="text-[10px] font-bold text-[#1A6B4A] bg-[#E6F4EE] border border-[#A7D9BC] px-2.5 py-0.5 rounded-full inline-block mt-1">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

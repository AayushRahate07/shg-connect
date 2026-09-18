import React from 'react';
import { Member, Transaction, Loan, SupportedLanguage } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { formatINR } from '../../theme/tokens';
import { Card } from '../ui/Card';
import { Landmark, ArrowUpRight, CheckCircle2, AlertCircle, Calendar, ShieldCheck, History } from 'lucide-react';

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1C1917] tracking-tight flex items-center gap-2">
          <Landmark className="w-6 h-6 text-[#F97316]" />
          <span>{language === 'mr' ? 'माझे कर्ज' : language === 'hi' ? 'मेरा ऋण' : 'My Loans'}</span>
        </h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          {language === 'mr' ? 'कर्ज, हप्ते आणि परतफेडीचा इतिहास' : language === 'hi' ? 'ऋण, किस्तें और पुनर्भुगतान इतिहास' : 'Loan status, EMI schedules, and repayment history'}
        </p>
      </div>

      {/* Case A: Active Loan Exists */}
      {outstanding > 0 ? (
        <div className="space-y-6">
          {/* Active Loan Hero Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7E5E4] shadow-card space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                {language === 'mr' ? 'सक्रिय कर्जाची शिल्लक' : language === 'hi' ? 'सक्रिय ऋण शेष' : 'Active Outstanding Loan'}
              </span>
              <span className="bg-[#FFEDD5] text-[#C2410C] font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {language === 'mr' ? 'पुढील हप्ता: ₹१,००० (५ ऑक्टोबर)' : language === 'hi' ? 'अगली किस्त: ₹1,000 (5 अक्टू)' : 'Next EMI: ₹1,000 (Due 5 Oct)'}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="text-4xl sm:text-5xl font-black text-[#1C1917] tracking-tight">
                  {formatINR(outstanding)}
                </div>
                <div className="text-xs text-[#78716C] font-medium mt-1">
                  {language === 'mr' ? `मूळ कर्ज: ${formatINR(principal)} • व्याजदर: १.५%/महिना` : language === 'hi' ? `मूल ऋण: ${formatINR(principal)} • ब्याज दर: 1.5%/माह` : `Original Principal: ${formatINR(principal)} • Interest: 1.5%/mo`}
                </div>
              </div>

              <button
                onClick={() => onOpenUpiPayment('EMI_REPAYMENT', 1000)}
                className="bg-[#0F766E] hover:bg-[#0D9488] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs h-11"
              >
                <ArrowUpRight className="w-4 h-4 text-[#FFEDD5]" />
                <span>{language === 'mr' ? '₹ हप्ता भरा' : language === 'hi' ? '₹ किस्त चुकाएं' : 'Repay EMI'}</span>
              </button>
            </div>

            {/* Repayment Progress Gauge */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-bold text-[#1C1917] mb-1.5">
                <span>{language === 'mr' ? 'परतफेडीची प्रगती' : language === 'hi' ? 'पुनर्भुगतान प्रगति' : 'Repayment Progress'}</span>
                <span>{progressPercent}% ({formatINR(paid)} {language === 'mr' ? 'भरले' : language === 'hi' ? 'भुगतान किया' : 'paid'})</span>
              </div>
              <div className="w-full bg-[#F5F5F4] rounded-full h-3 overflow-hidden border border-[#E7E5E4]">
                <div
                  className="bg-[#F97316] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Loan Lifecycle Stepper */}
            <div className="pt-3 border-t border-[#E7E5E4]">
              <div className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-3">
                {language === 'mr' ? 'कर्जाची स्थिती (Lifecycle Stage)' : language === 'hi' ? 'ऋण स्थिति' : 'Loan Lifecycle Stage'}
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                      step.done 
                        ? 'bg-[#0F766E] text-white' 
                        : step.active 
                        ? 'bg-[#F97316] text-white ring-2 ring-[#FFEDD5]' 
                        : 'bg-[#F5F5F4] text-[#78716C] border border-[#E7E5E4]'
                    }`}>
                      {step.done ? '✓' : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold text-[#1C1917] truncate max-w-full">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* EMI Repayment History Table */}
          <Card className="p-0 border border-[#E7E5E4] shadow-card rounded-2xl overflow-hidden bg-white">
            <div className="p-4 border-b border-[#E7E5E4] flex items-center justify-between bg-[#FAFAF9]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#0F766E]" />
                {language === 'mr' ? 'हप्त्यांचा इतिहास' : language === 'hi' ? 'किस्तों का इतिहास' : 'EMI Repayment History'}
              </span>
            </div>

            <div className="divide-y divide-[#E7E5E4]">
              {emiTxs.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#78716C]">
                  {language === 'mr' ? 'अजून कोणत्याही हप्त्याची नोंद नाही.' : language === 'hi' ? 'अभी कोई किस्त दर्ज नहीं है।' : 'No EMI repayments recorded yet.'}
                </div>
              ) : (
                emiTxs.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#F5F5F4] transition">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-[#FFEDD5] text-[#C2410C] font-bold">
                        EMI
                      </div>
                      <div>
                        <div className="font-bold text-[#1C1917]">
                          {language === 'mr' ? 'हप्ता जमा' : language === 'hi' ? 'किस्त भुगतान' : 'EMI Paid'}
                        </div>
                        <div className="text-[11px] text-[#78716C]">
                          {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-[#1C1917] text-sm sm:text-base">
                        {formatINR(tx.amount)}
                      </div>
                      {tx.checkpointFingerprint && (
                        <span className="text-[10px] font-mono text-[#78716C] block">{tx.checkpointFingerprint}</span>
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
          <div className="bg-white p-6 rounded-2xl border border-[#E7E5E4] shadow-card text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#1C1917]">
              {language === 'mr' ? 'सध्या कोणतेही सक्रिय कर्ज नाही' : language === 'hi' ? 'वर्तमान में कोई सक्रिय ऋण नहीं है' : 'No Active Outstanding Loan'}
            </h3>
            <p className="text-xs text-[#78716C] max-w-md mx-auto">
              {language === 'mr' ? 'तुमच्याकडे सध्या कोणतेही थकित कर्ज नाही. नवीन कर्जाची मागणी मासिक बैठकीत करता येते.' : language === 'hi' ? 'आपके पास वर्तमान में कोई बकाया ऋण नहीं है। नए ऋण का अनुरोध मासिक बैठक में किया जा सकता है।' : 'You currently have no active loan balance. New loan requests can be submitted during regular SHG meetings.'}
            </p>
          </div>

          {/* Display Historical Closed Loans if exist */}
          {closedLoans.length > 0 && (
            <Card className="p-0 border border-[#E7E5E4] shadow-card rounded-2xl overflow-hidden bg-white">
              <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#0F766E]" />
                  {language === 'mr' ? 'मागील कर्जांचा इतिहास' : language === 'hi' ? 'पिछला ऋण इतिहास' : 'Loan History'}
                </span>
              </div>
              <div className="divide-y divide-[#E7E5E4]">
                {closedLoans.map((loan) => (
                  <div key={loan.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#1C1917]">
                        {language === 'mr' ? 'पूर्ण झालेले कर्ज' : language === 'hi' ? 'पूर्ण ऋण' : 'Closed Loan'}
                      </div>
                      <div className="text-[11px] text-[#78716C]">
                        {language === 'mr' ? `वितरित: ${loan.dateDisbursed}` : `Disbursed: ${loan.dateDisbursed}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-[#0F766E]">{formatINR(loan.principal)}</div>
                      <span className="text-[10px] font-bold text-[#0F766E] bg-[#CCFBF1] px-2 py-0.5 rounded-full inline-block mt-0.5">
                        ✓ {language === 'mr' ? 'पूर्ण परतफेड' : 'Completed'}
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

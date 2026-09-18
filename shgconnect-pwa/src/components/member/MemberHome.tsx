import React from 'react';
import { Member, Transaction, Loan, SupportedLanguage } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { formatINR } from '../../theme/tokens';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SavingsGoal } from './SavingsGoal';
import { LoanLifecycleView } from './LoanLifecycleView';
import { Wallet, QrCode, ArrowUpRight, BookOpen, Calculator, Calendar, User, PlusCircle, Target, ArrowRight } from 'lucide-react';

interface MemberHomeProps {
  member: Member;
  transactions: Transaction[];
  loans: Loan[];
  language: SupportedLanguage;
  onOpenUpiPayment: (type: 'SAVINGS' | 'EMI_REPAYMENT', defaultAmt: number) => void;
  onNavigateTab: (tab: string) => void;
  onOpenDossier: (member: Member) => void;
}

export const MemberHome: React.FC<MemberHomeProps> = ({
  member,
  transactions,
  loans,
  language,
  onOpenUpiPayment,
  onNavigateTab,
  onOpenDossier
}) => {
  const t = translations[language] || translations.en;
  const activeLoans = loans.filter(l => l.memberId === member.id && l.status === 'ACTIVE');
  const activeLoan = activeLoans[0];
  const memberTxs = transactions.filter(t => t.memberId === member.id).slice(-4).reverse();

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Personalized Greeting Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-[#E7E5E4] shadow-card">
        <div>
          <div className="text-[11px] font-bold text-[#78716C] tracking-wide uppercase">
            {language === 'mr' ? 'सावित्री महिला बचत गट • सातारा' : 'Savitri Mahila Bachat Gat • Satara'}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1C1917] mt-0.5">
            {language === 'mr' ? `नमस्कार, ${member.nameRegional || member.name} 👋` : language === 'hi' ? `नमस्ते, ${member.name} 👋` : `Good day, ${member.name} 👋`}
          </h1>
        </div>

        <button
          onClick={() => onOpenDossier(member)}
          className="bg-[#F5F5F4] hover:bg-[#CCFBF1] text-[#1C1917] hover:text-[#0F766E] border border-[#E7E5E4] p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          title="View Dossier"
        >
          <User className="w-4 h-4 text-[#0F766E]" />
          <span className="hidden sm:inline">{t.member.viewDossier}</span>
        </button>
      </div>

      {/* Dominant Savings Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7E5E4] shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
            {language === 'mr' ? 'एकूण बचत' : language === 'hi' ? 'कुल बचत' : 'Total Personal Savings'}
          </span>
          <span className="bg-[#CCFBF1] text-[#0F766E] font-extrabold text-xs px-2.5 py-0.5 rounded-full">
            +₹500 {language === 'mr' ? 'या महिन्यात' : 'this month'}
          </span>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-black text-[#0F766E] tracking-tight">
            {formatINR(member.totalSavings)}
          </div>
          <div className="text-xs text-[#78716C] font-semibold mt-0.5">
            {language === 'mr' ? 'मासिक योगदान:' : 'Monthly contribution:'} ₹500
          </div>
        </div>

        <div className="pt-2.5 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
          <span className="text-[#0F766E] font-extrabold flex items-center gap-1">
            <span>✓</span>
            <span>{language === 'mr' ? 'नोंद सुरक्षित आहे' : 'Record secured'}</span>
          </span>
          <button
            onClick={() => onNavigateTab('savings')}
            className="text-[#0F766E] font-bold hover:underline flex items-center gap-1"
          >
            <span>{language === 'mr' ? 'तपशील पहा' : 'View Details'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Next Meeting Schedule Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
            {language === 'mr' ? 'पुढील बैठक' : language === 'hi' ? 'अगली बैठक' : 'Next Meeting'}
          </span>
          <div className="text-lg font-bold text-[#1C1917] mt-1">
            24 Sept • 4:00 PM
          </div>
          <div className="text-xs text-[#78716C] font-medium">
            Shirwal Gram Panchayat Hall
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('meetings')}
          className="text-[#0F766E] font-bold text-xs hover:underline flex items-center gap-1 bg-[#F5F5F4] px-3 py-2 rounded-xl border border-[#E7E5E4]"
        >
          <span>{language === 'mr' ? 'बैठका' : 'Meetings'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
          {language === 'mr' ? 'झटपट कृती' : language === 'hi' ? 'त्वरित कार्रवाई' : 'Quick Actions'}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Primary Action Button: Warm Teal Filled */}
          <button
            onClick={() => onOpenUpiPayment('SAVINGS', 500)}
            className="w-full flex items-center justify-center space-x-2 bg-[#0F766E] hover:bg-[#0D9488] text-white py-3.5 px-4 rounded-xl text-xs font-bold shadow-xs transition h-12"
          >
            <PlusCircle className="w-4 h-4 text-[#FFEDD5]" />
            <span>{language === 'mr' ? '＋ बचत जमा करा' : language === 'hi' ? '＋ बचत जमा करें' : 'Deposit Savings'}</span>
          </button>

          {/* Secondary Action: Repay EMI */}
          <button
            onClick={() => onOpenUpiPayment('EMI_REPAYMENT', 1000)}
            className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-[#F5F5F4] text-[#1C1917] border border-[#E7E5E4] py-3.5 px-4 rounded-xl text-xs font-bold transition h-12 shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4 text-[#0F766E]" />
            <span>{language === 'mr' ? '₹ हप्ता भरा' : language === 'hi' ? '₹ किस्त चुकाएं' : 'Repay EMI'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

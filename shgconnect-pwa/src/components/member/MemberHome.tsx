import React from 'react';
import { Member, Transaction, Loan, SupportedLanguage, GroupInfo, Meeting } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { formatINR } from '../../theme/tokens';
import { tts } from '../../services/tts';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoanLifecycleView } from './LoanLifecycleView';
import {
  TrendingUp,
  Calendar,
  ArrowRight,
  PlusCircle,
  ArrowUpRight,
  User,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Volume2,
  BookOpen,
  Landmark,
  Target,
  ArrowDownLeft,
  Banknote,
  Clock
} from 'lucide-react';

interface MemberHomeProps {
  member: Member;
  transactions: Transaction[];
  loans: Loan[];
  language: SupportedLanguage;
  onOpenUpiPayment: (type: 'SAVINGS' | 'EMI_REPAYMENT', defaultAmt: number) => void;
  onNavigateTab: (tab: string) => void;
  onOpenDossier: (member: Member) => void;
  group?: GroupInfo | null;
  meetings?: Meeting[];
  members?: Member[];
}

export const MemberHome: React.FC<MemberHomeProps> = ({
  member,
  transactions,
  loans,
  language,
  onOpenUpiPayment,
  onNavigateTab,
  onOpenDossier,
  group,
  meetings = [],
  members = []
}) => {
  const t = translations[language] || translations.en;
  const isMr = language === 'mr';
  const activeLoans = loans.filter(l => l.memberId === member.id && l.status === 'ACTIVE');
  const activeLoan = activeLoans[0];
  const memberTxs = transactions.filter(tx => tx.memberId === member.id).slice(-4).reverse();

  const groupName = group?.nameRegional || group?.name || (isMr ? 'सावित्री महिला बचत गट' : 'Savitri Mahila Bachat Gat');
  const villageInfo = group?.village ? `${group.village}, ${group.district}` : (isMr ? 'शिरवळ, सातारा' : 'Shirwal, Satara');
  const monthlyRate = group?.monthlyPoolRate || 500;

  // Dynamic savings deposited THIS month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthSavings = transactions
    .filter(t => t.memberId === member.id && t.type === 'SAVINGS')
    .filter(t => {
      const d = new Date(t.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Dynamic next meeting date
  const nextMeetingLabel = (() => {
    if (meetings && meetings.length > 0) {
      const latest = new Date(meetings[0].date);
      const next = new Date(latest);
      next.setMonth(next.getMonth() + 1);
      return next.toLocaleDateString(isMr ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' }) + ' · ४ वा.';
    }
    const d = new Date();
    d.setDate(18);
    return d.toLocaleDateString(isMr ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' }) + ' · ४ वा.';
  })();

  // Dynamic group health score
  const healthScore = Math.min(100, Math.round(88 + (member.trustScore ? member.trustScore * 0.1 : 6)));
  const healthGrade = healthScore >= 90 ? 'Grade A' : healthScore >= 75 ? 'Grade B' : 'Grade C';

  const greeting = isMr
    ? `नमस्कार, ${member.nameRegional || member.name}`
    : language === 'hi'
    ? `नमस्ते, ${member.name}`
    : `Hello, ${member.name}`;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* ── Greeting row ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-0.5 uppercase tracking-wider">
            {groupName} • {villageInfo}
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>{greeting}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const msg = isMr
                ? `नमस्कार ${member.nameRegional || member.name}. तुमची एकूण बचत ₹${member.totalSavings} आहे.`
                : `Hello ${member.name}. Your total savings is ₹${member.totalSavings}.`;
              tts.speak(msg);
            }}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
            title="Audio Balance Readout"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isMr ? 'ऐका' : 'Listen'}</span>
          </button>

          <button
            onClick={() => onOpenDossier(member)}
            className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl transition bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.member.viewDossier}</span>
          </button>
        </div>
      </div>

      {/* ── Hero Savings Card ── */}
      <div className="card-hero-green rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="relative z-10">
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-green-200 text-xs font-semibold uppercase tracking-wider mb-1">
                {isMr ? 'एकूण बचत' : 'Total Savings'}
              </p>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight amount-display">
                {formatINR(member.totalSavings)}
              </div>
              <p className="text-green-200 text-xs font-medium mt-1">
                {isMr ? 'मासिक योगदान:' : 'Monthly contribution:'} ₹{monthlyRate}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-[#DCFCE7] border border-white/20">
              <TrendingUp className="w-3 h-3" />
              +₹{thisMonthSavings} {isMr ? 'या महिन्यात' : 'this month'}
            </span>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <span className="flex items-center gap-1.5 text-green-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isMr ? 'नोंद ब्लॉकचेन लेजरमध्ये सुरक्षित' : 'Cryptographically Secured'}
            </span>
            <button
              onClick={() => onNavigateTab('passbook')}
              className="flex items-center gap-1 text-xs font-bold text-white hover:text-green-100 transition-colors"
            >
              {isMr ? 'पासबुक पहा' : 'View Passbook'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Primary Metric Cards Grid (UI Reference from ParthKing-123/SHG) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Savings Card */}
        <div className="bg-emerald-50/30 p-3.5 rounded-2xl border border-emerald-200 shadow-xs text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              {isMr ? 'माझी बचत' : 'My Savings'}
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-black text-[#14532D] amount-display mt-0.5 block">
            {formatINR(member.totalSavings)}
          </span>
          <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
            {isMr ? 'गटात जमा' : 'In Group Fund'}
          </span>
        </div>

        {/* Loan Due Card */}
        <div className="bg-amber-50/30 p-3.5 rounded-2xl border border-amber-200 shadow-xs text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              {isMr ? 'थकीत कर्ज' : 'Loan Due'}
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-black text-amber-700 amount-display mt-0.5 block">
            {formatINR(member.activeLoanBalance)}
          </span>
          <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
            {member.activeLoanBalance > 0 ? (isMr ? 'परतफेड शिल्लक' : 'To Repay') : (isMr ? 'निरंक' : 'Zero Debt')}
          </span>
        </div>

        {/* Next Meeting Card */}
        <div className="bg-teal-50/30 p-3.5 rounded-2xl border border-teal-200 shadow-xs text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              {isMr ? 'पुढील बैठक' : 'Next Meeting'}
            </span>
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xs sm:text-sm font-black text-stone-900 mt-0.5 block truncate">
            {nextMeetingLabel}
          </span>
          <span className="text-[10px] text-teal-700 font-bold block mt-0.5">
            {isMr ? 'उपस्थिती अनिवार्य' : 'Mandatory'}
          </span>
        </div>

        {/* Group Health / Trust Score Card */}
        <div className="bg-purple-50/30 p-3.5 rounded-2xl border border-purple-200 shadow-xs text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              {isMr ? 'विश्वास निर्देशांक' : 'Trust Score'}
            </span>
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-black text-purple-900 mt-0.5 block">
            {healthScore}/100
          </span>
          <span className="text-[10px] text-purple-700 font-bold block mt-0.5">
            {healthGrade} ({isMr ? 'उत्कृष्ट' : 'Grade A'})
          </span>
        </div>
      </div>

      {/* ── 4 Quick Navigation Tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('passbook')}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-emerald-50/60 rounded-2xl border border-stone-200 shadow-xs transition text-center group min-h-[52px]"
        >
          <BookOpen className="w-5 h-5 text-emerald-800 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800 group-hover:text-emerald-800">
            {isMr ? 'माझे पासबुक' : 'My Passbook'}
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('loans')}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-blue-50/60 rounded-2xl border border-stone-200 shadow-xs transition text-center group min-h-[52px]"
        >
          <Landmark className="w-5 h-5 text-blue-800 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800 group-hover:text-blue-800">
            {isMr ? 'माझे कर्ज' : 'My Loan'}
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('meetings')}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-amber-50/60 rounded-2xl border border-stone-200 shadow-xs transition text-center group min-h-[52px]"
        >
          <Calendar className="w-5 h-5 text-amber-800 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800 group-hover:text-amber-800">
            {isMr ? 'बैठका' : 'Meetings'}
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('goals')}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-purple-50/60 rounded-2xl border border-stone-200 shadow-xs transition text-center group min-h-[52px]"
        >
          <Target className="w-5 h-5 text-purple-800 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800 group-hover:text-purple-800">
            {isMr ? 'बचत ध्येय' : 'Savings Goal'}
          </span>
        </button>
      </div>

      {/* ── Quick Reminders & Meeting Schedule (UI Reference from ParthKing-123/SHG) ── */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-amber-950">
              {isMr ? 'महत्त्वाच्या सूचना व बैठकीचे स्मरणपत्र' : 'Quick Reminders & Meeting Schedule'}
            </h3>
          </div>
          <span className="bg-amber-200/70 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {isMr ? 'आगामी' : 'Upcoming'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Monthly Savings Quota Due */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                {isMr ? 'मासिक बचत योगदान' : 'Monthly Savings Due'}
              </span>
              <span className="text-sm font-black text-emerald-900 block amount-display">
                ₹{monthlyRate}
              </span>
              <span className="text-[10px] font-semibold text-stone-600 truncate block">
                {isMr ? 'बैठकीत रोख/पेटीत जमा' : 'Collected centrally in meeting'}
              </span>
            </div>
          </div>

          {/* Next Meeting */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                {isMr ? 'पुढील मासिक बैठक' : 'Next Group Meeting'}
              </span>
              <span className="text-xs font-black text-stone-900 block truncate">
                {nextMeetingLabel}
              </span>
              <span className="text-[10px] font-semibold text-stone-600 truncate block">
                {villageInfo}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Central Savings Quorum Notice & EMI Repay Action ── */}
      <div className="space-y-3">
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#14532D] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-amber-300" />
          </div>
          <div className="space-y-0.5 text-xs">
            <h3 className="font-extrabold text-emerald-950 text-sm">
              {isMr ? 'बचत संकलन: गट बैठकीत अध्यक्षांकडे जमा' : 'Savings Deposit: Centrally Maintained by Group Head'}
            </h3>
            <p className="text-emerald-800 font-medium leading-relaxed">
              {isMr
                ? 'मासिक बैठकीत अध्यक्षा / कोषाध्यक्षा (कमलताई पाटील) रोख किंवा अधिकृत UPI ने बचत संकलित करतात आणि किमान २ पंचांच्या (Quorum) स्वाक्षरीने सुरक्षित पेटीत जमा करतात.'
                : 'Collected centrally by Group Head/Treasurer during monthly meetings and verified by Quorum into the tamper-proof ledger.'}
            </p>
          </div>
        </div>

        {activeLoan && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {isMr ? 'थकीत कर्ज हप्ता' : 'Active Loan Due'}
              </p>
              <p className="text-base font-black text-amber-950">
                {formatINR(activeLoan.remainingBalance)} {isMr ? 'शिल्लक' : 'Remaining'}
              </p>
            </div>
            <button
              onClick={() => onOpenUpiPayment('EMI_REPAYMENT', 0)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{isMr ? 'हप्ता भरा' : 'Repay EMI'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Active Loan card (if any) ── */}
      {activeLoan && (
        <div className="rounded-2xl p-4 sm:p-5 bg-blue-50/70 border border-blue-200 text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-700 text-white">
                <CreditCard className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-black text-blue-950">
                  {isMr ? 'सक्रिय कर्ज खाते' : 'Active Loan Account'}
                </p>
                <p className="text-[10px] text-blue-700 font-bold">
                  {activeLoan.id}
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200">
              {formatINR(activeLoan.remainingBalance)} {isMr ? 'बाकी' : 'Balance'}
            </span>
          </div>
        </div>
      )}

      {/* ── Recent Transactions Card ── */}
      <Card className="p-0 border border-stone-200 shadow-xs rounded-2xl overflow-hidden bg-white">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <span className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#14532D]" />
            <span>{isMr ? 'अलीकडील व्यवहार (Recent Transactions)' : 'Recent Transactions'}</span>
          </span>
          <button
            onClick={() => onNavigateTab('passbook')}
            className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>{isMr ? 'सर्व पहा' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-stone-200">
          {memberTxs.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 font-medium">
              {isMr ? 'कोणतेही व्यवहार उपलब्ध नाहीत.' : 'No recent transactions.'}
            </div>
          ) : (
            memberTxs.map(tx => (
              <div key={tx.id} className="p-3.5 flex items-center justify-between hover:bg-stone-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    tx.type === 'SAVINGS'
                      ? 'bg-emerald-100 text-emerald-900'
                      : tx.type === 'LOAN_DISBURSAL'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {tx.type === 'SAVINGS' ? '+' : '-'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-stone-900">
                      {tx.type === 'SAVINGS'
                        ? (isMr ? 'बचत जमा' : 'Savings Deposit')
                        : tx.type === 'LOAN_DISBURSAL'
                        ? (isMr ? 'कर्ज वाटप' : 'Loan Disbursal')
                        : (isMr ? 'कर्ज हप्ता परतफेड' : 'EMI Repayment')}
                    </p>
                    <p className="text-[10px] text-stone-500 font-medium">
                      {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {tx.notes ? ` • ${tx.notes}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-black ${
                    tx.type === 'SAVINGS' ? 'text-[#14532D]' : 'text-stone-900'
                  }`}>
                    {tx.type === 'SAVINGS' ? '+' : ''}{formatINR(tx.amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

    </div>
  );
};

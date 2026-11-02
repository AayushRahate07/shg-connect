import React from 'react';
import { Member, Transaction, Loan, SupportedLanguage, GroupInfo, Meeting } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { formatINR } from '../../theme/tokens';
import { tts } from '../../services/tts';
import { Card } from '../ui/Card';
import {
  TrendingUp,
  Calendar,
  ArrowRight,
  User,
  Volume2,
  BookOpen,
  Landmark,
  ArrowUpRight,
} from 'lucide-react';

interface MemberHomeProps {
  isLeadUser?: boolean;
  onSwitchToLead?: () => void;
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
  isLeadUser,
  onSwitchToLead,
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
  // Show only last 3 transactions
  const memberTxs = transactions.filter(tx => tx.memberId === member.id).slice(-3).reverse();

  const groupName = group?.nameRegional || group?.name || (isMr ? 'सावित्री महिला बचत गट' : 'Savitri Mahila Bachat Gat');
  const villageInfo = group?.village ? `${group.village}, ${group.district}` : (isMr ? 'शिरवळ, सातारा' : 'Shirwal, Satara');
  const monthlyRate = group?.monthlyPoolRate || 500;

  // This month's savings
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthSavings = transactions
    .filter(tx => tx.memberId === member.id && tx.type === 'SAVINGS')
    .filter(tx => {
      const d = new Date(tx.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Next meeting
  const nextMeeting = group?.nextMeeting;
  const nextMeetingDate = nextMeeting
    ? new Date(nextMeeting.date).toLocaleDateString(isMr ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' })
    : (meetings && meetings.length > 0
        ? (() => {
            const latest = new Date(meetings[0].date);
            const next = new Date(latest);
            next.setMonth(next.getMonth() + 1);
            return next.toLocaleDateString(isMr ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' });
          })()
        : (isMr ? '१८ नोव्हें' : '18 Nov'));
  const nextMeetingVenue = nextMeeting?.venue || (isMr ? 'स्थान: गट कार्यालय' : 'Group Office');

  const greeting = isMr
    ? `नमस्कार, ${member.nameRegional || member.name}`
    : language === 'hi'
    ? `नमस्ते, ${member.name}`
    : `Hello, ${member.name}`;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* ── Dual-Role Lead Quick Banner ── */}
      {isLeadUser && onSwitchToLead && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/40 to-orange-50 border border-amber-200 rounded-lg p-3 sm:p-3.5 flex items-center justify-between shadow-2xs gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
              👑
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-amber-950 truncate leading-tight">
                {isMr ? 'तुम्ही या बचत गटाच्या प्रमुख (अध्यक्ष) आहात' : 'You are the SHG Lead for this group'}
              </p>
              <p className="text-[10px] text-amber-800 font-medium truncate mt-0.5">
                {isMr ? 'हे तुमचे वैयक्तिक बचत खाते आहे. संपूर्ण गट व्यवस्थापनासाठी स्विच करा.' : 'This is your individual savings. Switch to manage group funds & meetings.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSwitchToLead}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black rounded-lg shadow-2xs transition cursor-pointer shrink-0"
          >
            {isMr ? 'गट संचालन →' : 'Group Operations →'}
          </button>
        </div>
      )}

      {/* ── Greeting row ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-0.5">
            {groupName}
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {greeting}
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
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200"
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
      <div
        className="rounded-lg p-5 sm:p-6 relative overflow-hidden shadow-sm border border-emerald-600/30"
        style={{ background: 'linear-gradient(135deg, #1A6B4A 0%, #14532D 60%, #0F4230 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-green-200 text-xs font-semibold uppercase tracking-wider mb-1">
            {isMr ? 'एकूण बचत' : 'Total Savings'}
          </p>
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight amount-display">
            {formatINR(member.totalSavings)}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full text-green-100"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <TrendingUp className="w-3 h-3" />
              +{formatINR(thisMonthSavings)} {isMr ? 'या महिन्यात' : 'this month'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-4 mt-1 border-t border-white/20">
            <span className="text-green-200 text-xs font-medium">
              {isMr ? 'मासिक हप्ता:' : 'Monthly:'} ₹{monthlyRate}
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

      {/* ── Two stat tiles ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Next Meeting */}
        <button
          onClick={() => onNavigateTab('meetings')}
          className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 p-4 rounded-lg border border-amber-200/80 shadow-2xs text-left hover:border-amber-300 hover:shadow-xs transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              {isMr ? 'पुढील बैठक' : 'Next Meeting'}
            </span>
          </div>
          <p className="text-sm font-black text-stone-900 leading-snug">{nextMeetingDate}</p>
          <p className="text-[10px] text-stone-500 font-medium mt-0.5 truncate">{nextMeetingVenue}</p>
        </button>

        {/* Loan Due */}
        <button
          onClick={() => onNavigateTab('loans')}
          className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 p-4 rounded-lg border border-amber-200/80 shadow-2xs text-left hover:border-amber-300 hover:shadow-xs transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Landmark className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              {isMr ? 'थकीत कर्ज' : 'Loan Due'}
            </span>
          </div>
          {activeLoan ? (
            <>
              <p className="text-sm font-black text-stone-900 amount-display leading-snug">
                {formatINR(activeLoan.remainingBalance)}
              </p>
              <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                {isMr ? 'परतफेड बाकी' : 'To Repay'}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-black text-emerald-800 leading-snug">
                {isMr ? 'निरंक' : 'No active loan'}
              </p>
              <p className="text-[10px] text-stone-400 font-medium mt-0.5">
                {isMr ? 'सर्व हप्ते पूर्ण' : 'All clear'}
              </p>
            </>
          )}
        </button>
      </div>

      {/* ── Primary action row: 3 icon+label buttons ── */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onNavigateTab('passbook')}
          className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 bg-gradient-to-b from-white to-stone-50/40 hover:to-emerald-50/50 rounded-lg border border-stone-200/80 hover:border-emerald-300 shadow-2xs transition active:scale-[0.97] group"
        >
          <BookOpen className="w-5 h-5 text-[#14532D] group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800">
            {isMr ? 'पासबुक' : 'Passbook'}
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('loans')}
          className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 bg-gradient-to-b from-white to-stone-50/40 hover:to-emerald-50/50 rounded-lg border border-stone-200/80 hover:border-emerald-300 shadow-2xs transition active:scale-[0.97] group"
        >
          <Landmark className="w-5 h-5 text-[#14532D] group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800">
            {isMr ? 'माझे कर्ज' : 'My Loan'}
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('meetings')}
          className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 bg-gradient-to-b from-white to-stone-50/40 hover:to-emerald-50/50 rounded-lg border border-stone-200/80 hover:border-emerald-300 shadow-2xs transition active:scale-[0.97] group"
        >
          <Calendar className="w-5 h-5 text-[#14532D] group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800">
            {isMr ? 'बैठका' : 'Meetings'}
          </span>
        </button>
      </div>

      {/* ── Active loan repay nudge (only when loan exists) ── */}
      {activeLoan && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300/80 rounded-lg p-4 flex items-center justify-between gap-3 shadow-xs">
          <div>
            <p className="text-xs font-bold text-amber-800">
              {isMr ? 'थकीत हप्ता' : 'Loan Repayment Due'}
            </p>
            <p className="text-base font-black text-amber-950 amount-display">
              {formatINR(activeLoan.remainingBalance)}
            </p>
          </div>
          <button
            onClick={() => onOpenUpiPayment('EMI_REPAYMENT', 0)}
            className="bg-[#14532D] hover:bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{isMr ? 'हप्ता भरा' : 'Repay'}</span>
          </button>
        </div>
      )}

      {/* ── Recent Transactions (last 3) ── */}
      <Card className="p-0 border border-stone-200/80 shadow-2xs rounded-lg overflow-hidden bg-white">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <span className="text-xs font-black text-stone-600 uppercase tracking-wider">
            {isMr ? 'अलीकडील व्यवहार' : 'Recent Transactions'}
          </span>
          <button
            onClick={() => onNavigateTab('passbook')}
            className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>{isMr ? 'सर्व पहा' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-stone-100">
          {memberTxs.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400 font-medium">
              {isMr ? 'कोणतेही व्यवहार उपलब्ध नाहीत.' : 'No recent transactions.'}
            </div>
          ) : (
            memberTxs.map(tx => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    tx.type === 'SAVINGS'
                      ? 'bg-emerald-100 text-emerald-900'
                      : tx.type === 'LOAN_DISBURSAL'
                      ? 'bg-stone-100 text-stone-700'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {tx.type === 'SAVINGS' ? '+' : '−'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-stone-900">
                      {tx.type === 'SAVINGS'
                        ? (isMr ? 'बचत जमा' : 'Savings Deposit')
                        : tx.type === 'LOAN_DISBURSAL'
                        ? (isMr ? 'कर्ज वाटप' : 'Loan Disbursal')
                        : (isMr ? 'हप्ता परतफेड' : 'EMI Repayment')}
                    </p>
                    <p className="text-[10px] text-stone-400 font-medium">
                      {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-black ${
                  tx.type === 'SAVINGS' ? 'text-[#14532D]' : 'text-stone-700'
                }`}>
                  {tx.type === 'SAVINGS' ? '+' : ''}{formatINR(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

    </div>
  );
};

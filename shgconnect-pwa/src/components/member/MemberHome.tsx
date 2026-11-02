import React from 'react';
import { Member, Transaction, Loan, SupportedLanguage, GroupInfo, Meeting } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { formatINR, formatMarathiDate } from '../../theme/tokens';
import { getGroupSettings } from '../../services/db';
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
  CheckCircle2,
  Check,
  MapPin,
  Clock
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
  const isMr = language === 'mr';
  const settings = getGroupSettings(group);
  const activeLoans = loans.filter(l => l.memberId === member.id && l.status === 'ACTIVE');
  const activeLoan = activeLoans[0];

  const groupName = group?.nameRegional || group?.name || settings.nameRegional || settings.name;
  const villageInfo = `${settings.village}, ${settings.district}`;
  const monthlyRate = settings.monthlySavingAmount || 300;

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

  // Next meeting details
  const nextMeeting = group?.nextMeeting;
  const nextMeetingDateRaw = nextMeeting?.date || '2026-11-16';
  const nextMeetingDateFormatted = formatMarathiDate(`${nextMeetingDateRaw}T${nextMeeting?.time || settings.meetingTime || '16:00'}:00`);
  const nextMeetingVenue = nextMeeting?.venue || settings.meetingPlace || 'ग्रामपंचायत सभागृह';

  // Calculate monthly EMI if loan exists
  const emiAmount = activeLoan
    ? Math.round((activeLoan.principal / (activeLoan.tenureMonths || 12)) + (activeLoan.principal * (activeLoan.interestRateMonthly || 1.5)) / 100)
    : 0;

  const greeting = isMr
    ? `नमस्कार, ${member.nameRegional || member.name}`
    : `Hello, ${member.name}`;

  // Read whole screen summary
  const handleSpeakWholeScreen = () => {
    let msg = '';
    if (isMr) {
      msg = `${greeting}. तुमच्या बचत गटाचे नाव ${groupName}. तुमची एकूण जमा बचत ${member.totalSavings} रुपये आहे. पुढील बैठक ${nextMeetingDateFormatted} रोजी ${nextMeetingVenue} येथे आहे. `;
      if (activeLoan) {
        msg += `तुमचे थकीत कर्ज ${activeLoan.remainingBalance} रुपये आहे, आणि या महिन्याचा हप्ता ${emiAmount} रुपये आहे.`;
      } else {
        msg += 'तुमच्यावर सध्या कोणतेही कर्ज थकीत नाही.';
      }
    } else {
      msg = `${greeting}. Total savings is ${member.totalSavings} rupees. Next meeting on ${nextMeetingDateRaw} at ${nextMeetingVenue}. `;
      if (activeLoan) {
        msg += `Loan balance is ${activeLoan.remainingBalance} rupees with monthly EMI of ${emiAmount} rupees.`;
      } else {
        msg += 'No active loan outstanding.';
      }
    }
    tts.speak(msg);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">

      {/* ── Dual-Role Lead Quick Banner ── */}
      {isLeadUser && onSwitchToLead && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 border border-amber-300 rounded-lg p-3 sm:p-3.5 flex items-center justify-between shadow-2xs gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
              👑
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-amber-950 truncate leading-tight">
                {isMr ? 'तुम्ही या बचत गटाच्या प्रमुख (अध्यक्ष) आहात' : 'You are the SHG Lead for this group'}
              </p>
              <p className="text-[10px] text-amber-800 font-medium truncate mt-0.5">
                {isMr ? 'हे तुमचे वैयक्तिक बचत खाते आहे. संपूर्ण गट व्यवस्थापनासाठी स्विच करा.' : 'This is your personal savings. Switch to manage group funds.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSwitchToLead}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black rounded-lg shadow-2xs transition cursor-pointer shrink-0"
          >
            {isMr ? 'गट व्यवस्थापन →' : 'Group Operations →'}
          </button>
        </div>
      )}

      {/* ── Greeting Row + Full Screen Audio ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-stone-500 truncate mb-0.5">
            {groupName} • {villageInfo}
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight truncate">
            {greeting}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSpeakWholeScreen}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200 active:scale-95 cursor-pointer shadow-2xs"
            title={isMr ? 'संपूर्ण माहिती ऐका' : 'Listen to screen summary'}
            aria-label="Listen"
          >
            <Volume2 className="w-4 h-4 text-emerald-800" />
            <span className="font-black">{isMr ? 'ऐका' : 'Listen'}</span>
          </button>

          <button
            onClick={() => onOpenDossier(member)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100 active:scale-95 cursor-pointer shadow-2xs"
            title={isMr ? 'माझी प्रोफाइल' : 'Profile'}
          >
            <User className="w-4 h-4 text-emerald-800" />
            <span className="hidden sm:inline font-bold">{isMr ? 'प्रोफाइल' : 'Profile'}</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          P2 HOME MANDATE: SHOW ONLY THREE ESSENTIAL THINGS
          1. SAVED (जमा बचत)
          2. NEXT MEETING (पुढील बैठक)
          3. OWED (थकीत कर्ज + हप्ता)
         ────────────────────────────────────────────────────────── */}

      {/* ── 1. Hero Card: SAVED (जमा बचत) ── */}
      <div
        className="rounded-lg p-5 sm:p-6 relative overflow-hidden shadow-sm border border-emerald-700/30"
        style={{ background: 'linear-gradient(135deg, #14532D 0%, #0F4230 65%, #0A2F22 100%)' }}
      >
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider">
              {isMr ? 'एकूण जमा बचत' : 'Total Saved'}
            </span>
            <span className="bg-white/20 text-emerald-100 text-[11px] font-black px-2.5 py-1 rounded-full border border-white/20">
              +{formatINR(thisMonthSavings)} {isMr ? 'या महिन्यात जमा' : 'this month'}
            </span>
          </div>

          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight amount-display">
            {formatINR(member.totalSavings)}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/20 text-xs">
            <span className="text-emerald-200 font-semibold">
              {isMr ? 'ठरलेली मासिक बचत:' : 'Monthly saving:'} ₹{monthlyRate}
            </span>
            <button
              onClick={() => onNavigateTab('passbook')}
              className="flex items-center gap-1 font-bold text-white hover:text-emerald-200 transition active:scale-95 cursor-pointer"
            >
              <span>{isMr ? 'पासबुक पहा' : 'View Passbook'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Card: NEXT MEETING (पुढील बैठक) ── */}
      <button
        onClick={() => onNavigateTab('meetings')}
        className="w-full bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-4 sm:p-5 rounded-lg border-2 border-amber-200/90 shadow-2xs text-left hover:border-amber-300 transition active:scale-[0.99] cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 border border-amber-200">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              {isMr ? 'पुढील बैठक' : 'Next Meeting'}
            </span>
          </div>
          <span className="text-xs font-bold text-amber-900 group-hover:translate-x-1 transition-transform flex items-center gap-1">
            <span>{isMr ? 'तपशील' : 'Details'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <p className="text-base sm:text-lg font-black text-stone-900 leading-snug">
          {nextMeetingDateFormatted}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium mt-1">
          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="truncate">{nextMeetingVenue}</span>
        </div>
      </button>

      {/* ── 3. Card: OWED (थकीत कर्ज + या महिन्याचा हप्ता) ── */}
      <div className={`p-4 sm:p-5 rounded-lg border-2 shadow-2xs transition ${
        activeLoan
          ? 'bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 border-rose-200/80'
          : 'bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 border-emerald-200/80'
      }`}>
        <div className="flex items-center justify-between mb-2 border-b border-stone-100 pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              activeLoan
                ? 'bg-rose-100 text-rose-900 border-rose-200'
                : 'bg-emerald-100 text-emerald-900 border-emerald-200'
            }`}>
              <Landmark className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              activeLoan ? 'text-rose-900' : 'text-emerald-900'
            }`}>
              {isMr ? 'थकीत कर्ज' : 'Loan Due'}
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('loans')}
            className={`text-xs font-bold hover:underline flex items-center gap-1 ${
              activeLoan ? 'text-rose-800' : 'text-emerald-800'
            }`}
          >
            <span>{isMr ? 'कर्ज खाते' : 'Loan Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeLoan ? (
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase block">
                  {isMr ? 'एकूण बाकी' : 'Total Outstanding'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-rose-700 amount-display mt-0.5 block">
                  {formatINR(activeLoan.remainingBalance)}
                </span>
              </div>
              <button
                onClick={() => onOpenUpiPayment('EMI_REPAYMENT', emiAmount)}
                className="bg-[#14532D] hover:bg-emerald-900 text-white px-4 py-2 rounded-lg text-xs font-black shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isMr ? 'हप्ता भरा' : 'Pay EMI'}</span>
              </button>
            </div>

            {/* MANDATE: "या महिन्याचा हप्ता ₹X, तारीख Y" */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs font-bold text-amber-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {isMr
                  ? `या महिन्याचा हप्ता ${formatINR(emiAmount)}, बैठक तारीख ${nextMeetingDateRaw.split('-')[2] || '१६'}`
                  : `This month EMI: ${formatINR(emiAmount)}, due on meeting day`}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-2 flex items-center justify-between">
            <div>
              <p className="text-base font-black text-emerald-900 leading-snug">
                {isMr ? 'काही नाही' : 'No Active Loan'}
              </p>
              <p className="text-xs text-emerald-700/80 font-medium mt-0.5">
                <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" /><span>{isMr ? 'सर्व हप्ते पूर्ण (कोणतेही कर्ज थकीत नाही)' : 'All loans cleared'}</span></span>
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('loans')}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer shadow-2xs"
            >
              {isMr ? 'कर्ज मागा' : 'Apply'}
            </button>
          </div>
        )}
      </div>

      {/* ── Quick Nav Row ── */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <button
          onClick={() => onNavigateTab('passbook')}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-stone-50 hover:bg-emerald-50/50 rounded-lg border border-stone-200 shadow-2xs transition active:scale-[0.97] cursor-pointer group"
        >
          <BookOpen className="w-5 h-5 text-emerald-800 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800">
            {isMr ? 'पासबुक' : 'Passbook'}
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('loans')}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-stone-50 hover:bg-emerald-50/50 rounded-lg border border-stone-200 shadow-2xs transition active:scale-[0.97] cursor-pointer group"
        >
          <Landmark className="w-5 h-5 text-emerald-800 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800">
            {isMr ? 'माझे कर्ज' : 'My Loans'}
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('meetings')}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-stone-50 hover:bg-emerald-50/50 rounded-lg border border-stone-200 shadow-2xs transition active:scale-[0.97] cursor-pointer group"
        >
          <Calendar className="w-5 h-5 text-emerald-800 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-stone-800">
            {isMr ? 'बैठका' : 'Meetings'}
          </span>
        </button>
      </div>

    </div>
  );
};

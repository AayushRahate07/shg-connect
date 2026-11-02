import React, { useState, useMemo } from 'react';
import { Member, Transaction, SupportedLanguage, GroupInfo } from '../../types/shg';
import { formatINR, formatReceiptNumber } from '../../theme/tokens';
import { getGroupSettings } from '../../services/db';
import { Card } from '../ui/Card';
import { SavingsGoal } from './SavingsGoal';
import {
  PiggyBank,
  Calendar,
  Check,
  ShieldCheck,
  Share2,
  Printer,
  AlertCircle,
  TrendingUp,
  Percent,
  CheckCircle2
} from 'lucide-react';

interface SavingsViewProps {
  member: Member;
  transactions: Transaction[];
  language: SupportedLanguage;
  onOpenUpiPayment: (type: 'SAVINGS' | 'EMI_REPAYMENT', defaultAmt: number) => void;
  onNavigateTab?: (tab: string) => void;
  group?: GroupInfo | null;
  members?: Member[];
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  member,
  transactions,
  language,
  onOpenUpiPayment,
  onNavigateTab,
  group,
  members = []
}) => {
  const isMr = language === 'mr';
  const settings = getGroupSettings(group);
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'month' | '3months'>('all');

  const monthlyRate = settings.monthlySavingAmount || 300;

  // Filter savings transactions
  const savingsTxs = useMemo(() => {
    return transactions
      .filter(t => t.memberId === member.id && t.type === 'SAVINGS')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [transactions, member.id]);

  // Compute running balance for each savings row
  const txsWithRunningBalance = useMemo(() => {
    let running = 0;
    return savingsTxs.map(tx => {
      running += tx.amount;
      return { ...tx, runningBalance: running };
    }).reverse(); // Most recent first for display
  }, [savingsTxs]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Savings this month
  const thisMonthSavings = savingsTxs
    .filter(tx => {
      const d = new Date(tx.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Filter by period
  const filteredTxs = txsWithRunningBalance.filter(tx => {
    const txDate = new Date(tx.timestamp);
    if (filterPeriod === 'month') {
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    }
    if (filterPeriod === '3months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return txDate >= threeMonthsAgo;
    }
    return true; // Default 'all'
  });

  // Calculate year-end interest share / dividend (e.g. 8.5% annual return on savings)
  const estimatedYearlyInterest = Math.round((member.totalSavings * 8.5) / 100);

  // Group transactions by Month for clear headlines
  const groupedByMonth = useMemo(() => {
    const groups: { [key: string]: typeof filteredTxs } = {};
    const months = [
      'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
      'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
    ];
    filteredTxs.forEach(tx => {
      const d = new Date(tx.timestamp);
      const key = isMr
        ? `${months[d.getMonth()]} ${d.getFullYear()}`
        : d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [filteredTxs, isMr]);

  // WhatsApp share passbook summary
  const handleShareWhatsApp = () => {
    const text = isMr
      ? `*${settings.nameRegional || settings.name}*\nसदस्य: ${member.nameRegional || member.name}\nएकूण जमा बचत: ₹${member.totalSavings.toLocaleString('en-IN')}\nया महिन्याची बचत: ₹${thisMonthSavings.toLocaleString('en-IN')}\nमासिक ठरलेली बचत: ₹${monthlyRate}\n\nसर्व नोंदी डिजिटल वहीत सुरक्षित आहेत.`
      : `*${settings.name}*\nMember: ${member.name}\nTotal Savings: ₹${member.totalSavings.toLocaleString('en-IN')}\nMonthly Contribution: ₹${monthlyRate}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // WhatsApp message to lead for discrepancies
  const handleContactLead = () => {
    const leadPhone = group?.bankDetails?.accountMasked || '9876543210';
    const text = isMr
      ? `नमस्कार ${settings.treasurerName || settings.presidentName}, मी ${member.nameRegional || member.name}. माझ्या बचत वहीमध्ये रकमेची खात्री करायची आहे. कृपया मार्गदर्शन करावे.`
      : `Hello Lead, I am ${member.name}. I noticed a discrepancy in my passbook.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-8 animate-fadeIn">
      {/* ── Page Title & Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-emerald-800" />
            <span>{isMr ? 'माझी बचत' : 'My Savings'}</span>
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {settings.nameRegional || settings.name} • {settings.village}
          </p>
        </div>

        {/* Action Buttons: WhatsApp & Print */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            title={isMr ? 'WhatsApp वर पाठवा' : 'Share on WhatsApp'}
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">{isMr ? 'WhatsApp' : 'Share'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            title={isMr ? 'पासबुक प्रिंट / सेव्ह करा' : 'Print Passbook'}
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">{isMr ? 'प्रिंट' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Savings Card ── */}
      <div
        className="rounded-lg p-5 sm:p-6 shadow-sm border border-emerald-700/30 text-white space-y-3 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #14532D 0%, #0F4230 65%, #0A2F22 100%)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            {isMr ? 'एकूण जमा बचत' : 'Total Saved'}
          </span>
          <span className="bg-white/20 text-emerald-100 border border-white/20 font-black text-xs px-2.5 py-1 rounded-full">
            +{formatINR(thisMonthSavings)} {isMr ? 'या महिन्यात जमा' : 'this month'}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight amount-display">
            {formatINR(member.totalSavings)}
          </div>
          <div className="text-xs text-emerald-200 font-semibold">
            {isMr ? 'ठरलेली मासिक बचत:' : 'Monthly contribution:'} ₹{monthlyRate}
          </div>
        </div>

        {/* ONE-LINE SAFETY MESSAGE */}
        <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-emerald-200 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{isMr ? 'तुमची बचत पूर्ण सुरक्षित असून वहीमध्ये नोंदवली आहे.' : 'Your savings are 100% verified and recorded in the group ledger.'}</span>
          </span>
          <span className="text-[11px] text-emerald-300 font-bold hidden sm:inline">
            {settings.treasurerName} ({isMr ? 'कोषाध्यक्ष' : 'Treasurer'})
          </span>
        </div>
      </div>

      {/* ── Year-End Interest Share / Dividend Card ── */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200 rounded-lg p-3.5 sm:p-4 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              {isMr ? 'अंदाजे वार्षिक व्याज / लाभांश वाटप' : 'Projected Annual Dividend / Interest'}
            </span>
            <div className="text-base sm:text-lg font-black text-amber-950 amount-display mt-0.5">
              +{formatINR(estimatedYearlyInterest)} <span className="text-xs font-semibold text-stone-500">({isMr ? '८.५% अंदाजे' : '~8.5% p.a.'})</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-amber-800 font-medium text-right max-w-[150px] hidden sm:block">
          {isMr ? 'वर्षअखेरीस गटाच्या नफ्यातून थेट खात्यात जमा होतो.' : 'Disbursed at annual meeting.'}
        </p>
      </div>

      {/* ── Optional Member-Defined Savings Goal ── */}
      <SavingsGoal
        memberId={member.id}
        currentSavings={member.totalSavings}
        monthlyQuota={monthlyRate}
        language={language}
      />

      {/* ── Savings Passbook Ledger History ── */}
      <Card className="p-0 border border-stone-200 shadow-2xs rounded-lg overflow-hidden bg-white">
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50">
          <span className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span>{isMr ? 'बचत नोंद वही' : 'Savings Register'}</span>
          </span>

          {/* Time Filter Toggle (Default 'all' / सर्व) */}
          <div className="flex bg-white rounded-lg p-1 border border-stone-200 text-xs">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                filterPeriod === 'all' ? 'bg-[#14532D] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isMr ? 'सर्व' : 'All'}
            </button>
            <button
              onClick={() => setFilterPeriod('3months')}
              className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                filterPeriod === '3months' ? 'bg-[#14532D] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isMr ? '३ महिने' : '3 Months'}
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                filterPeriod === 'month' ? 'bg-[#14532D] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isMr ? 'या महिन्यात' : 'This Month'}
            </button>
          </div>
        </div>

        {/* Transaction Rows with Month Headline & Running Balance */}
        <div className="divide-y divide-stone-100">
          {Object.keys(groupedByMonth).length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 font-medium">
              {isMr ? 'निवडलेल्या कालावधीत कोणतीही बचत नोंद नाही.' : 'No transactions found.'}
            </div>
          ) : (
            Object.entries(groupedByMonth).map(([monthHeadline, txList]) => (
              <div key={monthHeadline} className="space-y-0">
                {/* Month Headline */}
                <div className="bg-stone-100/70 px-4 py-1.5 text-[11px] font-black text-stone-700 tracking-wide uppercase border-b border-stone-200/60">
                  {monthHeadline}
                </div>

                <div className="divide-y divide-stone-100">
                  {txList.map((tx) => {
                    const isInit = tx.notes?.includes('आधीची शिल्लक') || tx.id.includes('init');
                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-stone-50 transition min-h-[58px]"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#14532D] font-black flex items-center justify-center text-sm border border-emerald-200 shrink-0">
                            +
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 text-xs">
                              {isInit ? (isMr ? 'आधीची शिल्लक' : 'Opening Accumulated') : (isMr ? 'मासिक बचत जमा' : 'Monthly Savings')}
                            </div>
                            <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                              {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {tx.notes && !isInit ? ` • ${tx.notes}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-[#14532D] text-sm amount-display">
                            +{formatINR(tx.amount)}
                          </div>
                          <div className="text-[10px] text-stone-500 font-semibold mt-0.5">
                            {isMr ? 'शिल्लक:' : 'Bal:'} <span className="font-bold amount-display text-stone-800">{formatINR(tx.runningBalance)}</span> • {formatReceiptNumber(tx.index || 0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Discrepancy Action: "चूक आहे? प्रमुखांना कळवा" ── */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-stone-500 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{isMr ? 'हिशोबात तफावत किंवा चूक वाटते?' : 'Notice any discrepancy?'}</span>
          </span>
          <button
            type="button"
            onClick={handleContactLead}
            className="text-emerald-800 hover:text-emerald-950 font-black hover:underline cursor-pointer"
          >
            {isMr ? 'चूक आहे? प्रमुखांना कळवा' : 'Report to Lead'} →
          </button>
        </div>
      </Card>
    </div>
  );
};

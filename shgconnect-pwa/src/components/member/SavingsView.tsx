import React, { useState } from 'react';
import { Member, Transaction, SupportedLanguage, GroupInfo } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { formatINR } from '../../theme/tokens';
import { Card } from '../ui/Card';
import { PlusCircle, PiggyBank, Target, Calendar, Filter, ArrowUpRight, Check, Banknote, ShieldCheck } from 'lucide-react';

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
  const t = translations[language] || translations.en;
  const isMr = language === 'mr';
  const [filterPeriod, setFilterPeriod] = useState<'month' | '3months' | 'all'>('all');

  const savingsTxs = transactions.filter(t => t.memberId === member.id && t.type === 'SAVINGS');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Dynamic monthly contribution from group info
  const monthlyRate = group?.monthlyPoolRate || 500;

  // Dynamic savings this month
  const thisMonthSavings = savingsTxs
    .filter(tx => {
      const d = new Date(tx.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const filteredTxs = savingsTxs.filter(tx => {
    const txDate = new Date(tx.timestamp);
    if (filterPeriod === 'month') {
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    }
    if (filterPeriod === '3months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return txDate >= threeMonthsAgo;
    }
    return true;
  });

  // Dynamic savings goal based on current total savings
  const targetGoal = Math.max(25000, Math.ceil((member.totalSavings + 5000) / 5000) * 5000);
  const progressPercent = Math.min(100, Math.round((member.totalSavings / targetGoal) * 100));
  const remainingGoal = Math.max(0, targetGoal - member.totalSavings);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
          <PiggyBank className="w-6 h-6 text-[#14532D]" />
          <span>{isMr ? 'माझी बचत' : 'My Savings'}</span>
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          {group?.nameRegional || group?.name || (isMr ? 'सावित्री महिला बचत गट' : 'Savitri Mahila Bachat Gat')} • {isMr ? 'तुमच्या बचतीचा सविस्तर ताळेबंद' : 'Detailed overview of your savings ledger'}
        </p>
      </div>

      {/* Main Savings Card */}
      <div className="card-hero-green rounded-2xl p-5 sm:p-6 relative overflow-hidden space-y-3.5 border border-emerald-400/40">
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-green-200">
            {isMr ? 'एकूण जमा बचत' : 'Total Personal Savings'}
          </span>
          <span className="bg-white/20 text-[#DCFCE7] border border-white/20 font-extrabold text-xs px-2.5 py-1 rounded-full">
            +₹{thisMonthSavings} {isMr ? 'या महिन्यात जमा' : 'saved this month'}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2 relative z-10">
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight amount-display">
            {formatINR(member.totalSavings)}
          </div>
          <div className="text-xs text-green-200 font-semibold">
            {isMr ? 'मासिक योगदान:' : 'Monthly contribution:'} ₹{monthlyRate}
          </div>
        </div>

        <div className="pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <span className="text-xs font-bold text-green-200 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isMr ? 'नोंद लेजरमध्ये सुरक्षित आहे' : 'Secured in cryptoledger'}</span>
          </span>
          
          {/* Centralized Deposit Indicator (Quorum Witnessed by Group Head) */}
          <div className="bg-white/15 backdrop-blur text-white px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>{isMr ? 'बैठकीत अध्यक्षांकडे संकलित (कोरम)' : 'Centrally Collected by Head (Quorum)'}</span>
          </div>
        </div>
      </div>

      {/* ── Central Quorum Protocol Explanation Card ── */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs space-y-1.5">
        <div className="font-extrabold text-emerald-950 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{isMr ? 'केंद्रीकृत बचत संकलन पद्धत (Central Quorum Verification)' : 'Centralized Savings Collection Protocol'}</span>
        </div>
        <p className="text-emerald-800 font-medium leading-relaxed">
          {isMr
            ? 'बचत गट नियमानुसार वैयक्तिक सभासद परस्पर थेट बचत जमा करू शकत नाहीत. मासिक बैठकीत अध्यक्षा / कोषाध्यक्षा (कमलताई पाटील) रोख पेटीत किंवा अधिकृत UPI ने बचत संकलित करतात आणि किमान २ पंचांच्या (Quorum) स्वाक्षरीने सुरक्षित लेजरमध्ये नोंद होते.'
            : 'As per SHG rules, personal savings are centrally collected by the Group Head/Treasurer during monthly meetings and verified with Quorum signatures into the tamper-proof ledger.'}
        </p>
      </div>

      {/* Savings Goal Section */}
      <div className="bg-amber-50/20 p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-600" />
            {isMr ? 'बचतीची प्रगती (ध्येय)' : 'Savings Goal Progress'}
          </span>
          <span className="text-xs font-extrabold text-amber-600">
            {progressPercent}%
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-stone-900 mb-1.5">
            <span>{isMr ? 'आपत्कालीन व वैयक्तिक निधी' : 'Emergency & Personal Fund'}</span>
            <span>{formatINR(member.totalSavings)} / {formatINR(targetGoal)}</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200">
            <div
              className="h-full rounded-full transition-all duration-500 bg-[#14532D]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 font-medium pt-1">
          <span>{isMr ? `₹${remainingGoal.toLocaleString('en-IN')} बाकी` : `₹${remainingGoal.toLocaleString('en-IN')} remaining`}</span>
          <span>{isMr ? `दरमहा ₹${monthlyRate} प्रमाणे अंदाजे पूर्णता` : `Based on ₹${monthlyRate}/mo contribution`}</span>
        </div>
      </div>

      {/* Savings Ledger History with Filter */}
      <Card className="p-0 border border-stone-200 shadow-xs rounded-2xl overflow-hidden bg-white">
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#14532D]" />
            {isMr ? 'बचतीचा इतिहास' : 'Savings History'}
          </span>

          {/* Time Filter Toggle */}
          <div className="flex bg-white rounded-xl p-1 border border-stone-200 text-xs">
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1.5 min-h-[36px] min-w-[44px] rounded-lg font-bold transition ${
                filterPeriod === 'month' ? 'bg-[#14532D] text-white shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {isMr ? 'या महिन्यात' : 'This Month'}
            </button>
            <button
              onClick={() => setFilterPeriod('3months')}
              className={`px-3 py-1.5 min-h-[36px] min-w-[44px] rounded-lg font-bold transition ${
                filterPeriod === '3months' ? 'bg-[#14532D] text-white shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {isMr ? '३ महिने' : '3 Months'}
            </button>
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 min-h-[36px] min-w-[44px] rounded-lg font-bold transition ${
                filterPeriod === 'all' ? 'bg-[#14532D] text-white shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {isMr ? 'सर्व' : 'All'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-stone-200">
          {filteredTxs.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 font-medium">
              {isMr ? 'निवडलेल्या कालावधीत कोणतीही बचत नोंद नाही.' : 'No savings transactions found for the selected period.'}
            </div>
          ) : (
            filteredTxs.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between text-xs hover:bg-stone-50 transition min-h-[60px]">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#14532D] font-bold flex items-center justify-center text-base border border-emerald-200">
                    +
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-xs">
                      {isMr ? 'बचत जमा' : 'Savings Deposit'}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">
                      {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {tx.notes ? ` • ${tx.notes}` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-[#14532D] text-sm amount-display">
                    {formatINR(tx.amount)}
                  </div>
                  {tx.checkpointFingerprint && (
                    <span className="text-[10px] font-mono text-stone-400 block">{tx.checkpointFingerprint}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

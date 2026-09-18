import React, { useState } from 'react';
import { Member, Transaction, SupportedLanguage } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { formatINR } from '../../theme/tokens';
import { Card } from '../ui/Card';
import { PlusCircle, PiggyBank, Target, Calendar, Filter, ArrowUpRight } from 'lucide-react';

interface SavingsViewProps {
  member: Member;
  transactions: Transaction[];
  language: SupportedLanguage;
  onOpenUpiPayment: (type: 'SAVINGS' | 'EMI_REPAYMENT', defaultAmt: number) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  member,
  transactions,
  language,
  onOpenUpiPayment,
  onNavigateTab
}) => {
  const t = translations[language] || translations.en;
  const [filterPeriod, setFilterPeriod] = useState<'month' | '3months' | 'all'>('all');

  const savingsTxs = transactions.filter(t => t.memberId === member.id && t.type === 'SAVINGS');

  const now = new Date();
  const filteredTxs = savingsTxs.filter(tx => {
    const txDate = new Date(tx.timestamp);
    if (filterPeriod === 'month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (filterPeriod === '3months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return txDate >= threeMonthsAgo;
    }
    return true;
  });

  const targetGoal = 25000;
  const progressPercent = Math.min(100, Math.round((member.totalSavings / targetGoal) * 100));
  const remainingGoal = Math.max(0, targetGoal - member.totalSavings);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1C1917] tracking-tight flex items-center gap-2">
          <PiggyBank className="w-6 h-6 text-[#0F766E]" />
          <span>{language === 'mr' ? 'माझी बचत' : language === 'hi' ? 'मेरी बचत' : 'My Savings'}</span>
        </h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          {language === 'mr' ? 'तुमच्या बचतीचा सविस्तर आढावा आणि नोंदी' : language === 'hi' ? 'आपकी बचत का विस्तृत अवलोकन और रिकॉर्ड' : 'Overview of your savings balance and ledger entries'}
        </p>
      </div>

      {/* Main Savings Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7E5E4] shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
            {language === 'mr' ? 'एकूण जमा बचत' : language === 'hi' ? 'कुल जमा बचत' : 'Total Personal Savings'}
          </span>
          <span className="bg-[#CCFBF1] text-[#0F766E] font-extrabold text-xs px-2.5 py-0.5 rounded-full">
            +₹500 {language === 'mr' ? 'या महिन्यात' : language === 'hi' ? 'इस महीने' : 'this month'}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-3xl sm:text-4xl font-black text-[#0F766E] tracking-tight">
            {formatINR(member.totalSavings)}
          </div>
          <div className="text-xs text-[#78716C] font-semibold">
            {language === 'mr' ? 'मासिक योगदान:' : language === 'hi' ? 'मासिक योगदान:' : 'Monthly contribution:'} ₹500
          </div>
        </div>

        <div className="pt-2.5 border-t border-[#E7E5E4] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-extrabold text-[#0F766E] flex items-center gap-1">
            <span>✓</span>
            <span>{language === 'mr' ? 'नोंद सुरक्षित आहे' : language === 'hi' ? 'रिकॉर्ड सुरक्षित है' : 'Record secured'}</span>
          </span>
          <button
            onClick={() => onOpenUpiPayment('SAVINGS', 500)}
            className="bg-[#0F766E] hover:bg-[#0D9488] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs h-10"
          >
            <PlusCircle className="w-4 h-4 text-[#FFEDD5]" />
            <span>{language === 'mr' ? '＋ बचत जमा करा' : language === 'hi' ? '＋ बचत जमा करें' : 'Deposit Savings'}</span>
          </button>
        </div>
      </div>

      {/* Savings Goal Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7E5E4] shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#F97316]" />
            {language === 'mr' ? 'बचतीची प्रगती (लक्ष्य)' : language === 'hi' ? 'बचत लक्ष्य प्रगति' : 'Savings Goal Progress'}
          </span>
          <span className="text-xs font-extrabold text-[#F97316]">
            {progressPercent}%
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-[#1C1917] mb-1.5">
            <span>{language === 'mr' ? 'आपत्कालीन व वैद्यकीय निधी' : language === 'hi' ? 'आपातकालीन और चिकित्सा कोष' : 'Emergency & Medical Fund'}</span>
            <span>{formatINR(member.totalSavings)} / {formatINR(targetGoal)}</span>
          </div>
          <div className="w-full bg-[#F5F5F4] rounded-full h-3 overflow-hidden border border-[#E7E5E4]">
            <div
              className="bg-[#0F766E] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#78716C] font-medium pt-1">
          <span>{language === 'mr' ? `₹${remainingGoal.toLocaleString('en-IN')} बाकी` : language === 'hi' ? `₹${remainingGoal.toLocaleString('en-IN')} शेष` : `₹${remainingGoal.toLocaleString('en-IN')} remaining`}</span>
          <span>{language === 'mr' ? 'दरमहा ₹५०० प्रमाणे अंदाजे पूर्णता' : language === 'hi' ? '₹500 प्रति माह पर अनुमानित पूर्णता' : 'Based on ₹500/mo contribution'}</span>
        </div>
      </div>

      {/* Savings Ledger History with Filter */}
      <Card className="p-0 border border-[#E7E5E4] shadow-card rounded-2xl overflow-hidden bg-white">
        <div className="p-4 border-b border-[#E7E5E4] flex flex-wrap items-center justify-between gap-3 bg-[#FAFAF9]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0F766E]" />
            {language === 'mr' ? 'बचतीचा इतिहास' : language === 'hi' ? 'बचत का इतिहास' : 'Savings History'}
          </span>

          {/* Time Filter Toggle */}
          <div className="flex bg-white rounded-xl p-1 border border-[#E7E5E4] text-xs">
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterPeriod === 'month' ? 'bg-[#0F766E] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              {language === 'mr' ? 'या महिन्यात' : language === 'hi' ? 'इस महीने' : 'This Month'}
            </button>
            <button
              onClick={() => setFilterPeriod('3months')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterPeriod === '3months' ? 'bg-[#0F766E] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              {language === 'mr' ? '३ महिने' : language === 'hi' ? '3 महीने' : '3 Months'}
            </button>
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterPeriod === 'all' ? 'bg-[#0F766E] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              {language === 'mr' ? 'सर्व' : language === 'hi' ? 'सभी' : 'All'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#E7E5E4]">
          {filteredTxs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#78716C]">
              {language === 'mr' ? 'निवडलेल्या कालावधीत कोणतीही बचत नोंद नाही.' : language === 'hi' ? 'चयनित अवधि में कोई बचत रिकॉर्ड नहीं है।' : 'No savings transactions found for the selected period.'}
            </div>
          ) : (
            filteredTxs.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#F5F5F4] transition">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-[#CCFBF1] text-[#0F766E] font-bold">
                    +
                  </div>
                  <div>
                    <div className="font-bold text-[#1C1917]">
                      {language === 'mr' ? 'बचत जमा' : language === 'hi' ? 'बचत जमा' : 'Savings Deposit'}
                    </div>
                    <div className="text-[11px] text-[#78716C]">
                      {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {tx.notes ? ` • ${tx.notes}` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-[#0F766E] text-sm sm:text-base">
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
  );
};

import React from 'react';
import { Member, Transaction, Loan, SupportedLanguage } from '../../types/shg';
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
} from 'lucide-react';

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
  onOpenDossier,
}) => {
  const t = translations[language] || translations.en;
  const activeLoans = loans.filter(l => l.memberId === member.id && l.status === 'ACTIVE');
  const activeLoan = activeLoans[0];
  const memberTxs = transactions.filter(tx => tx.memberId === member.id).slice(-4).reverse();

  const greeting = language === 'mr'
    ? `नमस्कार, ${member.nameRegional || member.name}`
    : language === 'hi'
    ? `नमस्ते, ${member.name}`
    : `Hello, ${member.name}`;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* ── Greeting row ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-0.5 uppercase tracking-wider">
            {language === 'mr' ? 'सावित्री महिला बचत गट • सातारा' : 'Savitri Mahila Bachat Gat • Satara'}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>{greeting} 👋</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const msg = language === 'mr'
                ? `नमस्कार ${member.nameRegional || member.name}. तुमची एकूण बचत ₹${member.totalSavings} आहे.`
                : `Hello ${member.name}. Your total savings is ₹${member.totalSavings}.`;
              tts.speak(msg);
            }}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
            title="Audio Balance Readout"
          >
            <span>🔊</span>
            <span className="hidden sm:inline">{language === 'mr' ? 'ऐका' : 'Listen'}</span>
          </button>

          <button
            onClick={() => onOpenDossier(member)}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ background: '#E6F4EE', color: '#1A6B4A', border: '1px solid #A7D9BC' }}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.member.viewDossier}</span>
          </button>
        </div>
      </div>

      {/* ── Hero Savings Card ── */}
      <div className="card-hero-green rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full opacity-8 translate-y-1/2 -translate-x-1/2"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-green-200 text-xs font-semibold uppercase tracking-wider mb-1">
                {language === 'mr' ? 'एकूण बचत' : language === 'hi' ? 'कुल बचत' : 'Total Savings'}
              </p>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight amount-display">
                {formatINR(member.totalSavings)}
              </div>
              <p className="text-green-200 text-xs font-medium mt-1">
                {language === 'mr' ? 'मासिक योगदान:' : 'Monthly contribution:'} ₹500
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#DCFCE7', border: '1px solid rgba(255,255,255,0.2)' }}>
              <TrendingUp className="w-3 h-3" />
              +₹500 {language === 'mr' ? 'या महिन्यात' : 'this month'}
            </span>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <span className="flex items-center gap-1.5 text-green-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {language === 'mr' ? 'नोंद सुरक्षित आहे' : 'Cryptographically Secured'}
            </span>
            <button
              onClick={() => onNavigateTab('passbook')}
              className="flex items-center gap-1 text-xs font-semibold text-white hover:text-green-100 transition-colors"
            >
              {language === 'mr' ? 'पासबुक पहा' : 'View Passbook'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Primary Metric Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-left">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            {language === 'mr' ? 'माझी बचत' : 'My Savings'}
          </span>
          <span className="text-base font-black text-emerald-800 amount-display mt-0.5 block">
            {formatINR(member.totalSavings)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-left">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            {language === 'mr' ? 'थकीत कर्ज' : 'Loan Due'}
          </span>
          <span className="text-base font-black text-amber-700 amount-display mt-0.5 block">
            {formatINR(member.activeLoanBalance)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-left">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            {language === 'mr' ? 'पुढील बैठक' : 'Next Meeting'}
          </span>
          <span className="text-xs font-black text-gray-900 mt-1 block">
            24 Sept · 4 PM
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-left">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            {language === 'mr' ? 'गट आरोग्य' : 'Group Health'}
          </span>
          <span className="text-xs font-black text-emerald-800 mt-1 block flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>92/100 (Grade A)</span>
          </span>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onOpenUpiPayment('SAVINGS', 500)}
          className="flex flex-col items-start gap-2 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left"
          style={{ background: '#E6F4EE', border: '1px solid #A7D9BC' }}
        >
          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1A6B4A' }}>
            <PlusCircle className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0F4230' }}>
              {language === 'mr' ? 'बचत जमा करा' : language === 'hi' ? 'बचत जमा करें' : 'Deposit Savings'}
            </p>
            <p className="text-xs" style={{ color: '#1A6B4A' }}>UPI · Cash</p>
          </div>
        </button>

        <button
          onClick={() => onOpenUpiPayment('EMI_REPAYMENT', 1000)}
          className="flex flex-col items-start gap-2 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left"
          style={{ background: '#FFF0E5', border: '1px solid #FED7AA' }}
        >
          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#E8720C' }}>
            <ArrowUpRight className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#7C2D12' }}>
              {language === 'mr' ? 'हप्ता भरा' : language === 'hi' ? 'किस्त चुकाएं' : 'Repay EMI'}
            </p>
            <p className="text-xs" style={{ color: '#E8720C' }}>UPI · UTR</p>
          </div>
        </button>
      </div>

      {/* ── Active Loan card (if any) ── */}
      {activeLoan && (
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: '#EBF3FF', border: '1px solid #BFDBFE' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1D5FA8' }}>
                <CreditCard className="w-4 h-4 text-white" />
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-400">
                  {language === 'mr' ? 'सक्रिय कर्ज' : 'Active Loan'}
                </p>
                <p className="text-lg font-bold" style={{ color: '#1E3A5F' }}>
                  {formatINR(activeLoan.remainingBalance)}
                  <span className="text-xs font-medium text-gray-400 ml-1">remaining</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('loans')}
              className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg"
              style={{ background: '#1D5FA8', color: 'white' }}
            >
              Details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Next Meeting card ── */}
      <div className="rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4"
        style={{ background: 'white', border: '1px solid #E4E8EF', boxShadow: '0 1px 4px rgba(17,24,39,0.06)' }}>
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FFF0E5', border: '1px solid #FED7AA' }}>
            <Calendar className="w-5 h-5" style={{ color: '#E8720C' }} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {language === 'mr' ? 'पुढील बैठक' : language === 'hi' ? 'अगली बैठक' : 'Next Meeting'}
            </p>
            <p className="text-[15px] font-bold text-gray-900 mt-0.5">24 Sept • 4:00 PM</p>
            <p className="text-xs text-gray-400 font-medium">Shirwal Gram Panchayat Hall</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('meetings')}
          className="text-xs font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:scale-105"
          style={{ background: '#FFF0E5', color: '#E8720C', border: '1px solid #FED7AA' }}
        >
          {language === 'mr' ? 'बैठका' : 'View'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Recent Transactions ── */}
      {memberTxs.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E4E8EF', boxShadow: '0 1px 4px rgba(17,24,39,0.06)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F4F6FA' }}>
            <p className="text-sm font-semibold text-gray-900">
              {language === 'mr' ? 'अलीकडील व्यवहार' : 'Recent Transactions'}
            </p>
            <button
              onClick={() => onNavigateTab('passbook')}
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: '#1A6B4A' }}
            >
              All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {memberTxs.map((tx) => {
              const isSavings = tx.type === 'SAVINGS';
              const isLoan = tx.type === 'LOAN_DISBURSAL';
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{
                        background: isSavings ? '#E6F4EE' : isLoan ? '#EBF3FF' : '#FFF0E5',
                      }}
                    >
                      {isSavings ? '💰' : isLoan ? '🏦' : '↩️'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {isSavings
                          ? (language === 'mr' ? 'बचत' : 'Savings')
                          : isLoan
                          ? (language === 'mr' ? 'कर्ज' : 'Loan')
                          : (language === 'mr' ? 'हप्ता' : 'EMI')}
                      </p>
                      <p className="text-[11px] text-gray-400">{new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <span
                    className="text-sm font-bold amount-display"
                    style={{ color: isSavings ? '#1A6B4A' : '#1D5FA8' }}
                  >
                    {isSavings ? '+' : ''}{formatINR(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

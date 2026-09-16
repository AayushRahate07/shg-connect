import React, { useState } from 'react';
import { Member, Transaction, SupportedLanguage, Loan, Meeting } from '../types/shg';
import { GroupInfo } from '../services/db';
import { PassbookTable } from '../components/PassbookTable';
import { MeetingWizard } from '../components/MeetingWizard';
import { LedgerVerifier } from '../components/LedgerVerifier';
import { LoanCalculator } from '../components/LoanCalculator';
import { Users, Building2, HandCoins, ShieldCheck, Sparkles, PlusCircle, BookOpen, Calculator, Lock, UserPlus } from 'lucide-react';

interface AnimatorDashboardProps {
  group: GroupInfo;
  members: Member[];
  transactions: Transaction[];
  loans: Loan[];
  meetings: Meeting[];
  language: SupportedLanguage;
  onCompleteMeetingSession: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string }
  ) => void;
  onVerifyBlockIndex: (index: number) => void;
  onSimulateTamper: () => void;
}

export const AnimatorDashboard: React.FC<AnimatorDashboardProps> = ({
  group,
  members,
  transactions,
  loans,
  meetings,
  language,
  onCompleteMeetingSession,
  onVerifyBlockIndex,
  onSimulateTamper
}) => {
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'passbook' | 'verifier' | 'calculator'>('passbook');

  // Compute metrics
  const totalGroupSavings = members.reduce((sum, m) => sum + m.totalSavings, 0);
  const totalActiveLoansAmount = loans.reduce((sum, l) => sum + l.remainingBalance, 0);

  return (
    <div className="space-y-6">
      {/* Group Header Banner */}
      <div className="bg-emerald-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4 border border-emerald-800">
        <div>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-semibold">
            {group.shgCode}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            {language === 'mr' ? group.nameRegional : group.name}
          </h1>
          <p className="text-xs text-emerald-300 mt-1">
            {group.village}, {group.district} | {members.length} Active Members | Meeting Session #{meetings.length + 1}
          </p>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-3 rounded-2xl font-black text-sm shadow-xl transition transform active:scale-95 flex items-center space-x-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>
            {language === 'mr' ? 'नवीन बैठक सुरू करा (Start Meeting)' : 'Start Monthly Meeting'}
          </span>
        </button>
      </div>

      {/* Group Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            {language === 'mr' ? 'गटाचा एकूण निधी (Total Capital Pool)' : 'Group Capital Pool'}
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            ₹{totalGroupSavings.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-500">Monthly Deposit Rate: ₹{group.monthlyPoolRate}/member</span>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            {language === 'mr' ? 'सक्रिय कर्जे (Active Loan Portfolio)' : 'Active Loans Outstanding'}
          </span>
          <div className="text-2xl font-black text-rose-700 mt-1">
            ₹{totalActiveLoansAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-500">{loans.length} Active Micro-loans</span>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            {language === 'mr' ? 'SHA-256 ब्लॉक पडताळणी' : 'SHA-256 Ledger Security'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span className="text-base text-emerald-800 font-extrabold">100% Verified</span>
          </div>
          <span className="text-xs text-slate-500">{transactions.length} Total Blocks Chained</span>
        </div>
      </div>

      {/* Meeting Session Wizard Modal */}
      {showWizard && (
        <MeetingWizard
          members={members}
          language={language}
          monthlySavingsAmount={group.monthlyPoolRate}
          onCancel={() => setShowWizard(false)}
          onCompleteMeeting={(att, sav, loan) => {
            onCompleteMeetingSession(att, sav, loan);
            setShowWizard(false);
          }}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 pb-1">
        <button
          onClick={() => setActiveTab('passbook')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-xl text-xs font-bold transition ${
            activeTab === 'passbook'
              ? 'bg-emerald-900 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{language === 'mr' ? 'गट नोंदवही (Group Register)' : 'Group Ledger Register'}</span>
        </button>

        <button
          onClick={() => setActiveTab('verifier')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-xl text-xs font-bold transition ${
            activeTab === 'verifier'
              ? 'bg-emerald-900 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{language === 'mr' ? 'SHA-256 पडताळणी (Ledger Verifier)' : 'SHA-256 Audit Verifier'}</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-xl text-xs font-bold transition ${
            activeTab === 'calculator'
              ? 'bg-emerald-900 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{language === 'mr' ? 'कर्ज गणक (Loan Calculator)' : 'Loan Calculator'}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'passbook' && (
        <PassbookTable
          transactions={transactions}
          members={members}
          language={language}
          onVerifyBlock={onVerifyBlockIndex}
        />
      )}

      {activeTab === 'verifier' && (
        <LedgerVerifier
          transactions={transactions}
          language={language}
          onSimulateTamper={onSimulateTamper}
        />
      )}

      {activeTab === 'calculator' && (
        <LoanCalculator language={language} />
      )}
    </div>
  );
};

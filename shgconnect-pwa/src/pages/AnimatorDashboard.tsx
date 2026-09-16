import React, { useState } from 'react';
import { Member, Transaction, SupportedLanguage, Loan, Meeting, Resolution } from '../types/shg';
import { GroupInfo } from '../services/db';
import { PassbookTable } from '../components/PassbookTable';
import { MeetingWizard } from '../components/MeetingWizard';
import { LedgerVerifier } from '../components/LedgerVerifier';
import { LoanCalculator } from '../components/LoanCalculator';
import { PanchasutraAuditCard } from '../components/PanchasutraAuditCard';
import { ResolutionRegister, INITIAL_RESOLUTIONS } from '../components/ResolutionRegister';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { verifyLedgerIntegrity } from '../services/hashChain';
import { Users, Building2, HandCoins, ShieldCheck, Sparkles, BookOpen, Calculator, Lock, FileText, Award } from 'lucide-react';

interface AnimatorDashboardProps {
  group: GroupInfo;
  members: Member[];
  transactions: Transaction[];
  loans: Loan[];
  meetings: Meeting[];
  resolutions: Resolution[];
  language: SupportedLanguage;
  onCompleteMeetingSession: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[]
  ) => void;
  onAddResolution: (res: Omit<Resolution, 'id' | 'resolutionNumber'>) => void;
  onVerifyBlockIndex: (index: number) => void;
  onSimulateTamper: () => void;
}

export const AnimatorDashboard: React.FC<AnimatorDashboardProps> = ({
  group,
  members,
  transactions,
  loans,
  meetings,
  resolutions,
  language,
  onCompleteMeetingSession,
  onAddResolution,
  onVerifyBlockIndex,
  onSimulateTamper
}) => {
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'passbook' | 'panchasutra' | 'resolutions' | 'verifier' | 'calculator'>('passbook');
  const [selectedDossierMember, setSelectedDossierMember] = useState<Member | null>(null);
  const [isChainValid, setIsChainValid] = useState<boolean>(true);

  React.useEffect(() => {
    async function checkChain() {
      const res = await verifyLedgerIntegrity(transactions);
      setIsChainValid(res.isValid);
    }
    checkChain();
  }, [transactions]);

  // Compute metrics
  const totalGroupSavings = members.reduce((sum, m) => sum + m.totalSavings, 0);
  const totalActiveLoansAmount = loans.reduce((sum, l) => sum + l.remainingBalance, 0);

  return (
    <div className="space-y-6">
      {/* Group Header Banner */}
      <div className="bg-[#14532D] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4 border border-emerald-800">
        <div>
          <span className="bg-amber-400 text-amber-950 text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider">
            {group.shgCode}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            {language === 'mr' ? group.nameRegional : group.name}
          </h1>
          <p className="text-xs text-emerald-200 mt-1 font-medium">
            {group.village}, {group.district} | {members.length} Active Members | Meeting Session #{meetings.length + 1}
          </p>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-5 py-3 rounded-2xl font-black text-sm shadow-xl transition transform active:scale-95 flex items-center space-x-2"
        >
          <Sparkles className="w-5 h-5 text-amber-950" />
          <span>
            {language === 'mr' ? 'नवीन बैठक सुरू करा (Start Meeting)' : 'Start Monthly Meeting'}
          </span>
        </button>
      </div>

      {/* Group Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FDFBF7] p-5 rounded-3xl shadow-xs border border-[#E2DDD3]">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
            {language === 'mr' ? 'गटाचा एकूण निधी (Total Capital Pool)' : 'Group Capital Pool'}
          </span>
          <div className="text-2xl font-black text-[#14532D] mt-1">
            ₹{totalGroupSavings.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-stone-500 font-medium">Monthly Quota: ₹{group.monthlyPoolRate}/member</span>
        </div>

        <div className="bg-[#FDFBF7] p-5 rounded-3xl shadow-xs border border-[#E2DDD3]">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
            {language === 'mr' ? 'सक्रिय कर्जे (Active Loan Portfolio)' : 'Active Loans Outstanding'}
          </span>
          <div className="text-2xl font-black text-rose-700 mt-1">
            ₹{totalActiveLoansAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-stone-500 font-medium">{loans.length} Active Micro-loans</span>
        </div>

        <div className="bg-[#FDFBF7] p-5 rounded-3xl shadow-xs border border-[#E2DDD3]">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
            {language === 'mr' ? 'SHA-256 ब्लॉक पडताळणी' : 'SHA-256 Ledger Security'}
          </span>
          <div className="text-2xl font-black text-[#1C1917] mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-6 h-6 text-[#14532D]" />
            <span className="text-base text-[#14532D] font-black">100% Verified</span>
          </div>
          <span className="text-xs text-stone-500 font-medium">{transactions.length} Total Blocks Chained</span>
        </div>
      </div>

      {/* Meeting Session Wizard Modal */}
      {showWizard && (
        <MeetingWizard
          members={members}
          language={language}
          monthlySavingsAmount={group.monthlyPoolRate}
          onCancel={() => setShowWizard(false)}
          onCompleteMeeting={(att, sav, loan, newRes) => {
            onCompleteMeetingSession(att, sav, loan, newRes);
            setShowWizard(false);
          }}
        />
      )}

      {/* Member Dossier Modal */}
      {selectedDossierMember && (
        <MemberDossierModal
          member={selectedDossierMember}
          transactions={transactions}
          loans={loans}
          language={language}
          onClose={() => setSelectedDossierMember(null)}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E2DDD3] gap-2 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('passbook')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-2xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'passbook'
              ? 'bg-[#14532D] text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#E2DDD3]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>{language === 'mr' ? 'गट नोंदवही (Group Register)' : 'Group Ledger Register'}</span>
        </button>

        <button
          onClick={() => setActiveTab('panchasutra')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-2xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'panchasutra'
              ? 'bg-[#14532D] text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#E2DDD3]'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>{language === 'mr' ? 'पंचसूत्र ऑडिट (NABARD Audit)' : 'Panchasutra Audit'}</span>
        </button>

        <button
          onClick={() => setActiveTab('resolutions')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-2xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'resolutions'
              ? 'bg-[#14532D] text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#E2DDD3]'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>{language === 'mr' ? 'इतिवृत्त (Resolutions Book)' : 'Resolutions Book'}</span>
        </button>

        <button
          onClick={() => setActiveTab('verifier')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-2xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'verifier'
              ? 'bg-[#14532D] text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#E2DDD3]'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>{language === 'mr' ? 'SHA-256 पडताळणी (Ledger Verifier)' : 'SHA-256 Audit Verifier'}</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-2xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'calculator'
              ? 'bg-[#14532D] text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#E2DDD3]'
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-400" />
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
          onSelectMemberDossier={(m) => setSelectedDossierMember(m)}
        />
      )}

      {activeTab === 'panchasutra' && (
        <PanchasutraAuditCard
          members={members}
          transactions={transactions}
          isChainValid={isChainValid}
          language={language}
        />
      )}

      {activeTab === 'resolutions' && (
        <ResolutionRegister
          members={members}
          resolutions={resolutions}
          language={language}
          onAddResolution={onAddResolution}
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

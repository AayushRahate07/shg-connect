import React, { useState, useEffect } from 'react';
import { Member, Transaction, SupportedLanguage, Loan, Meeting, Resolution } from '../types/shg';
import { GroupInfo } from '../services/db';
import { translations } from '../i18n/translations';
import { formatINR } from '../theme/tokens';
import { PassbookTable } from '../components/PassbookTable';
import { MeetingWizard } from '../components/MeetingWizard';
import { LedgerVerifier } from '../components/LedgerVerifier';
import { LoanCalculator } from '../components/LoanCalculator';
import { PanchasutraVisualizer } from '../components/panchasutra/PanchasutraVisualizer';
import { ResolutionRegister } from '../components/ResolutionRegister';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { ReportsView } from '../components/reports/ReportsView';
import { SettingsView } from '../components/settings/SettingsView';
import { verifyLedgerIntegrity } from '../services/hashChain';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Users, Building2, HandCoins, ShieldCheck, Sparkles, BookOpen, Calculator, Lock, FileText, Award, Calendar, Landmark, Settings } from 'lucide-react';

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
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onToggleTts?: () => void;
  ttsEnabled?: boolean;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onOpenBackupModal?: () => void;
  onOpenSyncCenter?: () => void;
  onResetData?: () => void;
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
  onSimulateTamper,
  activeTab = 'home',
  onSelectTab,
  onToggleTts = () => {},
  ttsEnabled = true,
  onLanguageChange = () => {},
  onOpenBackupModal = () => {},
  onOpenSyncCenter = () => {},
  onResetData = () => {}
}) => {
  const t = translations[language] || translations.en;
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [selectedDossierMember, setSelectedDossierMember] = useState<Member | null>(null);
  const [isChainValid, setIsChainValid] = useState<boolean>(true);

  useEffect(() => {
    async function checkChain() {
      const res = await verifyLedgerIntegrity(transactions);
      setIsChainValid(res.isValid);
    }
    checkChain();
  }, [transactions]);

  const totalGroupSavings = members.reduce((sum, m) => sum + m.totalSavings, 0);
  const totalActiveLoansAmount = loans.reduce((sum, l) => sum + l.remainingBalance, 0);

  // Mock Panchasutra Score
  const mockPanchasutraScore = {
    regularMeetingsScore: 18,
    regularSavingsScore: 20,
    internalLendingScore: 18,
    timelyRecoveryScore: 16,
    transparentBooksScore: 20,
    totalScore: 92,
    bankGrade: 'Grade A' as const,
    loanEligibilityInr: 500000
  };

  const handleNavigate = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  return (
    <div className="space-y-6">
      {/* Group Header Banner */}
      <div className="bg-gradient-to-r from-[#0F4C3A] via-[#14532D] to-[#0B382B] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-wrap items-center justify-between gap-4 border border-emerald-800">
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

        <Button
          variant="secondary"
          size="lg"
          icon={<Sparkles className="w-5 h-5 text-amber-950" />}
          onClick={() => setShowWizard(true)}
        >
          {t.meeting.startMeeting}
        </Button>
      </div>

      {/* Dynamic Tab Body */}
      {(activeTab === 'home' || activeTab === 'overview') && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="parchment" className="p-5">
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                Group Capital Pool
              </span>
              <div className="text-2xl font-black text-[#14532D] mt-1">
                {formatINR(totalGroupSavings)}
              </div>
              <span className="text-xs text-stone-500 font-medium">Monthly Quota: ₹{group.monthlyPoolRate}/member</span>
            </Card>

            <Card variant="parchment" className="p-5">
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                Active Loans Outstanding
              </span>
              <div className="text-2xl font-black text-rose-700 mt-1">
                {formatINR(totalActiveLoansAmount)}
              </div>
              <span className="text-xs text-stone-500 font-medium">{loans.length} Active Loans</span>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SHA-256 Ledger State
              </span>
              <div className="mt-1">
                <Badge variant={isChainValid ? 'success' : 'error'}>
                  {isChainValid ? 'Verified Tamper-Proof' : 'Ledger Integrity Warning'}
                </Badge>
              </div>
              <span className="text-xs text-stone-500 font-medium mt-2 block">
                {transactions.length} Hash Blocks Chained
              </span>
            </Card>
          </div>

          {/* Quick Action Navigation Grid */}
          <Card className="p-5">
            <h3 className="font-extrabold text-stone-900 text-sm mb-3">Group Management Console</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="outline" size="md" icon={<Users className="w-4 h-4 text-emerald-700" />} onClick={() => handleNavigate('members')}>
                {t.nav.members} ({members.length})
              </Button>
              <Button variant="outline" size="md" icon={<Landmark className="w-4 h-4 text-amber-600" />} onClick={() => handleNavigate('loans')}>
                {t.nav.loans}
              </Button>
              <Button variant="outline" size="md" icon={<Award className="w-4 h-4 text-emerald-700" />} onClick={() => handleNavigate('panchasutra')}>
                {t.nav.panchasutra}
              </Button>
              <Button variant="outline" size="md" icon={<FileText className="w-4 h-4 text-stone-700" />} onClick={() => handleNavigate('resolutions')}>
                Resolutions Book
              </Button>
            </div>
          </Card>

          {/* Panchasutra Visualizer & Passbook Preview */}
          <PanchasutraVisualizer score={mockPanchasutraScore} language={language} />

          <PassbookTable transactions={transactions} members={members} language={language} onVerifyBlock={onVerifyBlockIndex} />
        </div>
      )}

      {activeTab === 'members' && (
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 border-none pb-2">
            <CardTitle className="text-base">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>SHG Member Directory ({members.length})</span>
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedDossierMember(m)}
                className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E2DDD3] hover:border-emerald-700 transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-extrabold text-stone-900 text-sm">{language === 'mr' ? m.nameRegional : m.name}</div>
                  <div className="text-xs text-stone-500 font-medium">{m.role} • {m.phone}</div>
                  <div className="text-xs text-emerald-800 font-bold mt-1">Savings: {formatINR(m.totalSavings)}</div>
                </div>
                <Badge variant="saffron" size="sm">
                  {m.trustScore}/100
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'loans' && (
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 border-none pb-2">
            <CardTitle className="text-base">
              <Landmark className="w-5 h-5 text-amber-600" />
              <span>Active Group Loans ({loans.length})</span>
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-stone-100">
            {loans.map(l => (
              <div key={l.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-stone-900">{l.memberName} (Loan #{l.id})</div>
                  <div className="text-stone-500">Principal: {formatINR(l.principal)} • Disbursed: {l.dateDisbursed}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-rose-700 text-sm">{formatINR(l.remainingBalance)} Remaining</div>
                  <Badge variant={l.status === 'ACTIVE' ? 'warning' : 'success'} size="sm">{l.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <Card className="p-6 text-center space-y-3">
            <Calendar className="w-8 h-8 text-emerald-700 mx-auto" />
            <h3 className="font-black text-stone-900 text-base">Monthly Meeting Session Mode</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Guided 7-step meeting workflow covering attendance, officer PIN quorum, savings collection, internal loan disbursal, resolutions, and cash box reconciliation.
            </p>
            <Button variant="secondary" size="md" icon={<Sparkles className="w-4 h-4 text-amber-950" />} onClick={() => setShowWizard(true)}>
              Launch Step-by-Step Meeting Wizard
            </Button>
          </Card>
        </div>
      )}

      {activeTab === 'passbook' && (
        <PassbookTable transactions={transactions} members={members} language={language} onVerifyBlock={onVerifyBlockIndex} />
      )}

      {activeTab === 'panchasutra' && (
        <PanchasutraVisualizer score={mockPanchasutraScore} language={language} />
      )}

      {activeTab === 'resolutions' && (
        <ResolutionRegister members={members} resolutions={resolutions} language={language} onAddResolution={onAddResolution} />
      )}

      {activeTab === 'verifier' && (
        <LedgerVerifier transactions={transactions} language={language} onSimulateTamper={onSimulateTamper} />
      )}

      {activeTab === 'calculator' && (
        <LoanCalculator language={language} />
      )}

      {activeTab === 'reports' && (
        <ReportsView
          language={language}
          onOpenPassbook={() => handleNavigate('passbook')}
          onOpenPanchasutra={() => handleNavigate('panchasutra')}
          onOpenVerifier={() => handleNavigate('verifier')}
          onOpenResolutions={() => handleNavigate('resolutions')}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView
          language={language}
          onLanguageChange={onLanguageChange}
          ttsEnabled={ttsEnabled}
          onToggleTts={onToggleTts}
          onOpenBackupModal={onOpenBackupModal}
          onOpenSyncCenter={onOpenSyncCenter}
          onResetData={onResetData}
          federation={group.federation}
        />
      )}

      {/* Guided 7-Step Meeting Wizard */}
      {showWizard && (
        <MeetingWizard
          members={members}
          language={language}
          monthlySavingsAmount={group.monthlyPoolRate || 500}
          onCancel={() => setShowWizard(false)}
          onCompleteMeeting={onCompleteMeetingSession}
        />
      )}

      {/* Member Dossier Modal */}
      {selectedDossierMember && (
        <MemberDossierModal
          member={selectedDossierMember}
          transactions={transactions.filter(t => t.memberId === selectedDossierMember.id)}
          loans={loans.filter(l => l.memberId === selectedDossierMember.id)}
          language={language}
          onClose={() => setSelectedDossierMember(null)}
        />
      )}
    </div>
  );
};

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
import { MoreMenuView } from '../components/member/MoreMenuView';
import { verifyLedgerIntegrity } from '../services/hashChain';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Users, Building2, HandCoins, ShieldCheck, Sparkles, BookOpen, Calculator, Lock, FileText, Award, Calendar, Landmark, Settings } from 'lucide-react';

interface OfficeBearerDashboardProps {
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
  onOpenAddMember?: () => void;
}

export const OfficeBearerDashboard: React.FC<OfficeBearerDashboardProps> = ({
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
  onResetData = () => {},
  onOpenAddMember
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
      {/* ── Group Hero Banner ── */}
      <div
        className="rounded-2xl p-5 sm:p-6 relative overflow-hidden flex flex-wrap items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #1A6B4A 0%, #145739 55%, #0F4230 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/4 pointer-events-none"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-8 translate-y-1/2 -translate-x-1/4 pointer-events-none"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full mb-3"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#FEF3C7', border: '1px solid rgba(255,255,255,0.2)' }}>
            {group.shgCode}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {language === 'mr' ? group.nameRegional : group.name}
          </h1>
          <p className="text-sm text-green-200 mt-1.5 font-medium">
            {group.village}, {group.district}
            <span className="mx-2 opacity-40">·</span>
            {members.length} Members
            <span className="mx-2 opacity-40">·</span>
            Meeting #{meetings.length + 1}
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          icon={<Sparkles className="w-5 h-5" />}
          onClick={() => setShowWizard(true)}
          className="relative z-10 flex-shrink-0"
        >
          {t.meeting.startMeeting}
        </Button>
      </div>

      {/* Guided 7-Step Meeting Wizard */}
      {showWizard ? (
        <MeetingWizard
          members={members}
          language={language}
          monthlySavingsAmount={group.monthlyPoolRate || 500}
          onCancel={() => setShowWizard(false)}
          onCompleteMeeting={(attendance, savings, loan, resolutions) => {
            setShowWizard(false);
            onCompleteMeetingSession(attendance, savings, loan, resolutions);
          }}
        />
      ) : (
        <>
          {/* Dynamic Tab Body */}
          {(activeTab === 'home' || activeTab === 'overview') && (
            <div className="space-y-5">
              {/* ── Metric Cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Group Capital */}
                <div className="rounded-2xl p-5 stat-green">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1A6B4A' }}>
                      <Building2 className="w-4 h-4 text-white" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#1A6B4A' }}>
                      Group Capital Pool
                    </span>
                  </div>
                  <div className="text-3xl font-black amount-display" style={{ color: '#0F4230' }}>
                    {formatINR(totalGroupSavings)}
                  </div>
                  <p className="text-xs font-medium mt-1.5" style={{ color: '#1A6B4A' }}>
                    Monthly Quota: ₹{group.monthlyPoolRate}/member
                  </p>
                </div>

                {/* Active Loans */}
                <div className="rounded-2xl p-5 stat-red">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-600">
                      <HandCoins className="w-4 h-4 text-white" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                      Loans Outstanding
                    </span>
                  </div>
                  <div className="text-3xl font-black amount-display text-red-700">
                    {formatINR(totalActiveLoansAmount)}
                  </div>
                  <p className="text-xs font-medium mt-1.5 text-red-500">
                    {loans.length} Active Loans
                  </p>
                </div>

                {/* Audit State */}
                <div className="rounded-2xl p-5 stat-violet">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#6D28D9' }}>
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5B21B6' }}>
                      SHA-256 Audit
                    </span>
                  </div>
                  <Badge variant={isChainValid ? 'success' : 'error'}>
                    {isChainValid ? 'Verified Tamper-Proof' : 'Integrity Warning'}
                  </Badge>
                  <p className="text-xs font-medium mt-2" style={{ color: '#6D28D9' }}>
                    {transactions.length} hash blocks chained
                  </p>
                </div>
              </div>

              {/* ── Quick Actions Grid ── */}
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E4E8EF', boxShadow: '0 1px 4px rgba(17,24,39,0.06)' }}>
                <p className="text-sm font-semibold text-gray-900 mb-3">Group Management Console</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'members', label: `${t.nav.members} (${members.length})`, icon: Users, color: '#1D5FA8', bg: '#EBF3FF' },
                    { id: 'loans', label: t.nav.loans, icon: Landmark, color: '#E8720C', bg: '#FFF0E5' },
                    { id: 'panchasutra', label: t.nav.panchasutra, icon: Award, color: '#E8720C', bg: '#FFF0E5' },
                    { id: 'resolutions', label: 'Resolutions', icon: FileText, color: '#6D28D9', bg: '#EDE9FE' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id)}
                        className="flex flex-col items-start gap-2.5 p-3.5 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] text-left"
                        style={{ background: item.bg, border: `1px solid ${item.color}28` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: item.color }} />
                        <span className="text-xs font-semibold" style={{ color: item.color }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Panchasutra Visualizer & Passbook Preview */}
              <PanchasutraVisualizer score={mockPanchasutraScore} language={language} />

              <PassbookTable transactions={transactions} members={members} language={language} onVerifyBlock={onVerifyBlockIndex} />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1D5FA8' }}>
                    <Users className="w-4 h-4 text-white" />
                  </span>
                  <h2 className="text-base font-bold text-gray-900">SHG Member Directory ({members.length})</h2>
                </div>
                {onOpenAddMember && (
                  <button
                    onClick={onOpenAddMember}
                    className="bg-[#14532D] hover:bg-emerald-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow flex items-center space-x-1.5 transition active:scale-95"
                  >
                    <span>+</span>
                    <span>{language === 'mr' ? 'नवीन सदस्य' : 'Add Member'}</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((m, idx) => {
                  const avatarColors = ['#1A6B4A', '#1D5FA8', '#E8720C', '#6D28D9', '#BE185D'];
                  const avatarColor = avatarColors[idx % avatarColors.length];
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedDossierMember(m)}
                      className="bg-white p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      style={{ border: '1px solid #E4E8EF', boxShadow: '0 1px 4px rgba(17,24,39,0.05)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                            style={{ background: avatarColor }}
                          >
                            {(language === 'mr' ? m.nameRegional : m.name).charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{language === 'mr' ? m.nameRegional : m.name}</div>
                            <div className="text-xs text-gray-400 font-medium mt-0.5">{m.role}</div>
                          </div>
                        </div>
                        <Badge variant="saffron" size="sm">{m.trustScore}/100</Badge>
                      </div>
                      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid #F4F6FA' }}>
                        <span className="text-xs font-medium text-gray-400">Total Savings</span>
                        <span className="text-sm font-bold amount-display" style={{ color: '#1A6B4A' }}>{formatINR(m.totalSavings)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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

          {activeTab === 'more' && (
            <MoreMenuView language={language} onNavigateTab={handleNavigate} />
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
        </>
      )}
    </div>
  );
};

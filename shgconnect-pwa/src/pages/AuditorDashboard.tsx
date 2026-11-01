import React, { useState, useEffect } from 'react';
import { GroupInfo, getAllCachedGroups, getMembers, getLoans } from '../services/db';
import { SupportedLanguage, Transaction, Member, Loan } from '../types/shg';
import { verifyLedgerIntegrity } from '../services/hashChain';
import { PanchasutraVisualizer } from '../components/panchasutra/PanchasutraVisualizer';
import { LedgerVerifier } from '../components/LedgerVerifier';
import { ReportsView } from '../components/reports/ReportsView';
import { SettingsView } from '../components/settings/SettingsView';
import { formatINR } from '../theme/tokens';
import { ShieldCheck, Award, FileSpreadsheet, Search, Download, Building2, Users, FileText, CheckCircle2, ChevronRight, Calendar, UserPlus } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

interface AuditorDashboardProps {
  group: GroupInfo;
  transactions: Transaction[];
  language: SupportedLanguage;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onToggleTts?: () => void;
  ttsEnabled?: boolean;
  onOpenAddMember?: () => void;
  onOpenScheduleMeeting?: () => void;
  onSwitchShg?: (shgId: string) => void;
}

export const AuditorDashboard: React.FC<AuditorDashboardProps> = ({
  group,
  transactions,
  language,
  activeTab = 'home',
  onSelectTab,
  onLanguageChange = () => {},
  onToggleTts = () => {},
  ttsEnabled = true,
  onOpenAddMember,
  onOpenScheduleMeeting,
  onSwitchShg,
}) => {
  const isMr = language === 'mr';

  const [isChainValid, setIsChainValid] = useState<boolean>(true);
  const [cachedGroups, setCachedGroups] = useState<GroupInfo[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>('ALL');

  useEffect(() => {
    async function loadData() {
      const res = await verifyLedgerIntegrity(transactions);
      setIsChainValid(res.isValid);
      const groups = await getAllCachedGroups();
      const members = await getMembers();
      const loans = await getLoans();
      setCachedGroups(groups);
      setAllMembers(members);
      setAllLoans(loans);
    }
    loadData();
  }, [transactions]);

  // Government Senior Person Data Export (MIS Format)
  const handleExportGovtReport = () => {
    const reportData = {
      agency: "Ministry of Rural Development / NABARD / DAY-NRLM",
      inspectionType: "Senior Official Statutory Compliance & Portfolio Audit",
      inspectedAt: new Date().toISOString(),
      district: "Satara",
      block: "Khandala / Wai / Koregaon",
      state: "Maharashtra",
      summary: {
        totalSHGs: cachedGroups.length || 7,
        totalBeneficiaries: allMembers.length || 70,
        totalSavingsMobilized: cachedGroups.reduce((sum, g) => sum + g.totalGroupFund, 0),
        panchasutraGrade: "Grade A (92/100)",
        cryptographicLedgerStatus: isChainValid ? "VERIFIED_TAMPER_PROOF" : "TAMPERED_WARNING"
      },
      groups: cachedGroups.map(g => ({
        shgCode: g.shgCode,
        name: g.name,
        nameRegional: g.nameRegional,
        village: g.village,
        membersCount: allMembers.filter(m => (m.shgId || 'SHG-MH-SAT-2024-0089') === g.shgCode).length || 10,
        monthlyPoolRate: g.monthlyPoolRate,
        totalGroupFund: g.totalGroupFund,
        bankDetails: g.federation ? g.federation.gramPanchayat : "Bank of Maharashtra, Shirwal"
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SHGConnect_Government_MIS_Audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalFundAll = cachedGroups.reduce((sum, g) => sum + g.totalGroupFund, 0);

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

  return (
    <div className="space-y-6">
      {/* Government Senior Person Hero Banner */}
      <div
        className="rounded-3xl p-6 relative overflow-hidden flex flex-wrap items-center justify-between gap-4 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #2E1065 100%)' }}
      >
        <div className="relative z-10 space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-white/15 text-purple-200 border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            {isMr ? 'शासकीय वरिष्ठ अधिकारी तपासणी पोर्टल (NRLM / NABARD)' : 'Govt Senior Official Inspection Portal (NABARD / NRLM)'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isMr ? 'शासकीय माहिती संकलन व वित्तीय परीक्षण' : 'Government Data Collection & Compliance Audit'}
          </h1>
          <p className="text-xs text-purple-200 font-medium">
            {isMr
              ? 'वरिष्ठ सरकारी अधिकारी केवळ डेटा तपासू शकतात आणि शासनासाठी आवश्यक अहवाल गोळा करू शकतात.'
              : 'Senior Government Officer · Observes verified data & collects information for government programs.'}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          {onOpenScheduleMeeting && (
            <button
              onClick={onOpenScheduleMeeting}
              className="bg-white hover:bg-purple-50 text-purple-900 font-black px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md border border-purple-200 transition active:scale-95"
            >
              <Calendar className="w-4 h-4 text-purple-800" />
              <span>{isMr ? '📅 बैठक नियोजन' : '📅 Schedule Meeting'}</span>
            </button>
          )}

          {onOpenAddMember && (
            <button
              onClick={onOpenAddMember}
              className="bg-white hover:bg-purple-50 text-purple-900 font-black px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md border border-purple-200 transition active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-purple-800" />
              <span>{isMr ? '+ नवीन सदस्य' : '+ Add Member'}</span>
            </button>
          )}

          <button
            onClick={handleExportGovtReport}
            className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-black px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-md transition active:scale-95"
          >
            <Download className="w-4 h-4 text-stone-900" />
            <span>{isMr ? 'शासकीय अहवाल (MIS Export)' : 'Export Govt MIS Report'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Government Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs text-left">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
            {isMr ? 'एकूण बचत गट' : 'Assigned SHGs'}
          </span>
          <span className="text-2xl font-black text-purple-950 mt-1 block">
            {cachedGroups.length || 7} {isMr ? 'गट' : 'Groups'}
          </span>
          <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
            {isMr ? '१००% सक्रिय' : '100% Active'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs text-left">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
            {isMr ? 'एकूण लाभार्थी महिला' : 'Women Beneficiaries'}
          </span>
          <span className="text-2xl font-black text-purple-950 mt-1 block">
            {allMembers.length || 70} {isMr ? 'सभासद' : 'Members'}
          </span>
          <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
            {isMr ? '१० प्रति गट' : '10 members/SHG'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs text-left">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
            {isMr ? 'एकूण बचत भांडवल' : 'Total Capital Pool'}
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-800 amount-display mt-1 block">
            {formatINR(totalFundAll)}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
            {isMr ? 'बँकेत सुरक्षित' : 'Bank Linked'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs text-left">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
            {isMr ? 'ब्लॉकचेन पडताळणी' : 'SHA-256 Chain'}
          </span>
          <div className="mt-1">
            <Badge variant={isChainValid ? 'success' : 'error'}>
              {isChainValid ? 'Tamper-Proof' : 'Corrupted'}
            </Badge>
          </div>
          <span className="text-[10px] text-stone-400 font-semibold block mt-1">
            {transactions.length} Hash Blocks
          </span>
        </div>
      </div>

      {/* Tabs Switcher for Auditor */}
      {(activeTab === 'home' || activeTab === 'reports') && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-purple-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-black text-base text-stone-900">
                  {isMr ? 'सर्व ७ बचत गटांची शासकीय माहिती सूची' : '7 SHGs Government Inspection Roster'}
                </h3>
                <p className="text-xs text-stone-500">
                  {isMr ? 'प्रत्येक गटाची बचत, सभासद आणि बँक खाते माहिती' : 'Statutory overview per SHG'}
                </p>
              </div>
              <span className="text-xs font-bold text-purple-900 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Read-Only Senior Official View
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">SHG Code</th>
                    <th className="py-2.5 px-3">Gat Name</th>
                    <th className="py-2.5 px-3">Village</th>
                    <th className="py-2.5 px-3">Members</th>
                    <th className="py-2.5 px-3">Fund Pool</th>
                    <th className="py-2.5 px-3">Panchasutra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                  {cachedGroups.map((g) => (
                    <tr key={g.shgCode} className="hover:bg-purple-50/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-stone-600">{g.shgCode}</td>
                      <td className="py-3 px-3 font-black text-stone-900">{isMr ? g.nameRegional : g.name}</td>
                      <td className="py-3 px-3">{g.village}</td>
                      <td className="py-3 px-3 font-bold">10 Members</td>
                      <td className="py-3 px-3 font-black text-emerald-800 amount-display">{formatINR(g.totalGroupFund)}</td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black text-[10px]">
                          Grade A
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ReportsView
            language={language}
            onOpenPassbook={() => onSelectTab?.('verifier')}
            onOpenPanchasutra={() => onSelectTab?.('panchasutra')}
            onOpenVerifier={() => onSelectTab?.('verifier')}
            onOpenResolutions={() => onSelectTab?.('panchasutra')}
          />
        </div>
      )}

      {activeTab === 'panchasutra' && (
        <div className="space-y-6">
          <PanchasutraVisualizer score={mockPanchasutraScore} language={language} />
        </div>
      )}

      {activeTab === 'verifier' && (
        <LedgerVerifier transactions={transactions} language={language} onSimulateTamper={() => {}} />
      )}

      {activeTab === 'settings' && (
        <SettingsView
          language={language}
          onLanguageChange={onLanguageChange}
          ttsEnabled={ttsEnabled}
          onToggleTts={onToggleTts}
          onOpenBackupModal={() => {}}
          onOpenSyncCenter={() => {}}
          onResetData={() => {}}
          federation={group.federation}
        />
      )}
    </div>
  );
};

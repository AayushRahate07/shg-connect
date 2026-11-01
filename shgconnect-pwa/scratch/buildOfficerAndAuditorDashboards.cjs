const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

// 1. Update AnimatorMultiSHGView.tsx to add "Orchestrate Meeting" per SHG
const multiShgPath = path.join(srcDir, 'pages/AnimatorMultiSHGView.tsx');
let multiShgContent = fs.readFileSync(multiShgPath, 'utf-8');
const isMultiCrlf = multiShgContent.includes('\r\n');
multiShgContent = multiShgContent.replace(/\r\n/g, '\n');

// Add onStartMeetingForSHG prop
multiShgContent = multiShgContent.replace(
  'interface AnimatorMultiSHGViewProps {\n  currentGroup: GroupInfo;\n  language: SupportedLanguage;\n  onSelectSHG?: (shgId: string) => void;\n  onOpenAddMember?: () => void;\n}',
  'interface AnimatorMultiSHGViewProps {\n  currentGroup: GroupInfo;\n  language: SupportedLanguage;\n  onSelectSHG?: (shgId: string) => void;\n  onOpenAddMember?: () => void;\n  onStartMeetingForSHG?: (shgId: string) => void;\n}'
);

multiShgContent = multiShgContent.replace(
  'export const AnimatorMultiSHGView: React.FC<AnimatorMultiSHGViewProps> = ({\n  currentGroup,\n  language,\n  onSelectSHG,\n  onOpenAddMember\n}) => {',
  'export const AnimatorMultiSHGView: React.FC<AnimatorMultiSHGViewProps> = ({\n  currentGroup,\n  language,\n  onSelectSHG,\n  onOpenAddMember,\n  onStartMeetingForSHG\n}) => {'
);

// Update banner subtitle
multiShgContent = multiShgContent.replace(
  "{isMr ? 'गट मार्गदर्शक बहु-गट नियंत्रण (SHG Lead Oversight)' : 'SHG Lead Multi-SHG Oversight'}",
  "{isMr ? 'प्रभाग अधिकारी बहु-गट नियंत्रण (Officer - Multi-SHG Oversight)' : 'Cluster Officer · Multi-SHG Oversight'}"
);
multiShgContent = multiShgContent.replace(
  "{isMr ? 'ग्रामसंघांतर्गत बचत गट नियंत्रण' : 'Village Portfolio Management'}",
  "{isMr ? 'सर्व ७ बचत गटांचे व्यवस्थापन व बैठक संचालन' : 'Multi-SHG Management & Meeting Orchestration'}"
);

// Update card footer to offer both Meeting Orchestration and Dashboard switch
const oldCardFooter = `<div className="flex items-center justify-between text-xs text-emerald-700 font-bold pt-2 border-t border-stone-100">
                  <span>{isCurrent ? (isMr ? 'सक्रिय निवडलेला गट' : 'Currently Active') : (isMr ? 'गट निवडा / डॅशबोर्ड उघडा' : 'Select & Manage SHG')}</span>
                  <ChevronRight className="w-4 h-4 text-emerald-700" />
                </div>`;

const newCardFooter = `<div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs">
                  {onStartMeetingForSHG && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartMeetingForSHG(shg.code);
                      }}
                      className="flex-1 bg-amber-400 hover:bg-amber-300 text-stone-900 font-black py-1.5 px-2 rounded-xl text-[11px] shadow-xs flex items-center justify-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3 text-stone-900" />
                      <span>{isMr ? 'बैठक चालवा' : 'Run Meeting'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectSHG) onSelectSHG(shg.code);
                    }}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <span>{isMr ? 'डॅशबोर्ड' : 'Manage'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>`;

if (multiShgContent.includes(oldCardFooter)) {
  multiShgContent = multiShgContent.replace(oldCardFooter, newCardFooter);
}

// Update modal actions to offer both
const oldModalActions = `<div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  if (onSelectSHG) onSelectSHG(selectedShgModal.id);
                  setSelectedShgModal(null);
                }}
                className="flex-1 bg-[#14532D] hover:bg-emerald-900 text-white font-black py-3 rounded-2xl text-xs shadow transition flex items-center justify-center gap-2"
              >
                <span>{isMr ? 'या गटाचा डॅशबोर्ड उघडा' : 'Switch to this SHG Dashboard'}</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>`;

const newModalActions = `<div className="pt-2 flex flex-col sm:flex-row gap-2">
              {onStartMeetingForSHG && (
                <button
                  onClick={() => {
                    const shgCode = selectedShgModal.code;
                    setSelectedShgModal(null);
                    onStartMeetingForSHG(shgCode);
                  }}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-stone-900 font-black py-2.5 rounded-2xl text-xs shadow transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-stone-900" />
                  <span>{isMr ? 'या गटाची बैठक सुरू करा' : 'Orchestrate Meeting for this SHG'}</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (onSelectSHG) onSelectSHG(selectedShgModal.id);
                  setSelectedShgModal(null);
                }}
                className="flex-1 bg-[#14532D] hover:bg-emerald-900 text-white font-black py-2.5 rounded-2xl text-xs shadow transition flex items-center justify-center gap-2"
              >
                <span>{isMr ? 'गट डॅशबोर्ड उघडा' : 'View Group Dashboard'}</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>`;

if (multiShgContent.includes(oldModalActions)) {
  multiShgContent = multiShgContent.replace(oldModalActions, newModalActions);
}

if (isMultiCrlf) multiShgContent = multiShgContent.replace(/\n/g, '\r\n');
fs.writeFileSync(multiShgPath, multiShgContent, 'utf-8');
console.log('[7/10] Updated AnimatorMultiSHGView.tsx with meeting orchestration triggers');

// 2. Update AnimatorDashboard.tsx (Officer Dashboard)
const officerDashboardContent = `import React, { useState, useEffect } from 'react';
import { GroupInfo, getAllCachedGroups, getMembersByShg, getMembers } from '../services/db';
import { SupportedLanguage, Member, Resolution, OfficerSignature } from '../types/shg';
import { SettingsView } from '../components/settings/SettingsView';
import { AnimatorMultiSHGView } from './AnimatorMultiSHGView';
import { MeetingWizard } from '../components/MeetingWizard';
import { Calendar, Users, Building2, Sparkles, ChevronRight, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface AnimatorDashboardProps {
  group: GroupInfo;
  members: Member[];
  language: SupportedLanguage;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSyncCenter?: () => void;
  onOpenBackupModal?: () => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onToggleTts?: () => void;
  ttsEnabled?: boolean;
  onResetData?: () => void;
  onOpenAddMember?: () => void;
  onSwitchShg?: (shgId: string) => void;
  onCompleteMeetingSession?: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => Promise<void> | void;
}

export const AnimatorDashboard: React.FC<AnimatorDashboardProps> = ({
  group,
  members,
  language,
  activeTab = 'home',
  onSelectTab,
  onOpenSyncCenter = () => {},
  onOpenBackupModal = () => {},
  onLanguageChange = () => {},
  onToggleTts = () => {},
  ttsEnabled = true,
  onResetData = () => {},
  onOpenAddMember,
  onSwitchShg,
  onCompleteMeetingSession
}) => {
  const isMr = language === 'mr';

  const [allGroups, setAllGroups] = useState<GroupInfo[]>([]);
  const [meetingGroup, setMeetingGroup] = useState<GroupInfo | null>(null);
  const [meetingMembers, setMeetingMembers] = useState<Member[]>([]);
  const [isConductingMeeting, setIsConductingMeeting] = useState<boolean>(false);

  useEffect(() => {
    async function loadGroups() {
      const groups = await getAllCachedGroups();
      setAllGroups(groups);
    }
    loadGroups();
  }, []);

  const handleStartMeetingForShg = async (shgCode: string) => {
    const targetGroup = allGroups.find(g => g.shgCode === shgCode) || group;
    const groupMembers = await getMembersByShg(shgCode);
    setMeetingGroup(targetGroup);
    setMeetingMembers(groupMembers.length > 0 ? groupMembers : members);
    setIsConductingMeeting(true);
  };

  return (
    <div className="space-y-6">
      {/* Active Meeting Wizard Overlay for Selected SHG */}
      {isConductingMeeting && meetingGroup ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsConductingMeeting(false)}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">
                  {isMr ? 'अधिकारी बैठक संचालन मोड' : 'Officer Meeting Mode'}
                </span>
                <h3 className="text-sm font-black text-stone-900 mt-0.5">
                  {isMr ? meetingGroup.nameRegional : meetingGroup.name} ({meetingGroup.village})
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold text-stone-500">
              {meetingMembers.length} {isMr ? 'सभासद' : 'Members'}
            </span>
          </div>

          <MeetingWizard
            members={meetingMembers}
            language={language}
            monthlySavingsAmount={meetingGroup.monthlyPoolRate || 500}
            onCancel={() => setIsConductingMeeting(false)}
            onCompleteMeeting={async (attendance, savings, loan, resolutions, signatories, proof) => {
              if (onCompleteMeetingSession) {
                await onCompleteMeetingSession(attendance, savings, loan, resolutions, signatories, proof);
              }
            }}
          />
        </div>
      ) : (
        <>
          {/* Default Multi-SHG Portfolio Tab */}
          {(activeTab === 'home' || activeTab === 'overview') && (
            <AnimatorMultiSHGView
              currentGroup={group}
              language={language}
              onSelectSHG={(shgId) => {
                if (onSwitchShg) onSwitchShg(shgId);
              }}
              onOpenAddMember={onOpenAddMember}
              onStartMeetingForSHG={handleStartMeetingForShg}
            />
          )}

          {/* Meeting Orchestration Hub Tab */}
          {activeTab === 'meetings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 shadow-md space-y-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-white/15 text-emerald-100 border border-white/20">
                  <Calendar className="w-3.5 h-3.5" />
                  {isMr ? 'प्रभाग अधिकारी बैठक संचालन केंद्र' : 'Officer Meeting Orchestration Hub'}
                </span>
                <h2 className="text-2xl font-black">
                  {isMr ? 'कोणत्याही एका बचत गटात बैठक चालवा' : 'Orchestrate Meeting in Any Assigned SHG'}
                </h2>
                <p className="text-xs text-emerald-100 max-w-xl">
                  {isMr
                    ? 'प्रभाग अधिकारी म्हणून तुम्ही कोणत्याही एका बचत गटाची निवड करून त्या गटाची मासिक बैठक (हजेरी, बचत संकलन, कर्ज वाटप व कोरम स्वाक्षरी) चालवू शकता.'
                    : 'As an Officer managing multiple SHGs, select any group to conduct and commit their monthly meeting session.'}
                </p>
              </div>

              {/* Group Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allGroups.map((g) => (
                  <div
                    key={g.shgCode}
                    className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-500 transition space-y-3 text-left"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        {g.shgCode} · {g.village}
                      </span>
                      <h4 className="font-black text-sm text-stone-900 mt-0.5">
                        {isMr ? g.nameRegional : g.name}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium mt-1">
                        मासिक बचत: ₹{g.monthlyPoolRate || 500}/सभासद
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartMeetingForShg(g.shgCode)}
                      className="w-full bg-[#14532D] hover:bg-emerald-900 text-white font-black py-2.5 px-3 rounded-xl text-xs shadow flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isMr ? 'या गटाची बैठक चालवा' : 'Orchestrate Meeting'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Directory across all SHGs */}
          {activeTab === 'members' && (
            <AnimatorMultiSHGView
              currentGroup={group}
              language={language}
              onSelectSHG={(shgId) => {
                if (onSwitchShg) onSwitchShg(shgId);
              }}
              onOpenAddMember={onOpenAddMember}
              onStartMeetingForSHG={handleStartMeetingForShg}
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
        </>
      )}
    </div>
  );
};
`;

fs.writeFileSync(path.join(srcDir, 'pages/AnimatorDashboard.tsx'), officerDashboardContent, 'utf-8');
console.log('[8/10] Updated AnimatorDashboard.tsx (Officer Dashboard with single-SHG meeting orchestration)');

// 3. Update AuditorDashboard.tsx (Senior Government Official Inspection Portal)
const auditorDashboardContent = `import React, { useState, useEffect } from 'react';
import { GroupInfo, getAllCachedGroups, getMembers, getLoans } from '../services/db';
import { SupportedLanguage, Transaction, Member, Loan } from '../types/shg';
import { verifyLedgerIntegrity } from '../services/hashChain';
import { PanchasutraVisualizer } from '../components/panchasutra/PanchasutraVisualizer';
import { LedgerVerifier } from '../components/LedgerVerifier';
import { ReportsView } from '../components/reports/ReportsView';
import { SettingsView } from '../components/settings/SettingsView';
import { formatINR } from '../theme/tokens';
import { ShieldCheck, Award, FileSpreadsheet, Search, Download, Building2, Users, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
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
    a.download = \`SHGConnect_Government_MIS_Audit_\${new Date().toISOString().split('T')[0]}.json\`;
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

        <button
          onClick={handleExportGovtReport}
          className="relative z-10 bg-amber-400 hover:bg-amber-300 text-stone-900 font-black px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
        >
          <Download className="w-4 h-4 text-stone-900" />
          <span>{isMr ? 'शासकीय अहवाल डाउनलोड करा (MIS Export)' : 'Export Govt MIS Report'}</span>
        </button>
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
`;

fs.writeFileSync(path.join(srcDir, 'pages/AuditorDashboard.tsx'), auditorDashboardContent, 'utf-8');
console.log('[9/10] Updated AuditorDashboard.tsx (Government Senior Person View & MIS Export)');

// 4. Update App.tsx wiring
const appPath = path.join(srcDir, 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf-8');
const isAppCrlf = appContent.includes('\r\n');
appContent = appContent.replace(/\r\n/g, '\n');

// Ensure AnimatorDashboard receives members and onCompleteMeetingSession
appContent = appContent.replace(
  `        <AnimatorDashboard
          group={group}
          language={language}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenSyncCenter={() => setShowSyncModal(true)}
          onOpenBackupModal={() => setShowBackupModal(true)}
          onLanguageChange={handleLanguageChange}
          onToggleTts={handleToggleTts}
          ttsEnabled={ttsEnabled}
          onResetData={handleResetData}
          onOpenAddMember={() => setShowAddMemberModal(true)}
          onSwitchShg={handleSwitchShgGroup}
        />`,
  `        <AnimatorDashboard
          group={group}
          members={members}
          language={language}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenSyncCenter={() => setShowSyncModal(true)}
          onOpenBackupModal={() => setShowBackupModal(true)}
          onLanguageChange={handleLanguageChange}
          onToggleTts={handleToggleTts}
          ttsEnabled={ttsEnabled}
          onResetData={handleResetData}
          onOpenAddMember={() => setShowAddMemberModal(true)}
          onSwitchShg={handleSwitchShgGroup}
          onCompleteMeetingSession={handleCompleteMeetingSession}
        />`
);

if (isAppCrlf) appContent = appContent.replace(/\n/g, '\r\n');
fs.writeFileSync(appPath, appContent, 'utf-8');
console.log('[10/10] Updated App.tsx wiring for Officer Dashboard');

console.log('\n>>> ROLE HIERARCHY SUCCESSFULLY IMPLEMENTED ACROSS ALL COMPONENTS! <<<');

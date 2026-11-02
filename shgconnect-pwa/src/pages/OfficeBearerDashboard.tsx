import React, { useState, useEffect } from 'react';
import { Member, Transaction, SupportedLanguage, Loan, Meeting, Resolution, PaymentMode, SettlementStatus, OfficerSignature } from '../types/shg';
import { CentralSavingsModal } from '../components/office/CentralSavingsModal';
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
import { getMembershipRequests, updateMembershipRequestStatus, saveMembers } from '../services/db';
import { MembershipRequest } from '../types/shg';
import { sound } from '../services/sound';
import { tts } from '../services/tts';
import { verifyLedgerIntegrity } from '../services/hashChain';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Bell, Users, User, HandCoins, Sparkles, FileText, Award, Calendar, Landmark, Check, Banknote, Radio, UserPlus, ShieldCheck, MapPin } from 'lucide-react';
import { LeadLiveMeeting } from '../components/meeting/LeadLiveMeeting';
import { LiveMeetingRoom } from '../services/liveMeeting';

interface OfficeBearerDashboardProps {
  onSwitchToPersonalSavings?: () => void;
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
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => Promise<void> | void;
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
  onOpenScheduleMeeting?: () => void;
  onMemberAdded?: (newMember: Member) => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onRecordTransaction?: (
    memberId: string,
    amount: number,
    type: 'SAVINGS' | 'EMI_REPAYMENT' | 'LOAN_DISBURSAL',
    notes?: string,
    paymentMode?: PaymentMode,
    settlementStatus?: SettlementStatus,
    utrReference?: string,
    signatories?: OfficerSignature[]
  ) => void;
}

export const OfficeBearerDashboard: React.FC<OfficeBearerDashboardProps> = ({
  onSwitchToPersonalSavings,
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
  onOpenAddMember,
  onOpenScheduleMeeting,
  onMemberAdded,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onRecordTransaction
}) => {
  const t = translations[language] || translations.en;
    const [pendingRequests, setPendingRequests] = useState<MembershipRequest[]>([]);

  const loadRequests = () => {
    const all = getMembershipRequests();
    setPendingRequests(all.filter(r => r.status === 'PENDING' && r.shgId === group.shgCode));
  };

  useEffect(() => {
    loadRequests();
  }, [group.shgCode]);

  const handleApproveRequest = async (req: MembershipRequest) => {
    sound.playStampSound();
    updateMembershipRequestStatus(req.id, 'APPROVED');

    const avatarColors = ['bg-amber-500', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600'];
    const newMember: Member = {
      id: 'mem-' + Date.now(),
      shgId: group.shgCode,
      name: req.name,
      nameRegional: req.name,
      phone: req.phone,
      role: 'MEMBER',
      totalSavings: 0,
      activeLoanBalance: 0,
      trustScore: 90,
      occupation: req.occupation,
      joinedDate: new Date().toISOString().split('T')[0],
      avatarColor: avatarColors[members.length % avatarColors.length],
      entityVersion: 1
    };

    const updatedMembers = [...members, newMember];
    await saveMembers(updatedMembers);
    if (onMemberAdded) {
      onMemberAdded(newMember);
    }
    loadRequests();
    tts.speak(language === 'mr' ? req.name + ' यांना बचत गटात समाविष्ट करण्यात आले आहे.' : req.name + ' has been approved into the SHG.');
  };

  const handleRejectRequest = (reqId: string) => {
    updateMembershipRequestStatus(reqId, 'REJECTED');
    loadRequests();
  };

  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [showLiveMeeting, setShowLiveMeeting] = useState<boolean>(false);
  const [showSavingsModal, setShowSavingsModal] = useState<boolean>(false);
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

    const renderPendingRequestsCard = () => {
    if (pendingRequests.length === 0) return null;
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 sm:p-5 shadow-sm space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-amber-950">
                {language === 'mr' ? 'नवीन सदस्य सामील होण्याच्या विनंत्या' : 'Pending Membership Requests'}
              </h3>
              <p className="text-xs text-amber-800 font-medium">
                {language === 'mr' ? pendingRequests.length + ' अर्जदारांनी बचत गटात सामील होण्याची विनंती केली आहे.' : pendingRequests.length + ' applicant(s) waiting for officer approval.'}
              </p>
            </div>
          </div>
          <Badge variant="warning">{pendingRequests.length} Pending</Badge>
        </div>

        <div className="divide-y divide-amber-200">
          {pendingRequests.map(req => (
            <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900">{req.name}</span>
                  <span className="text-xs font-mono font-semibold text-stone-600 bg-amber-100 px-2 py-0.5 rounded">
                    +91 {req.phone}
                  </span>
                </div>
                <div className="text-xs text-stone-600">
                  {language === 'mr' ? 'व्यवसाय: ' : 'Occupation: '}
                  <span className="font-medium text-stone-800">{req.occupation || '—'}</span>
                  <span className="mx-2 opacity-40">·</span>
                  <span className="text-[11px] text-stone-500">{new Date(req.requestedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleRejectRequest(req.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition active:scale-95"
                >
                  {language === 'mr' ? 'नाकारा (Reject)' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveRequest(req)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition active:scale-95 shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /><span>{language === 'mr' ? 'मंजूर करा' : 'Approve'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleNavigate = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  if (showLiveMeeting) {
    return (
      <LeadLiveMeeting
        shgId={group.shgCode}
        shgName={language === 'mr' ? group.nameRegional : group.name}
        leadId="officer-1"
        leadName={language === 'mr' ? 'कमलताई पाटील' : 'Kamalai Patil'}
        knownMembers={members}
        language={language}
        onComplete={(completedRoom: LiveMeetingRoom) => {
          setShowLiveMeeting(false);
          tts.speak(language === 'mr' ? 'बैठक पूर्ण झाली' : 'Meeting completed successfully');
        }}
        onCancel={() => setShowLiveMeeting(false)}
      />
    );
  }

    if (showWizard) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <MeetingWizard
          members={members}
          groupName={language === 'mr' ? group.nameRegional : group.name}
          language={language}
          monthlySavingsAmount={group.monthlyPoolRate || 500}
          onCancel={() => setShowWizard(false)}
          onCompleteMeeting={async (attendance, savings, loan, resolutions, signatories, proof) => {
            await onCompleteMeetingSession(attendance, savings, loan, resolutions, signatories, proof);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
            {/* ── Pending Membership Requests Alert Banner ── */}
      {unreadNotificationsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-sm text-amber-950">
                {language === 'mr'
                  ? `${unreadNotificationsCount} नवीन सभासद नोंदणी विनंती प्रलंबित आहे!`
                  : `${unreadNotificationsCount} New Membership Applications Pending!`}
              </h3>
              <p className="text-xs text-amber-800 font-medium">
                {language === 'mr'
                  ? 'नवीन सदस्यांची माहिती तपासा आणि बचत गटात समाविष्ट करण्यासाठी त्वरित मंजुरी द्या.'
                  : 'Review applicant credentials and approve entry into this SHG.'}
              </p>
            </div>
          </div>
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 shrink-0 cursor-pointer"
            >
              {language === 'mr' ? 'तपासा व मंजूर करा' : 'Review & Approve'}
            </button>
          )}
        </div>
      )}

      {/* ── Group Hero Banner: Strictly SHG Name, Location, Offline Meet, Live Meet, and Schedule ── */}
      <div
        className="rounded-lg p-4 sm:p-5 relative overflow-hidden text-white shadow-sm border border-emerald-600/30"
        style={{ background: 'linear-gradient(135deg, #1A6B4A 0%, #14532D 60%, #0F4230 100%)' }}
      >
        <div className="relative z-10 space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            {language === 'mr' ? group.nameRegional : group.name}
          </h1>
          <p className="text-xs text-emerald-100 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>{group.village}, {group.district}</span>
          </p>
        </div>

        {/* ── 3 Action Buttons: Offline Meet, Online Meet, Schedule (Never Cuts Out) ── */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4 pt-3.5 border-t border-white/15 relative z-10">
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-lg bg-white text-emerald-950 font-black text-xs shadow-xs hover:bg-emerald-50 active:scale-[0.98] transition cursor-pointer min-h-[50px] sm:min-h-[42px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-[11px] sm:text-xs font-black leading-tight text-center">
              {language === 'mr' ? 'ऑफलाईन' : 'Offline'}
              <span className="block sm:inline sm:ml-1 text-[9.5px] sm:text-xs font-semibold sm:font-black opacity-85 sm:opacity-100">
                {language === 'mr' ? 'बैठक' : 'Meet'}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowLiveMeeting(true)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs active:scale-[0.98] transition cursor-pointer min-h-[50px] sm:min-h-[42px]"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold leading-tight text-center">
              {language === 'mr' ? 'ऑनलाईन' : 'Online'}
              <span className="block sm:inline sm:ml-1 text-[9.5px] sm:text-xs font-semibold sm:font-bold opacity-85 sm:opacity-100">
                {language === 'mr' ? 'बैठक' : 'Meet'}
              </span>
            </span>
          </button>

          {onOpenScheduleMeeting && (
            <button
              type="button"
              onClick={onOpenScheduleMeeting}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs active:scale-[0.98] transition cursor-pointer min-h-[50px] sm:min-h-[42px]"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold leading-tight text-center">
                {language === 'mr' ? 'नियोजन' : 'Schedule'}
                <span className="block sm:inline sm:ml-1 text-[9.5px] sm:text-xs font-semibold sm:font-bold opacity-85 sm:opacity-100">
                  {language === 'mr' ? 'बैठक' : ''}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Tab Body */}
      <>
          {/* Dynamic Tab Body */}
          {(activeTab === 'home' || activeTab === 'overview') && (
            <div className="space-y-3.5">
              {renderPendingRequestsCard()}

              {/* ── 3 Stat Cards in 3-Columns: Subtle Themed Colors & High Contrast ── */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {/* Total Savings: Emerald / Mint Theme */}
                <div className="rounded-lg p-3 sm:p-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 border border-emerald-300/80 shadow-2xs text-left">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-800">
                      <Banknote className="w-3 h-3" />
                    </div>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-800 truncate">
                      {language === 'mr' ? 'एकूण बचत' : 'Savings'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-xl font-black amount-display text-[#0F4230]">
                    {formatINR(totalGroupSavings)}
                  </div>
                  <p className="text-[9.5px] font-semibold mt-0.5 text-emerald-700/80 truncate">
                    ₹{group.monthlyPoolRate || 300}/सदस्य
                  </p>
                </div>

                {/* Active Loans: Warm Amber / Saffron Theme */}
                <div className="rounded-lg p-3 sm:p-4 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 border border-amber-300/80 shadow-2xs text-left">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-amber-100 text-amber-800">
                      <HandCoins className="w-3 h-3" />
                    </div>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-800 truncate">
                      {language === 'mr' ? 'कर्ज शिल्लक' : 'Loan Due'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-xl font-black amount-display text-amber-950">
                    {formatINR(totalActiveLoansAmount)}
                  </div>
                  <p className="text-[9.5px] font-semibold mt-0.5 text-amber-700/80 truncate">
                    {loans.length} {language === 'mr' ? 'खाती' : 'loans'}
                  </p>
                </div>

                {/* Panchasutra Score: Soft Indigo / Sky Theme */}
                <div className="rounded-lg p-3 sm:p-4 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 border border-indigo-200/90 shadow-2xs text-left">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-800">
                      <Award className="w-3 h-3" />
                    </div>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-800 truncate">
                      {language === 'mr' ? 'पंचसूत्र' : 'Score'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-xl font-black text-indigo-950">
                    {mockPanchasutraScore.totalScore}/100
                  </div>
                  <p className="text-[9.5px] font-bold mt-0.5 text-indigo-700 truncate">
                    {mockPanchasutraScore.bankGrade}
                  </p>
                </div>
              </div>

              {/* ── Group Management (Spacious 2x2 on mobile, 4 on desktop) ── */}
              <div className="bg-gradient-to-b from-white to-stone-50/30 rounded-lg p-3.5 sm:p-4 border border-stone-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    {language === 'mr' ? 'गट व्यवस्थापन' : 'Group Management'}
                  </span>
                  {onOpenAddMember && (
                    <button
                      type="button"
                      onClick={onOpenAddMember}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition active:scale-95 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'mr' ? '+ नवीन सदस्य' : '+ Add Member'}</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: 'members',
                      titleEn: 'Members',
                      titleMr: 'सदस्य',
                      subEn: `${members.length} Active`,
                      subMr: `${members.length} सभासद`,
                      icon: Users,
                      badgeBg: 'bg-emerald-100 text-emerald-800',
                      cardBg: 'bg-emerald-50/40 hover:bg-emerald-100/60 border-emerald-200/70',
                    },
                    {
                      id: 'loans',
                      titleEn: 'Loans',
                      titleMr: 'कर्जे',
                      subEn: `${loans.length} Accounts`,
                      subMr: `${loans.length} खाती`,
                      icon: Landmark,
                      badgeBg: 'bg-amber-100 text-amber-800',
                      cardBg: 'bg-amber-50/40 hover:bg-amber-100/60 border-amber-200/70',
                    },
                    {
                      id: 'panchasutra',
                      titleEn: 'Panchasutra',
                      titleMr: 'पंचसूत्र',
                      subEn: `${mockPanchasutraScore.totalScore}/100`,
                      subMr: `${mockPanchasutraScore.totalScore}/100`,
                      icon: Award,
                      badgeBg: 'bg-indigo-100 text-indigo-800',
                      cardBg: 'bg-indigo-50/40 hover:bg-indigo-100/60 border-indigo-200/70',
                    },
                    {
                      id: 'resolutions',
                      titleEn: 'Register',
                      titleMr: 'नोंदवही',
                      subEn: `${meetings.length} Recorded`,
                      subMr: `${meetings.length} बैठका`,
                      icon: FileText,
                      badgeBg: 'bg-purple-100 text-purple-800',
                      cardBg: 'bg-purple-50/40 hover:bg-purple-100/60 border-purple-200/70',
                    },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border transition text-left cursor-pointer group active:scale-[0.98] ${item.cardBg}`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.badgeBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-stone-800 leading-tight">
                            {language === 'mr' ? item.titleMr : item.titleEn}
                          </div>
                          <div className="text-[10px] font-semibold text-stone-500 leading-tight mt-0.5">
                            {language === 'mr' ? item.subMr : item.subEn}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ledger integrity note (plain language) */}
              <div className={`rounded-lg px-3.5 py-2.5 flex items-center gap-2 border text-xs font-semibold ${isChainValid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
                <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${isChainValid ? 'text-emerald-700' : 'text-amber-700'}`} />
                <p className="text-[11px] truncate">
                  {isChainValid
                    ? (language === 'mr' ? 'लेजर सुरक्षित आहे — सर्व नोंदी अखंड आहेत.' : 'Ledger is secure — all records are intact.')
                    : (language === 'mr' ? 'लेजरमध्ये त्रुटी आढळली — कृपया तपासा.' : 'Ledger issue detected — please review.')}
                </p>
              </div>

            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-3.5">
              {renderPendingRequestsCard()}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-700 text-white shadow-2xs">
                    <Users className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-stone-900">
                      {language === 'mr' ? `सदस्य यादी (${members.length})` : `SHG Member Directory (${members.length})`}
                    </h2>
                    <p className="text-[11px] text-stone-500 font-medium">
                      {language === 'mr' ? 'तपशील पाहण्यासाठी सदस्याच्या नावावर टॅप करा' : 'Tap on any member to view full dossier'}
                    </p>
                  </div>
                </div>
                {onOpenAddMember && (
                  <button
                    onClick={onOpenAddMember}
                    className="bg-[#14532D] hover:bg-emerald-900 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-xs flex items-center space-x-1 transition active:scale-95 cursor-pointer"
                  >
                    <span>+</span>
                    <span>{language === 'mr' ? 'नवीन सदस्य' : 'Add Member'}</span>
                  </button>
                )}
              </div>

              {/* Compact Member Rows (Grid of 2 on tablet/desktop, 1 on mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map((m, idx) => {
                  const avatarColors = ['#1A6B4A', '#1D5FA8', '#B45309', '#6D28D9', '#BE185D', '#047857'];
                  const avatarColor = avatarColors[idx % avatarColors.length];
                  const roleLabel = m.role === 'OFFICE_BEARER'
                    ? (language === 'mr' ? 'अध्यक्ष/पदाधिकारी' : 'Office Bearer')
                    : (language === 'mr' ? 'सदस्य' : 'Member');
                  const isOfficer = m.role === 'OFFICE_BEARER';

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedDossierMember(m)}
                      className="bg-white hover:bg-emerald-50/40 p-2.5 sm:p-3 rounded-lg border border-stone-200/90 hover:border-emerald-300 shadow-2xs flex items-center justify-between gap-2.5 transition active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                          style={{ background: avatarColor }}
                        >
                          {(language === 'mr' ? m.nameRegional : m.name).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                            {language === 'mr' ? m.nameRegional : m.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isOfficer ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {roleLabel}
                            </span>
                            <span className="text-[10px] text-stone-500 font-semibold">
                              {m.trustScore}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-black text-emerald-800 amount-display">
                          {formatINR(m.totalSavings)}
                        </div>
                        <span className="text-[9.5px] text-stone-600 font-medium block">
                          {language === 'mr' ? 'एकूण बचत' : 'Savings'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="space-y-4">
              {/* Header with Outstanding Summary */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-50 via-white to-orange-50/50 p-4 rounded-lg border border-amber-200/80 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-600 text-white shadow-2xs">
                    <Landmark className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-stone-900">
                      {language === 'mr' ? `गटातील कर्जे (${loans.length})` : `Active Group Loans (${loans.length})`}
                    </h2>
                    <p className="text-xs text-stone-500 font-medium">
                      {language === 'mr' ? 'व्याज दर: १.५% / महिना (शेकडा दीड रुपये)' : 'Interest Rate: 1.5% / month (Reducing)'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    {language === 'mr' ? 'एकूण थकीत बाकी' : 'Total Outstanding'}
                  </span>
                  <div className="text-base sm:text-xl font-black text-rose-700 amount-display">
                    {formatINR(totalActiveLoansAmount)}
                  </div>
                </div>
              </div>

              {/* Pending Loan Requests (if any) */}
              {loans.filter(l => l.status === 'REQUESTED').length > 0 && (
                <div className="bg-gradient-to-br from-amber-100/70 via-amber-50 to-orange-50 border-2 border-amber-400 rounded-lg p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs">
                        !
                      </span>
                      <h3 className="font-black text-sm text-amber-950">
                        {language === 'mr' ? 'प्रलंबित कर्ज अर्ज' : 'Pending Loan Requests'} ({loans.filter(l => l.status === 'REQUESTED').length})
                      </h3>
                    </div>
                    <Badge variant="warning">{loans.filter(l => l.status === 'REQUESTED').length} Pending</Badge>
                  </div>

                  <div className="space-y-2">
                    {loans.filter(l => l.status === 'REQUESTED').map(pl => (
                      <div key={pl.id} className="bg-white rounded-lg p-3 border border-amber-300 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-sm text-stone-900">{pl.memberName}</div>
                          <div className="text-xs text-stone-600 mt-0.5">
                            {language === 'mr' ? 'मागितलेले कर्ज:' : 'Requested:'} <span className="font-black text-amber-900">{formatINR(pl.principal)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowWizard(true)}
                          className="px-3 py-1.5 rounded-lg bg-[#14532D] hover:bg-emerald-900 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          {language === 'mr' ? 'बैठकीत मंजूर करा' : 'Approve in Meeting'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual High-Contrast Loan Cards */}
              <div className="space-y-3">
                {loans.filter(l => l.status !== 'REQUESTED').map(l => {
                  const repaidAmt = Math.max(0, l.principal - l.remainingBalance);
                  const repaidPercent = Math.min(100, Math.round((repaidAmt / (l.principal || 1)) * 100));

                  return (
                    <div
                      key={l.id}
                      className="rounded-lg bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 border-2 border-amber-300/90 p-4 sm:p-5 shadow-2xs hover:border-amber-400 hover:shadow-xs transition space-y-3"
                    >
                      {/* Top Row: Borrower Info + Outstanding Amount */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-sm sm:text-base text-stone-950">
                              {l.memberName}
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 border border-amber-200/90 px-2 py-0.5 rounded">
                              #{l.id.replace('loan-', '')}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 font-medium mt-0.5">
                            {language === 'mr' ? 'वाटप दिनांक:' : 'Disbursed:'} {l.dateDisbursed}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base sm:text-xl font-black text-rose-700 amount-display">
                            {formatINR(l.remainingBalance)}
                          </div>
                          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                            {language === 'mr' ? 'बाकी रक्कम' : 'Remaining Due'}
                          </span>
                        </div>
                      </div>

                      {/* Repayment Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-stone-600">
                          <span>
                            {language === 'mr' ? 'परतफेड:' : 'Repaid:'} <strong className="text-emerald-800">{formatINR(repaidAmt)}</strong> ({repaidPercent}%)
                          </span>
                          <span>
                            {language === 'mr' ? 'एकूण मुद्दल:' : 'Principal:'} {formatINR(l.principal)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-300"
                            style={{ width: `${repaidPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* High Contrast Key-Value Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                        <div className="bg-white/85 p-2 rounded-lg border border-amber-200/60">
                          <span className="text-[10px] font-bold text-stone-500 uppercase block">
                            {language === 'mr' ? 'मूळ कर्ज' : 'Principal'}
                          </span>
                          <span className="font-black text-stone-900 text-xs sm:text-sm amount-display">
                            {formatINR(l.principal)}
                          </span>
                        </div>

                        <div className="bg-white/85 p-2 rounded-lg border border-amber-200/60">
                          <span className="text-[10px] font-bold text-stone-500 uppercase block">
                            {language === 'mr' ? 'मासिक व्याज' : 'Monthly Rate'}
                          </span>
                          <span className="font-black text-amber-900 text-xs sm:text-sm">
                            {l.interestRateMonthly || 1.5}% <span className="text-[10px] font-normal text-stone-500 hidden sm:inline">(१.५%)</span>
                          </span>
                        </div>

                        <div className="bg-white/85 p-2 rounded-lg border border-amber-200/60">
                          <span className="text-[10px] font-bold text-stone-500 uppercase block">
                            {language === 'mr' ? 'स्थिती' : 'Status'}
                          </span>
                          <span className="inline-block mt-0.5 font-black text-xs text-emerald-800">
                            <span className="inline-flex items-center gap-1">{l.status === 'ACTIVE' && <Check className="w-3 h-3 text-emerald-700" />}{language === 'mr' ? 'सक्रिय' : 'ACTIVE'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loans.length === 0 && (
                  <div className="bg-white rounded-lg p-8 text-center border border-stone-200 text-xs text-stone-500">
                    {language === 'mr' ? 'सध्या कोणतेही सक्रिय कर्ज नाही.' : 'No active loans in this group.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-teal-50/60 via-white to-sky-50/40 p-6 text-center space-y-3 rounded-lg border border-teal-200/80 shadow-2xs">
                <Calendar className="w-8 h-8 text-emerald-700 mx-auto" />
                <h3 className="font-black text-stone-900 text-base">Monthly Meeting Session Mode</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Guided 7-step meeting workflow covering attendance, officer PIN quorum, savings collection, internal loan disbursal, resolutions, and cash box reconciliation.
                </p>
                <Button variant="secondary" size="md" icon={<Sparkles className="w-4 h-4 text-amber-950" />} onClick={() => setShowWizard(true)}>
                  Launch Step-by-Step Meeting Wizard
                </Button>
              </div>
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

          {/* Central Savings Deposit Modal (Quorum Verified by Group Head) */}
          {showSavingsModal && (
            <CentralSavingsModal
              group={group}
              members={members}
              language={language}
              onClose={() => setShowSavingsModal(false)}
              onRecordTransaction={onRecordTransaction || (() => {})}
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
        </>
    </div>
  );
};

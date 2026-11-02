import React, { useState, useEffect } from 'react';
import { Member, Transaction, Loan, Meeting, Role, SupportedLanguage, Resolution, PaymentMode, SettlementStatus, OfficerSignature, MembershipRequest } from './types/shg';
import { seedInitialDataIfNeeded, GroupInfo, saveMembers, saveTransactions, saveLoans, saveMeetings, saveResolutions, saveGroupInfo, saveScheduledMeeting, resetToDemoData, queueMutation, setCurrentShgId, INITIAL_GROUP_INFO, getMembershipRequests, updateMembershipRequestStatus, updateShgLeadership } from './services/db';
import { INITIAL_RESOLUTIONS } from './components/ResolutionRegister';
import { computeBlockHash, generateCheckpointFingerprint } from './services/hashChain';
import { tts } from './services/tts';
import { sound } from './services/sound';
import { AppShell } from './components/layout/AppShell';
import { MemberDashboard } from './pages/MemberDashboard';
import { AnimatorDashboard } from './pages/AnimatorDashboard';
import { OfficeBearerDashboard } from './pages/OfficeBearerDashboard';
import { AuditorDashboard } from './pages/AuditorDashboard';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { SyncCenterModal } from './components/sync/SyncCenterModal';
import { AddMemberModal } from './components/member/AddMemberModal';
import { ScheduleMeetingModal } from './components/meeting/ScheduleMeetingModal';
import { LoginView } from './components/auth/LoginView';
import { NewUserRegistrationView } from './components/auth/NewUserRegistrationView';
import { NotificationsModal } from './components/common/NotificationsModal';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<Role>('MEMBER');
  // Privacy & Banking Security: Session is memory-only. Refreshing or reopening lands securely on Login screen.
  const [session, setSession] = useState<{ memberId: string; phone: string; role: Role; memberName?: string; shgId?: string } | null>(null);
  const [authPage, setAuthPage] = useState<'LOGIN' | 'NEW_USER'>('LOGIN');
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);

  // Core SHG Data State (declared early to prevent TDZ ReferenceError)
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>(INITIAL_RESOLUTIONS);

  const [activeTab, setActiveTab] = useState<string>('home');
  const [navStack, setNavStack] = useState<string[]>(['home']);
  const [language, setLanguage] = useState<SupportedLanguage>('mr');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState<boolean>(false);

  const handleLoginSuccess = async (newSession: { memberId: string; phone: string; role: Role; memberName?: string; shgId?: string }) => {
    if (newSession.shgId) {
      setCurrentShgId(newSession.shgId);
    }
    setSession(newSession);
    setCurrentRole(newSession.role);
    if (newSession.shgId) {
      await reloadAllData();
    }
    setActiveTab('home');
    setNavStack(['home']);
    window.history.pushState({ app: 'shgconnect', view: 'dashboard', tab: 'home' }, '', '#home');
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentRole('MEMBER');
    setActiveTab('home');
    setAuthPage('LOGIN');
    try {
      localStorage.removeItem('shg_auth_session_v1');
    } catch (e) {}
  };

  const refreshMembershipRequests = () => {
    setMembershipRequests(getMembershipRequests());
  };

  useEffect(() => {
    refreshMembershipRequests();
    const handleUpdate = () => refreshMembershipRequests();
    window.addEventListener('shg_requests_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('shg_requests_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [session, currentRole]);

  // Compute unread pending requests for the active role & group
  // Rule: Members (Tier 1) & Auditors (Tier 4) do NOT receive admitting new member notifications.
  // Only Tier 2 (Lead) & Tier 3 (Officer) receive notifications, and SPECIFICALLY ONLY for their SHG.
  // Once accepted, status becomes APPROVED and clears the notification for everyone.
  const unreadNotificationsCount = membershipRequests.filter(r => {
    if (r.status !== 'PENDING') return false;
    if (currentRole === 'MEMBER' || currentRole === 'AUDITOR') {
      return false; // Members and Auditors never receive admission requests
    }
    if (currentRole === 'OFFICE_BEARER' || currentRole === 'SHG_LEAD' || currentRole === 'OFFICER' || currentRole === 'ANIMATOR') {
      return r.shgId === group?.shgCode; // Specifically only requests for their SHG
    }
    return false;
  }).length;

  const handleApproveMembershipRequest = async (req: MembershipRequest) => {
    updateMembershipRequestStatus(req.id, 'APPROVED');
    const avatarColors = ['bg-amber-500', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600'];
    const newMember: Member = {
      id: 'mem-' + Date.now(),
      shgId: req.shgId || group?.shgCode || 'SHG-MH-SAT-2024-0089',
      name: req.name,
      nameRegional: req.nameRegional || req.name,
      phone: req.phone,
      role: 'MEMBER',
      totalSavings: 0,
      activeLoanBalance: 0,
      trustScore: 90,
      occupation: req.occupation || 'सभासद',
      joinedDate: new Date().toISOString().split('T')[0],
      avatarColor: avatarColors[members.length % avatarColors.length],
      entityVersion: 1
    };

    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    await saveMembers(updatedMembers);
    refreshMembershipRequests();
    sound.playCashDepositChime();
    tts.speak(
      language === 'mr'
        ? `${req.name} यांना बचत गटात समाविष्ट करण्यात आले आहे.`
        : `${req.name} has been approved into the SHG.`
    );
  };

  const handleRejectMembershipRequest = (reqId: string) => {
    updateMembershipRequestStatus(reqId, 'REJECTED');
    refreshMembershipRequests();
  };

  const handleSaveLeadership = async (
    shgCode: string,
    assignments: {
      presidentMemberId: string;
      treasurerMemberId: string;
      secretaryMemberId?: string;
    }
  ) => {
    const updatedAllMembers = await updateShgLeadership(shgCode, assignments);
    setMembers(updatedAllMembers);
    await reloadAllData();
  };

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    if (session) {
      setSession({ ...session, role });
    }
  };



  const reloadAllData = async () => {
    setLoading(true);
    const data = await seedInitialDataIfNeeded();
    setGroup(data.group);
    setMembers(data.members);
    setTransactions(data.transactions);
    setLoans(data.loans);
    setMeetings(data.meetings);
    setLoading(false);
  };

  useEffect(() => {
    // Clear any previous persistent session to ensure privacy on shared devices & page reloads
    try {
      localStorage.removeItem('shg_auth_session_v1');
    } catch (e) {}
    reloadAllData();

    // Prevent Android OS storage eviction on budget devices
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        if (granted) console.log('[Storage] Persistent storage granted by OS');
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const handleToggleTts = () => {
    const nextState = !ttsEnabled;
    setTtsEnabled(nextState);
    tts.setEnabled(nextState);
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    tts.setLanguage(lang);
  };

  const handleSelectTab = (tab: string) => {
    if (tab === 'sync') {
      setShowSyncModal(true);
      window.history.pushState({ app: 'shgconnect', view: 'modal', modal: 'sync' }, '', '#sync');
      return;
    }

    const primaryTabs = ['home', 'savings', 'loans', 'meetings', 'more', 'members', 'panchasutra', 'passbook', 'resolutions', 'reports', 'settings'];
    setNavStack(prev => {
      if (tab === 'home') {
        return ['home'];
      }
      return [...prev.filter(t => t !== tab), tab];
    });
    setActiveTab(tab);
    try {
      window.history.pushState({ app: 'shgconnect', view: 'tab', tab }, '', `#${tab}`);
    } catch (e) {}
  };

  const handleGoBack = () => {
    if (showSyncModal) {
      setShowSyncModal(false);
      return;
    }
    if (showAddMemberModal) {
      setShowAddMemberModal(false);
      return;
    }
    if (showBackupModal) {
      setShowBackupModal(false);
      return;
    }
    if (showConflictModal) {
      setShowConflictModal(false);
      return;
    }

    if (navStack.length > 1) {
      const newStack = navStack.slice(0, navStack.length - 1);
      const prevTab = newStack[newStack.length - 1] || 'home';
      setNavStack(newStack);
      setActiveTab(prevTab);
      window.history.pushState({ app: 'shgconnect', view: 'tab', tab: prevTab }, '', `#${prevTab}`);
    } else if (activeTab !== 'home') {
      setActiveTab('home');
      setNavStack(['home']);
      window.history.pushState({ app: 'shgconnect', view: 'tab', tab: 'home' }, '', '#home');
    }
  };

  // Safe PopState: Intercept Back button so it NEVER leaves the website abruptly!
  useEffect(() => {
    // Ensure baseline history state exists
    if (!window.history.state) {
      window.history.replaceState({ app: 'shgconnect', view: session ? 'dashboard' : 'login', tab: activeTab }, '', window.location.hash || '#');
    }

    const handlePopState = (e: PopStateEvent) => {
      // 1. If any modal is open, close the modal and stay inside app
      if (showSyncModal) {
        setShowSyncModal(false);
        window.history.pushState({ app: 'shgconnect', view: 'tab', tab: activeTab }, '', `#${activeTab}`);
        return;
      }
      if (showAddMemberModal) {
        setShowAddMemberModal(false);
        window.history.pushState({ app: 'shgconnect', view: 'tab', tab: activeTab }, '', `#${activeTab}`);
        return;
      }
      if (showBackupModal) {
        setShowBackupModal(false);
        window.history.pushState({ app: 'shgconnect', view: 'tab', tab: activeTab }, '', `#${activeTab}`);
        return;
      }
      if (showConflictModal) {
        setShowConflictModal(false);
        window.history.pushState({ app: 'shgconnect', view: 'tab', tab: activeTab }, '', `#${activeTab}`);
        return;
      }

      // 2. If inside a sub-tab (not 'home'), navigate back to 'home'
      if (activeTab !== 'home') {
        setActiveTab('home');
        setNavStack(['home']);
        window.history.pushState({ app: 'shgconnect', view: 'tab', tab: 'home' }, '', '#home');
        return;
      }

      // 3. If on 'home' and authenticated, log out to the login view instead of closing tab!
      if (session) {
        handleLogout();
        window.history.pushState({ app: 'shgconnect', view: 'login' }, '', '#login');
        return;
      }

      // 4. If already on login view, prevent exiting by holding current state
      window.history.pushState({ app: 'shgconnect', view: 'login' }, '', '#login');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, session, navStack, showSyncModal, showAddMemberModal, showBackupModal, showConflictModal]);

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'home': return language === 'mr' ? 'मुख्य पृष्ठ' : language === 'hi' ? 'मुख्य पृष्ठ' : 'Home';
      case 'savings': return language === 'mr' ? 'माझी बचत' : language === 'hi' ? 'मेरी बचत' : 'My Savings';
      case 'loans': return language === 'mr' ? 'माझे कर्ज' : language === 'hi' ? 'मेरा ऋण' : 'My Loans';
      case 'meetings': return language === 'mr' ? 'माझ्या बैठका' : language === 'hi' ? 'मेरी बैठकें' : 'My Meetings';
      case 'more': return language === 'mr' ? 'अधिक' : language === 'hi' ? 'अधिक' : 'More';
      case 'passbook': return language === 'mr' ? 'माझे पासबुक' : language === 'hi' ? 'मेरा पासबुक' : 'My Passbook';
      case 'calculator': return language === 'mr' ? 'बचत ध्येय' : language === 'hi' ? 'बचत लक्ष्य' : 'Savings Goal';
      case 'panchasutra': return 'SHG Operational Health';
      default: return language === 'mr' ? 'मागे' : 'Back';
    }
  };

  const parentTab = navStack.length > 1 ? navStack[navStack.length - 2] : 'home';
  const parentTabLabel = getTabLabel(parentTab);

  const handleAddResolution = (res: Omit<Resolution, 'id' | 'resolutionNumber'>) => {
    sound.playStampSound();
    const newRes: Resolution = {
      ...res,
      id: `res-${Date.now()}`,
      resolutionNumber: resolutions.length + 1
    };
    setResolutions(prev => [...prev, newRes]);
  };

  /**
   * Appends a new transaction block to the append-only SHA-256 hash-chain & IDB Queue
   */
  const handleRecordTransaction = async (
    memberId: string,
    amount: number,
    type: 'SAVINGS' | 'EMI_REPAYMENT' | 'LOAN_DISBURSAL',
    notes?: string,
    paymentMode?: PaymentMode,
    settlementStatus?: SettlementStatus,
    utrReference?: string,
    signatories?: OfficerSignature[]
  ) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    sound.playStampSound();
    const lastBlock = transactions[transactions.length - 1];
    const newIndex = transactions.length;
    const prevHash = lastBlock ? lastBlock.hash : "GENESIS_BLOCK_00000000000000000000000000000000";
    const timestamp = new Date().toISOString();

    const payload = `${member.id}:${member.name}:${type}:${amount}:${notes || ''}`;
    const hash = await computeBlockHash(newIndex, prevHash, timestamp, payload);
    const checkpointFingerprint = generateCheckpointFingerprint(hash);

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      index: newIndex,
      timestamp,
      memberId: member.id,
      memberName: member.name,
      type,
      amount,
      notes,
      paymentMode: paymentMode || 'CASH',
      settlementStatus: settlementStatus || (paymentMode === 'UPI_INTENT' ? 'SETTLED_DIGITAL_UTR' : 'SETTLED_CASH'),
      utrReference,
      signatories,
      prevHash,
      hash,
      checkpointFingerprint
    };

    const updatedTxs = [...transactions, newTx];
    setTransactions(updatedTxs);
    await saveTransactions(updatedTxs);

    // Record outbox mutation & audit trail entry
    await queueMutation({
      opId: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      shgId: group?.shgCode || 'SHG-MH-2024-884',
      actorId: member.id,
      actorRole: currentRole === 'ANIMATOR' ? 'ANIMATOR' : 'TREASURER',
      deviceId: 'dev-pwa-local',
      hlcTimestamp: `${timestamp}-0001`,
      type: type === 'SAVINGS' ? 'RECORD_SAVINGS' : type === 'LOAN_DISBURSAL' ? 'DISBURSE_LOAN' : 'REPAY_EMI',
      entityId: newTx.id,
      payload: { memberId, amount, type, notes, checkpointFingerprint, paymentMode, settlementStatus, utrReference }
    });

    // Update Member balances
    const updatedMembers = members.map(m => {
      if (m.id === memberId) {
        if (type === 'SAVINGS') {
          return { ...m, totalSavings: m.totalSavings + amount };
        } else if (type === 'EMI_REPAYMENT') {
          return { ...m, activeLoanBalance: Math.max(0, m.activeLoanBalance - amount) };
        } else if (type === 'LOAN_DISBURSAL') {
          return { ...m, activeLoanBalance: m.activeLoanBalance + amount };
        }
      }
      return m;
    });

    setMembers(updatedMembers);
    await saveMembers(updatedMembers);
  };

  /**
   * Registers a new SHG member into IndexedDB & outbox sync queue
   */
  const handleAddMember = async (data: {
    name: string;
    nameRegional: string;
    phone: string;
    role: Role;
    occupation?: string;
    initialSavings: number;
  }) => {
    const avatarColors = ['bg-amber-500', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600'];
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      shgId: group?.shgCode || 'SHG-MH-2024-884',
      name: data.name,
      nameRegional: data.nameRegional,
      phone: data.phone,
      role: data.role,
      totalSavings: data.initialSavings,
      activeLoanBalance: 0,
      trustScore: 90,
      occupation: data.occupation,
      joinedDate: new Date().toISOString().split('T')[0],
      avatarColor: avatarColors[members.length % avatarColors.length],
      entityVersion: 1
    };

    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    await saveMembers(updatedMembers);

    await queueMutation({
      opId: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      shgId: group?.shgCode || 'SHG-MH-2024-884',
      actorId: 'animator-1',
      actorRole: 'ANIMATOR',
      deviceId: 'dev-pwa-local',
      hlcTimestamp: `${new Date().toISOString()}-0001`,
      type: 'RECORD_SAVINGS',
      entityId: newMember.id,
      payload: { memberName: newMember.name, role: newMember.role, initialSavings: data.initialSavings }
    });

    if (data.initialSavings > 0) {
      await handleRecordTransaction(newMember.id, data.initialSavings, 'SAVINGS', 'Initial Savings Deposit');
    }
  };

  /**
   * Schedules a future meeting in advance for Tier 2 and Tier 3
   */
  const handleScheduleMeeting = async (meetingData: {
    date: string;
    time: string;
    venue: string;
    agenda: string;
  }) => {
    if (!group) return;
    const updated = await saveScheduledMeeting({
      shgId: group.shgCode,
      date: meetingData.date,
      time: meetingData.time,
      venue: meetingData.venue,
      agenda: meetingData.agenda,
      scheduledBy: session?.memberName || (currentRole === 'AUDITOR' ? 'प्रिया देशमुख (लेखापरीक्षक)' : 'गट प्रमुख')
    });
    if (updated) {
      setGroup(updated);
    }
  };

  /**
   * Complete a full Meeting Session (Attendance + Savings + Disbursals + Resolutions)
   */
  const handleCompleteMeetingSession = async (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => {
    let currentTxs = [...transactions];
    let currentMembers = [...members];
    const timestamp = new Date().toISOString();
    const activeShgCode = group?.shgCode || 'SHG-MH-SAT-2024-0089';

    // 1. Process each savings transaction in strict cryptographic sequence
    for (const item of savingsCollected) {
      if (item.amount <= 0) continue;
      const mem = currentMembers.find(m => m.id === item.memberId);
      if (!mem) continue;

      const newIndex = currentTxs.length;
      const lastBlock = currentTxs[currentTxs.length - 1];
      const prevHash = lastBlock ? lastBlock.hash : "GENESIS_BLOCK_00000000000000000000000000000000";
      const payload = `${mem.id}:${mem.name}:SAVINGS:${item.amount}:Monthly Savings Pool`;
      const hash = await computeBlockHash(newIndex, prevHash, timestamp, payload);
      const checkpointFingerprint = generateCheckpointFingerprint(hash);

      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        shgId: activeShgCode,
        index: newIndex,
        timestamp,
        memberId: mem.id,
        memberName: mem.name,
        type: 'SAVINGS',
        amount: item.amount,
        notes: 'Monthly Savings Pool',
        paymentMode: 'CASH',
        settlementStatus: 'SETTLED_CASH',
        signatories,
        signatureProof,
        prevHash,
        hash,
        checkpointFingerprint
      };
      currentTxs.push(newTx);

      currentMembers = currentMembers.map(m =>
        m.id === mem.id ? { ...m, totalSavings: (m.totalSavings || 0) + item.amount } : m
      );

      await queueMutation({
        opId: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        shgId: activeShgCode,
        actorId: 'animator-1',
        actorRole: 'ANIMATOR',
        deviceId: 'dev-pwa-local',
        hlcTimestamp: `${timestamp}-0001`,
        type: 'RECORD_SAVINGS',
        entityId: newTx.id,
        payload: { memberId: mem.id, amount: item.amount, checkpointFingerprint }
      });
    }

    // 2. Process micro-loan disbursal if any
    let updatedLoans = [...loans];
    if (loanDisbursed && loanDisbursed.amount > 0) {
      const borrower = currentMembers.find(m => m.id === loanDisbursed.memberId);
      if (borrower) {
        const newIndex = currentTxs.length;
        const lastBlock = currentTxs[currentTxs.length - 1];
        const prevHash = lastBlock ? lastBlock.hash : "GENESIS_BLOCK_00000000000000000000000000000000";
        const payload = `${borrower.id}:${borrower.name}:LOAN_DISBURSAL:${loanDisbursed.amount}:${loanDisbursed.notes || ''}`;
        const hash = await computeBlockHash(newIndex, prevHash, timestamp, payload);
        const checkpointFingerprint = generateCheckpointFingerprint(hash);

        const disbursalTx: Transaction = {
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          shgId: activeShgCode,
          index: newIndex,
          timestamp,
          memberId: borrower.id,
          memberName: borrower.name,
          type: 'LOAN_DISBURSAL',
          amount: loanDisbursed.amount,
          notes: loanDisbursed.notes || 'Micro-Loan Disbursal',
          paymentMode: 'CASH',
          settlementStatus: 'SETTLED_CASH',
          signatories,
          signatureProof,
          prevHash,
          hash,
          checkpointFingerprint
        };
        currentTxs.push(disbursalTx);

        currentMembers = currentMembers.map(m =>
          m.id === borrower.id ? { ...m, activeLoanBalance: (m.activeLoanBalance || 0) + loanDisbursed.amount } : m
        );

        const newLoan: Loan = {
          id: `loan-${Date.now()}`,
          shgId: activeShgCode,
          memberId: borrower.id,
          memberName: borrower.name,
          principal: loanDisbursed.amount,
          interestRateMonthly: 1.5,
          tenureMonths: 10,
          totalPaid: 0,
          remainingBalance: loanDisbursed.amount,
          status: 'ACTIVE',
          dateDisbursed: timestamp.split('T')[0],
          entityVersion: 1
        };
        updatedLoans.push(newLoan);

        await queueMutation({
          opId: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          shgId: activeShgCode,
          actorId: 'animator-1',
          actorRole: 'ANIMATOR',
          deviceId: 'dev-pwa-local',
          hlcTimestamp: `${timestamp}-0002`,
          type: 'DISBURSE_LOAN',
          entityId: newLoan.id,
          payload: { memberId: borrower.id, amount: loanDisbursed.amount }
        });
      }
    }

    // 3. Process resolutions if any
    let updatedResolutions = [...resolutions];
    if (newResolutions && newResolutions.length > 0) {
      newResolutions.forEach((r, idx) => {
        updatedResolutions.push({
          ...r,
          id: `res-${Date.now()}-${idx}`,
          resolutionNumber: updatedResolutions.length + 1
        });
      });
      setResolutions(updatedResolutions);
      await saveResolutions(updatedResolutions);
    }

    // 4. Save and commit meeting record
    const totalSav = savingsCollected.reduce((sum, s) => sum + s.amount, 0);
    const meetingFingerprint = `CHK-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newMeeting: Meeting = {
      id: `meet-${meetings.length + 1}`,
      date: timestamp.split('T')[0],
      meetingNumber: meetings.length + 1,
      totalSavingsCollected: totalSav,
      totalEmiCollected: 0,
      totalDisbursed: loanDisbursed ? loanDisbursed.amount : 0,
      attendanceRecord,
      signatories,
      checkpointFingerprint: meetingFingerprint
    };
    const updatedMeetings = [...meetings, newMeeting];

    // 5. Commit all updated states to IndexedDB atomically
    setTransactions(currentTxs);
    await saveTransactions(currentTxs);

    setMembers(currentMembers);
    await saveMembers(currentMembers);

    setLoans(updatedLoans);
    await saveLoans(updatedLoans);

    setMeetings(updatedMeetings);
    await saveMeetings(updatedMeetings);

    // 6. Update Group Fund
    if (group) {
      const updatedFund = group.totalGroupFund + totalSav - (loanDisbursed?.amount || 0);
      const updatedGroup = { ...group, totalGroupFund: updatedFund };
      setGroup(updatedGroup);
      await saveGroupInfo(updatedGroup);
    }

    // 7. Queue meeting mutation
    await queueMutation({
      opId: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      shgId: activeShgCode,
      actorId: 'animator-1',
      actorRole: 'ANIMATOR',
      deviceId: 'dev-pwa-local',
      hlcTimestamp: `${timestamp}-0003`,
      type: 'COMMIT_MEETING',
      entityId: newMeeting.id,
      payload: { meetingNumber: newMeeting.meetingNumber, totalSavingsCollected: totalSav, checkpointFingerprint: meetingFingerprint }
    });

    sound.playCashDepositChime();
    tts.speak(language === 'mr' ? 'बैठक सत्र यशस्वीरीत्या पूर्ण होऊन लेजरमध्ये जतन झाले.' : 'Meeting session committed to tamper-proof ledger successfully.');
  };

  /**
   * Intentionally corrupts a hash to demonstrate local cryptographic tamper detection live
   */
  const handleSimulateTamperAttack = async () => {
    if (transactions.length === 0) return;
    const corruptedTxs = transactions.map((tx, idx) => {
      if (idx === 1) { // Corrupt block #1
        return {
          ...tx,
          hash: 'CORRUPTED_HASH_ATTACK_999999999999999999999999999'
        };
      }
      return tx;
    });
    setTransactions(corruptedTxs);
    await saveTransactions(corruptedTxs);
  };

  const handleResetData = async () => {
    if (window.confirm("Reset offline database to initial demo state?")) {
      await resetToDemoData();
      await reloadAllData();
    }
  };

  const handleSwitchShgGroup = async (shgId: string) => {
    setCurrentShgId(shgId);
    await reloadAllData();
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-[#0F4C3A] flex items-center justify-center text-white font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <h2 className="text-lg font-black tracking-tight">SHGConnect PWA</h2>
            <p className="text-xs font-semibold text-emerald-200 mt-1">Initializing IndexedDB & Cryptographic Trust Engine...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    if (authPage === 'NEW_USER') {
      return (
        <NewUserRegistrationView
          language={language}
          onLanguageChange={handleLanguageChange}
          onBackToLogin={() => setAuthPage('LOGIN')}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    return (
      <LoginView
        members={members}
        language={language}
        onLanguageChange={handleLanguageChange}
        onLoginSuccess={handleLoginSuccess}
        onNavigateRegister={() => setAuthPage('NEW_USER')}
      />
    );
  }


  return (
    <AppShell
      userName={session?.memberName}
      currentRole={currentRole}
      onRoleChange={handleRoleChange}
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      language={language}
      onLanguageChange={handleLanguageChange}
      ttsEnabled={ttsEnabled}
      onToggleTts={handleToggleTts}
      onResetData={handleResetData}
      onOpenBackupModal={() => setShowBackupModal(true)}
      shgName={group.name}
      shgNameRegional={group.nameRegional}
      federation={group.federation || INITIAL_GROUP_INFO.federation}
      onSwitchShgGroup={handleSwitchShgGroup}
      onOpenConflictModal={() => setShowConflictModal(true)}
      onGoBack={handleGoBack}
      parentTabLabel={parentTabLabel}
      onLogout={handleLogout}
      unreadNotificationsCount={unreadNotificationsCount}
      onOpenNotifications={() => {
        refreshMembershipRequests();
        setShowNotificationsModal(true);
      }}
    >
      {currentRole === 'MEMBER' ? (
        <MemberDashboard
          group={group}
          members={members}
          transactions={transactions}
          loans={loans}
          meetings={meetings}
          language={language}
          onRecordTransaction={handleRecordTransaction}
          onVerifyBlockIndex={(idx) => setCurrentRole('ANIMATOR')}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenSyncCenter={() => setShowSyncModal(true)}
          onToggleTts={handleToggleTts}
          ttsEnabled={ttsEnabled}
          onLanguageChange={handleLanguageChange}
          onOpenBackupModal={() => setShowBackupModal(true)}
          onResetData={handleResetData}
          loggedInMemberId={session?.memberId}
        />
      ) : (currentRole === 'OFFICE_BEARER' || currentRole === 'SHG_LEAD') ? (
        <OfficeBearerDashboard
          group={group}
          members={members}
          transactions={transactions}
          loans={loans}
          meetings={meetings}
          resolutions={resolutions}
          language={language}
          onCompleteMeetingSession={handleCompleteMeetingSession}
          onAddResolution={handleAddResolution}
          onVerifyBlockIndex={(idx) => {}}
          onSimulateTamper={handleSimulateTamperAttack}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onToggleTts={handleToggleTts}
          ttsEnabled={ttsEnabled}
          onLanguageChange={handleLanguageChange}
          onOpenBackupModal={() => setShowBackupModal(true)}
          onOpenSyncCenter={() => setShowSyncModal(true)}
          onResetData={handleResetData}
          onOpenAddMember={() => setShowAddMemberModal(true)}
          onOpenScheduleMeeting={() => setShowScheduleMeetingModal(true)}
          onMemberAdded={(newMem) => setMembers(prev => [...prev, newMem])}
          onRecordTransaction={handleRecordTransaction}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => { refreshMembershipRequests(); setShowNotificationsModal(true); }}
        />
      ) : (currentRole === 'ANIMATOR' || currentRole === 'OFFICER') ? (
        <AnimatorDashboard
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
          onSaveLeadership={handleSaveLeadership}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => { refreshMembershipRequests(); setShowNotificationsModal(true); }}
        />
      ) : (
        <AuditorDashboard
          group={group}
          transactions={transactions}
          language={language}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onLanguageChange={handleLanguageChange}
          onToggleTts={handleToggleTts}
          ttsEnabled={ttsEnabled}
          onOpenAddMember={() => setShowAddMemberModal(true)}
          onOpenScheduleMeeting={() => setShowScheduleMeetingModal(true)}
          onSwitchShg={handleSwitchShgGroup}
        />
      )}

      {/* Add New Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          language={language}
          onClose={() => setShowAddMemberModal(false)}
          onAddMember={handleAddMember}
        />
      )}

      {/* Schedule Future Meeting in Advance Modal */}
      {showScheduleMeetingModal && group && (
        <ScheduleMeetingModal
          shgId={group.shgCode}
          shgName={language === 'mr' ? group.nameRegional : group.name}
          defaultVenue={group.nextMeeting?.venue || (language === 'mr' ? `${group.village} सभागृह` : `${group.village} Hall`)}
          language={language}
          onClose={() => setShowScheduleMeetingModal(false)}
          onSchedule={handleScheduleMeeting}
        />
      )}

      {/* Backup and Restore Modal */}
      {showBackupModal && (
        <BackupRestoreModal
          language={language}
          onClose={() => setShowBackupModal(false)}
          onRestored={reloadAllData}
        />
      )}

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
      />

      {/* Data Sync Center Modal */}
      <SyncCenterModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onOpenConflictModal={() => setShowConflictModal(true)}
      />

      {/* Notifications Desk Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        language={language}
        currentRole={currentRole}
        currentGroupCode={group?.shgCode || 'SHG-MH-SAT-2024-0089'}
        onApprove={handleApproveMembershipRequest}
        onReject={handleRejectMembershipRequest}
      />
    </AppShell>
  );
}



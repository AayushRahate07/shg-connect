import React, { useState, useEffect } from 'react';
import { Member, Transaction, Loan, Meeting, Role, SupportedLanguage, Resolution } from './types/shg';
import { seedInitialDataIfNeeded, GroupInfo, saveMembers, saveTransactions, saveLoans, saveMeetings, resetToDemoData, queueMutation, setCurrentShgId, INITIAL_GROUP_INFO } from './services/db';
import { INITIAL_RESOLUTIONS } from './components/ResolutionRegister';
import { computeBlockHash, generateCheckpointFingerprint } from './services/hashChain';
import { tts } from './services/tts';
import { sound } from './services/sound';
import { AppShell } from './components/layout/AppShell';
import { MemberDashboard } from './pages/MemberDashboard';
import { AnimatorDashboard } from './pages/AnimatorDashboard';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { SyncCenterModal } from './components/sync/SyncCenterModal';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<Role>('MEMBER');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [navStack, setNavStack] = useState<string[]>(['home']);
  const [language, setLanguage] = useState<SupportedLanguage>('mr');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);

  // App state
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>(INITIAL_RESOLUTIONS);

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
    reloadAllData();
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
      return;
    }

    const primaryTabs = ['home', 'savings', 'loans', 'meetings', 'more'];
    setNavStack(prev => {
      if (tab === 'home') {
        return ['home'];
      }
      if (primaryTabs.includes(tab)) {
        return ['home', tab];
      }
      return [...prev, tab];
    });
    setActiveTab(tab);
    try {
      window.history.pushState({ tab }, '', `#${tab}`);
    } catch (e) {
      // Browser history fallback
    }
  };

  const handleGoBack = () => {
    if (navStack.length > 1) {
      const newStack = navStack.slice(0, navStack.length - 1);
      const prevTab = newStack[newStack.length - 1];
      setNavStack(newStack);
      setActiveTab(prevTab);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (navStack.length > 1) {
        handleGoBack();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navStack]);

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
    notes?: string
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
      payload: { memberId, amount, type, notes, checkpointFingerprint }
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
   * Complete a full Meeting Session (Attendance + Savings + Disbursals + Resolutions)
   */
  const handleCompleteMeetingSession = async (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[]
  ) => {
    // Record savings transactions
    for (const item of savingsCollected) {
      await handleRecordTransaction(item.memberId, item.amount, 'SAVINGS', 'Monthly Savings Pool');
    }

    // Record loan disbursal if any
    if (loanDisbursed) {
      await handleRecordTransaction(loanDisbursed.memberId, loanDisbursed.amount, 'LOAN_DISBURSAL', loanDisbursed.notes);
      
      const borrower = members.find(m => m.id === loanDisbursed.memberId);
      if (borrower) {
        const newLoan: Loan = {
          id: `loan-${Date.now()}`,
          memberId: borrower.id,
          memberName: borrower.name,
          principal: loanDisbursed.amount,
          interestRateMonthly: 1.5,
          tenureMonths: 10,
          totalPaid: 0,
          remainingBalance: loanDisbursed.amount,
          status: 'ACTIVE',
          dateDisbursed: new Date().toISOString().split('T')[0],
          entityVersion: 1
        };
        const updatedLoans = [...loans, newLoan];
        setLoans(updatedLoans);
        await saveLoans(updatedLoans);
      }
    }

    // Record resolutions if any
    if (newResolutions && newResolutions.length > 0) {
      newResolutions.forEach(r => handleAddResolution(r));
    }

    // Record meeting metadata
    const totalSav = savingsCollected.reduce((sum, s) => sum + s.amount, 0);
    const meetingFingerprint = `CHK-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newMeeting: Meeting = {
      id: `meet-${meetings.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      meetingNumber: meetings.length + 1,
      totalSavingsCollected: totalSav,
      totalEmiCollected: 0,
      totalDisbursed: loanDisbursed ? loanDisbursed.amount : 0,
      attendanceRecord,
      checkpointFingerprint: meetingFingerprint
    };

    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    await saveMeetings(updatedMeetings);

    await queueMutation({
      opId: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      shgId: group?.shgCode || 'SHG-MH-2024-884',
      actorId: 'animator-1',
      actorRole: 'ANIMATOR',
      deviceId: 'dev-pwa-local',
      hlcTimestamp: `${new Date().toISOString()}-0001`,
      type: 'COMMIT_MEETING',
      entityId: newMeeting.id,
      payload: { meetingNumber: newMeeting.meetingNumber, totalSavingsCollected: totalSav, checkpointFingerprint: meetingFingerprint }
    });

    tts.speak(language === 'mr' ? 'बैठक सत्र यशस्वीरीत्या नोंदवले गेले आहे.' : 'Meeting Session committed to hash-chain successfully.');
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

  return (
    <AppShell
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
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
    >
      {currentRole === 'MEMBER' ? (
        <MemberDashboard
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
        />
      ) : (
        <AnimatorDashboard
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
    </AppShell>
  );
}



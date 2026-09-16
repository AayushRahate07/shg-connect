import React, { useState, useEffect } from 'react';
import { Member, Transaction, Loan, Meeting, Role, SupportedLanguage, Resolution } from './types/shg';
import { seedInitialDataIfNeeded, GroupInfo, saveMembers, saveTransactions, saveLoans, saveMeetings, resetToDemoData, queueMutation, setCurrentShgId, INITIAL_GROUP_INFO } from './services/db';
import { INITIAL_RESOLUTIONS } from './components/ResolutionRegister';
import { computeBlockHash, generateCheckpointFingerprint } from './services/hashChain';
import { tts } from './services/tts';
import { sound } from './services/sound';
import { Header } from './components/Header';
import { MemberDashboard } from './pages/MemberDashboard';
import { AnimatorDashboard } from './pages/AnimatorDashboard';
import { BackupRestoreModal } from './components/BackupRestoreModal';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<Role>('MEMBER');
  const [language, setLanguage] = useState<SupportedLanguage>('mr');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);

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

  const handleToggleTts = () => {
    const nextState = !ttsEnabled;
    setTtsEnabled(nextState);
    tts.setEnabled(nextState);
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    tts.setLanguage(lang);
  };

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
      <div className="min-h-screen bg-[#14532D] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-black tracking-wide text-emerald-100">Initializing SHGConnect IndexedDB Engine (v2)...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#1C1917] flex flex-col font-sans">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        language={language}
        onLanguageChange={handleLanguageChange}
        ttsEnabled={ttsEnabled}
        onToggleTts={handleToggleTts}
        onResetData={handleResetData}
        onOpenBackupModal={() => setShowBackupModal(true)}
        shgName={group.name}
        shgNameRegional={group.nameRegional}
        federation={INITIAL_GROUP_INFO.federation}
        onSwitchShgGroup={handleSwitchShgGroup}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentRole === 'MEMBER' ? (
          <MemberDashboard
            members={members}
            transactions={transactions}
            loans={loans}
            language={language}
            onRecordTransaction={handleRecordTransaction}
            onVerifyBlockIndex={(idx) => setCurrentRole('ANIMATOR')}
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
          />
        )}
      </main>

      {/* Backup and Restore Modal */}
      {showBackupModal && (
        <BackupRestoreModal
          language={language}
          onClose={() => setShowBackupModal(false)}
          onRestored={reloadAllData}
        />
      )}

      <footer className="bg-[#1C1917] text-stone-400 text-xs text-center py-4 print:hidden border-t border-stone-800">
        <p className="font-bold text-stone-300">SHGConnect - Grassroots Offline Trust Ledger & NABARD Panchasutra Operational System</p>
        <p className="text-[10px] text-stone-500 mt-0.5">IndexedDB v2, Dual-Chain Outbox Queue, Audit Envelopes & Merkle Root Cryptographic Log</p>
      </footer>
    </div>
  );
}


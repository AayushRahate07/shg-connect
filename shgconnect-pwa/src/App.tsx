import React, { useState, useEffect } from 'react';
import { Member, Transaction, Loan, Meeting, Role, SupportedLanguage } from './types/shg';
import { seedInitialDataIfNeeded, GroupInfo, saveMembers, saveTransactions, saveLoans, saveMeetings, resetToDemoData } from './services/db';
import { computeBlockHash } from './services/hashChain';
import { tts } from './services/tts';
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

  const reloadAllData = async () => {
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

  /**
   * Appends a new transaction block to the append-only SHA-256 hash-chain
   */
  const handleRecordTransaction = async (
    memberId: string,
    amount: number,
    type: 'SAVINGS' | 'EMI_REPAYMENT' | 'LOAN_DISBURSAL',
    notes?: string
  ) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const lastBlock = transactions[transactions.length - 1];
    const newIndex = transactions.length;
    const prevHash = lastBlock ? lastBlock.hash : "GENESIS_BLOCK_00000000000000000000000000000000";
    const timestamp = new Date().toISOString();

    const payload = `${member.id}:${member.name}:${type}:${amount}:${notes || ''}`;
    const hash = await computeBlockHash(newIndex, prevHash, timestamp, payload);

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
      hash
    };

    const updatedTxs = [...transactions, newTx];
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

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
    saveMembers(updatedMembers);
  };

  /**
   * Complete a full Meeting Session (Attendance + Savings + Disbursals)
   */
  const handleCompleteMeetingSession = async (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string }
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
          dateDisbursed: new Date().toISOString().split('T')[0]
        };
        const updatedLoans = [...loans, newLoan];
        setLoans(updatedLoans);
        saveLoans(updatedLoans);
      }
    }

    // Record meeting metadata
    const totalSav = savingsCollected.reduce((sum, s) => sum + s.amount, 0);
    const newMeeting: Meeting = {
      id: `meet-${meetings.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      meetingNumber: meetings.length + 1,
      totalSavingsCollected: totalSav,
      totalEmiCollected: 0,
      totalDisbursed: loanDisbursed ? loanDisbursed.amount : 0,
      attendanceRecord
    };

    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    saveMeetings(updatedMeetings);

    tts.speak(language === 'mr' ? 'बैठक सत्र यशस्वीरीत्या नोंदवले गेले आहे.' : 'Meeting Session committed to hash-chain successfully.');
  };

  /**
   * Intentionally corrupts a hash to demonstrate local cryptographic tamper detection live
   */
  const handleSimulateTamperAttack = () => {
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
    saveTransactions(corruptedTxs);
  };

  const handleResetData = () => {
    if (window.confirm("Reset offline database to initial demo state?")) {
      resetToDemoData();
      window.location.reload();
    }
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold tracking-wide text-emerald-200">Loading SHGConnect Offline Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
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
            language={language}
            onCompleteMeetingSession={handleCompleteMeetingSession}
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

      <footer className="bg-slate-900 text-slate-400 text-xs text-center py-4 print:hidden border-t border-slate-800">
        <p>SHGConnect - Grassroots Offline Trust Ledger for Self-Help Groups in India</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Built with React, Vite, PWA, Tailwind CSS & SHA-256 Web Crypto API</p>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { Member, Transaction, SupportedLanguage, Loan, Meeting } from '../types/shg';
import { translations } from '../i18n/translations';
import { MemberHome } from '../components/member/MemberHome';
import { SavingsView } from '../components/member/SavingsView';
import { LoansView } from '../components/member/LoansView';
import { MeetingsView } from '../components/member/MeetingsView';
import { MoreMenuView } from '../components/member/MoreMenuView';
import { PassbookTable } from '../components/PassbookTable';
import { UpiPaymentModal } from '../components/UpiPaymentModal';
import { LoanCalculator } from '../components/LoanCalculator';
import { PanchasutraVisualizer } from '../components/panchasutra/PanchasutraVisualizer';
import { SettingsView } from '../components/settings/SettingsView';
import { MemberDossierModal } from '../components/MemberDossierModal';

interface MemberDashboardProps {
  members: Member[];
  transactions: Transaction[];
  loans: Loan[];
  meetings?: Meeting[];
  language: SupportedLanguage;
  onRecordTransaction: (memberId: string, amount: number, type: 'SAVINGS' | 'EMI_REPAYMENT', notes?: string) => void;
  onVerifyBlockIndex: (index: number) => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSyncCenter?: () => void;
  onToggleTts?: () => void;
  ttsEnabled?: boolean;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onOpenBackupModal?: () => void;
  onResetData?: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  members,
  transactions,
  loans,
  meetings = [],
  language,
  onRecordTransaction,
  onVerifyBlockIndex,
  activeTab = 'home',
  onSelectTab,
  onOpenSyncCenter,
  onToggleTts,
  ttsEnabled,
  onLanguageChange,
  onOpenBackupModal,
  onResetData
}) => {
  const t = translations[language] || translations.en;
  // Member experience uses logged-in member (default first member) without member selector dropdown
  const currentMember = members[0] || {
    id: 'mem-1',
    name: 'Kamlatai Patil',
    nameRegional: 'कमलाताई पाटील',
    role: 'TREASURER',
    totalSavings: 18500,
    activeLoanBalance: 0,
    joinDate: '2022-01-15'
  };

  const memberTransactions = transactions.filter(t => t.memberId === currentMember.id);
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [paymentType, setPaymentType] = useState<'SAVINGS' | 'EMI_REPAYMENT'>('SAVINGS');
  const [paymentAmount, setPaymentAmount] = useState<number>(500);
  const [selectedDossierMember, setSelectedDossierMember] = useState<Member | null>(null);

  const handleOpenPayment = (type: 'SAVINGS' | 'EMI_REPAYMENT', defaultAmt: number) => {
    setPaymentType(type);
    setPaymentAmount(defaultAmt);
    setShowUpiModal(true);
  };

  const handlePaymentConfirmed = (amount: number, type: 'SAVINGS' | 'EMI_REPAYMENT') => {
    onRecordTransaction(currentMember.id, amount, type, type === 'EMI_REPAYMENT' ? 'EMI Repayment via UPI' : 'Monthly Savings via UPI');
  };

  const handleNavigate = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Home Page */}
      {activeTab === 'home' && (
        <MemberHome
          member={currentMember}
          transactions={transactions}
          loans={loans}
          language={language}
          onOpenUpiPayment={handleOpenPayment}
          onNavigateTab={handleNavigate}
          onOpenDossier={(m) => setSelectedDossierMember(m)}
        />
      )}

      {/* 2. My Savings Page */}
      {activeTab === 'savings' && (
        <SavingsView
          member={currentMember}
          transactions={transactions}
          language={language}
          onOpenUpiPayment={handleOpenPayment}
          onNavigateTab={handleNavigate}
        />
      )}

      {/* 3. My Loans Page */}
      {activeTab === 'loans' && (
        <LoansView
          member={currentMember}
          loans={loans}
          transactions={transactions}
          language={language}
          onOpenUpiPayment={handleOpenPayment}
          onNavigateTab={handleNavigate}
        />
      )}

      {/* 4. My Meetings Page */}
      {activeTab === 'meetings' && (
        <MeetingsView
          meetings={meetings}
          language={language}
        />
      )}

      {/* 5. More Menu Page */}
      {activeTab === 'more' && (
        <MoreMenuView
          language={language}
          onNavigateTab={handleNavigate}
        />
      )}

      {/* 6. Detailed Passbook Page */}
      {activeTab === 'passbook' && (
        <PassbookTable
          transactions={memberTransactions}
          members={members}
          language={language}
          onVerifyBlock={onVerifyBlockIndex}
        />
      )}

      {/* 7. Savings Goal / Calculator Page */}
      {activeTab === 'calculator' && (
        <LoanCalculator language={language} />
      )}

      {/* 8. SHG Operational Health / Panchasutra Page */}
      {activeTab === 'panchasutra' && (
        <PanchasutraVisualizer
          score={{
            regularMeetingsScore: 18,
            regularSavingsScore: 20,
            internalLendingScore: 18,
            timelyRecoveryScore: 16,
            transparentBooksScore: 20,
            totalScore: 92,
            bankGrade: 'Grade A',
            loanEligibilityInr: 500000
          }}
          language={language}
        />
      )}

      {/* 9. Settings Page */}
      {activeTab === 'settings' && (
        <SettingsView
          language={language}
          onLanguageChange={onLanguageChange || (() => {})}
          ttsEnabled={ttsEnabled || false}
          onToggleTts={onToggleTts || (() => {})}
          onOpenBackupModal={onOpenBackupModal || (() => {})}
          onOpenSyncCenter={onOpenSyncCenter || (() => {})}
          onResetData={onResetData || (() => {})}
        />
      )}

      {/* UPI Payment Intent Modal */}
      {showUpiModal && (
        <UpiPaymentModal
          member={currentMember}
          paymentType={paymentType}
          amount={paymentAmount}
          language={language}
          onClose={() => setShowUpiModal(false)}
          onPaymentConfirmed={handlePaymentConfirmed}
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

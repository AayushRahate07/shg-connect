import React, { useState } from 'react';
import {
  Member,
  Transaction,
  SupportedLanguage,
  Loan,
  Meeting,
  GroupInfo,
  PaymentMode,
  SettlementStatus,
  OfficerSignature
} from '../types/shg';
import { translations } from '../i18n/translations';
import { ALL_SEED_USERS } from '../data/seedData';
import { MemberHome } from '../components/member/MemberHome';
import { MemberPassbook } from '../components/member/MemberPassbook';
import { MemberLoan } from '../components/member/MemberLoan';
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
import { SavingsGoal } from '../components/member/SavingsGoal';
import { MemberLiveMeeting } from '../components/meeting/MemberLiveMeeting';
import { Radio } from 'lucide-react';

interface MemberDashboardProps {
  isLeadUser?: boolean;
  onSwitchToLead?: () => void;
  group?: GroupInfo | null;
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
  loggedInMemberId?: string;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  group,
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
  onResetData,
  loggedInMemberId
}) => {
  const t = translations[language] || translations.en;

  // Member resolution:
  // 1. Logged in member (from authentication session)
  // 2. First member with role === 'MEMBER' (e.g. Meena-bai Jadhav)
  // 3. Fallback to first member
  const currentMember = (loggedInMemberId ? members.find(m => m.id === loggedInMemberId) : null)
    || (loggedInMemberId ? ALL_SEED_USERS.find(m => m.id === loggedInMemberId) : null)
    || members.find(m => m.role === 'MEMBER')
    || members[0]
    || ALL_SEED_USERS[3];

  const memberTransactions = transactions.filter(t => t.memberId === currentMember.id);
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [paymentType, setPaymentType] = useState<'SAVINGS' | 'EMI_REPAYMENT'>('SAVINGS');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedDossierMember, setSelectedDossierMember] = useState<Member | null>(null);
  const [showLiveMeeting, setShowLiveMeeting] = useState<boolean>(false);

  const handleOpenPayment = (type: 'SAVINGS' | 'EMI_REPAYMENT', defaultAmt: number) => {
    setPaymentType(type);
    setPaymentAmount(defaultAmt);
    setShowUpiModal(true);
  };

  const handlePaymentConfirmed = (
    amount: number,
    type: 'SAVINGS' | 'EMI_REPAYMENT',
    paymentMode?: PaymentMode,
    settlementStatus?: SettlementStatus,
    utrOrNotes?: string,
    signatories?: OfficerSignature[]
  ) => {
    const isCash = paymentMode === 'CASH';
    const notes = isCash
      ? (utrOrNotes || 'रोख जमा (कोरम पडताळणी पूर्ण)')
      : (type === 'EMI_REPAYMENT'
        ? `EMI Repayment via UPI (UTR: ${utrOrNotes || 'N/A'})`
        : `Monthly Savings via UPI (UTR: ${utrOrNotes || 'N/A'})`);

    onRecordTransaction(currentMember.id, amount, type, notes);
  };

  const handleNavigate = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── LIVE MEETING fullscreen overlay ── */}
      {showLiveMeeting && (
        <div className="fixed inset-0 z-50 bg-stone-50 overflow-y-auto">
          <MemberLiveMeeting
            memberId={currentMember.id}
            memberName={currentMember.nameRegional || currentMember.name}
            phone={currentMember.phone || ''}
            language={language}
            onLeave={() => setShowLiveMeeting(false)}
          />
        </div>
      )}

      {/* Live Meeting Banner (shown on home) */}
      {(activeTab === 'home' || activeTab === 'meetings') && !showLiveMeeting && (
        <div className="mx-4 mt-2">
          <button
            onClick={() => setShowLiveMeeting(true)}
            className="w-full bg-emerald-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-400/20 rounded-xl flex items-center justify-center">
                <Radio className="w-4 h-4 text-green-300 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black">{language === 'mr' ? 'बैठकीत सामील व्हा' : 'Join Live Meeting'}</p>
                <p className="text-[10px] text-emerald-300 font-medium">{language === 'mr' ? 'गट प्रमुखांकडून कोड मिळवा' : 'Get code from your SHG Lead'}</p>
              </div>
            </div>
            <div className="text-emerald-300 text-xs font-black">→</div>
          </button>
        </div>
      )}
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
          group={group}
          meetings={meetings}
          members={members}
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
          group={group}
          members={members}
        />
      )}

      {/* 3. My Loans Page */}
      {activeTab === 'loans' && (
        <MemberLoan
          member={currentMember}
          loans={loans}
          transactions={transactions}
          language={language}
          onOpenUpiPayment={handleOpenPayment}
        />
      )}

      {/* 4. My Meetings Page */}
      {activeTab === 'meetings' && (
        <MeetingsView
          meetings={meetings}
          language={language}
          group={group}
          onJoinLiveMeeting={() => setShowLiveMeeting(true)}
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
        <MemberPassbook
          member={currentMember}
          transactions={transactions}
          language={language}
        />
      )}

      {/* 7. Savings Goal / Calculator Page */}
      {activeTab === 'calculator' && (
        <LoanCalculator language={language} />
      )}

      {activeTab === 'goals' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <SavingsGoal currentSavings={currentMember.totalSavings} targetAmount={25000} goalName="आपत्कालीन व वैद्यकीय निधी" />
          <LoanCalculator language={language} />
        </div>
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

      {/* Deposit Savings & Payment Modal (Cash with Quorum Witnessing OR Online UPI) */}
      {showUpiModal && (
        <UpiPaymentModal
          member={currentMember}
          paymentType={paymentType}
          amount={paymentAmount}
          language={language}
          onClose={() => setShowUpiModal(false)}
          onPaymentConfirmed={handlePaymentConfirmed}
          group={group}
          members={members}
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

import React, { useState } from 'react';
import { Member, Transaction, SupportedLanguage, Loan } from '../types/shg';
import { PassbookTable } from '../components/PassbookTable';
import { UpiPaymentModal } from '../components/UpiPaymentModal';
import { LoanCalculator } from '../components/LoanCalculator';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { Wallet, QrCode, TrendingUp, Award, Clock, ArrowUpRight, Calculator, ShieldCheck } from 'lucide-react';

interface MemberDashboardProps {
  members: Member[];
  transactions: Transaction[];
  loans: Loan[];
  language: SupportedLanguage;
  onRecordTransaction: (memberId: string, amount: number, type: 'SAVINGS' | 'EMI_REPAYMENT', notes?: string) => void;
  onVerifyBlockIndex: (index: number) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  members,
  transactions,
  loans,
  language,
  onRecordTransaction,
  onVerifyBlockIndex
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || 'mem-1');
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [paymentType, setPaymentType] = useState<'SAVINGS' | 'EMI_REPAYMENT'>('SAVINGS');
  const [paymentAmount, setPaymentAmount] = useState<number>(500);
  const [activeTab, setActiveTab] = useState<'passbook' | 'calculator'>('passbook');
  const [selectedDossierMember, setSelectedDossierMember] = useState<Member | null>(null);

  const currentMember = members.find(m => m.id === selectedMemberId) || members[0];
  const memberLoans = loans.filter(l => l.memberId === selectedMemberId && l.status === 'ACTIVE');
  const activeLoan = memberLoans[0];

  const handleOpenPayment = (type: 'SAVINGS' | 'EMI_REPAYMENT', defaultAmt: number) => {
    setPaymentType(type);
    setPaymentAmount(defaultAmt);
    setShowUpiModal(true);
  };

  const handlePaymentConfirmed = (amount: number, type: 'SAVINGS' | 'EMI_REPAYMENT') => {
    onRecordTransaction(currentMember.id, amount, type, type === 'EMI_REPAYMENT' ? 'EMI Repayment via UPI' : 'Monthly Savings via UPI');
  };

  return (
    <div className="space-y-6">
      {/* Member Selector Bar */}
      <div className="bg-[#FDFBF7] p-4 rounded-3xl shadow-xs border-2 border-[#E2DDD3] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-stone-700">
            {language === 'mr' ? 'सभासद निवडा (Switch Member):' : 'Viewing Member:'}
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="bg-white border border-[#E2DDD3] text-[#1C1917] font-extrabold text-sm rounded-xl px-3 py-1.5 outline-none"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {language === 'mr' ? m.nameRegional : m.name} ({m.role})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('passbook')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'passbook' ? 'bg-[#14532D] text-white shadow' : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#E2DDD3]'
            }`}
          >
            📖 {language === 'mr' ? 'माझे पासबुक' : 'My Passbook'}
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'calculator' ? 'bg-[#14532D] text-white shadow' : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#E2DDD3]'
            }`}
          >
            🧮 {language === 'mr' ? 'कर्ज गणक' : 'Loan Calculator'}
          </button>
        </div>
      </div>

      {/* Member Summary Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Savings Balance Card */}
        <div className="bg-gradient-to-br from-[#14532D] to-emerald-950 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-emerald-200 font-bold uppercase tracking-wider">
                {language === 'mr' ? 'एकूण बचत (Total Savings)' : 'Total Personal Savings'}
              </span>
              <div className="text-3xl font-black text-white mt-1">
                ₹{currentMember.totalSavings.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/60 flex items-center justify-center text-emerald-100">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">Monthly Pool: ₹500</span>
            <button
              onClick={() => handleOpenPayment('SAVINGS', 500)}
              className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-3 py-1.5 rounded-xl text-xs font-black shadow flex items-center space-x-1 transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'बचत जमा करा' : 'Deposit Savings'}</span>
            </button>
          </div>
        </div>

        {/* Active Loan Balance Card */}
        <div className="bg-[#FDFBF7] p-5 rounded-3xl shadow-xs border-2 border-[#E2DDD3] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                {language === 'mr' ? 'सक्रिय कर्ज (Active Loan Balance)' : 'Active Loan Balance'}
              </span>
              <div className="text-2xl font-black text-[#1C1917] mt-1">
                ₹{currentMember.activeLoanBalance.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-800" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">
              {activeLoan ? `Disbursed: ₹${activeLoan.principal.toLocaleString('en-IN')}` : 'No Active Loans'}
            </span>
            {currentMember.activeLoanBalance > 0 && (
              <button
                onClick={() => handleOpenPayment('EMI_REPAYMENT', 2150)}
                className="bg-[#14532D] hover:bg-emerald-900 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow flex items-center space-x-1 transition"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'mr' ? 'हप्ता भरा (Pay EMI)' : 'Pay EMI via UPI'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Trust Score Card */}
        <div className="bg-[#FDFBF7] p-5 rounded-3xl shadow-xs border-2 border-[#E2DDD3] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                {language === 'mr' ? 'विश्वास गुणांक (Trust Score)' : 'SHG Trust Score'}
              </span>
              <div className="text-2xl font-black text-[#14532D] mt-1 flex items-center gap-2">
                <span>{currentMember.trustScore}%</span>
                <span className="text-xs font-black bg-emerald-100 text-[#14532D] px-2 py-0.5 rounded-full">
                  EXCELLENT
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#14532D] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 text-xs text-stone-500 font-medium flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-[#14532D]" />
            <span>{language === 'mr' ? '१००% वेळेवर परतफेड ट्रॅक' : '100% On-time repayment history'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Tab Content */}
      {activeTab === 'passbook' ? (
        <PassbookTable
          transactions={transactions}
          members={members}
          language={language}
          selectedMemberId={selectedMemberId}
          onSelectMemberFilter={setSelectedMemberId}
          onVerifyBlock={onVerifyBlockIndex}
          onSelectMemberDossier={(m) => setSelectedDossierMember(m)}
        />
      ) : (
        <LoanCalculator language={language} />
      )}

      {/* Member Dossier Modal */}
      {selectedDossierMember && (
        <MemberDossierModal
          member={selectedDossierMember}
          transactions={transactions}
          loans={loans}
          language={language}
          onClose={() => setSelectedDossierMember(null)}
        />
      )}

      {/* UPI Payment Modal */}
      {showUpiModal && (
        <UpiPaymentModal
          member={currentMember}
          amount={paymentAmount}
          paymentType={paymentType}
          language={language}
          onClose={() => setShowUpiModal(false)}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}
    </div>
  );
};

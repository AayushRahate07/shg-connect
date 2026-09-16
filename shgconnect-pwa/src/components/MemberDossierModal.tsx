import React from 'react';
import { Member, Transaction, Loan, SupportedLanguage } from '../types/shg';
import { X, Award, Printer, ShieldCheck, Wallet, TrendingUp, Calendar, CheckCircle2, User } from 'lucide-react';

interface MemberDossierModalProps {
  member: Member;
  transactions: Transaction[];
  loans: Loan[];
  language: SupportedLanguage;
  onClose: () => void;
}

export const MemberDossierModal: React.FC<MemberDossierModalProps> = ({
  member,
  transactions,
  loans,
  language,
  onClose
}) => {
  const memberTxs = transactions.filter(tx => tx.memberId === member.id);
  const memberLoans = loans.filter(l => l.memberId === member.id);
  const activeLoan = memberLoans.find(l => l.status === 'ACTIVE');

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#FDFBF7] border-2 border-[#E2DDD3] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#14532D] text-white p-6 rounded-t-3xl flex justify-between items-start print:hidden">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-2xl ${member.avatarColor} text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/30`}>
              {member.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-black text-white">{member.nameRegional}</h2>
                <span className="bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full text-xs font-black uppercase">
                  {member.role}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                {member.name} | Phone: {member.phone} | UPI: {member.upiVpa || 'N/A'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block p-6 text-center border-b border-slate-300">
          <h1 className="text-2xl font-bold text-slate-900">महिला प्रगति बचत गट - सभासद विवरण (Passbook Slip)</h1>
          <p className="text-sm text-slate-600">सभासदाचे नाव: {member.nameRegional} ({member.name})</p>
          <p className="text-xs text-slate-500">दिनांक: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Lifetime Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
            <div className="bg-white border border-[#E2DDD3] p-4 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">एकूण बचत जमा</span>
              <div className="text-2xl font-black text-[#14532D] mt-1">₹{member.totalSavings.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-emerald-800 font-bold">100% Monthly Quota Met</span>
            </div>

            <div className="bg-white border border-[#E2DDD3] p-4 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">सक्रिय कर्ज बाकी</span>
              <div className="text-2xl font-black text-rose-700 mt-1">₹{member.activeLoanBalance.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-stone-500 font-semibold">{activeLoan ? 'ACTIVE LOAN' : 'NO ACTIVE LOANS'}</span>
            </div>

            <div className="bg-white border border-[#E2DDD3] p-4 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase">विश्वास गुणांक (Trust)</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{member.trustScore}%</div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">GRADE A SAVER</span>
            </div>
          </div>

          {/* Official Stamps / Seals */}
          <div className="flex flex-wrap gap-3 print:hidden">
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 px-3 py-1.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>नियमित बचतदार (Regular Saver Seal)</span>
            </div>
            {activeLoan && (
              <div className="bg-amber-100 border border-amber-300 text-amber-950 px-3 py-1.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 shadow-xs">
                <TrendingUp className="w-4 h-4 text-amber-700" />
                <span>सक्रिय कर्जदार (Active Borrower)</span>
              </div>
            )}
            <div className="bg-blue-100 border border-blue-300 text-blue-950 px-3 py-1.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 shadow-xs">
              <Award className="w-4 h-4 text-blue-700" />
              <span>NRLM Verified Member</span>
            </div>
          </div>

          {/* Individual Member Ledger Statement */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-[#1C1917]">
                {language === 'mr' ? 'वैयक्तिक पासबुक नोंदी (Individual Transactions)' : 'Personal Passbook Ledger'}
              </h3>
              <button
                onClick={handlePrintSlip}
                className="bg-[#14532D] hover:bg-emerald-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center space-x-1 print:hidden"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>पासबुक प्रिंट (Print Slip)</span>
              </button>
            </div>

            <div className="bg-white border border-[#E2DDD3] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F4EC] text-stone-800 font-bold border-b border-[#E2DDD3]">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-center print:hidden">Hash Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD3] font-medium text-stone-800">
                  {memberTxs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-stone-500">No transactions recorded for this member.</td>
                    </tr>
                  ) : (
                    memberTxs.map(tx => (
                      <tr key={tx.id} className="hover:bg-amber-50/40">
                        <td className="p-2.5">{new Date(tx.timestamp).toLocaleDateString('en-IN')}</td>
                        <td className="p-2.5 font-bold">{tx.type}</td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-800">₹{tx.amount.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-center font-mono text-[10px] text-stone-500 print:hidden">
                          0x{tx.hash.substring(0, 8)}...
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

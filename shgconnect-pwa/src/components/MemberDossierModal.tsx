import React from 'react';
import { Member, Transaction, Loan, SupportedLanguage } from '../types/shg';
import { formatINR } from '../theme/tokens';
import { X, Check, Award, Printer, ShieldCheck, TrendingUp, Calendar, CheckCircle2, User, Phone, Wallet } from 'lucide-react';

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
  const isMr = language === 'mr';
  const memberTxs = transactions.filter(tx => tx.memberId === member.id);
  const memberLoans = loans.filter(l => l.memberId === member.id);
  const activeLoan = memberLoans.find(l => l.status === 'ACTIVE');

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 bg-stone-900/80 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 z-[100] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border border-stone-200 rounded-t-2xl sm:rounded-lg shadow-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-slideUp sm:animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky Fixed Header (Close button always visible & accessible) ── */}
        <div className="bg-[#14532D] text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-xs border-b border-emerald-800 print:hidden">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${member.avatarColor || 'bg-emerald-700'} text-white font-black text-lg flex items-center justify-center shadow-xs border border-white/20 shrink-0`}>
              {(isMr ? member.nameRegional : member.name).charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate leading-tight">
                  {isMr ? member.nameRegional : member.name}
                </h2>
                <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0">
                  {member.role === 'OFFICE_BEARER' ? (isMr ? 'अध्यक्ष/पदाधिकारी' : 'Officer') : (isMr ? 'सदस्य' : 'Member')}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 mt-0.5 font-medium truncate">
                +91 {member.phone} {member.upiVpa ? `• UPI: ${member.upiVpa}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Print Only Header ── */}
        <div className="hidden print:block p-6 text-center border-b border-slate-300">
          <h1 className="text-xl font-bold text-slate-900">महिला बचत गट - सभासद विवरण (Passbook Slip)</h1>
          <p className="text-sm text-slate-600">सभासदाचे नाव: {member.nameRegional} ({member.name})</p>
          <p className="text-xs text-slate-500">दिनांक: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        {/* ── Scrollable Body with Touch Momentum ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain pb-24 sm:pb-6 touch-pan-y">
          {/* Lifetime Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 print:grid-cols-3">
            <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 sm:p-3 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-stone-500 uppercase block truncate">
                {isMr ? 'एकूण बचत' : 'Total Savings'}
              </span>
              <div className="text-sm sm:text-xl font-black text-emerald-950 mt-0.5 amount-display">
                {formatINR(member.totalSavings)}
              </div>
              <span className="text-[9.5px] text-emerald-800 font-bold block truncate mt-0.5">
                <span className="inline-flex items-center gap-1">{isMr ? '१००% कोटा पूर्ण' : 'Quota Met'} <Check className="w-2.5 h-2.5 text-emerald-800 shrink-0" /></span>
              </span>
            </div>

            <div className="bg-rose-50/80 border border-rose-200 p-2.5 sm:p-3 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-stone-500 uppercase block truncate">
                {isMr ? 'कर्ज बाकी' : 'Loan Due'}
              </span>
              <div className="text-sm sm:text-xl font-black text-rose-700 mt-0.5 amount-display">
                {formatINR(member.activeLoanBalance)}
              </div>
              <span className="text-[9.5px] text-stone-500 font-semibold block truncate mt-0.5">
                {activeLoan ? (isMr ? 'चालू कर्ज' : 'ACTIVE') : (isMr ? 'काही नाही' : 'NO LOAN')}
              </span>
            </div>

            <div className="bg-blue-50/80 border border-blue-200 p-2.5 sm:p-3 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-stone-500 uppercase block truncate">
                {isMr ? 'विश्वास गुणांक' : 'Trust Score'}
              </span>
              <div className="text-sm sm:text-xl font-black text-blue-950 mt-0.5">
                {member.trustScore}%
              </div>
              <span className="text-[9.5px] text-blue-800 font-bold block truncate mt-0.5">
                {isMr ? 'श्रेणी अ (Grade A)' : 'GRADE A'}
              </span>
            </div>
          </div>

          {/* Official Stamps / Badges */}
          <div className="flex flex-wrap gap-2 print:hidden">
            <div className="bg-emerald-100/80 border border-emerald-300 text-emerald-950 px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center space-x-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{isMr ? 'नियमित बचतदार' : 'Regular Saver'}</span>
            </div>
            {activeLoan && (
              <div className="bg-amber-100/80 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center space-x-1.5 shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{isMr ? 'सक्रिय कर्जदार' : 'Active Borrower'}</span>
              </div>
            )}
            <div className="bg-blue-100/80 border border-blue-300 text-blue-950 px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center space-x-1.5 shadow-2xs">
              <Award className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>{isMr ? 'NRLM पडताळणी पूर्ण' : 'NRLM Verified'}</span>
            </div>
          </div>

          {/* Individual Member Ledger Statement */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs sm:text-sm text-stone-900">
                {isMr ? 'वैयक्तिक पासबुक नोंदी' : 'Personal Passbook Ledger'}
              </h3>
              <button
                type="button"
                onClick={handlePrintSlip}
                className="bg-[#14532D] hover:bg-emerald-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs flex items-center space-x-1 print:hidden cursor-pointer active:scale-95 transition"
              >
                <Printer className="w-3 h-3" />
                <span>{isMr ? 'प्रिंट' : 'Print Slip'}</span>
              </button>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/80 text-stone-800 font-bold border-b border-stone-200">
                    <th className="p-2">{isMr ? 'तारीख' : 'Date'}</th>
                    <th className="p-2">{isMr ? 'प्रकार' : 'Type'}</th>
                    <th className="p-2 text-right">{isMr ? 'रक्कम' : 'Amount'}</th>
                    <th className="p-2 text-center print:hidden">{isMr ? 'पावती' : 'Hash'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                  {memberTxs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-stone-500 text-xs">
                        {isMr ? 'या सदस्यासाठी नोंदी उपलब्ध नाहीत.' : 'No transactions recorded for this member.'}
                      </td>
                    </tr>
                  ) : (
                    memberTxs.map(tx => (
                      <tr key={tx.id} className="hover:bg-amber-50/40">
                        <td className="p-2 whitespace-nowrap text-[11px]">{new Date(tx.timestamp).toLocaleDateString('en-IN')}</td>
                        <td className="p-2 font-bold text-[11px]">{tx.type}</td>
                        <td className="p-2 text-right font-black text-emerald-800 text-xs amount-display">
                          {formatINR(tx.amount)}
                        </td>
                        <td className="p-2 text-center font-mono text-[9px] text-stone-400 print:hidden">
                          {tx.hash.substring(0, 6)}...
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Mobile Sticky Dismiss Footer ── */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0 sm:hidden print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 font-black text-xs rounded-lg transition active:scale-95 cursor-pointer"
          >
            {isMr ? 'बंद करा (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

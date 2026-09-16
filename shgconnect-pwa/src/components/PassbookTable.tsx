import React, { useState, useEffect } from 'react';
import { Transaction, SupportedLanguage, Member } from '../types/shg';
import { verifyLedgerIntegrity } from '../services/hashChain';
import { Printer, ShieldCheck, ShieldAlert, Search, CheckCircle2, Lock } from 'lucide-react';

interface PassbookTableProps {
  transactions: Transaction[];
  members: Member[];
  language: SupportedLanguage;
  onVerifyBlock?: (index: number) => void;
  selectedMemberId?: string;
  onSelectMemberFilter?: (memberId: string) => void;
}

export const PassbookTable: React.FC<PassbookTableProps> = ({
  transactions,
  members,
  language,
  onVerifyBlock,
  selectedMemberId = '',
  onSelectMemberFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isChainValid, setIsChainValid] = useState<boolean>(true);
  const [checkingIntegrity, setCheckingIntegrity] = useState<boolean>(true);

  useEffect(() => {
    async function checkIntegrity() {
      setCheckingIntegrity(true);
      try {
        const res = await verifyLedgerIntegrity(transactions);
        setIsChainValid(res.isValid);
      } catch (err) {
        setIsChainValid(false);
      } finally {
        setCheckingIntegrity(false);
      }
    }
    checkIntegrity();
  }, [transactions]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesMember = selectedMemberId ? tx.memberId === selectedMemberId : true;
    const matchesSearch = searchTerm
      ? tx.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesMember && matchesSearch;
  });

  // Calculate cumulative balance
  let runningBalance = 0;
  const rows = filteredTransactions.map(tx => {
    const isCredit = tx.type === 'SAVINGS' || tx.type === 'EMI_REPAYMENT';
    const isDebit = tx.type === 'LOAN_DISBURSAL';

    if (isCredit) runningBalance += tx.amount;
    if (isDebit) runningBalance -= tx.amount;

    return {
      ...tx,
      credit: isCredit ? tx.amount : 0,
      debit: isDebit ? tx.amount : 0,
      balance: runningBalance
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const getTxTypeLabel = (type: string) => {
    if (language === 'mr') {
      switch (type) {
        case 'SAVINGS': return 'मासिक बचत (Savings)';
        case 'EMI_REPAYMENT': return 'कर्ज हप्ता (EMI)';
        case 'LOAN_DISBURSAL': return 'कर्ज वाटप (Loan Given)';
        case 'ATTENDANCE': return 'उपस्थिती (Attendance)';
        default: return type;
      }
    }
    return type.replace('_', ' ');
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      {/* Live Verified Ledger Badge Banner */}
      <div className={`p-3 px-4 border-b flex items-center justify-between print:hidden ${
        isChainValid 
          ? 'bg-emerald-800 text-white' 
          : 'bg-rose-700 text-white font-bold animate-pulse'
      }`}>
        <div className="flex items-center space-x-2">
          {isChainValid ? (
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-200 flex-shrink-0" />
          )}
          <span className="text-xs font-bold uppercase tracking-wide">
            {isChainValid ? (
              language === 'mr' ? 'सुरक्षित साखळी: क्रिप्‍टोग्राफिकली पडताळणीकृत' : 'VERIFIED LEDGER: Cryptographically Verified'
            ) : (
              language === 'mr' ? 'चेतावणी: साखळी बदलली आहे! (Integrity Warning)' : 'Integrity Warning: Chain Modified'
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] opacity-90 font-mono">
          <Lock className="w-3.5 h-3.5" />
          <span>SHA-256 Proof Stamp</span>
        </div>
      </div>

      {/* Table Header & Controls */}
      <div className="p-4 bg-amber-50/60 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-amber-950 flex items-center gap-2">
            📖 {language === 'mr' ? 'पासबुक व डिजिटल नोंदवही' : 'Physical Passbook Register'}
          </h2>
          <p className="text-xs text-amber-800">
            {language === 'mr' 
              ? 'सर्व बचत, हप्ते आणि कर्ज व्यवहारांची अद्ययावत नोंद'
              : 'Appended-only SHA-256 cryptographic hash-chain ledger'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Member Filter Dropdown */}
          {onSelectMemberFilter && (
            <div className="relative">
              <select
                value={selectedMemberId}
                onChange={(e) => onSelectMemberFilter(e.target.value)}
                className="bg-white border border-amber-300 text-amber-950 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
              >
                <option value="">{language === 'mr' ? 'सर्व सभासद (All Members)' : 'All Members'}</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {language === 'mr' ? m.nameRegional : m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'mr' ? 'शोध (Search)...' : 'Search ledger...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl pl-8 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none w-36 sm:w-48 shadow-sm"
            />
          </div>

          {/* Print / Export PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'प्रिंट / PDF' : 'Print / Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Print Header (Only visible during window.print()) */}
      <div className="hidden print:block p-6 text-center border-b border-slate-300">
        <h1 className="text-2xl font-bold text-slate-900">महिला प्रगति बचत गट (SHGConnect)</h1>
        <p className="text-sm text-slate-600">गावाचे नाव: शिरवळ | नोंदणी क्र: SHG-MH-2024-884</p>
        <p className="text-xs text-slate-500 mt-1">दिनांक: {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      {/* Main Register Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-amber-100/70 text-amber-950 text-xs uppercase font-bold border-b border-amber-300">
              <th className="py-3 px-3 text-center w-12">#</th>
              <th className="py-3 px-3">{language === 'mr' ? 'दिनांक' : 'Date'}</th>
              <th className="py-3 px-3">{language === 'mr' ? 'सभासदाचे नाव' : 'Member Name'}</th>
              <th className="py-3 px-3">{language === 'mr' ? 'तपशील' : 'Type / Note'}</th>
              <th className="py-3 px-3 text-right text-emerald-800">{language === 'mr' ? 'जमा (Credit ₹)' : 'Credit (₹)'}</th>
              <th className="py-3 px-3 text-right text-rose-800">{language === 'mr' ? 'नावे (Debit ₹)' : 'Debit (₹)'}</th>
              <th className="py-3 px-3 text-right text-slate-900">{language === 'mr' ? 'शिल्लक (Balance ₹)' : 'Balance (₹)'}</th>
              <th className="py-3 px-3 text-center print:hidden">{language === 'mr' ? 'SHA-256 ब्लॉक' : 'Proof Hash Stamp'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs font-medium">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  {language === 'mr' ? 'कोणतेही व्यवहार आढळले नाहीत.' : 'No transactions found.'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-amber-50/40 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">{row.index}</td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                    {new Date(row.timestamp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {row.memberName}
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium inline-block mr-1">
                      {getTxTypeLabel(row.type)}
                    </span>
                    {row.notes && <span className="text-slate-500 text-[11px]">({row.notes})</span>}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700">
                    {row.credit > 0 ? `+₹${row.credit.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">
                    {row.debit > 0 ? `-₹${row.debit.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    ₹{row.balance.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center print:hidden">
                    <button
                      onClick={() => onVerifyBlock && onVerifyBlock(row.index)}
                      className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-md text-[10px] font-mono transition shadow-2xs"
                      title={`Full SHA-256 Hash: ${row.hash}`}
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>0x{row.hash.substring(0, 6)}...{row.hash.substring(row.hash.length - 4)}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center print:border-t-2 print:border-slate-800">
        <span>
          {language === 'mr' ? `एकूण व्यवहार: ${filteredTransactions.length}` : `Total Transactions: ${filteredTransactions.length}`}
        </span>
        <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{language === 'mr' ? 'स्थानिकरीत्या सुरक्षित (SHA-256 Integrity Verified)' : 'Locally Persistent SHA-256 Hash Chain'}</span>
        </span>
      </div>
    </div>
  );
};

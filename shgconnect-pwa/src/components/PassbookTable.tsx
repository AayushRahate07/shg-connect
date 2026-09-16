import React, { useState, useEffect } from 'react';
import { Transaction, SupportedLanguage, Member, TransactionType } from '../types/shg';
import { verifyLedgerIntegrity } from '../services/hashChain';
import { Printer, ShieldCheck, ShieldAlert, Search, CheckCircle2, Lock, Filter, User } from 'lucide-react';
import { sound } from '../services/sound';

interface PassbookTableProps {
  transactions: Transaction[];
  members: Member[];
  language: SupportedLanguage;
  onVerifyBlock?: (index: number) => void;
  selectedMemberId?: string;
  onSelectMemberFilter?: (memberId: string) => void;
  onSelectMemberDossier?: (member: Member) => void;
}

export const PassbookTable: React.FC<PassbookTableProps> = ({
  transactions,
  members,
  language,
  onVerifyBlock,
  selectedMemberId = '',
  onSelectMemberFilter,
  onSelectMemberDossier
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isChainValid, setIsChainValid] = useState<boolean>(true);

  useEffect(() => {
    async function checkIntegrity() {
      try {
        const res = await verifyLedgerIntegrity(transactions);
        setIsChainValid(res.isValid);
      } catch (err) {
        setIsChainValid(false);
      }
    }
    checkIntegrity();
  }, [transactions]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesMember = selectedMemberId ? tx.memberId === selectedMemberId : true;
    
    let matchesCategory = true;
    if (categoryFilter === 'SAVINGS') matchesCategory = tx.type === 'SAVINGS';
    else if (categoryFilter === 'LOAN') matchesCategory = tx.type === 'LOAN_DISBURSAL' || tx.type === 'EMI_REPAYMENT';
    else if (categoryFilter === 'RESOLUTION') matchesCategory = tx.type === 'RESOLUTION';
    else if (categoryFilter === 'PENALTY') matchesCategory = tx.type === 'PENALTY';

    const matchesSearch = searchTerm
      ? tx.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesMember && matchesCategory && matchesSearch;
  });

  // Calculate cumulative balance
  let runningBalance = 0;
  const rows = filteredTransactions.map(tx => {
    const isCredit = tx.type === 'SAVINGS' || tx.type === 'EMI_REPAYMENT' || tx.type === 'PENALTY';
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

  const handlePillClick = (cat: string) => {
    sound.playStampSound();
    setCategoryFilter(cat);
  };

  const getTxTypeLabel = (type: string) => {
    if (language === 'mr') {
      switch (type) {
        case 'SAVINGS': return 'मासिक बचत (Savings)';
        case 'EMI_REPAYMENT': return 'कर्ज हप्ता (EMI)';
        case 'LOAN_DISBURSAL': return 'कर्ज वाटप (Loan Given)';
        case 'ATTENDANCE': return 'उपस्थिती (Attendance)';
        case 'RESOLUTION': return 'इतिवृत्त (Resolution)';
        case 'PENALTY': return 'दंड (Penalty)';
        default: return type;
      }
    }
    return type.replace('_', ' ');
  };

  return (
    <div className="bg-[#FDFBF7] rounded-3xl shadow-md border-2 border-[#E2DDD3] overflow-hidden">
      {/* Live Verified Ledger Badge Banner */}
      <div className={`p-3 px-5 border-b flex items-center justify-between print:hidden ${
        isChainValid 
          ? 'bg-[#14532D] text-white' 
          : 'bg-rose-700 text-white font-bold animate-pulse'
      }`}>
        <div className="flex items-center space-x-2">
          {isChainValid ? (
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-200 flex-shrink-0" />
          )}
          <span className="text-xs font-black uppercase tracking-wide">
            {isChainValid ? (
              language === 'mr' ? 'सुरक्षित साखळी: क्रिप्‍टोग्राफिकली पडताळणीकृत' : 'VERIFIED LEDGER: Cryptographically Verified'
            ) : (
              language === 'mr' ? 'चेतावणी: साखळी बदलली आहे! (Integrity Warning)' : 'Integrity Warning: Chain Modified'
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] opacity-90 font-mono">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>SHA-256 Proof Stamp</span>
        </div>
      </div>

      {/* Table Header Controls & Filter Pills */}
      <div className="p-4 bg-[#F7F4EC] border-b border-[#E2DDD3] space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#1C1917] flex items-center gap-2">
              📖 {language === 'mr' ? 'पासबुक व डिजिटल नोंदवही' : 'Physical Passbook Register'}
            </h2>
            <p className="text-xs text-stone-600">
              {language === 'mr' 
                ? 'सर्व बचत, हप्ते आणि कर्ज व्यवहारांची अद्ययावत नोंद'
                : 'Appended-only SHA-256 cryptographic hash-chain ledger'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Member Filter Dropdown */}
            {onSelectMemberFilter && (
              <select
                value={selectedMemberId}
                onChange={(e) => onSelectMemberFilter(e.target.value)}
                className="bg-white border border-[#E2DDD3] text-[#1C1917] text-xs rounded-xl px-3 py-2 font-bold outline-none shadow-xs"
              >
                <option value="">{language === 'mr' ? 'सर्व सभासद (All Members)' : 'All Members'}</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {language === 'mr' ? m.nameRegional : m.name}
                  </option>
                ))}
              </select>
            )}

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'mr' ? 'शोध (Search)...' : 'Search ledger...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-[#E2DDD3] text-[#1C1917] text-xs rounded-xl pl-8 pr-3 py-2 font-medium outline-none w-36 sm:w-44 shadow-xs"
              />
            </div>

            {/* Print / Export PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-[#14532D] hover:bg-emerald-900 text-white text-xs font-black px-3 py-2 rounded-xl shadow transition"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'mr' ? 'प्रिंट / PDF' : 'Print / Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Module 5) */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => handlePillClick('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              categoryFilter === 'ALL' ? 'bg-[#14532D] text-white shadow-xs' : 'bg-white text-stone-700 hover:bg-amber-100 border border-[#E2DDD3]'
            }`}
          >
            सर्व (All)
          </button>
          <button
            onClick={() => handlePillClick('SAVINGS')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              categoryFilter === 'SAVINGS' ? 'bg-[#14532D] text-white shadow-xs' : 'bg-white text-stone-700 hover:bg-amber-100 border border-[#E2DDD3]'
            }`}
          >
            💰 बचत (Savings)
          </button>
          <button
            onClick={() => handlePillClick('LOAN')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              categoryFilter === 'LOAN' ? 'bg-[#14532D] text-white shadow-xs' : 'bg-white text-stone-700 hover:bg-amber-100 border border-[#E2DDD3]'
            }`}
          >
            🤝 कर्ज (Loans)
          </button>
          <button
            onClick={() => handlePillClick('RESOLUTION')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              categoryFilter === 'RESOLUTION' ? 'bg-[#14532D] text-white shadow-xs' : 'bg-white text-stone-700 hover:bg-amber-100 border border-[#E2DDD3]'
            }`}
          >
            📜 इतिवृत्त (Resolutions)
          </button>
          <button
            onClick={() => handlePillClick('PENALTY')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              categoryFilter === 'PENALTY' ? 'bg-[#14532D] text-white shadow-xs' : 'bg-white text-stone-700 hover:bg-amber-100 border border-[#E2DDD3]'
            }`}
          >
            ⚖️ दंड (Penalties)
          </button>
        </div>
      </div>

      {/* Main Register Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#F7F4EC] text-[#1C1917] text-xs uppercase font-extrabold border-b border-[#E2DDD3]">
              <th className="py-3 px-3 text-center w-12">#</th>
              <th className="py-3 px-3">{language === 'mr' ? 'दिनांक' : 'Date'}</th>
              <th className="py-3 px-3">{language === 'mr' ? 'सभासदाचे नाव' : 'Member Name'}</th>
              <th className="py-3 px-3">{language === 'mr' ? 'तपशील' : 'Type / Note'}</th>
              <th className="py-3 px-3 text-right text-emerald-800">{language === 'mr' ? 'जमा (Credit ₹)' : 'Credit (₹)'}</th>
              <th className="py-3 px-3 text-right text-rose-800">{language === 'mr' ? 'नावे (Debit ₹)' : 'Debit (₹)'}</th>
              <th className="py-3 px-3 text-right text-[#1C1917]">{language === 'mr' ? 'शिल्लक (Balance ₹)' : 'Balance (₹)'}</th>
              <th className="py-3 px-3 text-center print:hidden">{language === 'mr' ? 'SHA-256 ब्लॉक' : 'Proof Hash Stamp'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DDD3] text-xs font-medium">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-stone-500">
                  {language === 'mr' ? 'कोणतेही व्यवहार आढळले नाहीत.' : 'No transactions found.'}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const targetMember = members.find(m => m.id === row.memberId);
                return (
                  <tr key={row.id} className="hover:bg-amber-50/60 transition">
                    <td className="py-3 px-3 text-center font-bold text-stone-400">{row.index}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-stone-700">
                      {new Date(row.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-[#1C1917]">
                      <button
                        onClick={() => targetMember && onSelectMemberDossier && onSelectMemberDossier(targetMember)}
                        className="hover:text-[#14532D] hover:underline flex items-center gap-1.5 text-left"
                        title="Click to view Member Dossier Profile"
                      >
                        <User className="w-3.5 h-3.5 text-stone-400 print:hidden" />
                        <span>{row.memberName}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-white border border-[#E2DDD3] text-stone-800 px-2 py-0.5 rounded text-[11px] font-bold inline-block mr-1">
                        {getTxTypeLabel(row.type)}
                      </span>
                      {row.notes && <span className="text-stone-600 text-[11px]">({row.notes})</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-[#14532D]">
                      {row.credit > 0 ? `+₹${row.credit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-rose-700">
                      {row.debit > 0 ? `-₹${row.debit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-[#1C1917]">
                      ₹{row.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center print:hidden">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => onVerifyBlock && onVerifyBlock(row.index)}
                          className="inline-flex items-center space-x-1 bg-white hover:bg-emerald-50 text-[#14532D] border border-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-mono transition shadow-2xs font-bold"
                          title={`Full SHA-256 Hash: ${row.hash}`}
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>0x{row.hash.substring(0, 6)}...{row.hash.substring(row.hash.length - 4)}</span>
                        </button>
                        {row.checkpointFingerprint && (
                          <span className="text-[9px] font-mono font-extrabold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-1.5 py-0.2 rounded">
                            {row.checkpointFingerprint}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#F7F4EC] border-t border-[#E2DDD3] text-xs text-stone-600 flex justify-between items-center print:border-t-2 print:border-slate-800">
        <span>
          {language === 'mr' ? `एकूण व्यवहार: ${filteredTransactions.length}` : `Total Transactions: ${filteredTransactions.length}`}
        </span>
        <span className="flex items-center space-x-1 text-[#14532D] font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{language === 'mr' ? 'स्थानिकरीत्या सुरक्षित (SHA-256 Integrity Verified)' : 'Locally Persistent SHA-256 Hash Chain'}</span>
        </span>
      </div>
    </div>
  );
};

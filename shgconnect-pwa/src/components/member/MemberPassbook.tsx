import React, { useState, useMemo } from 'react';
import { Member, Transaction, SupportedLanguage } from '../../types/shg';
import { formatINR } from '../../theme/tokens';
import { tts } from '../../services/tts';
import { BookOpen, Volume2, Filter, ArrowUpRight, ArrowDownLeft, ShieldCheck, Search, Calendar } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface MemberPassbookProps {
  member: Member;
  transactions: Transaction[];
  language: SupportedLanguage;
}

export const MemberPassbook: React.FC<MemberPassbookProps> = ({
  member,
  transactions,
  language
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isMr = language === 'mr';
  const isHi = language === 'hi';

  const memberTransactions = useMemo(() => {
    return transactions
      .filter(t => t.memberId === member.id)
      .filter(t => {
        if (filterType !== 'ALL' && t.type !== filterType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            t.notes?.toLowerCase().includes(q) ||
            t.type.toLowerCase().includes(q) ||
            t.utrReference?.toLowerCase().includes(q) ||
            t.amount.toString().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.index - a.index);
  }, [transactions, member.id, filterType, searchQuery]);

  const speakPassbookSummary = () => {
    const totalTx = memberTransactions.length;
    const msg = isMr
      ? `${member.nameRegional || member.name} यांचे पासबुक: एकूण बचत ₹${member.totalSavings}, थकीत कर्ज ₹${member.activeLoanBalance}. ${totalTx} व्यवहार नोंदवले आहेत.`
      : `${member.name}'s Passbook: Total savings ₹${member.totalSavings}, Loan balance ₹${member.activeLoanBalance}. ${totalTx} transactions recorded.`;
    tts.speak(msg);
  };

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#14532D] to-[#0F4C3A] rounded-3xl p-5 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {isMr ? 'माझे डिजिटल पासबुक' : isHi ? 'मेरा डिजिटल पासबुक' : 'My Digital Passbook'}
              </h2>
              <p className="text-xs text-emerald-200 font-medium">
                {member.nameRegional || member.name} · SHA-256 Ledger Verified
              </p>
            </div>
          </div>

          <button
            onClick={speakPassbookSummary}
            className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow transition active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            <span>{isMr ? 'आवाज सारांश' : 'Voice Summary'}</span>
          </button>
        </div>

        {/* Balance Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider block">
              {isMr ? 'एकूण बचत (Total Savings)' : 'Total Savings'}
            </span>
            <span className="text-2xl font-black text-amber-300 amount-display mt-0.5 block">
              {formatINR(member.totalSavings)}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider block">
              {isMr ? 'कर्ज उर्वरित (Loan Balance)' : 'Loan Outstanding'}
            </span>
            <span className="text-2xl font-black text-white amount-display mt-0.5 block">
              {formatINR(member.activeLoanBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isMr ? 'व्यवहार शोधा...' : 'Search transactions...'}
            className="bg-transparent text-xs font-medium text-gray-800 outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          {['ALL', 'SAVINGS', 'EMI_REPAYMENT', 'LOAN_DISBURSAL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex-shrink-0 ${
                filterType === type
                  ? 'bg-[#14532D] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'ALL'
                ? isMr
                  ? 'सर्व'
                  : 'All'
                : type === 'SAVINGS'
                ? isMr
                  ? 'बचत'
                  : 'Savings'
                : type === 'EMI_REPAYMENT'
                ? isMr
                  ? 'हप्ता'
                  : 'EMI'
                : isMr
                ? 'कर्ज वितरण'
                : 'Loan'}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {memberTransactions.length === 0 ? (
          <Card className="p-8 text-center text-xs text-gray-500 font-medium">
            {isMr ? 'कोणतेही व्यवहार आढळले नाहीत.' : 'No passbook transactions found for selected filter.'}
          </Card>
        ) : (
          memberTransactions.map((tx) => {
            const isSavings = tx.type === 'SAVINGS';
            const isEmi = tx.type === 'EMI_REPAYMENT';
            const isDisbursal = tx.type === 'LOAN_DISBURSAL';

            return (
              <div
                key={tx.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-card hover:shadow-md transition space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSavings
                          ? 'bg-emerald-100 text-emerald-800'
                          : isEmi
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isSavings ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                      ) : isEmi ? (
                        <ArrowUpRight className="w-5 h-5 text-blue-700" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-rose-700" />
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                        <span>
                          {isSavings
                            ? isMr
                              ? 'मासिक बचत जमा'
                              : 'Monthly Savings'
                            : isEmi
                            ? isMr
                              ? 'कर्ज हप्ता परतफेड'
                              : 'EMI Repayment'
                            : isMr
                            ? 'कर्ज वितरण'
                            : 'Loan Disbursal'}
                        </span>
                        {tx.paymentMode === 'UPI_INTENT' && (
                          <Badge variant="blue" size="sm">
                            UPI
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                        {tx.utrReference && (
                          <span className="text-stone-400">· UTR: {tx.utrReference}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-black amount-display ${
                        isSavings || isEmi ? 'text-emerald-800' : 'text-rose-700'
                      }`}
                    >
                      {isSavings || isEmi ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </span>
                    <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-end gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Block #{tx.index}</span>
                    </div>
                  </div>
                </div>

                {tx.notes && (
                  <div className="text-xs bg-[#FDFBF7] p-2 rounded-xl border border-[#E2DDD3]/60 text-stone-700 font-medium">
                    {tx.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

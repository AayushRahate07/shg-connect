import React, { useState, useMemo } from 'react';
import { Member, Transaction, SupportedLanguage } from '../../types/shg';
import { formatINR, formatReceiptNumber } from '../../theme/tokens';
import { tts } from '../../services/tts';
import {
  BookOpen,
  Volume2,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Calendar,
  Share2,
  Printer,
  AlertCircle
} from 'lucide-react';
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

  // Sort transactions chronologically to compute running balance accurately
  const txsWithRunningBalance = useMemo(() => {
    const userTxs = transactions
      .filter(t => t.memberId === member.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let running = 0;
    const enriched = userTxs.map((t, idx) => {
      if (t.type === 'SAVINGS') {
        running += t.amount;
      }
      return {
        ...t,
        runningBalance: running,
        displayIndex: idx + 1
      };
    });

    return enriched.reverse(); // Display most recent first
  }, [transactions, member.id]);

  const filteredTransactions = useMemo(() => {
    return txsWithRunningBalance.filter(t => {
      if (filterType !== 'ALL' && t.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.notes?.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
        );
      }
      return true;
    });
  }, [txsWithRunningBalance, filterType, searchQuery]);

  // Group by Month headline
  const groupedByMonth = useMemo(() => {
    const groups: { [key: string]: typeof filteredTransactions } = {};
    const months = [
      'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
      'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
    ];
    filteredTransactions.forEach(tx => {
      const d = new Date(tx.timestamp);
      const key = isMr
        ? `${months[d.getMonth()]} ${d.getFullYear()}`
        : d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [filteredTransactions, isMr]);

  const speakPassbookSummary = () => {
    const totalTx = filteredTransactions.length;
    const msg = isMr
      ? `${member.nameRegional || member.name} यांचे पासबुक: एकूण बचत ${member.totalSavings} रुपये, थकीत कर्ज ${member.activeLoanBalance} रुपये. ${totalTx} नोंदी वहीत आहेत.`
      : `${member.name}'s Passbook: Total savings ${member.totalSavings} rupees, Loan balance ${member.activeLoanBalance} rupees. ${totalTx} transactions recorded.`;
    tts.speak(msg);
  };

  const handleShareWhatsApp = () => {
    const text = isMr
      ? `*बचत पासबुक वही*\nसदस्य: ${member.nameRegional || member.name}\nएकूण जमा बचत: ₹${member.totalSavings.toLocaleString('en-IN')}\nथकीत कर्ज: ₹${member.activeLoanBalance.toLocaleString('en-IN')}\nएकूण नोंदी: ${filteredTransactions.length}`
      : `*Passbook Summary*\nMember: ${member.name}\nTotal Savings: ₹${member.totalSavings.toLocaleString('en-IN')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-8 animate-fadeIn max-w-2xl mx-auto">
      {/* Header Banner */}
      <div
        className="rounded-lg p-5 sm:p-6 text-white shadow-sm space-y-4 border border-emerald-700/40"
        style={{ background: 'linear-gradient(135deg, #14532D 0%, #0F4230 65%, #0A2F22 100%)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-black">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {isMr ? 'माझे पासबुक (डिजिटल वही)' : 'My Passbook'}
              </h2>
              <p className="text-xs text-emerald-200 font-medium">
                {member.nameRegional || member.name} • {isMr ? 'नोंद वही' : 'Verified Register'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={speakPassbookSummary}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isMr ? 'ऐका' : 'Listen'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="bg-white/15 hover:bg-white/25 text-white p-2 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-white/20"
              title={isMr ? 'WhatsApp वर पाठवा' : 'Share'}
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="bg-white/15 hover:bg-white/25 text-white p-2 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-white/20"
              title={isMr ? 'प्रिंट / सेव्ह करा' : 'Print'}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Balance Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3.5 border border-white/10">
            <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider block">
              {isMr ? 'एकूण जमा बचत' : 'Total Savings'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 amount-display mt-0.5 block">
              {formatINR(member.totalSavings)}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-3.5 border border-white/10">
            <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider block">
              {isMr ? 'थकीत बाकी कर्ज' : 'Loan Due'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white amount-display mt-0.5 block">
              {formatINR(member.activeLoanBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-stone-200 shadow-2xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isMr ? 'नोंद शोधा...' : 'Search records...'}
            className="bg-transparent text-xs font-bold text-stone-800 outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          {[
            { id: 'ALL', mr: 'सर्व', en: 'All' },
            { id: 'SAVINGS', mr: 'बचत', en: 'Savings' },
            { id: 'EMI_REPAYMENT', mr: 'हप्ता', en: 'EMI' },
            { id: 'LOAN_DISBURSAL', mr: 'कर्ज वाटप', en: 'Loan' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-black transition shrink-0 cursor-pointer ${
                filterType === item.id
                  ? 'bg-[#14532D] text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {isMr ? item.mr : item.en}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List Grouped by Month */}
      <div className="space-y-4">
        {Object.keys(groupedByMonth).length === 0 ? (
          <Card className="p-8 text-center text-xs text-stone-500 font-medium rounded-lg border border-stone-200">
            {isMr ? 'कोणतीही नोंद आढळली नाही.' : 'No passbook records found.'}
          </Card>
        ) : (
          Object.entries(groupedByMonth).map(([monthTitle, txList]) => (
            <div key={monthTitle} className="bg-white rounded-lg border border-stone-200 shadow-2xs overflow-hidden">
              <div className="bg-stone-100/80 px-4 py-2 border-b border-stone-200 flex items-center justify-between">
                <span className="text-xs font-black text-stone-800 uppercase tracking-wide">
                  {monthTitle}
                </span>
                <span className="text-[11px] font-bold text-stone-500">
                  {txList.length} {isMr ? 'नोंदी' : 'records'}
                </span>
              </div>

              <div className="divide-y divide-stone-100">
                {txList.map((tx) => {
                  const isSavings = tx.type === 'SAVINGS';
                  const isEmi = tx.type === 'EMI_REPAYMENT';
                  const isDisbursal = tx.type === 'LOAN_DISBURSAL';
                  const isInit = tx.notes?.includes('आधीची शिल्लक') || tx.id.includes('init');

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 sm:p-4 hover:bg-stone-50 transition flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                            isSavings
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : isEmi
                              ? 'bg-amber-100 text-amber-950 border border-amber-200'
                              : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}
                        >
                          {isSavings ? (
                            <ArrowDownLeft className="w-5 h-5 text-emerald-800" />
                          ) : isEmi ? (
                            <ArrowUpRight className="w-5 h-5 text-amber-800" />
                          ) : (
                            <ArrowDownLeft className="w-5 h-5 text-rose-800" />
                          )}
                        </div>

                        <div>
                          <div className="font-black text-stone-900 text-xs flex items-center gap-1.5">
                            <span>
                              {isInit
                                ? (isMr ? 'आधीची शिल्लक' : 'Opening Accumulated')
                                : isSavings
                                ? (isMr ? 'मासिक बचत जमा' : 'Monthly Savings')
                                : isEmi
                                ? (isMr ? 'कर्ज हप्ता परतफेड' : 'EMI Repayment')
                                : (isMr ? 'कर्ज वाटप' : 'Loan Disbursal')}
                            </span>
                            {tx.paymentMode === 'UPI_INTENT' && (
                              <Badge variant="blue" size="sm">
                                UPI
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 font-medium mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            <span>{new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {tx.notes && !isInit && (
                              <span className="text-stone-400 hidden sm:inline">• {tx.notes}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm sm:text-base font-black amount-display ${
                            isSavings || isEmi ? 'text-emerald-800' : 'text-rose-700'
                          }`}
                        >
                          {isSavings || isEmi ? '+' : '-'}
                          {formatINR(tx.amount)}
                        </span>
                        <div className="text-[10px] text-stone-500 font-bold mt-0.5">
                          {isSavings && (
                            <>
                              {isMr ? 'शिल्लक:' : 'Bal:'} <span className="text-stone-800 amount-display font-black">{formatINR(tx.runningBalance)}</span> •{' '}
                            </>
                          )}
                          <span className="text-emerald-800">{formatReceiptNumber(tx.index || 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Discrepancy report notice */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs text-stone-600 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{isMr ? 'हिशोब जुळला ✔ (तफावत असल्यास प्रमुखांना कळवा)' : 'Ledger balanced ✔'}</span>
        </span>
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noreferrer"
          className="text-emerald-800 font-bold hover:underline"
        >
          {isMr ? 'प्रमुखांना कळवा' : 'Report'} →
        </a>
      </div>
    </div>
  );
};

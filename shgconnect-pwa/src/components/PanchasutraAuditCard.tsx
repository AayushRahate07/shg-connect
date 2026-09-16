import React from 'react';
import { SupportedLanguage, PanchasutraScore, Member, Transaction } from '../types/shg';
import { Award, Building2, CheckCircle2, ShieldCheck, TrendingUp, AlertTriangle, Scale } from 'lucide-react';

interface PanchasutraAuditCardProps {
  members: Member[];
  transactions: Transaction[];
  isChainValid: boolean;
  language: SupportedLanguage;
}

export function calculatePanchasutraScore(
  members: Member[],
  transactions: Transaction[],
  isChainValid: boolean
): PanchasutraScore {
  const totalSavingsPool = members.reduce((sum, m) => sum + m.totalSavings, 0);
  const totalActiveLoans = members.reduce((sum, m) => sum + m.activeLoanBalance, 0);

  // 1. Regular Meetings Score (0-20)
  const regularMeetingsScore = 20;

  // 2. Regular Savings Score (0-20)
  const nonZeroSavers = members.filter(m => m.totalSavings > 0).length;
  const regularSavingsScore = Math.round((nonZeroSavers / (members.length || 1)) * 20);

  // 3. Internal Lending Score (0-20)
  const lendingRatio = totalSavingsPool > 0 ? (totalActiveLoans / totalSavingsPool) : 0;
  const internalLendingScore = lendingRatio > 0.3 ? 20 : Math.round(lendingRatio * 60);

  // 4. Timely Recovery Score (0-20)
  const avgTrust = members.reduce((sum, m) => sum + m.trustScore, 0) / (members.length || 1);
  const timelyRecoveryScore = Math.min(20, Math.round((avgTrust / 100) * 20));

  // 5. Transparent Books Score (0-20)
  const transparentBooksScore = isChainValid ? 20 : 0;

  const totalScore = regularMeetingsScore + regularSavingsScore + internalLendingScore + timelyRecoveryScore + transparentBooksScore;

  let bankGrade: 'Grade A' | 'Grade B' | 'Grade C' = 'Grade A';
  let multiplier = 10;
  if (totalScore < 65) {
    bankGrade = 'Grade C';
    multiplier = 2;
  } else if (totalScore < 80) {
    bankGrade = 'Grade B';
    multiplier = 5;
  }

  const loanEligibilityInr = totalSavingsPool * multiplier;

  return {
    regularMeetingsScore,
    regularSavingsScore,
    internalLendingScore,
    timelyRecoveryScore,
    transparentBooksScore,
    totalScore,
    bankGrade,
    loanEligibilityInr
  };
}

export const PanchasutraAuditCard: React.FC<PanchasutraAuditCardProps> = ({
  members,
  transactions,
  isChainValid,
  language
}) => {
  const score = calculatePanchasutraScore(members, transactions, isChainValid);

  // Circular gauge calculations
  const strokeDashoffset = 283 - (283 * score.totalScore) / 100;

  return (
    <div className="bg-[#FDFBF7] border-2 border-[#E2DDD3] rounded-3xl p-6 shadow-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DDD3] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#14532D] text-emerald-100 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              NRLM / NABARD Norms
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${
              score.bankGrade === 'Grade A' ? 'bg-amber-400 text-amber-950' : 'bg-blue-600 text-white'
            }`}>
              {score.bankGrade}
            </span>
          </div>
          <h2 className="text-xl font-black text-[#1C1917] mt-2 flex items-center gap-2">
            🏛️ {language === 'mr' ? 'नाबार्ड "पंचसूत्र" बँक क्रेडिट मानके' : 'NABARD Panchasutra Credit Linkage Audit'}
          </h2>
          <p className="text-xs text-stone-600">
            {language === 'mr'
              ? 'बँक कर्जासाठी बचत गटाचे ५ संस्थात्मक निकष मूल्यमापन'
              : 'Institutional 5-Pillar evaluation for Indian Bank Credit Linkage'}
          </p>
        </div>

        {/* Circular Gauge */}
        <div className="flex items-center space-x-4 bg-white p-3 px-5 rounded-2xl border border-[#E2DDD3] shadow-xs">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#E2DDD3"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke={score.totalScore >= 80 ? '#14532D' : score.totalScore >= 65 ? '#B45309' : '#C2410C'}
                strokeWidth="8"
                strokeDasharray="213"
                strokeDashoffset={213 - (213 * score.totalScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-[#1C1917]">{score.totalScore}</span>
              <span className="text-[9px] text-stone-500 font-bold">/ 100</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-stone-500 uppercase">{language === 'mr' ? 'पात्रता दर्जा' : 'Credit Linkage'}</div>
            <div className="text-lg font-black text-[#14532D]">{score.bankGrade}</div>
            <div className="text-[11px] font-semibold text-amber-900">NABARD Qualified</div>
          </div>
        </div>
      </div>

      {/* 5 Panchasutra Pillars Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Pillar 1 */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="text-[11px] font-bold text-stone-700 truncate">
            १. नियमित बैठक
          </div>
          <div className="text-xs font-black text-[#14532D]">{score.regularMeetingsScore} / 20</div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#14532D] h-2 rounded-full" style={{ width: `${(score.regularMeetingsScore / 20) * 100}%` }}></div>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="text-[11px] font-bold text-stone-700 truncate">
            २. नियमित बचत
          </div>
          <div className="text-xs font-black text-[#14532D]">{score.regularSavingsScore} / 20</div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#14532D] h-2 rounded-full" style={{ width: `${(score.regularSavingsScore / 20) * 100}%` }}></div>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="text-[11px] font-bold text-stone-700 truncate">
            ३. अंतर्गत कर्ज
          </div>
          <div className="text-xs font-black text-[#14532D]">{score.internalLendingScore} / 20</div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#14532D] h-2 rounded-full" style={{ width: `${(score.internalLendingScore / 20) * 100}%` }}></div>
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="text-[11px] font-bold text-stone-700 truncate">
            ४. वेळेवर परतफेड
          </div>
          <div className="text-xs font-black text-[#14532D]">{score.timelyRecoveryScore} / 20</div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#14532D] h-2 rounded-full" style={{ width: `${(score.timelyRecoveryScore / 20) * 100}%` }}></div>
          </div>
        </div>

        {/* Pillar 5 (SHA-256 Verifier Linked) */}
        <div className={`p-3 rounded-2xl border space-y-1 ${
          score.transparentBooksScore > 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'
        }`}>
          <div className="text-[11px] font-bold text-stone-900 truncate flex items-center justify-between">
            <span>५. पारदर्शक हिशोब</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-xs font-black text-[#14532D]">{score.transparentBooksScore} / 20</div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${(score.transparentBooksScore / 20) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Bank Linkage Estimate Banner */}
      <div className="bg-[#F7F4EC] border border-[#E2DDD3] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#14532D] text-amber-400 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-600 font-bold uppercase">
              {language === 'mr' ? 'अंदाजित बँक कर्ज पात्रता (Bank Loan Eligibility)' : 'Estimated Bank Credit Linkage'}
            </span>
            <div className="text-2xl font-black text-[#1C1917]">
              ₹{score.loanEligibilityInr.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="text-xs text-stone-600 max-w-xs text-right">
          {language === 'mr' 
            ? 'गट ग्रेड A असल्यामुळे बचत रक्कमेच्या १० पट पर्यंत बँक कर्ज मिळण्यास पात्र.'
            : 'Grade A classification entitles the SHG to up to 10x savings pool credit linkage.'}
        </div>
      </div>
    </div>
  );
};

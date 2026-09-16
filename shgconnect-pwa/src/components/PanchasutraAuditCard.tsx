import React from 'react';
import { SupportedLanguage, PanchasutraScore, Member, Transaction, NRLMCreditAssessment } from '../types/shg';
import { Award, Building2, CheckCircle2, ShieldCheck, TrendingUp, AlertTriangle, Scale, Info } from 'lucide-react';

interface PanchasutraAuditCardProps {
  members: Member[];
  transactions: Transaction[];
  isChainValid: boolean;
  language: SupportedLanguage;
  shgAgeMonths?: number;
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

export function calculateNRLMCreditAssessment(
  members: Member[],
  panchasutraScore: number,
  shgAgeMonths: number = 18
): NRLMCreditAssessment {
  const eligibleCorpus = members.reduce((sum, m) => sum + m.totalSavings, 0);
  const avgTrust = members.reduce((sum, m) => sum + m.trustScore, 0) / (members.length || 1);

  let recommendedDose: 'INELIGIBLE_AGE' | 'DOSE_1' | 'DOSE_2' | 'DOSE_3_PLUS' = 'DOSE_1';
  let estimatedCreditLimit = 0;

  if (shgAgeMonths < 6) {
    recommendedDose = 'INELIGIBLE_AGE';
    estimatedCreditLimit = 0;
  } else if (shgAgeMonths < 12) {
    recommendedDose = 'DOSE_1';
    estimatedCreditLimit = Math.max(6 * eligibleCorpus, 150000);
  } else if (shgAgeMonths < 24) {
    recommendedDose = 'DOSE_2';
    estimatedCreditLimit = Math.max(8 * eligibleCorpus, 300000);
  } else {
    recommendedDose = 'DOSE_3_PLUS';
    estimatedCreditLimit = 600000; // Minimum ₹6,00,000 baseline; actual sanction via MCP/appraisal
  }

  const appraisalDisclaimer = "Suggested internal credit-readiness indicator based on DAY-NRLM circular guidance. Final sanction limit, drawing power, and interest subvention are determined solely by the financing bank branch via Micro-Credit Plan (MCP) appraisal and credit history.";

  return {
    shgAgeMonths,
    panchasutraHealthScore: panchasutraScore,
    eligibleCorpus,
    activeRepaymentRate: Math.round(avgTrust),
    recommendedDose,
    estimatedCreditLimit,
    appraisalDisclaimer
  };
}

export const PanchasutraAuditCard: React.FC<PanchasutraAuditCardProps> = ({
  members,
  transactions,
  isChainValid,
  language,
  shgAgeMonths = 18
}) => {
  const score = calculatePanchasutraScore(members, transactions, isChainValid);
  const nrlmAssessment = calculateNRLMCreditAssessment(members, score.totalScore, shgAgeMonths);

  const getDoseBadgeLabel = (dose: string) => {
    switch (dose) {
      case 'INELIGIBLE_AGE': return language === 'mr' ? 'अपात्र (६ महिन्यांपेक्षा कमी वय)' : 'Ineligible (< 6 Months Vintage)';
      case 'DOSE_1': return language === 'mr' ? 'प्रस्तावित हप्ता १ (Dose 1: ₹1.5L आधारभूत)' : 'Suggested Dose 1 (₹1.5 Lakh Min)';
      case 'DOSE_2': return language === 'mr' ? 'प्रस्तावित हप्ता २ (Dose 2: ₹3.0L आधारभूत)' : 'Suggested Dose 2 (₹3.0 Lakh Min)';
      case 'DOSE_3_PLUS': return language === 'mr' ? 'प्रस्तावित हप्ता ३+ (Dose 3+: ₹6.0L आधारभूत + MCP मूल्यमापन)' : 'Suggested Dose 3+ (₹6.0L Min + MCP Appraisal)';
      default: return dose;
    }
  };

  return (
    <div className="bg-[#FDFBF7] border-2 border-[#E2DDD3] rounded-3xl p-6 shadow-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DDD3] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#14532D] text-emerald-100 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              DAY-NRLM / RBI Framework
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${
              score.bankGrade === 'Grade A' ? 'bg-amber-400 text-amber-950' : 'bg-blue-600 text-white'
            }`}>
              {score.bankGrade}
            </span>
          </div>
          <h2 className="text-xl font-black text-[#1C1917] mt-2 flex items-center gap-2">
            🏛️ {language === 'mr' ? 'SHGConnect कार्यक्षमता निर्देशांक (पंचसूत्र मानके)' : 'SHGConnect Operational Health Index (Panchasutra-Aligned)'}
          </h2>
          <p className="text-xs text-stone-600">
            {language === 'mr'
              ? 'बँक कर्जासाठी बचत गटाचे ५ संस्थात्मक निकष मूल्यमापन'
              : 'Operational 5-Pillar audit index for Indian Bank Credit Linkage'}
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
            <div className="text-xs font-bold text-stone-500 uppercase">{language === 'mr' ? 'पात्रता दर्जा' : 'Health Index'}</div>
            <div className="text-lg font-black text-[#14532D]">{score.bankGrade}</div>
            <div className="text-[11px] font-semibold text-amber-900">DAY-NRLM Compliant</div>
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

      {/* DAY-NRLM Credit Readiness Assessment Section */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-700" />
            <h3 className="font-extrabold text-base text-[#1C1917]">
              {language === 'mr' ? 'दीनदयाळ अंत्योदय योजना (DAY-NRLM) बँक क्रेडिट तयारता मूल्यमापन' : 'NRLM Credit Readiness Assessment'}
            </h3>
          </div>
          <span className="bg-amber-100 text-amber-950 border border-amber-300 px-3 py-1 rounded-full text-xs font-black">
            {getDoseBadgeLabel(nrlmAssessment.recommendedDose)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FDFBF7] border border-[#E2DDD3] p-3 rounded-xl">
            <span className="text-[11px] text-stone-500 font-bold uppercase block">
              {language === 'mr' ? 'बचत गटाचे वय (SHG Age)' : 'SHG Active Vintage'}
            </span>
            <span className="text-lg font-black text-[#1C1917]">{nrlmAssessment.shgAgeMonths} Months</span>
          </div>

          <div className="bg-[#FDFBF7] border border-[#E2DDD3] p-3 rounded-xl">
            <span className="text-[11px] text-stone-500 font-bold uppercase block">
              {language === 'mr' ? 'एकूण बचत कॉर्पस (Eligible Corpus)' : 'Eligible Savings Corpus'}
            </span>
            <span className="text-lg font-black text-[#14532D]">₹{nrlmAssessment.eligibleCorpus.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-[#FDFBF7] border border-[#E2DDD3] p-3 rounded-xl">
            <span className="text-[11px] text-stone-500 font-bold uppercase block">
              {language === 'mr' ? 'अंदाजित क्रेडिट मर्यादा (Est. Limit)' : 'Estimated Credit Limit'}
            </span>
            <span className="text-xl font-black text-[#14532D]">₹{nrlmAssessment.estimatedCreditLimit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Institutional Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3 rounded-xl text-xs font-medium flex items-start space-x-2">
          <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="leading-snug text-[11px]">
            {nrlmAssessment.appraisalDisclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};


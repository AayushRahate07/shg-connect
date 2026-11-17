import { Loan, Member } from '../types/shg';
import {
  ClimateBufferState,
  ClimatePanchasutraReport,
  LoanClimateCategory
} from '../types/climate';
import { runMonteCarloSimulationSync } from './climateSimulator';
import { inferClimateCategory, CITED_AGRONOMY_SENSITIVITIES } from '../data/climateAssumptions';
import { getClimateAIProvider } from './climateAiProviders';

/**
 * Computes the Supplementary Climate Resilience Index (0 - 100).
 *
 * Designed with absolute scientific honesty under banking and auditor scrutiny:
 * 1. Explicitly flagged as "Supplementary (Not a NABARD Standard)".
 * 2. Component 1: Stress-Test Survival Margin (0–40 pts) under standard -30% drought.
 * 3. Component 2: Portfolio Diversification (0–30 pts) via 1 - HHI across loan categories.
 * 4. Component 3: Climate Buffer Solvency & Governance (0–30 pts).
 */
export async function calculateClimatePanchasutraScore(
  loans: Loan[],
  members: Member[],
  bufferState: ClimateBufferState,
  officialScore: number = 92
): Promise<ClimatePanchasutraReport> {
  const provider = getClimateAIProvider();
  const weights = await provider.getCalibrationWeights(bufferState.shgId);

  // 1. Calculate Component 2: Loan Portfolio Diversification (1 - HHI)
  const totalPrincipal = loans.reduce((sum, l) => sum + (l.remainingBalance || l.principal), 0) || 1;
  const categoryTotals: Record<LoanClimateCategory, number> = {
    RAINFED_CROP: 0,
    IRRIGATED_AGRI: 0,
    DAIRY_LIVESTOCK: 0,
    NONFARM_MICROENTERPRISE: 0,
    HEALTH_CONSUMPTION: 0
  };

  loans.forEach(l => {
    const cat = l.climateCategory || inferClimateCategory(
      members.find(m => m.id === l.memberId)?.occupation,
      l.memberName
    );
    categoryTotals[cat] += (l.remainingBalance || l.principal);
  });

  // Calculate Herfindahl-Hirschman Index (HHI)
  // HHI = sum(s_i^2), ranges from 0.20 (5 equal shares) to 1.0 (100% in 1 category)
  let hhi = 0;
  (Object.keys(categoryTotals) as LoanClimateCategory[]).forEach(cat => {
    const share = categoryTotals[cat] / totalPrincipal;
    hhi += share * share;
  });
  hhi = Math.min(1.0, Math.max(0.20, hhi));

  // Scale (1 - HHI) to 0 - 30 points (at HHI 0.20 -> 30 pts; at HHI 1.0 -> 0 pts)
  const diversificationPts = Math.round(
    Math.min(30, Math.max(0, ((1 - hhi) / 0.8) * (weights.diversityW / 0.30) * 30))
  );

  // 2. Calculate Component 1: Stress-Test Survival Margin under -30% drought benchmark
  const stressLoans = loans.map(l => ({
    id: l.id,
    category: l.climateCategory || inferClimateCategory(
      members.find(m => m.id === l.memberId)?.occupation,
      l.memberName
    ),
    principalOutstanding: l.remainingBalance || l.principal,
    monthlyEmi: Math.round((l.principal / (l.tenureMonths || 12)) + (l.principal * (l.interestRateMonthly || 1.5)) / 100),
    remainingTenureMonths: 12
  }));

  const simResult = runMonteCarloSimulationSync({
    rainfallDeficitPct: -30,
    heatAnomalyC: 1.5,
    initialCashBoxInr: 68400,
    initialBufferInr: bufferState.balanceInr,
    monthlyMemberSavingsInr: (members.length || 10) * 300,
    loans: stressLoans,
    horizonMonths: 12,
    trials: 400, // fast deterministic calibration
    seed: 42
  }, CITED_AGRONOMY_SENSITIVITIES);

  const survivalMedian = (simResult.survivalRangePct[0] + simResult.survivalRangePct[1]) / 2;
  // Scale survival percentage to 0 - 40 points
  const survivalMarginPts = Math.round(
    Math.min(40, Math.max(0, (survivalMedian / 100) * (weights.survivalW / 0.40) * 40))
  );

  // 3. Calculate Component 3: Climate Buffer Readiness & Governance (0–30 pts)
  // Target liability: 1 month of full member relief = 10 members * ₹500 = ₹5,000
  const targetLiability = (members.length || 10) * (bufferState.policy.grantAmountPerMemberInr || 500);
  const coverageRatio = bufferState.balanceInr / Math.max(1, targetLiability);

  // Up to 15 pts for solvency coverage ratio
  const coveragePts = Math.min(15, Math.round(coverageRatio * 15));
  // 5 pts for active pre-agreed policy
  const policyPts = bufferState.policy.thresholdC > 0 ? 5 : 0;
  // 10 pts for OTP audit trail entries
  const governancePts = bufferState.ledger.length > 0 ? 10 : 5;
  const bufferAdequacyPts = Math.round(
    Math.min(30, (coveragePts + policyPts + governancePts) * (weights.bufferW / 0.30))
  );

  const supplementaryClimateIndex = Math.min(
    100,
    Math.max(0, survivalMarginPts + diversificationPts + bufferAdequacyPts)
  );

  return {
    officialNabardScore: officialScore,
    supplementaryClimateIndex,
    diversificationHhiScore: diversificationPts,
    stressSurvivalMarginScore: survivalMarginPts,
    bufferAdequacyScore: bufferAdequacyPts,
    isOfficialNabardStandard: false,
    cryptographicScopeDisclaimer:
      'The SHA-256 hash chain and Merkle checkpoint prove that the underlying SHG financial records, loan ledger, and buffer approvals have not been altered since commitment; they do not prove that the climate stress assumptions or weather forecasts are right.',
    breakdown: {
      survivalMarginPts,
      diversificationPts,
      bufferAdequacyPts,
      hhiValue: Number(hhi.toFixed(3)),
      survivalMedianPct: Math.round(survivalMedian),
      bufferCoverageMonths: Number(coverageRatio.toFixed(1))
    }
  };
}

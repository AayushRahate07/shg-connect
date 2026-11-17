/**
 * Climate Domain Models & Invariants
 * Pure TypeScript types for 100% offline mathematical simulation,
 * heat-wage shielding, and supplementary climate scoring.
 */

export type LoanClimateCategory =
  | 'RAINFED_CROP'
  | 'IRRIGATED_AGRI'
  | 'DAIRY_LIVESTOCK'
  | 'NONFARM_MICROENTERPRISE'
  | 'HEALTH_CONSUMPTION';

export interface LoanSensitivityAssumption {
  category: LoanClimateCategory;
  categoryLabelMr: string;
  categoryLabelEn: string;
  baseMonthlyDefaultProb: number; // e.g. 0.025 (2.5%/month base)
  rainfallElasticity: number;     // Multiplier on rainfall deficit
  heatElasticity: number;         // Multiplier on heat anomaly
  recoveryHaircut: number;        // Haircut on collateral/recovery in drought (0.0 - 1.0)
  sourceCitation: string;         // Public agronomy / IMD / ICRISAT literature citation
}

export interface StressTestLoanItem {
  id: string;
  category: LoanClimateCategory;
  principalOutstanding: number;
  monthlyEmi: number;
  remainingTenureMonths: number;
  isNpa?: boolean;
}

export interface StressTestInput {
  rainfallDeficitPct: number; // e.g. -35 for 35% deficit (0 to -60)
  heatAnomalyC: number;       // e.g. +2.0 C (0 to 4.0)
  initialCashBoxInr: number;
  initialBufferInr: number;
  monthlyMemberSavingsInr: number;
  loans: StressTestLoanItem[];
  horizonMonths?: number;     // Default 12
  trials?: number;            // Default 1500
  seed?: number;              // Deterministic PRNG seed (default 42)
}

export interface CategoryExposure {
  category: LoanClimateCategory;
  categoryLabelEn: string;
  categoryLabelMr: string;
  principalInr: number;
  sharePct: number;
  stressedDefaultRangePct: [number, number]; // [10th percentile, 90th percentile]
}

export interface StressTestResult {
  survivalRangePct: [number, number];        // [p10, p90] e.g. [38, 47] - Honest range, never single point!
  projectedDefaultMonthRange: [number, number] | null; // e.g. [5, 7] or null if survives horizon
  exposureByCategory: CategoryExposure[];
  assumptionsSnapshot: LoanSensitivityAssumption[];
  trialsRun: number;
  isStressed: boolean;
  timestamp: string;
}

export interface HeatShieldPolicy {
  triggerMetric: 'WBGT' | 'HEAT_INDEX';
  thresholdC: number;                        // e.g. 31.5°C WBGT or 41.0°C Heat Index
  minConsecutiveDays: number;                // e.g. 2
  waiveLatePenalty: boolean;
  grantAmountPerMemberInr: number;           // e.g. ₹500
  fundingRule: {
    interestSurplusPct: number;              // e.g. 5% of monthly interest retained
    monthlyMemberContributionInr: number;    // e.g. ₹20 per member per month
  };
  emptyBufferFallback: 'PENALTY_WAIVER_ONLY' | 'PRO_RATA_CAP';
}

export interface ClimateBufferEntry {
  id: string;
  date: string;
  type: 'CONTRIBUTION_INTEREST_SURPLUS' | 'CONTRIBUTION_MEMBER_LEVY' | 'GRANT_DISBURSED';
  amountInr: number;
  memberId?: string;
  description: string;
  txHash?: string;
}

export interface ClimateBufferState {
  shgId: string;
  balanceInr: number;
  totalContributedInr: number;
  totalDisbursedInr: number;
  policy: HeatShieldPolicy;
  ledger: ClimateBufferEntry[];
  isDemoEmptyBufferSimulated?: boolean;
}

export interface HeatReliefProposal {
  id: string;
  shgId: string;
  memberId: string;
  memberName: string;
  type: 'PENALTY_WAIVER' | 'BUFFER_GRANT';
  requestedAmountInr: number;
  measuredWbgtC: number;
  measuredHeatIndexC: number;
  forecastDate: string;
  status: 'PROPOSED' | 'APPROVED_OTP' | 'REJECTED' | 'DEFERRED_EMPTY_BUFFER';
  otpVerifiedAt?: string;
  blockHash?: string;
  notes?: string;
}

export interface ClimatePanchasutraReport {
  officialNabardScore: number;               // 0 - 100 official 5-pillar score
  supplementaryClimateIndex: number;         // 0 - 100 supplementary climate resilience index
  diversificationHhiScore: number;           // 0 - 30 pts (1 - HHI across loan categories)
  stressSurvivalMarginScore: number;         // 0 - 40 pts (from -30% drought survival)
  bufferAdequacyScore: number;               // 0 - 30 pts (buffer balance / 1-month heat relief liability)
  isOfficialNabardStandard: false;           // Mandatory honesty flag
  cryptographicScopeDisclaimer: string;      // Explicit legal / cryptographic limitation disclaimer
  breakdown: {
    survivalMarginPts: number;
    diversificationPts: number;
    bufferAdequacyPts: number;
    hhiValue: number;
    survivalMedianPct: number;
    bufferCoverageMonths: number;
  };
}

export interface DailyHeatForecast {
  date: string;
  dayName: string;
  maxTempC: number;
  relativeHumidityPct: number;
  solarRadiationProxy: 'SUN' | 'SHADE';
  wbgtC: number;
  heatIndexC: number;
  isBreached: boolean;
}

export interface DistrictHeatForecastData {
  district: string;
  state: string;
  cachedAt: string;
  forecastSource: string;
  forecasts: DailyHeatForecast[];
}

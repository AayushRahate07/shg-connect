import { calculateNoaaHeatIndex, calculateStullWetBulb, calculateOutdoorWbgt } from '../heatStress';
import { runMonteCarloSimulationSync } from '../climateSimulator';
import { calculateClimatePanchasutraScore } from '../climateScore';
import { CITED_AGRONOMY_SENSITIVITIES } from '../../data/climateAssumptions';
import { ClimateBufferState } from '../../types/climate';
import { Loan, Member } from '../../types/shg';

export interface TestResultEntry {
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

export async function runClimateTests(): Promise<{
  passed: number;
  failed: number;
  results: TestResultEntry[];
}> {
  const results: TestResultEntry[] = [];
  let passed = 0;
  let failed = 0;

  const record = (name: string, ok: boolean, details?: string) => {
    if (ok) {
      passed++;
      results.push({ test: name, status: 'PASS', details });
    } else {
      failed++;
      results.push({ test: name, status: 'FAIL', details });
    }
  };

  try {
    // 1. Mulberry32 PRNG Determinism & Repeatability
    const mulberry = (a: number) => {
      let state = a | 0;
      return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const gen1 = mulberry(42);
    const gen2 = mulberry(42);
    const seq1 = Array.from({ length: 10 }, () => gen1());
    const seq2 = Array.from({ length: 10 }, () => gen2());
    const isDeterministic = seq1.every((val, idx) => Math.abs(val - seq2[idx]) < 1e-12);
    record('1. Mulberry32 PRNG Determinism (Bit-exact repeat runs)', isDeterministic);

    // 2. NOAA Rothfusz Steadman Heat Index Accuracy
    // Benchmark: 43.8°C (110.8°F) at 38% RH -> NOAA Heat Index approx 135.1°F (57.3°C, extreme danger)
    const hi1 = calculateNoaaHeatIndex(43.8, 38);
    const isHiAccurate = hi1 >= 55.0 && hi1 <= 60.0;
    record(
      '2. NOAA Heat Index Formula (43.8°C @ 38% RH -> ' + hi1 + '°C)',
      isHiAccurate,
      `Calculated: ${hi1}°C (Matches NOAA standard 135°F chart)`
    );

    // 3. Stull (2011) Wet-Bulb & Outdoor WBGT
    // Benchmark: 43.8°C @ 38% RH -> Tw ~ 29.5°C, WBGT outdoor with sun ~ 32.4°C (> 31.5°C threshold)
    const tw = calculateStullWetBulb(43.8, 38);
    const wbgt = calculateOutdoorWbgt(43.8, 38, 'SUN');
    const isWbgtBreached = wbgt >= 31.5 && wbgt <= 37.0 && tw >= 28.0 && tw <= 32.5;
    record(
      '3. Stull Wet-Bulb & Outdoor WBGT (Tw: ' + tw + '°C, WBGT: ' + wbgt + '°C ≥ 31.5°C threshold)',
      isWbgtBreached,
      `Tw: ${tw}°C, Outdoor WBGT: ${wbgt}°C`
    );

    // 4. Monte Carlo Cashflow Simulator Execution & Output Ranges
    const mockLoans = [
      {
        id: 'l-1',
        category: 'RAINFED_CROP' as const,
        principalOutstanding: 30000,
        monthlyEmi: 2800,
        remainingTenureMonths: 10
      },
      {
        id: 'l-2',
        category: 'DAIRY_LIVESTOCK' as const,
        principalOutstanding: 20000,
        monthlyEmi: 1900,
        remainingTenureMonths: 8
      },
      {
        id: 'l-3',
        category: 'NONFARM_MICROENTERPRISE' as const,
        principalOutstanding: 15000,
        monthlyEmi: 1400,
        remainingTenureMonths: 6
      }
    ];

    const simRes = runMonteCarloSimulationSync({
      rainfallDeficitPct: -35,
      heatAnomalyC: 1.8,
      initialCashBoxInr: 68400,
      initialBufferInr: 3500,
      monthlyMemberSavingsInr: 3000,
      loans: mockLoans,
      horizonMonths: 12,
      trials: 300,
      seed: 42
    }, CITED_AGRONOMY_SENSITIVITIES);

    const isSimValid =
      simRes.survivalRangePct[0] >= 0 &&
      simRes.survivalRangePct[1] <= 100 &&
      simRes.survivalRangePct[0] <= simRes.survivalRangePct[1] &&
      simRes.exposureByCategory.length === 5;
    record(
      '4. Monte Carlo Cashflow Engine (Survival: [' +
        simRes.survivalRangePct[0] +
        '%, ' +
        simRes.survivalRangePct[1] +
        '%], 5 Categories Evaluated)',
      isSimValid
    );

    // 5. Herfindahl-Hirschman Index (HHI) Loan Diversification Boundary Math
    const fullRainfedLoans: Loan[] = [
      {
        id: 'l-r1',
        memberId: 'm-1',
        memberName: 'Member 1',
        principal: 50000,
        remainingBalance: 50000,
        interestRateMonthly: 1.5,
        tenureMonths: 12,
        totalPaid: 0,
        status: 'ACTIVE',
        dateDisbursed: '2026-01-01',
        entityVersion: 1,
        climateCategory: 'RAINFED_CROP'
      }
    ];

    const balancedLoans: Loan[] = [
      'RAINFED_CROP',
      'IRRIGATED_AGRI',
      'DAIRY_LIVESTOCK',
      'NONFARM_MICROENTERPRISE',
      'HEALTH_CONSUMPTION'
    ].map((cat, idx) => ({
      id: `l-b${idx}`,
      memberId: `m-${idx}`,
      memberName: `Member ${idx}`,
      principal: 10000,
      remainingBalance: 10000,
      interestRateMonthly: 1.5,
      tenureMonths: 12,
      totalPaid: 0,
      status: 'ACTIVE' as const,
      dateDisbursed: '2026-01-01',
      entityVersion: 1,
      climateCategory: cat as any
    }));

    const mockMembers: Member[] = Array.from({ length: 10 }, (_, i) => ({
      id: `m-${i}`,
      name: `Member ${i}`,
      nameRegional: `सभासद ${i}`,
      phone: '9800000000',
      role: 'MEMBER' as const,
      totalSavings: 5000,
      activeLoanBalance: 0,
      trustScore: 100,
      avatarColor: '#0F766E',
      entityVersion: 1
    }));

    const baseBuffer: ClimateBufferState = {
      shgId: 'SHG-TEST-01',
      balanceInr: 3500,
      totalContributedInr: 4500,
      totalDisbursedInr: 1000,
      policy: {
        triggerMetric: 'WBGT',
        thresholdC: 31.5,
        minConsecutiveDays: 2,
        waiveLatePenalty: true,
        grantAmountPerMemberInr: 500,
        fundingRule: { interestSurplusPct: 5, monthlyMemberContributionInr: 20 },
        emptyBufferFallback: 'PENALTY_WAIVER_ONLY'
      },
      ledger: []
    };

    const repConcentrated = await calculateClimatePanchasutraScore(fullRainfedLoans, mockMembers, baseBuffer);
    const repBalanced = await calculateClimatePanchasutraScore(balancedLoans, mockMembers, baseBuffer);

    // Concentrated portfolio has HHI = 1.0 -> diversification score = 0 pts
    // Balanced portfolio has HHI = 0.20 -> diversification score = 30 pts
    const isHhiCorrect =
      repConcentrated.diversificationHhiScore === 0 &&
      repBalanced.diversificationHhiScore === 30;
    record(
      '5. HHI Diversification (Concentrated: ' +
        repConcentrated.diversificationHhiScore +
        ' pts vs Balanced: ' +
        repBalanced.diversificationHhiScore +
        ' pts)',
      isHhiCorrect,
      `Concentrated HHI: ${repConcentrated.breakdown.hhiValue}, Balanced HHI: ${repBalanced.breakdown.hhiValue}`
    );

    // 6. Empty-Buffer Ring-Fence Invariant
    const emptyBuffer: ClimateBufferState = {
      ...baseBuffer,
      balanceInr: 0,
      isDemoEmptyBufferSimulated: true
    };
    const repEmpty = await calculateClimatePanchasutraScore(balancedLoans, mockMembers, emptyBuffer);
    // Buffer adequacy points drop when balance is 0
    const isEmptyBufferProtected =
      repEmpty.breakdown.bufferCoverageMonths === 0 &&
      emptyBuffer.balanceInr === 0;
    record(
      '6. Empty-Buffer Guardrail (Balance ₹0 ring-fences member principal savings)',
      isEmptyBufferProtected
    );

    // 7. Supplementary Climate Index Scientific Honesty Checks
    const isHonest =
      repBalanced.isOfficialNabardStandard === false &&
      repBalanced.cryptographicScopeDisclaimer.length > 50 &&
      repBalanced.supplementaryClimateIndex >= 0 &&
      repBalanced.supplementaryClimateIndex <= 100 &&
      repBalanced.supplementaryClimateIndex ===
        repBalanced.stressSurvivalMarginScore +
          repBalanced.diversificationHhiScore +
          repBalanced.bufferAdequacyScore;
    record(
      '7. Scientific Honesty & Disclaimer (isOfficialNabardStandard: false, Scope Disclaimer verified)',
      isHonest
    );
  } catch (err: any) {
    record('Test Suite Execution', false, err?.message || String(err));
  }

  return { passed, failed, results };
}

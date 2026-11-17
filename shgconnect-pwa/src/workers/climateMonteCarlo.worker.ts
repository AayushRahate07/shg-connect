import {
  StressTestInput,
  StressTestResult,
  LoanSensitivityAssumption,
  CategoryExposure,
  LoanClimateCategory
} from '../types/climate';

/**
 * Deterministic Mulberry32 32-bit PRNG
 * Produces rock-solid, repeatable pseudorandom sequences across runs with identical seed.
 */
function mulberry32(a: number): () => number {
  let state = a | 0;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform for sampling standard normal distribution Z ~ N(0, 1)
 */
function sampleStandardNormal(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * 1,500-Trial Stochastic 12-Month Cashflow Simulation Engine
 */
export function runSimulation(
  input: StressTestInput,
  sensitivities: LoanSensitivityAssumption[]
): StressTestResult {
  const seed = input.seed || 42;
  const rand = mulberry32(seed);

  const totalTrials = input.trials || 1500;
  const numBatches = 10;
  const trialsPerBatch = Math.floor(totalTrials / numBatches);
  const horizon = input.horizonMonths || 12;

  // Sensitivity lookup map
  const sensMap = new Map<LoanClimateCategory, LoanSensitivityAssumption>();
  sensitivities.forEach(s => sensMap.set(s.category, s));

  // Default fallback assumption
  const fallbackSens: LoanSensitivityAssumption = {
    category: 'RAINFED_CROP',
    categoryLabelEn: 'Rainfed Agriculture',
    categoryLabelMr: 'जिरायती शेती',
    baseMonthlyDefaultProb: 0.025,
    rainfallElasticity: 1.85,
    heatElasticity: 0.45,
    recoveryHaircut: 0.65,
    sourceCitation: 'IMD Standard Model'
  };

  const rainfallDeficitAbs = Math.min(60, Math.max(0, Math.abs(input.rainfallDeficitPct)));
  const heatAnomaly = Math.min(5, Math.max(0, input.heatAnomalyC));
  const isStressed = rainfallDeficitAbs > 15 || heatAnomaly > 1.0;

  const batchSurvivalRates: number[] = [];
  const insolvencyMonths: number[] = [];

  // Track defaults per category to compute category stressed default range
  const categoryDefaultsCount: Record<LoanClimateCategory, number[]> = {
    RAINFED_CROP: [],
    IRRIGATED_AGRI: [],
    DAIRY_LIVESTOCK: [],
    NONFARM_MICROENTERPRISE: [],
    HEALTH_CONSUMPTION: []
  };

  for (let b = 0; b < numBatches; b++) {
    let survivedTrialsInBatch = 0;
    const batchCatDefaults: Record<LoanClimateCategory, { totalLoans: number; defaultedLoans: number }> = {
      RAINFED_CROP: { totalLoans: 0, defaultedLoans: 0 },
      IRRIGATED_AGRI: { totalLoans: 0, defaultedLoans: 0 },
      DAIRY_LIVESTOCK: { totalLoans: 0, defaultedLoans: 0 },
      NONFARM_MICROENTERPRISE: { totalLoans: 0, defaultedLoans: 0 },
      HEALTH_CONSUMPTION: { totalLoans: 0, defaultedLoans: 0 }
    };

    for (let t = 0; t < trialsPerBatch; t++) {
      let cashBox = input.initialCashBoxInr;
      const buffer = input.initialBufferInr;
      let trialInsolventMonth: number | null = null;

      // Track active loans in this trial
      const loanStates = input.loans.map(loan => ({
        ...loan,
        isDefaulted: loan.isNpa || false,
        remainingMonths: loan.remainingTenureMonths
      }));

      for (let m = 1; m <= horizon; m++) {
        // Macro village covariate shock: Z ~ N(0, 1)
        // Correlates rural distress across all members in the same village
        const villageCovariateShock = sampleStandardNormal(rand);

        // Inflows: regular member savings pool
        let monthlyInflows = input.monthlyMemberSavingsInr;

        // Process EMI collections or defaults
        loanStates.forEach(loan => {
          if (loan.remainingMonths <= 0) return;

          const sens = sensMap.get(loan.category) || fallbackSens;
          batchCatDefaults[loan.category].totalLoans++;

          if (!loan.isDefaulted) {
            // Idiosyncratic member shock
            const idiosyncraticShock = sampleStandardNormal(rand);

            // Stressed default hazard calculation
            // Base prob multiplied by drought severity and heat stress
            const droughtFactor = 1 + sens.rainfallElasticity * (rainfallDeficitAbs / 30);
            const heatFactor = 1 + sens.heatElasticity * (heatAnomaly / 2.0);
            const shockExponent = 0.35 * villageCovariateShock + 0.15 * idiosyncraticShock;

            const monthlyHazard = Math.min(
              0.92,
              Math.max(
                0.005,
                sens.baseMonthlyDefaultProb * droughtFactor * heatFactor * Math.exp(shockExponent)
              )
            );

            // Bernoulli default check
            if (rand() < monthlyHazard) {
              loan.isDefaulted = true;
              batchCatDefaults[loan.category].defaultedLoans++;
              // Recovery with haircut after 2 months
              const recovery = Math.round(loan.monthlyEmi * (1 - sens.recoveryHaircut) * 0.4);
              monthlyInflows += recovery;
            } else {
              monthlyInflows += loan.monthlyEmi;
            }
          }

          loan.remainingMonths--;
        });

        // Group cash balance update
        // (Outflows: buffer grant drawdowns or baseline operational costs ~ 10% of savings)
        const baselineOutflows = Math.round(input.monthlyMemberSavingsInr * 0.1);
        cashBox += monthlyInflows - baselineOutflows;

        // Insolvency condition: cashBox drops below 0
        if (cashBox < 0 && trialInsolventMonth === null) {
          trialInsolventMonth = m;
        }
      }

      if (trialInsolventMonth === null) {
        survivedTrialsInBatch++;
      } else {
        insolvencyMonths.push(trialInsolventMonth);
      }
    }

    batchSurvivalRates.push(survivedTrialsInBatch / trialsPerBatch);

    // Record category default rates for this batch
    (Object.keys(batchCatDefaults) as LoanClimateCategory[]).forEach(cat => {
      const { totalLoans, defaultedLoans } = batchCatDefaults[cat];
      const rate = totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;
      categoryDefaultsCount[cat].push(rate);
    });
  }

  // Sort batch survival rates to get bootstrap confidence interval [p10, p90]
  batchSurvivalRates.sort((a, b) => a - b);
  // 10 batches: p10 is index 1, p90 is index 8, median is average of 4 and 5
  const p10Survival = Math.round(batchSurvivalRates[1] * 100);
  const p90Survival = Math.round(batchSurvivalRates[8] * 100);
  const survivalRangePct: [number, number] = [
    Math.max(0, Math.min(p10Survival, p90Survival)),
    Math.min(100, Math.max(p10Survival, p90Survival))
  ];

  // Projected liquidity stress month range (p25 to p75 / median)
  let projectedDefaultMonthRange: [number, number] | null = null;
  if (insolvencyMonths.length > totalTrials * 0.15) {
    insolvencyMonths.sort((a, b) => a - b);
    const p25Idx = Math.floor(insolvencyMonths.length * 0.25);
    const p75Idx = Math.floor(insolvencyMonths.length * 0.75);
    projectedDefaultMonthRange = [
      insolvencyMonths[p25Idx] || 4,
      insolvencyMonths[p75Idx] || 8
    ];
  }

  // Compute exposure and stressed default range by category
  const totalPrincipal = input.loans.reduce((sum, l) => sum + l.principalOutstanding, 0) || 1;
  const categories: LoanClimateCategory[] = [
    'RAINFED_CROP',
    'IRRIGATED_AGRI',
    'DAIRY_LIVESTOCK',
    'NONFARM_MICROENTERPRISE',
    'HEALTH_CONSUMPTION'
  ];

  const exposureByCategory: CategoryExposure[] = categories.map(cat => {
    const sens = sensMap.get(cat) || fallbackSens;
    const catLoans = input.loans.filter(l => l.category === cat);
    const principal = catLoans.reduce((sum, l) => sum + l.principalOutstanding, 0);
    const sharePct = Math.round((principal / totalPrincipal) * 100);

    const rates = categoryDefaultsCount[cat].sort((a, b) => a - b);
    const p10Rate = Math.round(rates[1] || (sens.baseMonthlyDefaultProb * 12 * 100));
    const p90Rate = Math.round(rates[8] || (p10Rate * 1.5));

    return {
      category: cat,
      categoryLabelEn: sens.categoryLabelEn,
      categoryLabelMr: sens.categoryLabelMr,
      principalInr: principal,
      sharePct,
      stressedDefaultRangePct: [Math.min(p10Rate, p90Rate), Math.max(p10Rate, p90Rate)]
    };
  });

  return {
    survivalRangePct,
    projectedDefaultMonthRange,
    exposureByCategory,
    assumptionsSnapshot: sensitivities,
    trialsRun: totalTrials,
    isStressed,
    timestamp: new Date().toISOString()
  };
}

// Worker message handling (in browser environment)
if (typeof self !== 'undefined') {
  self.onmessage = (e: MessageEvent) => {
    const { type, input, sensitivities } = e.data;
    if (type === 'RUN_STRESS_TEST') {
      const result = runSimulation(input, sensitivities);
      self.postMessage({ type: 'STRESS_TEST_RESULT', result });
    }
  };
}

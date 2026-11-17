import { StressTestInput, StressTestResult, LoanSensitivityAssumption } from '../types/climate';
import { runSimulation } from '../workers/climateMonteCarlo.worker';
import { getClimateAIProvider, ClimateAIProviders } from './climateAiProviders';
import { CITED_AGRONOMY_SENSITIVITIES } from '../data/climateAssumptions';

let workerInstance: Worker | null = null;

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('../workers/climateMonteCarlo.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (e) {
      console.warn('Web Worker instantiation failed, falling back to main-thread execution:', e);
      workerInstance = null;
    }
  }
  return workerInstance;
}

/**
 * Runs the 1,500-trial Stochastic Climate Stress Test.
 * 1. Checks AI Swap Seam provider for sensitivities.
 * 2. Offloads to Web Worker if supported (zero UI stutter).
 * 3. Falls back smoothly to synchronous pure-TS execution if worker is unavailable.
 */
export async function runClimateStressTest(
  input: StressTestInput,
  customProvider?: ClimateAIProviders,
  district: string = 'Nagpur'
): Promise<StressTestResult> {
  const provider = customProvider || getClimateAIProvider();

  // Retrieve sensitivities through AI Seam (today: static agronomy table; future: ML model)
  let sensitivities: LoanSensitivityAssumption[];
  try {
    // Convert StressTestLoanItem to mock Loan objects for provider interface
    const mockLoans = input.loans.map(l => ({
      id: l.id,
      memberId: 'm',
      memberName: 'Member',
      principal: l.principalOutstanding,
      interestRateMonthly: 1.5,
      tenureMonths: l.remainingTenureMonths,
      totalPaid: 0,
      remainingBalance: l.principalOutstanding,
      status: 'ACTIVE' as const,
      dateDisbursed: '2026-01-01',
      entityVersion: 1,
      climateCategory: l.category
    }));
    sensitivities = await provider.getLoanSensitivities(district, mockLoans);
  } catch (err) {
    console.warn('Sensitivity provider error, using default agronomy sensitivities:', err);
    sensitivities = CITED_AGRONOMY_SENSITIVITIES;
  }

  const worker = getWorker();
  if (worker) {
    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data.type === 'STRESS_TEST_RESULT') {
          worker.removeEventListener('message', handler);
          resolve(e.data.result as StressTestResult);
        }
      };
      worker.addEventListener('message', handler);
      worker.postMessage({
        type: 'RUN_STRESS_TEST',
        input,
        sensitivities
      });

      // Safety timeout: 2500ms fallback
      setTimeout(() => {
        worker.removeEventListener('message', handler);
        resolve(runSimulation(input, sensitivities));
      }, 2500);
    });
  }

  // Synchronous execution fallback
  return runSimulation(input, sensitivities);
}

/**
 * Direct synchronous runner for unit testing and non-DOM environments
 */
export function runMonteCarloSimulationSync(
  input: StressTestInput,
  sensitivities: LoanSensitivityAssumption[] = CITED_AGRONOMY_SENSITIVITIES
): StressTestResult {
  return runSimulation(input, sensitivities);
}

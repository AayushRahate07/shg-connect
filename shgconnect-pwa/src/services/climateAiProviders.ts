import { Loan } from '../types/shg';
import { LoanSensitivityAssumption, DailyHeatForecast } from '../types/climate';
import { CITED_AGRONOMY_SENSITIVITIES } from '../data/climateAssumptions';
import { getCachedDistrictForecast } from '../data/cachedWeatherForecasts';

/**
 * 1-File AI Swap Seam Interface
 * Clean decoupling contract allowing Stage II/III ML microservices (e.g. XGBoost yield models,
 * Open-Meteo live APIs, calibrated regression weights) to be swapped without changing UI code.
 */
export interface ClimateAIProviders {
  /**
   * Feature 1: Get category sensitivities.
   * Offline: returns peer-reviewed agronomy table (CITED_AGRONOMY_SENSITIVITIES).
   * Stage II/III: calls ML endpoint returning hyper-localized yield-default elasticity.
   */
  getLoanSensitivities(district: string, loans: Loan[]): Promise<LoanSensitivityAssumption[]>;

  /**
   * Feature 2: Get 7-day heat & wage forecast.
   * Offline: returns cached IMD/Agromet advisory dataset.
   * Stage II/III: calls live weather API + local agricultural labor wage loss predictor.
   */
  getHeatForecast(district: string): Promise<DailyHeatForecast[]>;

  /**
   * Feature 3: Get weights for Supplementary Climate Index.
   * Offline: returns standard transparent weights (40% survival, 30% diversity, 30% buffer).
   * Stage II/III: returns empirical regression weights calibrated against multi-season defaults.
   */
  getCalibrationWeights(shgId: string): Promise<{ survivalW: number; diversityW: number; bufferW: number }>;
}

/**
 * Default 100% Offline Heuristic Provider
 * Guarantees zero-network capability, zero hallucination, and full scientific auditability.
 */
export class OfflineHeuristicClimateProvider implements ClimateAIProviders {
  async getLoanSensitivities(_district: string, _loans: Loan[]): Promise<LoanSensitivityAssumption[]> {
    return CITED_AGRONOMY_SENSITIVITIES;
  }

  async getHeatForecast(district: string): Promise<DailyHeatForecast[]> {
    const data = getCachedDistrictForecast(district);
    return data.forecasts;
  }

  async getCalibrationWeights(_shgId: string): Promise<{ survivalW: number; diversityW: number; bufferW: number }> {
    return {
      survivalW: 0.40,  // 40 points: Drought cashflow survival margin
      diversityW: 0.30, // 30 points: 1 - HHI portfolio diversification
      bufferW: 0.30     // 30 points: Climate buffer coverage & governance
    };
  }
}

// Global active climate AI provider instance (swap seam)
let activeProvider: ClimateAIProviders = new OfflineHeuristicClimateProvider();

export function getClimateAIProvider(): ClimateAIProviders {
  return activeProvider;
}

export function setClimateAIProvider(provider: ClimateAIProviders): void {
  activeProvider = provider;
}

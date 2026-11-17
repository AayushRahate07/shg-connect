import { HeatShieldPolicy, DailyHeatForecast } from '../types/climate';
import { getCachedDistrictForecast } from '../data/cachedWeatherForecasts';
import { getClimateAIProvider } from './climateAiProviders';

/**
 * Calculates NOAA Rothfusz Steadman Heat Index in Celsius (°C)
 * Standard meteorological formula used by NOAA, NWS, and IMD.
 */
export function calculateNoaaHeatIndex(tempC: number, rhPct: number): number {
  // Convert Celsius to Fahrenheit
  const tf = tempC * (9 / 5) + 32;
  const rh = Math.min(100, Math.max(0, rhPct));

  // Simple Steadman formula for mild temperatures
  const simpleHi = 0.5 * (tf + 61.0 + (tf - 68.0) * 1.2 + rh * 0.094);

  if (simpleHi < 80.0) {
    return Number((((simpleHi - 32) * 5) / 9).toFixed(1));
  }

  // Full Rothfusz regression equation
  let hi =
    -42.379 +
    2.04901523 * tf +
    10.14333127 * rh -
    0.22475541 * tf * rh -
    0.00683783 * tf * tf -
    0.05481717 * rh * rh +
    0.00122874 * tf * tf * rh +
    0.00085282 * tf * rh * rh -
    0.00000199 * tf * tf * rh * rh;

  // Low humidity adjustment
  if (rh < 13 && tf >= 80 && tf <= 112) {
    const adj = ((13 - rh) / 4) * Math.sqrt(Math.max(0, (17 - Math.abs(tf - 95)) / 17));
    hi -= adj;
  }
  // High humidity adjustment
  else if (rh > 85 && tf >= 80 && tf <= 87) {
    const adj = ((rh - 85) / 10) * ((87 - tf) / 5);
    hi += adj;
  }

  // Convert back to Celsius
  const hiC = ((hi - 32) * 5) / 9;
  return Number(hiC.toFixed(1));
}

/**
 * Calculates Stull (2011) Wet-Bulb Temperature (Tw) in Celsius (°C)
 * Published in Journal of Applied Meteorology and Climatology:
 * "Wet-Bulb Temperature from Relative Humidity and Air Temperature"
 * Error < 1°C across -20°C to 50°C and 5% to 99% RH.
 */
export function calculateStullWetBulb(tempC: number, rhPct: number): number {
  const t = tempC;
  const rh = Math.min(100, Math.max(1, rhPct));

  const tw =
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;

  return Number(tw.toFixed(1));
}

/**
 * Outdoor Wet Bulb Globe Temperature (WBGT) Estimation
 * Standard approximation: WBGT_outdoor = 0.7 * Tw + 0.2 * Tg + 0.1 * Ta
 * where Tg = Ta + delta_solar (approx 4.5°C in full Indian summer sunshine, 0.0°C in shade)
 */
export function calculateOutdoorWbgt(
  tempC: number,
  rhPct: number,
  solarProxy: 'SUN' | 'SHADE' = 'SUN'
): number {
  const tw = calculateStullWetBulb(tempC, rhPct);
  const ta = tempC;
  const solarDelta = solarProxy === 'SUN' ? 4.5 : 0.0;
  const tg = ta + solarDelta;

  const wbgt = 0.7 * tw + 0.2 * tg + 0.1 * ta;
  return Number(wbgt.toFixed(1));
}

export interface HeatStressEvaluation {
  isTriggerBreached: boolean;
  consecutiveBreachedDays: number;
  peakMetricValueC: number;
  triggerMetric: 'WBGT' | 'HEAT_INDEX';
  thresholdC: number;
  forecastDate: string;
  district: string;
  forecasts: DailyHeatForecast[];
}

/**
 * Evaluates a 7-day heat forecast against an SHG's pre-agreed HeatShieldPolicy
 */
export async function evaluateHeatShieldPolicy(
  district: string,
  policy: HeatShieldPolicy,
  forceHeatwaveDemo: boolean = false
): Promise<HeatStressEvaluation> {
  const aiProvider = getClimateAIProvider();
  let forecasts: DailyHeatForecast[];

  if (forceHeatwaveDemo) {
    // Nagpur heatwave preset
    forecasts = getCachedDistrictForecast('Nagpur').forecasts;
  } else {
    try {
      forecasts = await aiProvider.getHeatForecast(district);
    } catch {
      forecasts = getCachedDistrictForecast(district).forecasts;
    }
  }

  let consecutiveCount = 0;
  let maxConsecutive = 0;
  let peakValue = 0;
  let breachDate = forecasts[0]?.date || new Date().toISOString().split('T')[0];

  forecasts.forEach(f => {
    const metricVal = policy.triggerMetric === 'WBGT' ? f.wbgtC : f.heatIndexC;
    if (metricVal > peakValue) {
      peakValue = metricVal;
    }

    if (metricVal >= policy.thresholdC) {
      consecutiveCount++;
      if (consecutiveCount > maxConsecutive) {
        maxConsecutive = consecutiveCount;
        breachDate = f.date;
      }
    } else {
      consecutiveCount = 0;
    }
  });

  const isTriggerBreached = maxConsecutive >= policy.minConsecutiveDays;

  return {
    isTriggerBreached,
    consecutiveBreachedDays: maxConsecutive,
    peakMetricValueC: peakValue,
    triggerMetric: policy.triggerMetric,
    thresholdC: policy.thresholdC,
    forecastDate: breachDate,
    district,
    forecasts
  };
}

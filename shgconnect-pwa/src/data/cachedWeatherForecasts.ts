import { DistrictHeatForecastData, DailyHeatForecast } from '../types/climate';

/**
 * 7-Day Offline Cached Weather Forecasts for SHG Districts in Maharashtra.
 * Data source: IMD Agromet Advisory & ERA5-Land Reanalysis Cache.
 * Formatted for zero-latency offline biometeorological evaluation in PWAs.
 */
export const CACHED_WEATHER_FORECASTS: Record<string, DistrictHeatForecastData> = {
  Nagpur: {
    district: 'Nagpur',
    state: 'Maharashtra',
    cachedAt: '2026-05-18T06:00:00.000Z',
    forecastSource: 'IMD Agromet Service / Open-Meteo Vidarbha Cluster',
    forecasts: [
      {
        date: '2026-05-18',
        dayName: 'Monday',
        maxTempC: 43.8,
        relativeHumidityPct: 38,
        solarRadiationProxy: 'SUN',
        wbgtC: 32.4,
        heatIndexC: 46.2,
        isBreached: true
      },
      {
        date: '2026-05-19',
        dayName: 'Tuesday',
        maxTempC: 44.5,
        relativeHumidityPct: 36,
        solarRadiationProxy: 'SUN',
        wbgtC: 32.9,
        heatIndexC: 47.5,
        isBreached: true
      },
      {
        date: '2026-05-20',
        dayName: 'Wednesday',
        maxTempC: 44.1,
        relativeHumidityPct: 37,
        solarRadiationProxy: 'SUN',
        wbgtC: 32.6,
        heatIndexC: 46.8,
        isBreached: true
      },
      {
        date: '2026-05-21',
        dayName: 'Thursday',
        maxTempC: 42.8,
        relativeHumidityPct: 40,
        solarRadiationProxy: 'SUN',
        wbgtC: 31.9,
        heatIndexC: 45.1,
        isBreached: true
      },
      {
        date: '2026-05-22',
        dayName: 'Friday',
        maxTempC: 41.5,
        relativeHumidityPct: 42,
        solarRadiationProxy: 'SHADE',
        wbgtC: 30.6,
        heatIndexC: 43.4,
        isBreached: false
      },
      {
        date: '2026-05-23',
        dayName: 'Saturday',
        maxTempC: 40.2,
        relativeHumidityPct: 44,
        solarRadiationProxy: 'SHADE',
        wbgtC: 29.8,
        heatIndexC: 41.2,
        isBreached: false
      },
      {
        date: '2026-05-24',
        dayName: 'Sunday',
        maxTempC: 39.5,
        relativeHumidityPct: 45,
        solarRadiationProxy: 'SHADE',
        wbgtC: 29.2,
        heatIndexC: 39.8,
        isBreached: false
      }
    ]
  },
  Satara: {
    district: 'Satara',
    state: 'Maharashtra',
    cachedAt: '2026-05-18T06:00:00.000Z',
    forecastSource: 'IMD Agromet Service / Western Ghats Agro Advisory',
    forecasts: [
      {
        date: '2026-05-18',
        dayName: 'Monday',
        maxTempC: 34.5,
        relativeHumidityPct: 55,
        solarRadiationProxy: 'SUN',
        wbgtC: 27.8,
        heatIndexC: 37.1,
        isBreached: false
      },
      {
        date: '2026-05-19',
        dayName: 'Tuesday',
        maxTempC: 35.0,
        relativeHumidityPct: 53,
        solarRadiationProxy: 'SUN',
        wbgtC: 28.1,
        heatIndexC: 37.8,
        isBreached: false
      },
      {
        date: '2026-05-20',
        dayName: 'Wednesday',
        maxTempC: 34.8,
        relativeHumidityPct: 56,
        solarRadiationProxy: 'SUN',
        wbgtC: 28.0,
        heatIndexC: 37.5,
        isBreached: false
      },
      {
        date: '2026-05-21',
        dayName: 'Thursday',
        maxTempC: 34.0,
        relativeHumidityPct: 60,
        solarRadiationProxy: 'SHADE',
        wbgtC: 27.5,
        heatIndexC: 36.5,
        isBreached: false
      },
      {
        date: '2026-05-22',
        dayName: 'Friday',
        maxTempC: 33.5,
        relativeHumidityPct: 62,
        solarRadiationProxy: 'SHADE',
        wbgtC: 27.1,
        heatIndexC: 35.8,
        isBreached: false
      },
      {
        date: '2026-05-23',
        dayName: 'Saturday',
        maxTempC: 33.0,
        relativeHumidityPct: 65,
        solarRadiationProxy: 'SHADE',
        wbgtC: 26.8,
        heatIndexC: 35.2,
        isBreached: false
      },
      {
        date: '2026-05-24',
        dayName: 'Sunday',
        maxTempC: 32.8,
        relativeHumidityPct: 68,
        solarRadiationProxy: 'SHADE',
        wbgtC: 26.5,
        heatIndexC: 34.8,
        isBreached: false
      }
    ]
  },
  Beed: {
    district: 'Beed',
    state: 'Maharashtra',
    cachedAt: '2026-05-18T06:00:00.000Z',
    forecastSource: 'IMD Agromet Service / Marathwada Zone',
    forecasts: [
      {
        date: '2026-05-18',
        dayName: 'Monday',
        maxTempC: 41.8,
        relativeHumidityPct: 35,
        solarRadiationProxy: 'SUN',
        wbgtC: 30.5,
        heatIndexC: 42.6,
        isBreached: true
      },
      {
        date: '2026-05-19',
        dayName: 'Tuesday',
        maxTempC: 42.2,
        relativeHumidityPct: 34,
        solarRadiationProxy: 'SUN',
        wbgtC: 30.9,
        heatIndexC: 43.1,
        isBreached: true
      },
      {
        date: '2026-05-20',
        dayName: 'Wednesday',
        maxTempC: 41.5,
        relativeHumidityPct: 36,
        solarRadiationProxy: 'SUN',
        wbgtC: 30.3,
        heatIndexC: 42.2,
        isBreached: true
      },
      {
        date: '2026-05-21',
        dayName: 'Thursday',
        maxTempC: 40.8,
        relativeHumidityPct: 38,
        solarRadiationProxy: 'SUN',
        wbgtC: 29.8,
        heatIndexC: 41.2,
        isBreached: false
      },
      {
        date: '2026-05-22',
        dayName: 'Friday',
        maxTempC: 39.5,
        relativeHumidityPct: 40,
        solarRadiationProxy: 'SHADE',
        wbgtC: 28.9,
        heatIndexC: 39.5,
        isBreached: false
      },
      {
        date: '2026-05-23',
        dayName: 'Saturday',
        maxTempC: 38.8,
        relativeHumidityPct: 42,
        solarRadiationProxy: 'SHADE',
        wbgtC: 28.4,
        heatIndexC: 38.5,
        isBreached: false
      },
      {
        date: '2026-05-24',
        dayName: 'Sunday',
        maxTempC: 38.2,
        relativeHumidityPct: 45,
        solarRadiationProxy: 'SHADE',
        wbgtC: 28.0,
        heatIndexC: 37.8,
        isBreached: false
      }
    ]
  },
  Sangli: {
    district: 'Sangli',
    state: 'Maharashtra',
    cachedAt: '2026-05-18T06:00:00.000Z',
    forecastSource: 'IMD Agromet Service / Krishna Valley Agro Region',
    forecasts: [
      {
        date: '2026-05-18',
        dayName: 'Monday',
        maxTempC: 36.2,
        relativeHumidityPct: 50,
        solarRadiationProxy: 'SUN',
        wbgtC: 28.9,
        heatIndexC: 39.2,
        isBreached: false
      },
      {
        date: '2026-05-19',
        dayName: 'Tuesday',
        maxTempC: 36.8,
        relativeHumidityPct: 48,
        solarRadiationProxy: 'SUN',
        wbgtC: 29.2,
        heatIndexC: 39.8,
        isBreached: false
      },
      {
        date: '2026-05-20',
        dayName: 'Wednesday',
        maxTempC: 36.0,
        relativeHumidityPct: 52,
        solarRadiationProxy: 'SUN',
        wbgtC: 28.8,
        heatIndexC: 38.9,
        isBreached: false
      },
      {
        date: '2026-05-21',
        dayName: 'Thursday',
        maxTempC: 35.4,
        relativeHumidityPct: 55,
        solarRadiationProxy: 'SHADE',
        wbgtC: 28.3,
        heatIndexC: 38.1,
        isBreached: false
      },
      {
        date: '2026-05-22',
        dayName: 'Friday',
        maxTempC: 34.8,
        relativeHumidityPct: 58,
        solarRadiationProxy: 'SHADE',
        wbgtC: 27.9,
        heatIndexC: 37.4,
        isBreached: false
      },
      {
        date: '2026-05-23',
        dayName: 'Saturday',
        maxTempC: 34.0,
        relativeHumidityPct: 60,
        solarRadiationProxy: 'SHADE',
        wbgtC: 27.4,
        heatIndexC: 36.6,
        isBreached: false
      },
      {
        date: '2026-05-24',
        dayName: 'Sunday',
        maxTempC: 33.5,
        relativeHumidityPct: 62,
        solarRadiationProxy: 'SHADE',
        wbgtC: 27.0,
        heatIndexC: 36.0,
        isBreached: false
      }
    ]
  },
  Latur: {
    district: 'Latur',
    state: 'Maharashtra',
    cachedAt: '2026-05-18T06:00:00.000Z',
    forecastSource: 'IMD Agromet Service / Marathwada Central',
    forecasts: [
      {
        date: '2026-05-18',
        dayName: 'Monday',
        maxTempC: 42.0,
        relativeHumidityPct: 34,
        solarRadiationProxy: 'SUN',
        wbgtC: 30.7,
        heatIndexC: 42.8,
        isBreached: true
      },
      {
        date: '2026-05-19',
        dayName: 'Tuesday',
        maxTempC: 42.5,
        relativeHumidityPct: 33,
        solarRadiationProxy: 'SUN',
        wbgtC: 31.0,
        heatIndexC: 43.4,
        isBreached: true
      },
      {
        date: '2026-05-20',
        dayName: 'Wednesday',
        maxTempC: 41.8,
        relativeHumidityPct: 35,
        solarRadiationProxy: 'SUN',
        wbgtC: 30.5,
        heatIndexC: 42.5,
        isBreached: true
      },
      {
        date: '2026-05-21',
        dayName: 'Thursday',
        maxTempC: 41.0,
        relativeHumidityPct: 36,
        solarRadiationProxy: 'SUN',
        wbgtC: 30.0,
        heatIndexC: 41.5,
        isBreached: true
      },
      {
        date: '2026-05-22',
        dayName: 'Friday',
        maxTempC: 39.8,
        relativeHumidityPct: 38,
        solarRadiationProxy: 'SHADE',
        wbgtC: 29.1,
        heatIndexC: 39.9,
        isBreached: false
      },
      {
        date: '2026-05-23',
        dayName: 'Saturday',
        maxTempC: 39.0,
        relativeHumidityPct: 40,
        solarRadiationProxy: 'SHADE',
        wbgtC: 28.5,
        heatIndexC: 38.8,
        isBreached: false
      },
      {
        date: '2026-05-24',
        dayName: 'Sunday',
        maxTempC: 38.5,
        relativeHumidityPct: 42,
        solarRadiationProxy: 'SHADE',
        wbgtC: 28.1,
        heatIndexC: 38.1,
        isBreached: false
      }
    ]
  },
  Amravati: {
    district: 'Amravati',
    state: 'Maharashtra',
    cachedAt: '2026-05-18T06:00:00.000Z',
    forecastSource: 'IMD Agromet Service / West Vidarbha',
    forecasts: [
      {
        date: '2026-05-18',
        dayName: 'Monday',
        maxTempC: 43.2,
        relativeHumidityPct: 37,
        solarRadiationProxy: 'SUN',
        wbgtC: 31.9,
        heatIndexC: 45.4,
        isBreached: true
      },
      {
        date: '2026-05-19',
        dayName: 'Tuesday',
        maxTempC: 43.8,
        relativeHumidityPct: 35,
        solarRadiationProxy: 'SUN',
        wbgtC: 32.3,
        heatIndexC: 46.2,
        isBreached: true
      },
      {
        date: '2026-05-20',
        dayName: 'Wednesday',
        maxTempC: 43.5,
        relativeHumidityPct: 36,
        solarRadiationProxy: 'SUN',
        wbgtC: 32.1,
        heatIndexC: 45.8,
        isBreached: true
      },
      {
        date: '2026-05-21',
        dayName: 'Thursday',
        maxTempC: 42.1,
        relativeHumidityPct: 39,
        solarRadiationProxy: 'SUN',
        wbgtC: 31.3,
        heatIndexC: 44.2,
        isBreached: true
      },
      {
        date: '2026-05-22',
        dayName: 'Friday',
        maxTempC: 40.8,
        relativeHumidityPct: 41,
        solarRadiationProxy: 'SHADE',
        wbgtC: 30.2,
        heatIndexC: 42.5,
        isBreached: false
      },
      {
        date: '2026-05-23',
        dayName: 'Saturday',
        maxTempC: 39.8,
        relativeHumidityPct: 43,
        solarRadiationProxy: 'SHADE',
        wbgtC: 29.4,
        heatIndexC: 40.8,
        isBreached: false
      },
      {
        date: '2026-05-24',
        dayName: 'Sunday',
        maxTempC: 39.0,
        relativeHumidityPct: 44,
        solarRadiationProxy: 'SHADE',
        wbgtC: 28.8,
        heatIndexC: 39.5,
        isBreached: false
      }
    ]
  }
};

/**
 * Get cached 7-day forecast for a district, falling back to Nagpur/Satara if district unknown.
 */
export function getCachedDistrictForecast(districtName?: string): DistrictHeatForecastData {
  if (!districtName) return CACHED_WEATHER_FORECASTS.Nagpur;
  const key = Object.keys(CACHED_WEATHER_FORECASTS).find(
    k => k.toLowerCase() === districtName.trim().toLowerCase()
  );
  return key ? CACHED_WEATHER_FORECASTS[key] : CACHED_WEATHER_FORECASTS.Nagpur;
}

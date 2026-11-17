import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { GroupInfo } from '../../services/db';
import { Loan, Member, SupportedLanguage } from '../../types/shg';
import { StressTestInput, StressTestResult, LoanClimateCategory, CategoryExposure } from '../../types/climate';
import { runClimateStressTest } from '../../services/climateSimulator';
import { CLIMATE_PRESETS, inferClimateCategory } from '../../data/climateAssumptions';
import { formatINR } from '../../theme/tokens';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  CloudRain,
  Flame,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  TrendingDown,
  BookOpen,
  RefreshCw
} from 'lucide-react';

interface ClimateShockSimulatorProps {
  group: GroupInfo;
  loans: Loan[];
  members: Member[];
  language: SupportedLanguage;
}

const CATEGORY_COLORS: Record<LoanClimateCategory, string> = {
  RAINFED_CROP: '#D97706',          // amber
  IRRIGATED_AGRI: '#059669',        // emerald
  DAIRY_LIVESTOCK: '#2563EB',       // blue
  NONFARM_MICROENTERPRISE: '#7C3AED',// purple
  HEALTH_CONSUMPTION: '#DC2626'     // red
};

export const ClimateShockSimulator: React.FC<ClimateShockSimulatorProps> = ({
  group,
  loans,
  members,
  language
}) => {
  const isMr = language === 'mr';
  const [, startTransition] = useTransition();

  // Slider State
  const [rainfallDeficitPct, setRainfallDeficitPct] = useState<number>(-35); // Default to -35% Vidarbha benchmark
  const [heatAnomalyC, setHeatAnomalyC] = useState<number>(1.8);
  const [selectedPreset, setSelectedPreset] = useState<string>('VIDARBHA_2015');

  // Simulation output state
  const [result, setResult] = useState<StressTestResult | null>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [showAssumptionsDrawer, setShowAssumptionsDrawer] = useState<boolean>(false);

  // Group portfolio numbers
  const initialCashBoxInr = group.totalGroupFund || 68400;
  const initialBufferInr = 3500;
  const monthlySavingsRate = group.monthlyPoolRate || 300;
  const monthlyMemberSavingsInr = (members.length || 10) * monthlySavingsRate;

  // Map existing loans to stress test loan items with inferred climate categories
  const stressLoans = useMemo(() => {
    return loans.map(l => {
      const category = l.climateCategory || inferClimateCategory(
        members.find(m => m.id === l.memberId)?.occupation,
        l.memberName
      );
      return {
        id: l.id,
        category,
        principalOutstanding: l.remainingBalance || l.principal,
        monthlyEmi: Math.round((l.principal / (l.tenureMonths || 12)) + (l.principal * (l.interestRateMonthly || 1.5)) / 100),
        remainingTenureMonths: Math.max(1, Math.round((l.remainingBalance || l.principal) / Math.max(1, l.principal / (l.tenureMonths || 12)))),
        isNpa: l.status === 'REJECTED'
      };
    });
  }, [loans, members]);

  // Debounced run simulation whenever sliders or loans change
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsComputing(true);
      const input: StressTestInput = {
        rainfallDeficitPct,
        heatAnomalyC,
        initialCashBoxInr,
        initialBufferInr,
        monthlyMemberSavingsInr,
        loans: stressLoans,
        horizonMonths: 12,
        trials: 1500,
        seed: 42 // Deterministic PRNG seed for stable UI confidence intervals
      };

      try {
        const res = await runClimateStressTest(input, undefined, group.district || 'Nagpur');
        if (!isCancelled) {
          startTransition(() => {
            setResult(res);
            setIsComputing(false);
          });
        }
      } catch (err) {
        console.error('Stress test calculation failed:', err);
        if (!isCancelled) setIsComputing(false);
      }
    }, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [rainfallDeficitPct, heatAnomalyC, stressLoans, initialCashBoxInr, initialBufferInr, monthlyMemberSavingsInr, group.district]);

  // Apply scenario preset
  const applyPreset = (presetId: string) => {
    const preset = CLIMATE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(preset.id);
    setRainfallDeficitPct(preset.rainfallDeficitPct);
    setHeatAnomalyC(preset.heatAnomalyC);
  };

  // Helper for survival range color
  const getSurvivalColorClass = (range: [number, number]) => {
    const mid = (range[0] + range[1]) / 2;
    if (mid >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (mid >= 40) return 'text-amber-800 bg-amber-50 border-amber-300';
    return 'text-rose-800 bg-rose-50 border-rose-300';
  };

  return (
    <Card className="border-2 border-emerald-900/20 shadow-md overflow-hidden bg-gradient-to-b from-white to-stone-50/50">
      {/* Header Banner */}
      <div className="bg-emerald-950 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-stone-950 shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-stone-950" />
              {isMr ? 'स्ट्रेस टेस्ट — अंदाज किंवा भाकीत नाही' : 'Stress Test — Not a Forecast'}
            </span>
            <span className="text-xs text-emerald-200 font-mono">
              1,500 Monte Carlo Trials · N = 12 Mo
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-emerald-300" />
            {isMr ? 'हवामान ताण व परतफेड जोखीम सिम्युलेटर' : 'Climate Shock & Portfolio Stress Simulator'}
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-2xl leading-relaxed">
            {isMr
              ? 'दुष्काळ व उष्णतेच्या लाटेत शेती, दुग्ध व बिगरशेती कर्जांवर होणारा एकत्रित परिणाम पारदर्शक गणिती मॉडेलद्वारे तपासा.'
              : 'Simulates correlated cashflow stress on rural loan portfolios across IMD drought & NDMA heatwave scenarios.'}
          </p>
        </div>

        {isComputing && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-900/60 px-3 py-1.5 rounded-full border border-emerald-700/50 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{isMr ? 'गणिती विश्लेषण चालू...' : 'Computing Trials...'}</span>
          </div>
        )}
      </div>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Preset Scenarios Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
            {isMr ? 'मानक ऐतिहासिक परिस्थिती निवडा' : 'Historical Benchmark Presets'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CLIMATE_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id && rainfallDeficitPct === preset.rainfallDeficitPct && heatAnomalyC === preset.heatAnomalyC;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
                      : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-200'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{isMr ? preset.nameMr : preset.nameEn}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-stone-100 text-stone-600'}`}>
                      {preset.rainfallDeficitPct}%
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-snug line-clamp-2 ${isSelected ? 'text-emerald-100' : 'text-stone-500'}`}>
                    {isMr ? preset.descriptionMr : preset.descriptionEn}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200">
          {/* Rainfall Deficit Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-blue-600" />
                <span>{isMr ? 'पावसाची तूट (Rainfall Deficit)' : 'Monsoon Rainfall Deficit'}</span>
              </label>
              <span className="font-mono text-sm font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {rainfallDeficitPct}%
              </span>
            </div>
            <input
              type="range"
              min="-60"
              max="0"
              step="5"
              value={rainfallDeficitPct}
              onChange={(e) => {
                setRainfallDeficitPct(Number(e.target.value));
                setSelectedPreset('CUSTOM');
              }}
              className="w-full h-2.5 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-emerald-700"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-medium">
              <span>0% (सामान्य / Normal)</span>
              <span className="text-amber-700 font-bold">-26% (मध्यम दुष्काळ / Moderate)</span>
              <span className="text-rose-700 font-bold">-50% (तीव्र / Severe)</span>
            </div>
          </div>

          {/* Heat Anomaly Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>{isMr ? 'तापमान वाढ विसंगती (Heat Anomaly)' : 'Summer Heat Anomaly (+°C)'}</span>
              </label>
              <span className="font-mono text-sm font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                +{heatAnomalyC.toFixed(1)}°C
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4.0"
              step="0.2"
              value={heatAnomalyC}
              onChange={(e) => {
                setHeatAnomalyC(Number(e.target.value));
                setSelectedPreset('CUSTOM');
              }}
              className="w-full h-2.5 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-medium">
              <span>+0.0°C (Baseline)</span>
              <span>+2.0°C (NDMA Advisory)</span>
              <span className="text-rose-700 font-bold">+4.0°C (Extreme Heatwave)</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Outputs */}
        {result && (
          <div className="space-y-5 animate-fadeIn">
            {/* Top KPIs: Survival Range & Liquidity Month */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Survival Range Card */}
              <div className={`p-4 rounded-2xl border-2 ${getSurvivalColorClass(result.survivalRangePct)} shadow-xs`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    {isMr ? '१२ महिने बचत गट भांडवल टिकण्याची शक्यता' : 'Corpus 12-Month Survival Probability'}
                  </span>
                  <Badge variant={result.survivalRangePct[0] >= 50 ? 'success' : 'error'}>
                    {result.survivalRangePct[0] >= 70 ? 'Resilient' : result.survivalRangePct[0] >= 40 ? 'Vulnerable' : 'High Stress'}
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                    {result.survivalRangePct[0]}% – {result.survivalRangePct[1]}%
                  </span>
                  <span className="text-xs text-stone-600 font-semibold">
                    (p10 – p90 confidence band)
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1.5 leading-relaxed">
                  {isMr
                    ? '१० उप-गटांमधील चाचण्यांवर आधारित वास्तववादी मर्यादा. कोणत्याही बनावट एका आकड्याचा दावा केला जात नाही.'
                    : 'Honest bootstrap range across 10 trial batches. Never a fabricated single-point forecast.'}
                </p>
              </div>

              {/* Liquidity Stress Month Card */}
              <div className="p-4 rounded-2xl border-2 border-stone-200 bg-white shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    {isMr ? 'संभाव्य रोख चणचण कालावधी' : 'Projected Liquidity Stress Window'}
                  </span>
                  <Layers className="w-4 h-4 text-purple-700" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-purple-950">
                    {result.projectedDefaultMonthRange
                      ? `${isMr ? 'महिना' : 'Month'} ${result.projectedDefaultMonthRange[0]} – ${result.projectedDefaultMonthRange[1]}`
                      : isMr ? '१२ महिने पूर्ण सुरक्षित' : 'Survives 12-Month Horizon'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                  {result.projectedDefaultMonthRange
                    ? isMr
                      ? 'या महिन्यांमध्ये थकीत कर्जांमुळे बचत गटाच्या रोकड पेटीवर (Cash Box) सर्वात जास्त ताण पडेल.'
                      : 'Concentrated EMI defaults deplete cash buffer during these months before kharif realization.'
                    : isMr
                      ? 'सध्याच्या बचत व हप्त्यांच्या प्रवाहात गट सुरक्षित राहतो.'
                      : 'Inflows from savings and non-farm loans fully sustain liquidity through dry season.'}
                </p>
              </div>
            </div>

            {/* Loan Portfolio Exposure Breakdown */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                    {isMr ? 'कर्ज वर्गवारीनुसार ताण व थकीत प्रमाण' : 'Loan Exposure & Stressed Default Hazard by Category'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {isMr
                      ? 'प्रत्येक क्षेत्राची संवेदनशीलता (हवामान लवचिकता गुणांकानुसार)'
                      : 'Category-specific default hazards under current rainfall & heat settings'}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-stone-700">
                  Total: {formatINR(result.exposureByCategory.reduce((sum, c) => sum + c.principalInr, 0))}
                </span>
              </div>

              {/* Stacked Share Bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-stone-100">
                {result.exposureByCategory.map((cat) => {
                  if (cat.sharePct <= 0) return null;
                  return (
                    <div
                      key={cat.category}
                      style={{
                        width: `${cat.sharePct}%`,
                        backgroundColor: CATEGORY_COLORS[cat.category]
                      }}
                      title={`${cat.categoryLabelEn}: ${cat.sharePct}%`}
                    />
                  );
                })}
              </div>

              {/* Category Exposure Table */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-[10px] uppercase font-bold">
                      <th className="py-2 px-2.5">Category</th>
                      <th className="py-2 px-2.5">Principal (₹)</th>
                      <th className="py-2 px-2.5">Portfolio Share</th>
                      <th className="py-2 px-2.5">Stressed Default Range (p10–p90)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {result.exposureByCategory.map((cat) => (
                      <tr key={cat.category} className="hover:bg-stone-50 transition">
                        <td className="py-2.5 px-2.5 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                          />
                          <span className="font-bold text-stone-900">
                            {isMr ? cat.categoryLabelMr : cat.categoryLabelEn}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 font-mono font-bold text-stone-800">
                          {formatINR(cat.principalInr)}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono font-bold text-stone-600">
                          {cat.sharePct}%
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {cat.stressedDefaultRangePct[0]}% – {cat.stressedDefaultRangePct[1]}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Collapsible Model Assumptions & Citations Drawer */}
            <div className="border border-stone-200 rounded-2xl bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAssumptionsDrawer(!showAssumptionsDrawer)}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-stone-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-800" />
                  <span className="text-xs font-bold text-stone-800">
                    {isMr ? 'मॉडेल गृहितके, संदर्भ व वैज्ञानिक आधार (Citations & Assumptions)' : 'Model Assumptions, Agronomy Citations & Methodology'}
                  </span>
                </div>
                {showAssumptionsDrawer ? (
                  <ChevronUp className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                )}
              </button>

              {showAssumptionsDrawer && (
                <div className="p-4 sm:p-5 pt-0 space-y-3 border-t border-stone-100 text-xs text-stone-600">
                  <p className="leading-relaxed">
                    {isMr
                      ? 'हे सिम्युलेशन भारतीय हवामान विभाग (IMD), भारतीय कृषी संशोधन परिषद (ICAR), आणि आंतरराष्ट्रीय पीक संशोधन संस्था (ICRISAT) च्या क्षेत्रीय अभ्यासांवर आधारित आहे.'
                      : 'This engine implements peer-reviewed biometeorological & agronomic hazard models cited from Indian public research institutes:'}
                  </p>
                  <ul className="space-y-2 list-disc list-inside font-medium text-stone-700">
                    {result.assumptionsSnapshot.map((a) => (
                      <li key={a.category}>
                        <strong className="text-stone-900">{isMr ? a.categoryLabelMr : a.categoryLabelEn}:</strong>{' '}
                        Base default: {(a.baseMonthlyDefaultProb * 100).toFixed(1)}%/mo · Rain elasticity: {a.rainfallElasticity} · Heat elasticity: {a.heatElasticity} · Haircut: {(a.recoveryHaircut * 100)}%
                        <span className="block text-[11px] text-stone-500 italic ml-4 mt-0.5">
                          Source: {a.sourceCitation}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-2.5 bg-stone-100 rounded-lg text-[11px] text-stone-600 font-mono">
                    Hazard Equation: λ_i = λ_0 × (1 + β_rain × |ΔR|/30 + β_heat × ΔT/2) × exp(0.35·Z_village + 0.15·ε_i)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

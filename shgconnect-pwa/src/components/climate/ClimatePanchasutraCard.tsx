import React, { useState, useEffect } from 'react';
import { GroupInfo } from '../../services/db';
import { Loan, Member, Transaction, SupportedLanguage } from '../../types/shg';
import { ClimateBufferState, ClimatePanchasutraReport } from '../../types/climate';
import { getClimateBufferState } from '../../services/db';
import { calculateClimatePanchasutraScore } from '../../services/climateScore';
import { printClimateCreditDossier } from '../../services/reportGenerator';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatINR } from '../../theme/tokens';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Download,
  PieChart,
  Coins,
  Shield,
  CheckCircle,
  HelpCircle,
  Lock
} from 'lucide-react';

interface ClimatePanchasutraCardProps {
  group: GroupInfo;
  loans: Loan[];
  members: Member[];
  transactions: Transaction[];
  language: SupportedLanguage;
  officialPanchasutraScore?: number;
}

export const ClimatePanchasutraCard: React.FC<ClimatePanchasutraCardProps> = ({
  group,
  loans,
  members,
  transactions,
  language,
  officialPanchasutraScore = 92
}) => {
  const isMr = language === 'mr';
  const shgId = group?.shgCode || 'SHG-MH-NGP-2024-0010';

  const [bufferState, setBufferState] = useState<ClimateBufferState | null>(null);
  const [report, setReport] = useState<ClimatePanchasutraReport | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    async function loadScore() {
      const buf = await getClimateBufferState(shgId);
      setBufferState(buf);
      const rep = await calculateClimatePanchasutraScore(loans, members, buf, officialPanchasutraScore);
      setReport(rep);
    }
    loadScore();

    const handleBufferUpdate = async () => {
      const buf = await getClimateBufferState(shgId);
      setBufferState(buf);
      const rep = await calculateClimatePanchasutraScore(loans, members, buf, officialPanchasutraScore);
      setReport(rep);
    };

    window.addEventListener('shg_climate_buffer_updated', handleBufferUpdate);
    return () => window.removeEventListener('shg_climate_buffer_updated', handleBufferUpdate);
  }, [shgId, loans, members, officialPanchasutraScore]);

  if (!report || !bufferState) return null;

  const handleExportPDF = async () => {
    setIsExporting(true);
    await printClimateCreditDossier({
      group,
      loans,
      members,
      transactions,
      bufferState,
      report,
      language
    });
    setIsExporting(false);
  };

  const getGrade = (score: number) => {
    if (score >= 75) return { grade: 'Grade A+ (Resilient)', mr: 'अ+ श्रेणी (हवामान सक्षम)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (score >= 55) return { grade: 'Grade B (Moderate)', mr: 'ब श्रेणी (मध्यम लवचिक)', color: 'text-amber-800 bg-amber-50 border-amber-300' };
    return { grade: 'Grade C (High Vulnerability)', mr: 'क श्रेणी (अति संवेदनशील)', color: 'text-rose-800 bg-rose-50 border-rose-300' };
  };

  const gradeInfo = getGrade(report.supplementaryClimateIndex);

  return (
    <Card className="border-2 border-emerald-800/30 shadow-md bg-white overflow-hidden">
      {/* Card Header with Honesty Warning */}
      <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-900 text-white p-4 sm:p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
              {isMr ? 'पूरक निर्देशांक' : 'Supplementary Framework'}
            </span>
          </div>
          {/* HARD-CODED HONESTY PILL */}
          <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-full shadow-xs">
            {isMr ? 'नाबार्ड मानक नाही (Not NABARD Standard)' : 'Supplementary Index — Not a NABARD Standard'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {isMr ? 'हवामान पंचसूत्र लवचिकता निर्देशांक' : 'Climate Panchasutra Resilience Index'}
            </h3>
            <p className="text-xs text-stone-300">
              {isMr
                ? 'अधिकृत नाबार्ड (NABARD) पंचसूत्राला जोडणारा पूरक हवामान जोखीम मूल्यांकन अहवाल'
                : 'Supplementary climate stress appraisal complementing the statutory 5-pillar NABARD scorecard'}
            </p>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPDF}
            className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4 text-stone-900" />
            <span>{isMr ? 'बँक क्रेडिट डॉसियर (PDF)' : 'Export Bank Credit Dossier (PDF)'}</span>
          </button>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Score & Comparative Pill */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Official vs Supplementary */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              {isMr ? 'अधिकृत नाबार्ड पंचसूत्र (NABARD)' : 'Official NABARD Panchasutra Score'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-emerald-900">
                {report.officialNabardScore} / 100
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Grade A
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              {isMr ? '५ वैधानिक निकष: बैठकी, बचत, अंतर्गत कर्ज, परतफेड, हिशोब' : 'Statutory: Meetings, Savings, Internal Lending, Recovery, Books'}
            </p>
          </div>

          {/* Supplementary Index */}
          <div className={`p-4 rounded-2xl border-2 ${gradeInfo.color} space-y-2`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
              {isMr ? 'पूरक हवामान निर्देशांक (Supplementary)' : 'Supplementary Climate Resilience Score'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono">
                {report.supplementaryClimateIndex} / 100
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded border bg-white/80">
                {isMr ? gradeInfo.mr : gradeInfo.grade}
              </span>
            </div>
            <p className="text-[11px] text-stone-600">
              {isMr ? 'दुष्काळ ताण, कर्ज वैविध्य (HHI) व हवामान बफर निधी निकष' : 'Drought stress survival, 1 - HHI loan diversity, and buffer readiness'}
            </p>
          </div>
        </div>

        {/* 3 Component Sub-scores */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">
            {isMr ? 'हवामान निर्देशांकाचे ३ प्रमुख घटक (Breakdown)' : 'Supplementary Climate Index: 3 Component Pillars'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Component 1: Survival Margin */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700">
                  {isMr ? '१. दुष्काळ टिकवण क्षमता' : '1. Drought Survival Margin'}
                </span>
                <span className="font-mono font-black text-xs text-emerald-800">
                  {report.stressSurvivalMarginScore} / 40 pts
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${(report.stressSurvivalMarginScore / 40) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-500 block">
                {isMr
                  ? `-३०% दुष्काळात सरासरी ${report.breakdown.survivalMedianPct}% टिकण्याची शक्यता`
                  : `Median ${report.breakdown.survivalMedianPct}% survival under -30% drought`}
              </span>
            </div>

            {/* Component 2: Loan Diversification */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700">
                  {isMr ? '२. कर्ज विविधीकरण (1 - HHI)' : '2. Loan Diversification'}
                </span>
                <span className="font-mono font-black text-xs text-purple-800">
                  {report.diversificationHhiScore} / 30 pts
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{ width: `${(report.diversificationHhiScore / 30) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-500 block">
                HHI = {report.breakdown.hhiValue} (जिरायती शेती एकाग्रता जोखीम कमी)
              </span>
            </div>

            {/* Component 3: Climate Buffer */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700">
                  {isMr ? '३. बफर निधी व सुशासन' : '3. Buffer & Governance'}
                </span>
                <span className="font-mono font-black text-xs text-amber-800">
                  {report.bufferAdequacyScore} / 30 pts
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full"
                  style={{ width: `${(report.bufferAdequacyScore / 30) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-500 block">
                {formatINR(bufferState.balanceInr)} शिल्लक ({report.breakdown.bufferCoverageMonths}x coverage)
              </span>
            </div>
          </div>
        </div>

        {/* Cryptographic Scope Disclaimer */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
          <Lock className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-black text-stone-900 block text-[11px] uppercase tracking-wider">
              {isMr ? 'क्रिप्टोग्राफिक पडताळणी कक्षा व कायदेशीर मर्यादा' : 'Cryptographic Verification Scope & Honest Disclosure'}
            </span>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {report.cryptographicScopeDisclaimer}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { Award, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { formatINR } from '../../theme/tokens';
import { PanchasutraScore, SupportedLanguage } from '../../types/shg';
import { translations } from '../../i18n/translations';

interface PanchasutraVisualizerProps {
  score: PanchasutraScore;
  language: SupportedLanguage;
}

export const PanchasutraVisualizer: React.FC<PanchasutraVisualizerProps> = ({
  score,
  language
}) => {
  const t = translations[language] || translations.en;

  const indicators = [
    { label: t.panchasutra.regularMeetings, val: score.regularMeetingsScore, max: 20 },
    { label: t.panchasutra.regularSavings, val: score.regularSavingsScore, max: 20 },
    { label: t.panchasutra.internalLending, val: score.internalLendingScore, max: 20 },
    { label: t.panchasutra.timelyRecovery, val: score.timelyRecoveryScore, max: 20 },
    { label: t.panchasutra.transparentBookkeeping, val: score.transparentBooksScore, max: 20 }
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-card overflow-hidden space-y-6">
      {/* Header */}
      <div className="bg-white p-5 border-b border-[#E7E5E4] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-[#0F766E]" />
            <h2 className="text-xl font-extrabold tracking-tight text-[#1C1917]">
              {language === 'mr' ? 'गटाची कार्यक्षमता (पंचसूत्र)' : language === 'hi' ? 'SHG कार्यक्षमता (पंचसूत्र)' : 'SHG Operational Health'}
            </h2>
          </div>
          <p className="text-xs text-[#78716C] mt-1 font-medium">
            {language === 'mr' ? 'नाबार्ड पंचसूत्र तत्त्वांवर आधारित अंतर्गत कार्यक्षमता गुण' : 'Panchasutra-aligned internal operational health indicator'}
          </p>
        </div>
        <span className="bg-[#CCFBF1] text-[#0F766E] border border-[#0F766E]/20 font-extrabold text-xs px-3 py-1 rounded-full">
          Grade A (उत्कृष्ट कार्यक्षमता)
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Main Score Banner */}
        <div className="bg-[#FAFAF9] p-5 sm:p-6 rounded-2xl border border-[#E7E5E4] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-2xl bg-[#0F766E] text-white flex flex-col items-center justify-center shadow-xs border-2 border-[#F97316]">
              <span className="text-2xl font-black">{score.totalScore}</span>
              <span className="text-[10px] uppercase font-bold text-[#CCFBF1]">/ 100</span>
            </div>
            <div>
              <div className="text-xs text-[#78716C] font-bold uppercase">
                {language === 'mr' ? 'कार्यक्षमता गुण' : 'Operational Health Score'}
              </div>
              <div className="text-xl font-extrabold text-[#1C1917] mt-0.5">
                {score.totalScore >= 80 ? 'Grade A — उत्कृष्ट कार्यक्षमता' : score.totalScore >= 60 ? 'Grade B — चांगली स्थिती' : 'Grade C — सुधारणा आवश्यक'}
              </div>
              <div className="text-xs text-[#0F766E] font-bold mt-1">
                {language === 'mr' ? 'अंदाजे अंतर्गत कर्ज क्षमता:' : 'Estimated Internal Credit Readiness:'} {formatINR(score.loanEligibilityInr)}
              </div>
            </div>
          </div>
        </div>

        {/* 5 Indicators Breakdown */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-[#1C1917] text-sm">
            {language === 'mr' ? 'गुण रचना (५ घटक)' : t.panchasutra.whyThisScore}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicators.map((ind, idx) => (
              <div key={idx} className="bg-[#FAFAF9] p-4 rounded-xl border border-[#E7E5E4] space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-[#1C1917]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#0F766E]" />
                    {ind.label}
                  </span>
                  <span className="font-mono text-[#0F766E]">{ind.val} / {ind.max}</span>
                </div>
                <Progress value={ind.val} max={ind.max} variant="emerald" />
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Disclaimer */}
        <div className="p-4 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] text-xs text-[#78716C] flex items-start space-x-2">
          <HelpCircle className="w-4 h-4 text-[#0F766E] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed font-semibold">
            {language === 'mr' 
              ? 'टीप: हे पंचसूत्र तत्त्वांवर आधारित SHG चे अंतर्गत कार्यक्षमता दर्शक आहे. हे बँकेचे अधिकृत क्रेडिट रेटिंग किंवा कर्ज मंजुरीचे प्रमाणपत्र नाही.'
              : 'Internal SHG operational indicator based on Panchasutra-aligned measures. It is not an official bank credit rating or sanction decision.'}
          </p>
        </div>
      </div>
    </div>
  );
};


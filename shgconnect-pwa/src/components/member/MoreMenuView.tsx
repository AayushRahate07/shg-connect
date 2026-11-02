import React from 'react';
import { SupportedLanguage } from '../../types/shg';
import { BookOpen, Calculator, Award, RefreshCw, Settings, ChevronRight, MoreHorizontal } from 'lucide-react';

interface MoreMenuViewProps {
  language: SupportedLanguage;
  onNavigateTab: (tab: string) => void;
}

export const MoreMenuView: React.FC<MoreMenuViewProps> = ({
  language,
  onNavigateTab
}) => {
  const isMr = language === 'mr';
  const menuOptions = [
    {
      id: 'passbook',
      title: isMr ? 'माझे पासबुक (वही)' : 'My Passbook',
      desc: isMr ? 'सर्व आर्थिक व्यवहारांची सविस्तर नोंद वही' : 'Complete financial transaction register',
      icon: <BookOpen className="w-5 h-5 text-[#0F766E]" />,
      color: 'bg-[#CCFBF1]'
    },
    {
      id: 'calculator',
      title: isMr ? 'कर्ज हप्ता कॅल्क्युलेटर' : 'Loan Calculator',
      desc: isMr ? 'शेकडा दीड रुपये (१.५%) घटत्या बाकीनुसार हप्ता गणना' : 'Diminishing interest calculator',
      icon: <Calculator className="w-5 h-5 text-[#E8720C]" />,
      color: 'bg-[#FFEDD5]'
    },
    {
      id: 'panchasutra',
      title: isMr ? 'गटाची कार्यक्षमता (पंचसूत्र)' : 'SHG Operational Health',
      desc: isMr ? 'नाबार्ड (NABARD) ०-१०० मूल्यांकन व आरोग्य वर्ग' : 'NABARD Panchasutra health scorecard',
      icon: <Award className="w-5 h-5 text-[#0F766E]" />,
      color: 'bg-[#CCFBF1]'
    },
    {
      id: 'sync',
      title: isMr ? 'सिंक केंद्र' : 'Sync Center',
      desc: isMr ? 'ऑफलाइन बदल आणि सर्वर सिंक स्थिती' : 'Offline mutations & sync status',
      icon: <RefreshCw className="w-5 h-5 text-[#0F766E]" />,
      color: 'bg-[#CCFBF1]'
    },
    {
      id: 'settings',
      title: isMr ? 'सेटिंग्ज' : 'Settings',
      desc: isMr ? 'ॲप भाषा, आवाज मार्गदर्शन आणि डेटा बॅकअप' : 'App settings, language & backup',
      icon: <Settings className="w-5 h-5 text-[#78716C]" />,
      color: 'bg-[#F5F5F4]'
    }
  ];

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <MoreHorizontal className="w-6 h-6 text-stone-600" />
          <span>{isMr ? 'अधिक सुविधा' : 'More Features'}</span>
        </h1>
        <p className="text-xs text-stone-500 font-medium mt-0.5">
          {isMr ? 'इतर सर्व साधने, कॅल्क्युलेटर व सेटिंग्ज' : 'Access additional tools, calculator, and settings'}
        </p>
      </div>

      {/* Grouped List Box Container */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-2xs overflow-hidden divide-y divide-stone-100">
        {menuOptions.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigateTab(item.id)}
            className="w-full p-4 hover:bg-stone-50 transition flex items-center justify-between text-left group min-h-[64px] cursor-pointer"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${item.color} shrink-0 transition-transform group-hover:scale-105`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="font-black text-sm text-stone-900 group-hover:text-emerald-900 transition">
                  {item.title}
                </div>
                <div className="text-[11px] text-stone-500 truncate mt-0.5 font-medium">
                  {item.desc}
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800 transition shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </div>
  );
};

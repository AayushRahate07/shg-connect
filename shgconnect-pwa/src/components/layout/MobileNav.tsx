import React from 'react';
import { SupportedLanguage } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { Home, PiggyBank, Landmark, Calendar, MoreHorizontal } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  language: SupportedLanguage;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  language
}) => {
  const items = [
    { id: 'home', label: language === 'mr' ? 'मुख्य' : language === 'hi' ? 'मुख्य' : 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'savings', label: language === 'mr' ? 'बचत' : language === 'hi' ? 'बचत' : 'Savings', icon: <PiggyBank className="w-5 h-5" /> },
    { id: 'loans', label: language === 'mr' ? 'कर्ज' : language === 'hi' ? 'ऋण' : 'Loans', icon: <Landmark className="w-5 h-5" /> },
    { id: 'meetings', label: language === 'mr' ? 'बैठका' : language === 'hi' ? 'बैठकें' : 'Meetings', icon: <Calendar className="w-5 h-5" /> },
    { id: 'more', label: language === 'mr' ? 'अधिक' : language === 'hi' ? 'अधिक' : 'More', icon: <MoreHorizontal className="w-5 h-5" /> }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white text-[#1C1917] border-t border-[#E7E5E4] lg:hidden z-50 print:hidden shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'more' && ['passbook', 'calculator', 'panchasutra', 'reports', 'settings', 'sync'].includes(activeTab));
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-bold transition-colors ${
                isActive ? 'text-[#0F766E] bg-[#CCFBF1]/40 border-t-2 border-t-[#0F766E]' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <span className="mb-0.5">{item.icon}</span>
              <span className="truncate max-w-[64px] text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};


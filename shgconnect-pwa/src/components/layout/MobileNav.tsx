import React from 'react';
import { Role, SupportedLanguage } from '../../types/shg';
import { Home, PiggyBank, Landmark, Calendar, MoreHorizontal, ShieldCheck, Activity, Search, RefreshCw, Award, Settings, Users } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  language: SupportedLanguage;
  currentRole: Role;
}

const getNavItems = (language: SupportedLanguage, role: Role) => {
  const tHome = language === 'mr' ? 'मुख्य' : language === 'hi' ? 'मुख्य' : 'Home';
  const tMore = language === 'mr' ? 'अधिक' : language === 'hi' ? 'अधिक' : 'More';

  if (role === 'AUDITOR') {
    return [
      { id: 'home', label: tHome, icon: Home, color: '#6D28D9' },
      { id: 'panchasutra', label: 'Panchasutra', icon: Award, color: '#6D28D9' },
      { id: 'verifier', label: 'Audit', icon: ShieldCheck, color: '#6D28D9' },
      { id: 'reports', label: 'Reports', icon: Search, color: '#6D28D9' },
      { id: 'settings', label: language === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings, color: '#6D28D9' },
    ];
  }

  if (role === 'ANIMATOR' || (role as string) === 'OFFICER') {
    return [
      { id: 'home', label: language === 'mr' ? 'सर्व ७ गट' : 'Portfolio', icon: Activity, color: '#1D5FA8' },
      { id: 'meetings', label: language === 'mr' ? 'बैठक' : 'Meetings', icon: Calendar, color: '#1D5FA8' },
      { id: 'members', label: language === 'mr' ? 'सभासद' : 'Members', icon: Users, color: '#1D5FA8' },
      { id: 'settings', label: language === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings, color: '#1D5FA8' },
    ];
  }

  if (role === 'OFFICE_BEARER') {
    return [
      { id: 'home', label: tHome, icon: Home, color: '#E8720C' },
      { id: 'members', label: language === 'mr' ? 'सदस्य' : language === 'hi' ? 'सदस्य' : 'Members', icon: Users, color: '#E8720C' },
      { id: 'loans', label: language === 'mr' ? 'कर्ज' : language === 'hi' ? 'ऋण' : 'Loans', icon: Landmark, color: '#E8720C' },
      { id: 'meetings', label: language === 'mr' ? 'बैठका' : language === 'hi' ? 'बैठकें' : 'Meetings', icon: Calendar, color: '#E8720C' },
      { id: 'more', label: tMore, icon: MoreHorizontal, color: '#E8720C' },
    ];
  }

  // MEMBER
  return [
    { id: 'home', label: tHome, icon: Home, color: '#1A6B4A' },
    { id: 'savings', label: language === 'mr' ? 'बचत' : language === 'hi' ? 'बचत' : 'Savings', icon: PiggyBank, color: '#1A6B4A' },
    { id: 'loans', label: language === 'mr' ? 'कर्ज' : language === 'hi' ? 'ऋण' : 'Loans', icon: Landmark, color: '#1A6B4A' },
    { id: 'meetings', label: language === 'mr' ? 'बैठका' : language === 'hi' ? 'बैठकें' : 'Meetings', icon: Calendar, color: '#1A6B4A' },
    { id: 'more', label: tMore, icon: MoreHorizontal, color: '#1A6B4A' },
  ];
};

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onSelectTab, language, currentRole }) => {
  const items = getNavItems(language, currentRole);
  const moreTabIds = ['passbook', 'calculator', 'settings'];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white lg:hidden z-50 print:hidden safe-area-bottom"
      style={{ boxShadow: '0 -2px 16px rgba(17,24,39,0.08)', borderTop: '1px solid #E4E8EF' }}
    >
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto px-1">
        {items.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'more' && moreTabIds.includes(activeTab));
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1.5 gap-0.5 transition-all duration-200 relative"
            >
              {/* Active top indicator */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                  style={{ background: item.color }}
                />
              )}

              {/* Icon container */}
              <span
                className="w-9 h-7 flex items-center justify-center rounded-xl transition-all duration-200"
                style={isActive ? {
                  background: `${item.color}18`,
                } : {}}
              >
                <Icon
                  className="w-[19px] h-[19px] transition-all duration-200"
                  style={{ color: isActive ? item.color : '#9CA3AF', strokeWidth: isActive ? 2.5 : 1.8 }}
                />
              </span>

              {/* Label */}
              <span
                className="text-[10px] font-semibold transition-colors duration-200 truncate max-w-[56px]"
                style={{ color: isActive ? item.color : '#9CA3AF' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

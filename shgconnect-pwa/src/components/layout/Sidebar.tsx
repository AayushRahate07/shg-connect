import React from 'react';
import { Role, SupportedLanguage } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { 
  Home, 
  Users, 
  Landmark, 
  Calendar, 
  BookOpen, 
  Award, 
  FileSpreadsheet, 
  RefreshCw, 
  Settings, 
  Shield,
  Target,
  PiggyBank
} from 'lucide-react';

interface SidebarProps {
  currentRole: Role;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  language: SupportedLanguage;
  onRoleChange: (role: Role) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  language,
  onRoleChange
}) => {
  const t = translations[language] || translations.en;

  // Role-Aware Navigation Definition
  const getNavItems = () => {
    if (currentRole === 'MEMBER') {
      return [
        { id: 'home', label: language === 'mr' ? 'मुख्य पृष्ठ' : language === 'hi' ? 'मुख्य पृष्ठ' : 'Overview', icon: <Home className="w-4 h-4" /> },
        { id: 'savings', label: language === 'mr' ? 'माझी बचत' : language === 'hi' ? 'मेरी बचत' : 'My Savings', icon: <PiggyBank className="w-4 h-4" /> },
        { id: 'loans', label: language === 'mr' ? 'माझे कर्ज' : language === 'hi' ? 'मेरा ऋण' : 'My Loans', icon: <Landmark className="w-4 h-4" /> },
        { id: 'passbook', label: language === 'mr' ? 'माझे पासबुक' : language === 'hi' ? 'मेरा पासबुक' : 'My Passbook', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'meetings', label: language === 'mr' ? 'माझ्या बैठका' : language === 'hi' ? 'मेरी बैठकें' : 'My Meetings', icon: <Calendar className="w-4 h-4" /> },
        { id: 'calculator', label: language === 'mr' ? 'बचत ध्येय' : language === 'hi' ? 'बचत लक्ष्य' : 'Savings Goal', icon: <Target className="w-4 h-4" /> }
      ];
    }

    if (currentRole === 'ANIMATOR') {
      return [
        { id: 'home', label: language === 'mr' ? 'मुख्य पृष्ठ' : language === 'hi' ? 'मुख्य पृष्ठ' : 'Overview', icon: <Home className="w-4 h-4" /> },
        { id: 'members', label: language === 'mr' ? 'माझे SHGs' : language === 'hi' ? 'मेरे SHGs' : 'My SHGs', icon: <Users className="w-4 h-4" /> },
        { id: 'panchasutra', label: language === 'mr' ? 'SHG आरोग्य' : language === 'hi' ? 'SHG स्वास्थ्य' : 'SHG Health', icon: <Award className="w-4 h-4" /> },
        { id: 'loans', label: language === 'mr' ? 'कर्ज वसुली' : language === 'hi' ? 'ऋण वसूली' : 'Loan Recovery', icon: <Landmark className="w-4 h-4" /> },
        { id: 'reports', label: language === 'mr' ? 'अहवाल' : language === 'hi' ? 'रिपोर्ट' : 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> }
      ];
    }

    // Default / Treasurer / Office Bearer
    return [
      { id: 'home', label: language === 'mr' ? 'मुख्य पृष्ठ' : language === 'hi' ? 'मुख्य पृष्ठ' : 'Overview', icon: <Home className="w-4 h-4" /> },
      { id: 'members', label: language === 'mr' ? 'सभासद' : language === 'hi' ? 'सदस्य' : 'Members', icon: <Users className="w-4 h-4" /> },
      { id: 'savings', label: language === 'mr' ? 'बचत' : language === 'hi' ? 'बचत' : 'Savings', icon: <PiggyBank className="w-4 h-4" /> },
      { id: 'loans', label: language === 'mr' ? 'कर्ज व्यवहार' : language === 'hi' ? 'ऋण प्रबंधन' : 'Loans', icon: <Landmark className="w-4 h-4" /> },
      { id: 'meetings', label: language === 'mr' ? 'मासिक बैठक' : language === 'hi' ? 'मासिक बैठक' : 'Meetings', icon: <Calendar className="w-4 h-4" /> },
      { id: 'passbook', label: language === 'mr' ? 'पासबुक' : language === 'hi' ? 'पासबुक' : 'Passbook', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'panchasutra', label: language === 'mr' ? 'पंचसूत्र' : language === 'hi' ? 'पंचसूत्र' : 'Panchasutra', icon: <Award className="w-4 h-4" /> },
      { id: 'reports', label: language === 'mr' ? 'अहवाल' : language === 'hi' ? 'रिपोर्ट' : 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> }
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-[#F5F5F4] text-[#1C1917] flex flex-col h-screen sticky top-0 hidden lg:flex border-r border-[#E7E5E4] z-30 shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E7E5E4] flex items-center space-x-3 bg-white/60">
        <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-black text-lg shadow-xs">
          स
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight text-[#1C1917] flex items-center gap-1.5">
            SHGConnect
          </h1>
          <p className="text-[11px] text-[#78716C] font-medium">सुरक्षित • ऑफलाइन • विश्वासार्ह</p>
        </div>
      </div>

      {/* Role Toggle Switcher */}
      <div className="p-3 mx-3 my-3 bg-white rounded-2xl border border-[#E7E5E4] shadow-xs">
        <div className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
          <Shield className="w-3 h-3 text-[#F97316]" /> Active View Mode
        </div>
        <div className="grid grid-cols-2 gap-1 bg-[#F5F5F4] p-1 rounded-xl border border-[#E7E5E4]">
          <button
            onClick={() => onRoleChange('MEMBER')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center ${
              currentRole === 'MEMBER' 
                ? 'bg-[#FFEDD5] text-[#1C1917] border border-[#F97316]/40 font-extrabold shadow-xs' 
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Member
          </button>
          <button
            onClick={() => onRoleChange('ANIMATOR')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center ${
              currentRole !== 'MEMBER' 
                ? 'bg-[#FFEDD5] text-[#1C1917] border border-[#F97316]/40 font-extrabold shadow-xs' 
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Animator
          </button>
        </div>
      </div>

      {/* Main Role-Aware Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-[#0F766E] font-extrabold shadow-xs border border-[#0F766E]/20'
                  : 'text-[#1C1917] hover:bg-white/80 hover:text-[#0F766E]'
              }`}
            >
              <span className={isActive ? 'text-[#0F766E]' : 'text-[#78716C]'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-3 my-2 border-t border-[#E7E5E4] space-y-1">
          <button
            onClick={() => onSelectTab('sync')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'sync'
                ? 'bg-white text-[#0F766E] font-extrabold shadow-xs border border-[#0F766E]/20'
                : 'text-[#1C1917] hover:bg-white/80'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-[#78716C]" />
            <span>{language === 'mr' ? 'सिंक केंद्र' : language === 'hi' ? 'सिंक केंद्र' : 'Sync Center'}</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-white text-[#0F766E] font-extrabold shadow-xs border border-[#0F766E]/20'
                : 'text-[#1C1917] hover:bg-white/80'
            }`}
          >
            <Settings className="w-4 h-4 text-[#78716C]" />
            <span>{language === 'mr' ? 'सेटिंग्ज' : language === 'hi' ? 'सेटिंग्स' : 'Settings'}</span>
          </button>
        </div>
      </nav>

      {/* Single SHG Identity Footer */}
      <div className="p-4 border-t border-[#E7E5E4] bg-white/60 text-[11px] text-[#78716C]">
        <p className="font-bold text-[#1C1917]">Savitri Mahila Bachat Gat</p>
        <p className="text-[10px] text-[#78716C]">Satara • Maharashtra</p>
      </div>
    </aside>
  );
};


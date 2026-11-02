import React from 'react';
import { Role, SupportedLanguage } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { ShgLogo } from '../common/ShgLogo';
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
  PiggyBank,
  ChevronRight,
  LogOut,
  UserCheck,
  Activity,
  Bell
} from 'lucide-react';

interface SidebarProps {
  currentRole: Role;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  language: SupportedLanguage;
  onRoleChange?: (role: Role) => void;
  onLogout?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  language,
  onLogout,
  unreadNotificationsCount = 0,
  onOpenNotifications
}) => {
  const t = translations[language] || translations.en;
  const isMr = language === 'mr';

  const getNavItems = () => {
    if (currentRole === 'MEMBER') {
      return [
        { id: 'home', label: isMr ? 'मुख्य पृष्ठ' : 'Overview', icon: Home, color: '#14532D' },
        { id: 'savings', label: isMr ? 'माझी बचत' : 'My Savings', icon: PiggyBank, color: '#14532D' },
        { id: 'loans', label: isMr ? 'माझे कर्ज' : 'My Loans', icon: Landmark, color: '#1D5FA8' },
        { id: 'passbook', label: isMr ? 'माझे पासबुक' : 'My Passbook', icon: BookOpen, color: '#6D28D9' },
        { id: 'meetings', label: isMr ? 'माझ्या बैठका' : 'My Meetings', icon: Calendar, color: '#D97706' },
        { id: 'calculator', label: isMr ? 'बचत ध्येय' : 'Savings Goal', icon: Target, color: '#14532D' },
        { id: 'notifications', label: isMr ? 'सूचना' : 'Notifications', icon: Bell, color: '#D97706', badge: unreadNotificationsCount },
      ];
    }

    if (currentRole === 'OFFICE_BEARER') {
      return [
        { id: 'home', label: isMr ? 'मुख्य पृष्ठ' : 'Overview', icon: Home, color: '#14532D' },
        { id: 'members', label: isMr ? 'सभासद यादी' : 'Members Directory', icon: Users, color: '#1D5FA8' },
        { id: 'loans', label: isMr ? 'कर्ज व्यवस्थापन' : 'Loans Register', icon: Landmark, color: '#1D5FA8' },
        { id: 'meetings', label: isMr ? 'मासिक बैठक' : 'Meetings', icon: Calendar, color: '#D97706' },
        { id: 'passbook', label: isMr ? 'डिजिटल पासबुक' : 'Passbook', icon: BookOpen, color: '#6D28D9' },
        { id: 'notifications', label: isMr ? 'सूचना व विनंत्या' : 'Notifications', icon: Bell, color: '#D97706', badge: unreadNotificationsCount },
      ];
    }

    if (currentRole === 'ANIMATOR' || (currentRole as string) === 'OFFICER') {
      return [
        { id: 'home', label: isMr ? 'सर्व ७ गट (Multi-SHG)' : 'Multi-SHG Portfolio', icon: Activity, color: '#1D5FA8' },
        { id: 'meetings', label: isMr ? 'बैठक संचालन' : 'Orchestrate Meeting', icon: Calendar, color: '#1D5FA8' },
        { id: 'members', label: isMr ? 'सर्व ७० सभासद' : 'All 70 Beneficiaries', icon: Users, color: '#1D5FA8' },
        { id: 'notifications', label: isMr ? 'सूचना व विनंत्या' : 'Notifications', icon: Bell, color: '#D97706', badge: unreadNotificationsCount },
        { id: 'sync', label: isMr ? 'डेटा सिंक केंद्र' : 'Sync Center', icon: RefreshCw, color: '#1D5FA8' },
        { id: 'settings', label: isMr ? 'सेटिंग्ज' : 'Settings', icon: Settings, color: '#1D5FA8' },
      ];
    }

    // AUDITOR
    return [
      { id: 'home', label: isMr ? 'शासकीय तपासणी' : 'Govt Inspection', icon: Home, color: '#6D28D9' },
      { id: 'panchasutra', label: isMr ? 'पंचसूत्र अनुपालन' : 'Panchasutra Compliance', icon: Award, color: '#6D28D9' },
      { id: 'verifier', label: isMr ? 'ब्लॉकचेन पडताळणी' : 'Ledger Integrity', icon: Shield, color: '#6D28D9' },
      { id: 'reports', label: isMr ? 'शासकीय अहवाल गोळा करा' : 'Collect Govt Data', icon: FileSpreadsheet, color: '#6D28D9' },
    ];
  };

  const navItems = getNavItems();

  const getRoleSnippet = () => {
    switch (currentRole) {
      case 'OFFICE_BEARER':
      case 'SHG_LEAD' as any:
        return {
          name: isMr ? 'कमलताई पाटील' : 'Kamal-tai Patil',
          title: isMr ? 'गट प्रमुख (SHG Lead - Single SHG)' : 'SHG Lead (1 SHG & Finance)',
          bg: 'bg-amber-100 text-amber-900'
        };
      case 'MEMBER':
        return {
          name: isMr ? 'मीनाबाई जाधव' : 'Meena-bai Jadhav',
          title: isMr ? 'बचत गट सभासद (SHG Member)' : 'SHG Member',
          bg: 'bg-emerald-100 text-emerald-900'
        };
      case 'ANIMATOR':
      case 'OFFICER' as any:
        return {
          name: isMr ? 'सुनिताबाई देशमुख' : 'Sunita-bai Deshmukh',
          title: isMr ? 'प्रभाग अधिकारी (Multi-SHG Officer)' : 'Officer (Manages Multiple SHGs)',
          bg: 'bg-blue-100 text-blue-900'
        };
      case 'AUDITOR':
        return {
          name: isMr ? 'शासकीय वरिष्ठ अधिकारी' : 'Govt Senior Official',
          title: isMr ? 'लेखापरीक्षक (Auditor / Govt Data)' : 'Auditor (Govt Data Collection)',
          bg: 'bg-purple-100 text-purple-900'
        };
      default:
        return { name: 'User', title: 'Member', bg: 'bg-stone-100 text-stone-900' };
    }
  };

  const roleSnippet = getRoleSnippet();

  return (
    <aside className="w-64 bg-white flex flex-col h-screen sticky top-0 hidden lg:flex z-30 border-r border-stone-200 shadow-xs select-none">
      
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-3 border-b border-stone-200">
        <ShgLogo size={36} />
        <div className="min-w-0">
          <h1 className="text-sm font-black tracking-tight text-stone-900 truncate">SHGConnect</h1>
          <p className="text-[10px] text-stone-500 font-bold truncate">
            {isMr ? 'सावित्री महिला बचत गट' : 'Savitri Mahila Bachat Gat'}
          </p>
        </div>
      </div>

      {/* Logged-in User Identity Snippet (STATIC - No Role Jumping!) */}
      <div className="p-3.5 mx-3 mt-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
          {isMr ? 'सक्रिय सत्र (Active Session)' : 'Active Session'}
        </span>
        <p className="text-xs font-black text-stone-900 truncate">
          {roleSnippet.name}
        </p>
        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md ${roleSnippet.bg}`}>
          {roleSnippet.title}
        </span>
      </div>

      {/* Navigation */}
      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-5 mt-4 mb-1">
        {isMr ? 'नेव्हिगेशन' : 'Navigation'}
      </div>
      <nav className="flex-1 px-3 pb-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => { if (item.id === 'notifications' && onOpenNotifications) { onOpenNotifications(); } else { onSelectTab(item.id); } }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                isActive
                  ? 'bg-emerald-50 text-[#14532D] font-black border border-emerald-200'
                  : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#14532D]' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {(item as any).badge !== undefined && (item as any).badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                    {(item as any).badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#14532D]" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Logout button at bottom of sidebar */}
      {onLogout && (
        <div className="p-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isMr ? 'बाहेर पडा (Log Out)' : 'Log Out'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};

import React from 'react';
import { Role, SupportedLanguage, FederationScope } from '../types/shg';
import { ShgLogo } from './common/ShgLogo';
import { ArrowLeft, Globe, LogOut } from 'lucide-react';

interface HeaderProps {
  currentRole: Role;
  onRoleChange?: (role: Role) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  ttsEnabled?: boolean;
  onToggleTts?: () => void;
  onResetData?: () => void;
  onOpenBackupModal?: () => void;
  shgName: string;
  shgNameRegional: string;
  federation?: FederationScope;
  onSwitchShgGroup?: (shgId: string) => void;
  onOpenConflictModal?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onGoBack?: () => void;
  parentTabLabel?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  language,
  onLanguageChange,
  shgName,
  shgNameRegional,
  federation,
  activeTab = 'home',
  onGoBack,
  parentTabLabel,
  onLogout,
}) => {
  const isInnerScreen = activeTab !== 'home';
  const isMr = language === 'mr';

  // Desktop Role Label
  const getRoleLabel = () => {
    switch (currentRole) {
      case 'OFFICE_BEARER':
      case 'SHG_LEAD' as any:
        return isMr ? 'कमलताई • गट प्रमुख (SHG Lead)' : 'Kamal-tai • SHG Lead (Single SHG)';
      case 'MEMBER':
        return isMr ? 'मीनाबाई • सभासद' : 'Meena-bai • SHG Member';
      case 'ANIMATOR':
      case 'OFFICER' as any:
        return isMr ? 'सुनिताबाई • प्रभाग अधिकारी (Officer)' : 'Sunita-bai • Officer (Multi-SHG)';
      case 'AUDITOR':
        return isMr ? 'शासकीय वरिष्ठ अधिकारी (Auditor)' : 'Govt Senior Official (Auditor)';
      default:
        return 'User';
    }
  };

  // Compact Mobile Role Label (Fits cleanly on mobile without ugly truncation)
  const getRoleShortLabel = () => {
    switch (currentRole) {
      case 'OFFICE_BEARER':
      case 'SHG_LEAD' as any:
        return isMr ? 'गट प्रमुख' : 'SHG Lead';
      case 'MEMBER':
        return isMr ? 'सभासद' : 'Member';
      case 'ANIMATOR':
      case 'OFFICER' as any:
        return isMr ? 'अधिकारी' : 'Officer';
      case 'AUDITOR':
        return isMr ? 'लेखापरीक्षक' : 'Auditor';
      default:
        return 'User';
    }
  };

  const getRoleBadgeStyle = () => {
    switch (currentRole) {
      case 'OFFICE_BEARER':
      case 'SHG_LEAD' as any:
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'MEMBER':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'ANIMATOR':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'AUDITOR':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-stone-100 text-stone-900 border-stone-300';
    }
  };

  return (
    <header className="bg-white sticky top-0 z-40 border-b border-stone-200 shadow-2xs print:hidden select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">

        {/* ── Left: Back button or Brand Identity ── */}
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
          {isInnerScreen && onGoBack ? (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition active:scale-95 border border-stone-200"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-xs">
                {parentTabLabel || (isMr ? 'मागे' : 'Back')}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0">
                <ShgLogo size={28} />
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-xs sm:text-sm text-stone-900 tracking-tight truncate leading-tight">
                  {shgNameRegional || shgName}
                </h1>
                <p className="text-[10px] text-stone-500 font-bold truncate leading-none mt-0.5">
                  {federation?.district ? (federation.block ? federation.block + ', ' : '') + federation.district : (isMr ? 'महाराष्ट्र' : 'Maharashtra')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Role Badge + Language Toggle + Logout ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

          {/* Static Role Tag (Full on desktop, compact on mobile) */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 sm:px-2.5 py-1 rounded-full border whitespace-nowrap ${getRoleBadgeStyle()}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block flex-shrink-0" />
            <span className="hidden sm:inline">{getRoleLabel()}</span>
            <span className="inline sm:hidden">{getRoleShortLabel()}</span>
          </span>

          {/* Language Toggle Pill */}
          <button
            type="button"
            onClick={() => onLanguageChange(language === 'mr' ? 'en' : 'mr')}
            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 transition"
            title="Switch Language"
          >
            <Globe className="w-3 h-3 text-stone-500" />
            <span>{language === 'mr' ? 'EN' : 'मराठी'}</span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 text-[11px] font-bold p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition active:scale-95"
              title={isMr ? 'बाहेर पडा (Log Out)' : 'Log Out'}
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{isMr ? 'बाहेर पडा' : 'Log Out'}</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};

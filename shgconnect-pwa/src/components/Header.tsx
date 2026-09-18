import React from 'react';
import { Role, SupportedLanguage, FederationScope } from '../types/shg';
import { Volume2, VolumeX, Database, Network, ChevronDown } from 'lucide-react';
import { SyncStatusPill } from './SyncStatusPill';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  onResetData: () => void;
  onOpenBackupModal: () => void;
  shgName: string;
  shgNameRegional: string;
  federation?: FederationScope;
  onSwitchShgGroup?: (shgId: string) => void;
  onOpenConflictModal?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onGoBack?: () => void;
  parentTabLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  ttsEnabled,
  onToggleTts,
  onResetData,
  onOpenBackupModal,
  shgName,
  shgNameRegional,
  federation,
  onSwitchShgGroup,
  onOpenConflictModal,
  activeTab = 'home',
  onSelectTab,
  onGoBack,
  parentTabLabel
}) => {
  const isInnerScreen = activeTab !== 'home';

  return (
    <header className="bg-white text-[#1C1917] border-b border-[#E7E5E4] sticky top-0 z-40 print:hidden shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left Section: Hierarchical Back Button or Main Brand */}
        <div className="flex items-center space-x-3 min-w-0">
          {isInnerScreen && onGoBack ? (
            <button
              onClick={onGoBack}
              className="flex items-center space-x-2 text-[#1C1917] hover:text-[#0F766E] transition font-extrabold text-xs sm:text-sm bg-[#F5F5F4] hover:bg-[#CCFBF1] px-3.5 py-1.5 rounded-xl border border-[#E7E5E4] shadow-xs"
            >
              <span className="text-base font-bold">←</span>
              <span className="truncate max-w-[160px] sm:max-w-xs">{parentTabLabel || 'मागे'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                स
              </div>
              <div className="flex items-center space-x-2 min-w-0">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#0F766E] flex-shrink-0">
                  SHGConnect
                </span>
                <span className="text-[#E7E5E4] font-light hidden xs:inline">•</span>
                <span className="text-xs font-bold text-[#78716C] truncate hidden xs:inline">
                  {shgNameRegional || shgName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Status Pill: Human Trust Indicator */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="bg-[#CCFBF1] text-[#0F766E] font-extrabold text-[11px] sm:text-xs px-3 py-1 rounded-full border border-[#0F766E]/20 flex items-center gap-1 shadow-2xs">
            <span className="text-xs">✓</span>
            <span>{language === 'mr' ? 'सुरक्षित' : language === 'hi' ? 'सुरक्षित' : 'Secured'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};


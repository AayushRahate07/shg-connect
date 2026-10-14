import React from 'react';
import { Role, SupportedLanguage, FederationScope } from '../../types/shg';
import { Sidebar } from './Sidebar';
import { Header } from '../Header';
import { MobileNav } from './MobileNav';
import { OfflineBanner } from '../OfflineBanner';
import { InstallPrompt } from '../InstallPrompt';

interface AppShellProps {
  children: React.ReactNode;
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
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
  onGoBack?: () => void;
  parentTabLabel?: string;
  demoMode?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentRole,
  onRoleChange,
  activeTab,
  onSelectTab,
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
  onGoBack,
  parentTabLabel,
  demoMode = true
}) => {
  return (
    <div className="min-h-screen w-full flex font-sans relative" style={{ background: '#F4F6FA', color: '#111827' }}>
      {/* Desktop Sidebar */}
      <Sidebar
        currentRole={currentRole}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        language={language}
        onRoleChange={onRoleChange}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {demoMode && (
          <div className="bg-amber-500 text-stone-900 text-[11px] font-black py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 border-b border-amber-600/20 shadow-xs">
            <span>✨ Demo Mode Active • Sample Data (16 Members) • No Internet Required</span>
          </div>
        )}
        <OfflineBanner language={language} />
        {/* Sticky Header */}
        <Header
          currentRole={currentRole}
          onRoleChange={onRoleChange}
          language={language}
          onLanguageChange={onLanguageChange}
          ttsEnabled={ttsEnabled}
          onToggleTts={onToggleTts}
          onResetData={onResetData}
          onOpenBackupModal={onOpenBackupModal}
          shgName={shgName}
          shgNameRegional={shgNameRegional}
          federation={federation}
          onSwitchShgGroup={onSwitchShgGroup}
          onOpenConflictModal={onOpenConflictModal}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          onGoBack={onGoBack}
          parentTabLabel={parentTabLabel}
        />

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 animate-fadeIn">
          {children}
        </main>
      </div>

      <InstallPrompt language={language} />

      {/* Mobile Bottom Nav */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        language={language}
        currentRole={currentRole}
      />
    </div>
  );
};

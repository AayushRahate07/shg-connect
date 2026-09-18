import React from 'react';
import { Role, SupportedLanguage, FederationScope } from '../../types/shg';
import { Sidebar } from './Sidebar';
import { Header } from '../Header';
import { MobileNav } from './MobileNav';

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
  parentTabLabel
}) => {
  return (
    <div className="min-h-[100dvh] w-full bg-[#FAFAF9] text-[#1C1917] flex font-sans overflow-x-hidden relative">
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

        {/* Dynamic Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        language={language}
      />
    </div>
  );
};

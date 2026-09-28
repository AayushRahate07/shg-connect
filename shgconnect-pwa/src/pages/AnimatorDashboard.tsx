import React, { useState } from 'react';
import { GroupInfo } from '../services/db';
import { SupportedLanguage } from '../types/shg';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Building2, Users, RefreshCw, ShieldCheck, Activity } from 'lucide-react';
import { SettingsView } from '../components/settings/SettingsView';
import { AnimatorMultiSHGView } from './AnimatorMultiSHGView';

interface AnimatorDashboardProps {
  group: GroupInfo;
  language: SupportedLanguage;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSyncCenter?: () => void;
  onOpenBackupModal?: () => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onToggleTts?: () => void;
  ttsEnabled?: boolean;
  onResetData?: () => void;
  onOpenAddMember?: () => void;
}

export const AnimatorDashboard: React.FC<AnimatorDashboardProps> = ({
  group,
  language,
  activeTab = 'home',
  onSelectTab,
  onOpenSyncCenter = () => {},
  onOpenBackupModal = () => {},
  onLanguageChange = () => {},
  onToggleTts = () => {},
  ttsEnabled = true,
  onResetData = () => {},
  onOpenAddMember
}) => {
  return (
    <div className="space-y-6">
      {(activeTab === 'home' || activeTab === 'members' || activeTab === 'overview') && (
        <AnimatorMultiSHGView
          currentGroup={group}
          language={language}
          onSelectSHG={(shgId) => {
            if (onSelectTab) onSelectTab('home');
          }}
          onOpenAddMember={onOpenAddMember}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView
          language={language}
          onLanguageChange={onLanguageChange}
          ttsEnabled={ttsEnabled}
          onToggleTts={onToggleTts}
          onOpenBackupModal={onOpenBackupModal}
          onOpenSyncCenter={onOpenSyncCenter}
          onResetData={onResetData}
          federation={group.federation}
        />
      )}
    </div>
  );
};

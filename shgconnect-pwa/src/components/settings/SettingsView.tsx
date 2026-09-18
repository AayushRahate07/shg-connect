import React from 'react';
import { SupportedLanguage, FederationScope } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { Settings, Globe, Volume2, VolumeX, Database, RefreshCw, Lock, Info, Network, ShieldCheck } from 'lucide-react';

interface SettingsViewProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  onOpenBackupModal: () => void;
  onOpenSyncCenter: () => void;
  onResetData: () => void;
  federation?: FederationScope;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onLanguageChange,
  ttsEnabled,
  onToggleTts,
  onOpenBackupModal,
  onOpenSyncCenter,
  onResetData,
  federation
}) => {
  const t = translations[language] || translations.en;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7E5E4] shadow-card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1917] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#0F766E]" />
            <span>{language === 'mr' ? 'सेटिंग्ज' : language === 'hi' ? 'सेटिंग्स' : 'Settings'}</span>
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5 font-medium">
            {language === 'mr' ? 'भाषा, आवाज मार्गदर्शन, डेटा बॅकअप आणि सिंक व्यवस्थापन' : 'Configure language, voice guidance, data backup, and sync options'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language & Accessibility Settings */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-4">
          <div className="flex items-center space-x-2 font-extrabold text-sm text-[#1C1917] pb-2 border-b border-[#E7E5E4]">
            <Globe className="w-4 h-4 text-[#0F766E]" />
            <span>{language === 'mr' ? 'भाषा आणि आवाज पर्याय' : 'Language & Accessibility'}</span>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1C1917] block mb-2">
              {language === 'mr' ? 'ॲपची भाषा (Display Language)' : 'Display Language'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onLanguageChange('mr')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition ${
                  language === 'mr' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-[#F5F5F4] text-[#1C1917] hover:bg-[#CCFBF1]'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition ${
                  language === 'hi' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-[#F5F5F4] text-[#1C1917] hover:bg-[#CCFBF1]'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition ${
                  language === 'en' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-[#F5F5F4] text-[#1C1917] hover:bg-[#CCFBF1]'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1C1917]">
                {language === 'mr' ? 'आवाज मार्गदर्शन (Voice Guidance)' : 'Voice Guidance (TTS)'}
              </div>
              <div className="text-[11px] text-[#78716C] font-medium">
                {language === 'mr' ? 'रक्कम आणि सूचनांचे आवाज मार्गदर्शन' : 'Audio guidance for amounts & instructions'}
              </div>
            </div>
            <button
              onClick={onToggleTts}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                ttsEnabled ? 'bg-[#FFEDD5] text-[#1C1917] border-[#F97316]' : 'bg-[#F5F5F4] text-[#78716C] border-[#E7E5E4]'
              }`}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-[#F97316]" /> : <VolumeX className="w-4 h-4" />}
              <span>{ttsEnabled ? (language === 'mr' ? 'आवाज सुरू' : 'Voice ON') : (language === 'mr' ? 'आवाज बंद' : 'Voice OFF')}</span>
            </button>
          </div>
        </div>

        {/* Data Persistence & Encrypted Backups */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-4">
          <div className="flex items-center space-x-2 font-extrabold text-sm text-[#1C1917] pb-2 border-b border-[#E7E5E4]">
            <Database className="w-4 h-4 text-[#F97316]" />
            <span>{language === 'mr' ? 'डेटा बॅकअप आणि सिंक' : 'Data Backup & Sync'}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1C1917]">
                {language === 'mr' ? 'सुरक्षित बॅकअप (AES-256)' : 'AES-256 Encrypted Backup'}
              </div>
              <div className="text-[11px] text-[#78716C] font-medium">
                {language === 'mr' ? 'पासकोड संरक्षित डेटा फाइल्स' : 'Passcode protected snapshots'}
              </div>
            </div>
            <button
              onClick={onOpenBackupModal}
              className="px-3.5 py-2 bg-[#F5F5F4] hover:bg-[#CCFBF1] text-[#1C1917] border border-[#E7E5E4] rounded-xl text-xs font-bold transition shadow-2xs"
            >
              {language === 'mr' ? 'बॅकअप / रिस्टोर' : 'Backup / Restore'}
            </button>
          </div>

          <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1C1917]">
                {language === 'mr' ? 'सिंक केंद्र (Sync Center)' : 'Data Sync Center'}
              </div>
              <div className="text-[11px] text-[#78716C] font-medium">
                {language === 'mr' ? 'ऑफलाइन नोंदी आणि नेटवर्क सिंक' : 'Inspect outbox queue & network'}
              </div>
            </div>
            <button
              onClick={onOpenSyncCenter}
              className="px-3.5 py-2 bg-[#F5F5F4] hover:bg-[#CCFBF1] text-[#0F766E] border border-[#E7E5E4] rounded-xl text-xs font-bold transition shadow-2xs"
            >
              {language === 'mr' ? 'सिंक केंद्र' : 'Sync Center'}
            </button>
          </div>
        </div>

        {/* Group Context & Federation Scope */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-3">
          <div className="flex items-center space-x-2 font-extrabold text-sm text-[#1C1917] pb-2 border-b border-[#E7E5E4]">
            <Network className="w-4 h-4 text-[#0F766E]" />
            <span>{language === 'mr' ? 'बचत गट व फेडरेशन माहिती' : 'Federation & Group Scope'}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#E7E5E4]/60">
              <span className="text-[#78716C] font-medium">{language === 'mr' ? 'राज्य:' : 'State:'}</span>
              <span className="font-bold text-[#1C1917]">{federation?.state || 'Maharashtra'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E7E5E4]/60">
              <span className="text-[#78716C] font-medium">{language === 'mr' ? 'जिल्हा / तालुका:' : 'District / Block:'}</span>
              <span className="font-bold text-[#1C1917]">{federation?.district || 'Satara'} / {federation?.block || 'Khandala'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E7E5E4]/60">
              <span className="text-[#78716C] font-medium">{language === 'mr' ? 'ग्रामपंचायत:' : 'Gram Panchayat:'}</span>
              <span className="font-bold text-[#1C1917]">{federation?.gramPanchayat || 'Shirwal Prabhag'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#78716C] font-medium">{language === 'mr' ? 'ग्रामसंघ (VO):' : 'Gram Sangha (VO):'}</span>
              <span className="font-bold text-[#1C1917]">{federation?.villageOrganization || 'Shirwal Gram Sangha'}</span>
            </div>
          </div>
        </div>

        {/* Security & Officer Credentials */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-3">
          <div className="flex items-center space-x-2 font-extrabold text-sm text-[#1C1917] pb-2 border-b border-[#E7E5E4]">
            <Lock className="w-4 h-4 text-[#F97316]" />
            <span>{language === 'mr' ? '२-पैकी-३ स्वाक्षरी अधिकारी (Quorum)' : '2-of-3 Quorum Signatories'}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] flex justify-between items-center">
              <div>
                <div className="font-bold text-[#1C1917]">President (अध्यक्ष)</div>
                <div className="text-[10px] text-[#78716C] font-medium">Sunita-bai Deshmukh</div>
              </div>
              <span className="bg-[#FFEDD5] text-[#1C1917] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#F97316]/30">PIN Set</span>
            </div>
            <div className="p-2.5 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] flex justify-between items-center">
              <div>
                <div className="font-bold text-[#1C1917]">Secretary (सचिव)</div>
                <div className="text-[10px] text-[#78716C] font-medium">Anita-tai Shinde</div>
              </div>
              <span className="bg-[#FFEDD5] text-[#1C1917] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#F97316]/30">PIN Set</span>
            </div>
            <div className="p-2.5 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] flex justify-between items-center">
              <div>
                <div className="font-bold text-[#1C1917]">Treasurer (खजिनदार)</div>
                <div className="text-[10px] text-[#78716C] font-medium">Kamal-tai Patil</div>
              </div>
              <span className="bg-[#FFEDD5] text-[#1C1917] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#F97316]/30">PIN Set</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


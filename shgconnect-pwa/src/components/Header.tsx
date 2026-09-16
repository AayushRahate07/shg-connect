import React from 'react';
import { Role, SupportedLanguage } from '../types/shg';
import { ShieldCheck, Volume2, VolumeX, RotateCcw, BookOpen, Users, Database } from 'lucide-react';

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
  shgNameRegional
}) => {
  return (
    <header className="bg-emerald-900 text-white shadow-lg sticky top-0 z-40 print:hidden">
      {/* Top Info Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between text-xs border-b border-emerald-800/60 gap-2">
        <div className="flex items-center space-x-2 font-medium">
          <span className="bg-emerald-700/80 px-2 py-0.5 rounded text-emerald-100 font-semibold tracking-wide">OFFLINE PWA</span>
          <span>{language === 'mr' ? shgNameRegional : shgName}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* TTS Audio Toggle */}
          <button
            onClick={onToggleTts}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full font-medium transition ${
              ttsEnabled ? 'bg-amber-500 text-amber-950 font-bold' : 'bg-emerald-800 text-emerald-300'
            }`}
            title="Toggle Voice Announcements (Web Speech API)"
          >
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{ttsEnabled ? (language === 'mr' ? 'आवाज सुरू' : 'Voice ON') : (language === 'mr' ? 'आवाज बंद' : 'Voice OFF')}</span>
          </button>

          {/* Backup & Restore Modal Trigger */}
          <button
            onClick={onOpenBackupModal}
            className="flex items-center space-x-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 rounded-lg font-medium transition"
            title="Backup or Restore Ledger JSON State"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'mr' ? 'बॅकअप' : 'Backup/Restore'}</span>
          </button>

          {/* Language Switcher */}
          <div className="flex bg-emerald-950 rounded-lg p-0.5 border border-emerald-800">
            <button
              onClick={() => onLanguageChange('mr')}
              className={`px-2 py-0.5 rounded font-semibold text-xs transition ${
                language === 'mr' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-0.5 rounded font-semibold text-xs transition ${
                language === 'hi' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 rounded font-semibold text-xs transition ${
                language === 'en' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Reset Demo Data */}
          <button
            onClick={onResetData}
            className="text-emerald-300 hover:text-rose-300 transition flex items-center space-x-1"
            title="Reset to initial offline demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar with Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-black text-xl shadow">
            स
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              SHGConnect
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-normal">
                Trust Ledger
              </span>
            </h1>
            <p className="text-xs text-emerald-200 hidden sm:block">
              {language === 'mr' ? 'डिजिटल नोंदवही आणि SHA-256 ब्लॉक पडताळणी' : 'Digital Passbook & SHA-256 Ledger Verification'}
            </p>
          </div>
        </div>

        {/* Role Toggle Widget */}
        <div className="flex items-center bg-emerald-950 p-1 rounded-xl border border-emerald-700/60 shadow-inner">
          <button
            onClick={() => onRoleChange('MEMBER')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentRole === 'MEMBER'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'text-emerald-200 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'mr' ? 'सभासद (Member)' : 'Member View'}</span>
          </button>
          <button
            onClick={() => onRoleChange('ANIMATOR')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentRole !== 'MEMBER'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'text-emerald-200 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{language === 'mr' ? 'अध्यक्ष/सचिव (Animator)' : 'Animator/Treasurer'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Role, SupportedLanguage, FederationScope } from '../types/shg';
import { ShgLogo } from './common/ShgLogo';
import { ArrowLeft, LogOut, Bell, Crown, User } from 'lucide-react';

interface HeaderProps {
  isLeadUser?: boolean;
  currentRole?: Role;
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
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  isLeadUser,
  language,
  onLanguageChange,
  shgName,
  shgNameRegional,
  federation,
  activeTab = 'home',
  onGoBack,
  parentTabLabel,
  onLogout,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const isInnerScreen = activeTab !== 'home';
  const isMr = language === 'mr';

  return (
    <header className="bg-white sticky top-0 z-40 border-b border-stone-200 shadow-2xs print:hidden select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">

        {/* ── Left: Back button or Brand Identity ── */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isInnerScreen && onGoBack ? (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition active:scale-95 border border-stone-200 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-xs">
                {parentTabLabel || (isMr ? 'मागे' : 'Back')}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex-shrink-0">
                <ShgLogo size={30} />
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

        {/* ── Right: Notification Bell + Language Switch (अ/A) + Logout ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          {/* Dual-Role Switcher for SHG Leads */}
          {isLeadUser && onRoleChange && (
            <button
              type="button"
              onClick={() => onRoleChange(currentRole === 'MEMBER' ? 'OFFICE_BEARER' : 'MEMBER')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer font-bold text-xs shadow-2xs ${
                currentRole === 'MEMBER'
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 ring-1 ring-amber-300/50'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300 ring-1 ring-emerald-300/50'
              }`}
              title={
                currentRole === 'MEMBER'
                  ? (isMr ? 'गट प्रमुख डॅशबोर्डवर जा (Switch to Lead Operations)' : 'Switch to Group Operations')
                  : (isMr ? 'माझी वैयक्तिक बचत पहा (Switch to Personal Savings)' : 'Switch to Personal Savings')
              }
            >
              {currentRole === 'MEMBER' ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="hidden xs:inline sm:inline">{isMr ? 'गट व्यवस्थापन' : 'Lead Mode'}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                  <span className="hidden xs:inline sm:inline">{isMr ? 'माझी बचत' : 'My Savings'}</span>
                </>
              )}
            </button>
          )}

          {/* High-Visibility Notification Bell Button */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer font-bold text-xs shadow-2xs ${
                unreadNotificationsCount > 0
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400 ring-2 ring-amber-300/50'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
              }`}
              title={isMr ? 'सूचना व प्रलंबित विनंत्या (Notifications & Requests)' : 'Notifications & Requests'}
              aria-label="Notifications"
            >
              <Bell className={`w-4 h-4 shrink-0 ${unreadNotificationsCount > 0 ? 'text-amber-800' : 'text-stone-600'}`} />
              <span className="hidden xs:inline sm:inline font-bold">
                {isMr ? 'सूचना' : 'Notice'}
              </span>
              {unreadNotificationsCount !== undefined && unreadNotificationsCount > 0 ? (
                <span className="min-w-[18px] h-[18px] px-1 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs border-2 border-white animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              ) : (
                <span className="text-[10px] text-stone-400 font-semibold hidden sm:inline">0</span>
              )}
            </button>
          )}

          {/* Language Toggle Pill (अ/A) */}
          <button
            type="button"
            onClick={() => onLanguageChange(language === 'mr' ? 'en' : 'mr')}
            className="inline-flex items-center justify-center font-bold text-xs px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition active:scale-95 cursor-pointer"
            title={isMr ? 'Switch to English' : 'मराठी निवडा'}
            aria-label={isMr ? 'Switch to English' : 'मराठी निवडा'}
          >
            <span className={language === 'mr' ? 'text-emerald-800 font-black' : 'text-stone-400 font-semibold'}>अ</span>
            <span className="text-stone-300 mx-1">/</span>
            <span className={language === 'en' ? 'text-emerald-800 font-black' : 'text-stone-400 font-semibold'}>A</span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200 hover:border-rose-200 transition active:scale-95 cursor-pointer"
              title={isMr ? 'बाहेर पडा (Log Out)' : 'Log Out'}
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

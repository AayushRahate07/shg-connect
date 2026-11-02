import React, { useState, useEffect } from 'react';
import { Role, SupportedLanguage, FederationScope } from '../types/shg';
import { ShgLogo } from './common/ShgLogo';
import { ArrowLeft, LogOut, Bell, Crown, User, Eye, EyeOff, Lock, AlertTriangle, X } from 'lucide-react';
import { getAmountPrivacy, setAmountPrivacy } from '../theme/tokens';

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
  onLockApp?: () => void;
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
  onLockApp,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const isInnerScreen = activeTab !== 'home';
  const isMr = language === 'mr';
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [hideAmounts, setHideAmountsState] = useState<boolean>(getAmountPrivacy());

  useEffect(() => {
    const handlePrivacyEvent = (e: any) => {
      setHideAmountsState(e.detail?.hide ?? getAmountPrivacy());
    };
    window.addEventListener('shg_privacy_changed', handlePrivacyEvent);
    return () => window.removeEventListener('shg_privacy_changed', handlePrivacyEvent);
  }, []);

  const handleTogglePrivacy = () => {
    const newVal = !hideAmounts;
    setHideAmountsState(newVal);
    setAmountPrivacy(newVal);
  };

  return (
    <>
      <header className="bg-white sticky top-0 z-40 border-b border-stone-200 shadow-2xs print:hidden select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* ── Left: Back button (always Home / मुख्य पृष्ठ) or Brand Identity ── */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {isInnerScreen && onGoBack ? (
              <button
                onClick={onGoBack}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition active:scale-95 border border-stone-200 cursor-pointer"
                title={isMr ? 'मुख्य पृष्ठावर जा' : 'Go to Home'}
              >
                <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-xs font-black">
                  {isMr ? 'मुख्य पृष्ठ' : 'Home'}
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

          {/* ── Right Controls: Privacy 👁 + Dual-Role Switch + Notifications + Language (अ/A) + Logout ── */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

            {/* 👁 "रक्कम लपवा" (Privacy Masking for Shared Phones) */}
            <button
              type="button"
              onClick={handleTogglePrivacy}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs ${
                hideAmounts
                  ? 'bg-amber-100 text-amber-950 border-amber-300 ring-1 ring-amber-300'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
              }`}
              title={hideAmounts ? (isMr ? 'रक्कम दाखवा' : 'Show amounts') : (isMr ? 'रक्कम लपवा (गोपनीयता)' : 'Hide amounts')}
              aria-label={hideAmounts ? 'Show amounts' : 'Hide amounts'}
            >
              {hideAmounts ? (
                <EyeOff className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-stone-600 shrink-0" />
              )}
              <span className="hidden md:inline text-[11px]">
                {hideAmounts ? (isMr ? 'दाखवा' : 'Show') : (isMr ? 'रक्कम लपवा' : 'Hide')}
              </span>
            </button>

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
                    ? (isMr ? 'गट प्रमुख डॅशबोर्डवर जा' : 'Switch to Lead Operations')
                    : (isMr ? 'माझी वैयक्तिक बचत पहा' : 'Switch to Personal Savings')
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
                title={isMr ? 'सूचना व प्रलंबित विनंत्या' : 'Notifications & Requests'}
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

            {/* Language Toggle Pill (अ/A) with explicit label */}
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
              <span className="hidden lg:inline text-[10px] text-stone-500 ml-1.5">{isMr ? 'भाषा' : 'Lang'}</span>
            </button>

            {/* Logout Button (triggers confirmation dialog) */}
            {onLogout && (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 hover:border-rose-200 transition active:scale-95 cursor-pointer"
                title={isMr ? 'बाहेर पडा (Log Out)' : 'Log Out'}
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline text-xs font-bold">{isMr ? 'बाहेर पडा' : 'Exit'}</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-stone-900">
                {isMr ? 'बाहेर पडायचे आहे का?' : 'Confirm Logout'}
              </h3>
              <p className="text-xs text-stone-600 font-medium mt-1.5 leading-relaxed">
                {isMr
                  ? 'तुम्हाला खात्री आहे की तुम्ही बचत गट अ‍ॅपमधून बाहेर पडू इच्छिता? तुमचे रेकॉर्ड सुरक्षित सेव्ह आहेत.'
                  : 'Are you sure you want to log out? Your local records remain safely saved.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 active:scale-95 transition"
              >
                {isMr ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout?.();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs active:scale-95 transition"
              >
                {isMr ? 'होय, बाहेर पडा' : 'Yes, Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

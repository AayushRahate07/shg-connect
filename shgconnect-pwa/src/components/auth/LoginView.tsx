import React, { useState, useEffect } from 'react';
import { Member, Role, SupportedLanguage, MembershipRequest } from '../../types/shg';
import { saveMembershipRequest } from '../../services/db';
import { UNIVERSAL_PHONE, findUserByCredentials, SEED_GROUPS } from '../../data/seedData';
import { sound } from '../../services/sound';
import { tts } from '../../services/tts';
import { ShgLogo } from '../common/ShgLogo';

const loginBg = '/login-bg.png';
import {
  ArrowRight,
  UserPlus,
  X,
  CheckCircle2,
  Building2,
  User,
  ShieldCheck,
  ClipboardCheck,
  Zap,
  Lock,
  Phone,
  BookOpen,
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  members: Member[];
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLoginSuccess: (session: { memberId: string; phone: string; role: Role; memberName?: string; shgId?: string }) => void;
  onNavigateRegister?: () => void;
}

interface TierConfig {
  key: string;
  labelMr: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  pin: string;
  nameMr: string;
  nameEn: string;
  role: Role;
  descMr: string;
  descEn: string;
  actionMr: string;
  actionEn: string;
}

const TIERS: TierConfig[] = [
  {
    key: 'MEMBER',
    labelMr: 'सभासद',
    labelEn: 'Member',
    icon: User,
    pin: '1002',
    nameMr: 'अनिता पाटील',
    nameEn: 'Anita Patil',
    role: 'MEMBER',
    descMr: 'वैयक्तिक बचत, कर्ज व पासबुक',
    descEn: 'Savings & Loans',
    actionMr: 'सभासद म्हणून प्रवेश करा',
    actionEn: 'Enter as Member'
  },
  {
    key: 'LEAD',
    labelMr: 'गट प्रमुख',
    labelEn: 'Lead',
    icon: Building2,
    pin: '1001',
    nameMr: 'मीनाताई राऊत',
    nameEn: 'Meena Tai Raut',
    role: 'OFFICE_BEARER',
    descMr: 'गट संचालन, मासिक बैठक व कर्ज वाटप',
    descEn: 'Group operations, meetings & loans',
    actionMr: 'गट प्रमुख म्हणून प्रवेश करा',
    actionEn: 'Enter as Lead'
  },
  {
    key: 'OFFICER',
    labelMr: 'अधिकारी',
    labelEn: 'Officer',
    icon: ClipboardCheck,
    pin: '0001',
    nameMr: 'सुरेखा मोरे',
    nameEn: 'Surekha More',
    role: 'ANIMATOR',
    descMr: 'प्रभाग समन्वय, बहु-गट संनियंत्रण',
    descEn: 'Cluster federation & multi-SHG supervision',
    actionMr: 'अधिकारी म्हणून प्रवेश करा',
    actionEn: 'Enter as Officer'
  },
  {
    key: 'AUDITOR',
    labelMr: 'लेखापरीक्षक',
    labelEn: 'Auditor',
    icon: ShieldCheck,
    pin: '0000',
    nameMr: 'प्रिया देशमुख',
    nameEn: 'Priya Deshmukh',
    role: 'AUDITOR',
    descMr: 'शासकीय तपासणी व वित्तीय अहवाल',
    descEn: 'Statutory audit & compliance inspection',
    actionMr: 'लेखापरीक्षक म्हणून प्रवेश करा',
    actionEn: 'Enter as Auditor'
  }
];

export const LoginView: React.FC<LoginViewProps> = ({
  members,
  language,
  onLanguageChange,
  onLoginSuccess,
  onNavigateRegister
}) => {
  const isMr = language === 'mr';
  const t = (mr: string, en: string) => isMr ? mr : en;

    const [selectedTierKey, setSelectedTierKey] = useState<string>('MEMBER');
  const currentTier = TIERS.find(t => t.key === selectedTierKey) || TIERS[0];

  // Custom PIN Entry modal / directory
  const [showCustomPinModal, setShowCustomPinModal] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [customPhone] = useState<string>(UNIVERSAL_PHONE);
  const [error, setError] = useState<string>('');
  const [matchedUser, setMatchedUser] = useState<any | null>(null);
  const [showDirectory, setShowDirectory] = useState<boolean>(false);

  // Join SHG Modal
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [joinSubmitted, setJoinSubmitted] = useState<boolean>(false);
  const [joinName, setJoinName] = useState<string>('');
  const [joinPhone, setJoinPhone] = useState<string>(UNIVERSAL_PHONE);
  const [joinOccupation, setJoinOccupation] = useState<string>('');

  // Strictly lock viewport and body scrolling while on the Login screen
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyHeight = document.body.style.height;
    const prevBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.height = '';
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.height = prevBodyHeight;
      document.body.style.position = prevBodyPosition;
      document.body.style.width = prevBodyWidth;
    };
  }, []);

  // Live custom PIN matcher
  useEffect(() => {
    if (enteredPin.length === 4) {
      let match = findUserByCredentials(customPhone, enteredPin);
      if (!match && members && members.length > 0) {
        const foundMem = members.find(m => m.pin === enteredPin);
        if (foundMem) {
          match = {
            user: foundMem,
            group: SEED_GROUPS[1] || SEED_GROUPS[0],
            role: foundMem.role,
            shgId: foundMem.shgId || (SEED_GROUPS[1] || SEED_GROUPS[0]).shgCode
          };
        }
      }
      if (match) {
        setMatchedUser(match);
        setError('');
        const matchingTier = TIERS.find(t => t.pin === enteredPin);
        if (matchingTier) {
          setSelectedTierKey(matchingTier.key);
        }
      } else {
        setMatchedUser(null);
        setError(t('अवैध पिन. कृपया ४-अंकी वैध पिन टाका.', 'Invalid PIN. Check the 4-digit code.'));
      }
    } else {
      setMatchedUser(null);
      setError('');
    }
  }, [enteredPin, customPhone, members, isMr]);

  const executeLogin = (userSession: any) => {
    if (!userSession) return;
    sound.playStampSound();
    const displayName = isMr
      ? userSession.user.nameRegional || userSession.user.name
      : userSession.user.name;

    tts.speak(isMr ? `${displayName}, स्वागत आहे.` : `Welcome, ${displayName}.`);

    onLoginSuccess({
      memberId: userSession.user.id,
      phone: UNIVERSAL_PHONE,
      role: userSession.role,
      memberName: displayName,
      shgId: userSession.shgId
    });
  };

  // Direct 1-tap login for current selected tier or specific PIN
  const handleOneTapLogin = (pinToUse = currentTier.pin) => {
    const match = findUserByCredentials(UNIVERSAL_PHONE, pinToUse);
    if (match) {
      executeLogin(match);
    }
  };

  // Join Request submit
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) return;

    const group = SEED_GROUPS[1] || SEED_GROUPS[0];
    const req: MembershipRequest = {
      id: `req-${Date.now()}`,
      shgId: group.shgCode,
      shgName: isMr ? group.nameRegional : group.name,
      name: joinName.trim(),
      nameRegional: joinName.trim(),
      phone: joinPhone.replace(/\D/g, '').slice(-10) || UNIVERSAL_PHONE,
      occupation: joinOccupation,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    saveMembershipRequest(req);
    sound.playStampSound();
    setJoinSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col justify-between p-4 sm:p-6 font-sans select-none text-stone-900 bg-cover bg-center bg-no-repeat z-40 touch-none"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundColor: '#F5E6D3'
      }}
    >
      {/* ── Top Bar: Language Selector (Top Right) ── */}
      <div className="max-w-sm w-full mx-auto flex items-center justify-end shrink-0 pt-1 relative z-10">
        <div className="inline-flex bg-white/95 rounded-xl p-1 border border-stone-200/90 text-xs font-bold shadow-sm">
          <button
            type="button"
            onClick={() => onLanguageChange('mr')}
            className={`px-3 py-1 rounded-lg transition ${language === 'mr' ? 'bg-[#14532D] text-white font-black' : 'text-stone-600'}`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1 rounded-lg transition ${language === 'en' ? 'bg-[#14532D] text-white font-black' : 'text-stone-600'}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* ── Center Login Card (Pixel-perfect match to screenshot) ── */}
      <div className="max-w-sm w-full mx-auto bg-white rounded-lg border border-amber-200/60 shadow-[0_12px_40px_rgba(20,83,45,0.09)] bg-white/98 p-6 sm:p-7 space-y-4 my-auto relative z-10">
        {/* Brand: Circular Logo Seal, Title, Subtitle */}
        <div className="text-center space-y-1">
          <ShgLogo size={46} className="mx-auto" />
          <h1 className="text-xl font-black tracking-tight text-stone-900 leading-tight mt-1.5">
            SHGConnect
          </h1>
          <p className="text-xs text-stone-500 font-medium leading-tight">
            {isMr ? 'डिजिटल नोंदवही प्रणाली' : 'Digital Ledger System'}
          </p>
        </div>

        {/* 4-Tier Segmented Control (Adequate line-height so Marathi matras never clip) */}
        <div className="grid grid-cols-4 bg-stone-50/90 p-1 rounded-lg border border-stone-200/80 gap-1">
          {TIERS.map((tier) => {
            const isSelected = selectedTierKey === tier.key;
            const Icon = tier.icon;
            return (
              <button
                key={tier.key}
                type="button"
                onClick={() => {
                  setSelectedTierKey(tier.key);
                  setError('');
                }}
                className={`py-2 sm:py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer overflow-visible min-h-[58px] ${
                  isSelected
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                <span className="text-[11px] font-bold leading-snug tracking-tight overflow-visible w-full text-center block pt-0.5 pb-0.5">
                  {isMr ? tier.labelMr : tier.labelEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 4-Digit PIN Input (Visible Numbers, No Prefill) ── */}
        <div className="space-y-1.5 pt-1">
          <div className="relative w-full">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoComplete="off"
              value={enteredPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setEnteredPin(val);
              }}
              placeholder="----"
              className="w-full text-center tracking-[16px] sm:tracking-[20px] font-mono text-2xl sm:text-3xl font-black py-2.5 px-4 bg-stone-50 hover:bg-stone-100/70 focus:bg-white border-2 border-stone-200 focus:border-[#14532D] rounded-2xl outline-none shadow-2xs text-stone-900 transition placeholder:text-stone-300 placeholder:tracking-[12px]"
              aria-label="4-digit PIN"
            />
            {enteredPin.length > 0 && (
              <button
                type="button"
                onClick={() => { setEnteredPin(''); setError(''); setMatchedUser(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-500 hover:text-stone-800 flex items-center justify-center text-xs transition cursor-pointer"
                title={isMr ? 'पिन हटवा' : 'Clear'}
              >
                ✕
              </button>
            )}
          </div>

          {/* Minimalist User Verification Pill / Hint */}
          <div className="min-h-[20px] flex items-center justify-center text-center">
            {matchedUser ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full animate-fadeIn shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{isMr ? (matchedUser.user.nameRegional || matchedUser.user.name) : matchedUser.user.name}</span>
                <span className="text-[10px] text-emerald-700 font-semibold opacity-90">
                  · {matchedUser.role === 'OFFICE_BEARER'
                    ? (isMr ? 'गट प्रमुख' : 'Lead')
                    : matchedUser.role === 'ANIMATOR' || matchedUser.role === 'OFFICER'
                    ? (isMr ? 'अधिकारी' : 'Officer')
                    : matchedUser.role === 'AUDITOR'
                    ? (isMr ? 'लेखापरीक्षक' : 'Auditor')
                    : (isMr ? 'सभासद' : 'Member')}
                </span>
              </div>
            ) : error ? (
              <span className="text-[11px] font-bold text-rose-600 animate-shake">
                {error}
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 font-medium">
                {isMr ? 'PIN प्रविष्ट करा किंवा खालील १-टॅप बटणाने थेट प्रवेश करा' : 'Enter PIN or tap instant login below'}
              </span>
            )}
          </div>
        </div>

        {/* ── Sleek 1-Tap Instant Login Button (Directly below PIN box) ── */}
        <button
          type="button"
          onClick={() => handleOneTapLogin(currentTier.pin)}
          className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between bg-emerald-50 hover:bg-emerald-100/90 active:scale-[0.98] text-[#14532D] border border-emerald-200/90 shadow-2xs transition cursor-pointer group"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-6 h-6 rounded-lg bg-[#14532D] text-amber-300 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
            </span>
            <div className="text-left truncate">
              <span className="font-extrabold text-stone-900 block truncate leading-tight">
                {isMr ? '१-टॅप थेट प्रवेश' : '1-Tap Instant Login'}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium truncate block">
                {isMr ? currentTier.nameMr : currentTier.nameEn} ({isMr ? currentTier.labelMr : currentTier.labelEn})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <span className="font-mono text-[11px] font-black bg-white/95 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md shadow-2xs">
              PIN: {currentTier.pin}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition" />
          </div>
        </button>

        {/* ── Main Full-Width Sign-In Action Button ── */}
        <button
          type="button"
          onClick={() => {
            if (matchedUser) {
              executeLogin(matchedUser);
            } else if (enteredPin.length === 4) {
              const match = findUserByCredentials(customPhone, enteredPin);
              if (match) {
                executeLogin(match);
              } else {
                setError(isMr ? 'अवैध पिन. कृपया ४-अंकी वैध पिन टाका.' : 'Invalid PIN.');
              }
            } else {
              handleOneTapLogin(currentTier.pin);
            }
          }}
          className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow transition cursor-pointer ${
            matchedUser
              ? 'bg-[#14532D] hover:bg-emerald-900 active:scale-[0.98] text-white'
              : 'bg-stone-800 hover:bg-stone-900 text-white active:scale-[0.98]'
          }`}
        >
          <span className="truncate">
            {matchedUser
              ? (isMr ? `${matchedUser.user.nameRegional || matchedUser.user.name} म्हणून प्रवेश करा` : `Sign In as ${matchedUser.user.name}`)
              : (isMr ? 'प्रवेश करा (Sign In)' : 'Sign In')}
          </span>
          <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />
        </button>

        {/* ── Single Clean Minimalist Registration Link ── */}
        <div className="pt-2 text-center border-t border-stone-100">
          <button
            type="button"
            onClick={() => {
              if (onNavigateRegister) onNavigateRegister();
              else {
                setJoinSubmitted(false);
                setShowJoinModal(true);
              }
            }}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isMr ? 'नवीन वापरकर्ता? नोंदणी करा / नवीन बचत गट' : 'New user? Register / Start new SHG'}</span>
          </button>
        </div>
      </div>

      {/* ── Bottom Spacer ── */}
      <div className="w-full shrink-0 h-1"></div>

      {/* ── Custom PIN Modal (For any of the 88 members) ── */}
      {showCustomPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-fadeIn touch-auto">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 border border-stone-200 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-black text-stone-900">
                {isMr ? 'सुरक्षा पिन द्वारे लॉगिन' : 'Login with PIN'}
              </span>
              <button
                type="button"
                onClick={() => setShowCustomPinModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-600 mb-1">
                {isMr ? 'नोंदणीकृत मोबाईल' : 'Mobile Number'}
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  readOnly
                  value={customPhone}
                  className="w-full text-xs font-bold pl-8 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-700 select-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span>{isMr ? '४-अंकी सुरक्षा पिन' : '4-Digit Security PIN'}</span>
                <Lock className="w-3 h-3 text-stone-400" />
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={enteredPin}
                onChange={e => setEnteredPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                autoFocus
                className="w-full text-center text-xl font-black tracking-[0.4em] py-2 bg-stone-50 border-2 border-stone-300 focus:border-emerald-700 rounded-xl outline-none text-stone-900 transition"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5 flex items-center gap-1.5 text-rose-700 text-[10px] font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {matchedUser && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-900 truncate">
                    {isMr ? matchedUser.user.nameRegional || matchedUser.user.name : matchedUser.user.name}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md">
                    {matchedUser.role}
                  </span>
                </div>
                <p className="text-[9.5px] text-emerald-700 font-semibold truncate">
                  {matchedUser.group.name}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (matchedUser) {
                  setShowCustomPinModal(false);
                  executeLogin(matchedUser);
                }
              }}
              disabled={!matchedUser}
              className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
            >
              <span>{isMr ? 'प्रवेश करा' : 'Enter Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCustomPinModal(false);
                setShowDirectory(true);
              }}
              className="w-full text-[10px] font-bold text-emerald-800 hover:underline flex items-center justify-center gap-1"
            >
              <BookOpen className="w-3 h-3 text-emerald-700" />
              <span>{isMr ? 'सर्व ८८ सभासद पिन निर्देशिका' : 'View 88 Users PIN Directory'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 88 Users PIN Directory Modal ── */}
      {showDirectory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-fadeIn touch-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 border border-stone-200 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-800" />
                <h3 className="text-xs font-black text-stone-900">
                  {isMr ? 'सर्व ८८ युजर्स पिन निर्देशिका' : '88 Users PIN Directory'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectory(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] text-stone-500 font-semibold shrink-0">
              {isMr ? 'मोबाईल: 9876543210 · कोणत्याही पिनवर क्लिक करून थेट लॉगिन करा:' : 'Mobile: 9876543210 · Tap any PIN to auto-login:'}
            </p>

            <div className="overflow-y-auto space-y-2.5 pr-1 text-xs">
              {/* Tier 4: Auditor */}
              <div
                onClick={() => {
                  setShowDirectory(false);
                  handleOneTapLogin('0000');
                }}
                className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 cursor-pointer hover:bg-purple-100 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-950 text-xs">Priya Deshmukh (प्रिया देशमुख)</span>
                  <span className="font-mono font-black text-xs bg-purple-800 text-white px-2 py-0.5 rounded-md">PIN: 0000</span>
                </div>
                <p className="text-[10px] text-purple-800 font-semibold">
                  AUDITOR TIER 4 • State Resource Person / Auditor (MSRLM / UMED)
                </p>
              </div>

              {/* Tier 3: Officer */}
              <div
                onClick={() => {
                  setShowDirectory(false);
                  handleOneTapLogin('0001');
                }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 cursor-pointer hover:bg-blue-100 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-950 text-xs">Surekha More (सुरेखा मोरे)</span>
                  <span className="font-mono font-black text-xs bg-blue-800 text-white px-2 py-0.5 rounded-md">PIN: 0001</span>
                </div>
                <p className="text-[10px] text-blue-800 font-semibold">
                  OFFICER TIER 3 • UMED Cluster Coordinator / Field Officer (Multi-SHG)
                </p>
              </div>

              {/* 6 SHGs */}
              {SEED_GROUPS.map((g, idx) => (
                <div key={g.shgCode} className="border border-stone-200 rounded-xl p-2.5 space-y-1.5 bg-stone-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-stone-900">{idx + 1}. {g.district} — {isMr ? g.nameRegional : g.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDirectory(false);
                        handleOneTapLogin(`${(idx + 1) * 1000 + 1}`);
                      }}
                      className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md hover:bg-amber-300 transition"
                    >
                      👑 Leader: {(idx + 1) * 1000 + 1}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDirectory(false);
                        handleOneTapLogin(`${(idx + 1) * 1000 + 2}`);
                      }}
                      className="text-[10px] font-bold bg-white text-stone-700 border border-stone-200 px-2 py-0.5 rounded-md hover:bg-stone-100 transition"
                    >
                      Members: {(idx + 1) * 1000 + 2} - {(idx + 1) * 1000 + (idx === 0 ? 14 : idx === 1 ? 16 : idx === 2 ? 12 : idx === 3 ? 15 : idx === 4 ? 13 : 17)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Join Modal ── */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 z-50 animate-fadeIn touch-auto">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 border border-stone-200 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-black text-stone-900">
                {isMr ? 'बचत गटात सामील व्हा' : 'Join SHG'}
              </span>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {joinSubmitted ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto" />
                <p className="text-xs font-bold text-stone-800">
                  {isMr ? 'तुमचा अर्ज नोंदवला गेला आहे!' : 'Application Submitted!'}
                </p>
                <p className="text-[11px] text-stone-500">
                  {isMr ? 'गट प्रमुख लवकरच मंजुरी देतील.' : 'Group Head will review and approve.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="mt-2 w-full bg-[#14532D] text-white text-xs font-bold py-2 rounded-xl"
                >
                  {isMr ? 'ठीक आहे' : 'Done'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                    {isMr ? 'पूर्ण नाव' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={joinName}
                    onChange={e => setJoinName(e.target.value)}
                    placeholder={isMr ? 'उदा. सुनिता पवार' : 'e.g. Sunita Pawar'}
                    className="w-full border border-stone-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                    {isMr ? 'मोबाईल क्रमांक' : 'Phone'} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={joinPhone}
                    onChange={e => setJoinPhone(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-emerald-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                    {isMr ? 'व्यवसाय' : 'Occupation'}
                  </label>
                  <input
                    type="text"
                    value={joinOccupation}
                    onChange={e => setJoinOccupation(e.target.value)}
                    placeholder={isMr ? 'उदा. दुग्ध व्यवसाय' : 'e.g. Farming / Dairy'}
                    className="w-full border border-stone-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-emerald-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#14532D] text-white font-bold py-2 rounded-xl text-xs mt-1"
                >
                  {isMr ? 'अर्ज पाठवा' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

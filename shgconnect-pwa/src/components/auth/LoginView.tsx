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
  Zap,
  Lock,
  Phone,
  BookOpen,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  members: Member[];
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLoginSuccess: (session: { memberId: string; phone: string; role: Role; memberName?: string; shgId?: string }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  members,
  language,
  onLanguageChange,
  onLoginSuccess
}) => {
  const isMr = language === 'mr';
  const t = (mr: string, en: string) => isMr ? mr : en;

  // Universal phone number: 9876543210
  const [phone, setPhone] = useState<string>(UNIVERSAL_PHONE);
  const [pin, setPin] = useState<string>('');
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

  // Live PIN matcher
  useEffect(() => {
    if (pin.length === 4) {
      const match = findUserByCredentials(phone, pin);
      if (match) {
        setMatchedUser(match);
        setError('');
      } else {
        setMatchedUser(null);
        setError(t('अवैध पिन. कृपया ४-अंकी वैध पिन टाका.', 'Invalid PIN. Check the 4-digit code.'));
      }
    } else {
      setMatchedUser(null);
      setError('');
    }
  }, [pin, phone, isMr]);

  const handleLogin = (userSession = matchedUser) => {
    if (!userSession) {
      setError(t('कृपया ४-अंकी वैध पिन टाका.', 'Please enter a valid 4-digit PIN.'));
      return;
    }

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

  // Quick 1-tap chip selector for evaluation
  const handleQuickPinSelect = (quickPin: string) => {
    setPin(quickPin);
    const match = findUserByCredentials(UNIVERSAL_PHONE, quickPin);
    if (match) {
      setMatchedUser(match);
      handleLogin(match);
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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col justify-between p-2.5 sm:p-4 font-sans select-none text-stone-900 bg-cover bg-center bg-no-repeat z-40 touch-none"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundColor: '#F5E6D3'
      }}
    >
      {/* ── Top Bar: Language Selector ── */}
      <div className="max-w-xs w-full mx-auto flex items-center justify-end shrink-0 pt-0.5 relative z-10">
        <div className="inline-flex bg-white/90 backdrop-blur-xs rounded-lg p-0.5 border border-stone-200/80 text-[11px] font-bold shadow-xs">
          <button
            type="button"
            onClick={() => onLanguageChange('mr')}
            className={`px-2 py-0.5 rounded transition ${language === 'mr' ? 'bg-[#14532D] text-white font-black' : 'text-stone-600'}`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-0.5 rounded transition ${language === 'en' ? 'bg-[#14532D] text-white font-black' : 'text-stone-600'}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* ── Center Login Card (Strictly viewport bounded) ── */}
      <div className="max-w-xs w-full mx-auto bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-2xl p-4 space-y-2.5 my-auto shrink-0 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-0.5">
          <ShgLogo size={32} className="mx-auto" />
          <h1 className="text-sm font-black tracking-tight text-stone-900 leading-tight">
            SHGConnect
          </h1>
          <p className="text-[10px] text-stone-500 font-bold leading-tight">
            {t('डिजिटल स्वयंसहाय्यता गट प्रणाली', 'Self-Help Group Digital Ledger')}
          </p>
        </div>

        {/* Mobile & 4-Digit Security PIN Form */}
        <div className="space-y-2 pt-0.5">
          {/* Mobile Display */}
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">
              {t('नोंदणीकृत मोबाईल', 'Mobile Number')}
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                readOnly
                value={phone}
                className="w-full text-xs font-bold pl-8 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-700 select-all outline-none"
              />
            </div>
          </div>

          {/* 4-Digit Security PIN Input */}
          <div>
            <label className="block text-[10px] font-bold text-stone-700 mb-1 flex items-center justify-between">
              <span>{t('४-अंकी सुरक्षा पिन', '4-Digit Security PIN')}</span>
              <Lock className="w-3 h-3 text-stone-400" />
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              autoFocus
              className="w-full text-center text-xl font-black tracking-[0.4em] py-2 bg-stone-50 border-2 border-stone-300 focus:border-emerald-700 rounded-xl outline-none text-stone-900 transition"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5 flex items-center gap-1.5 text-rose-700 text-[10px] font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Identification Preview Badge */}
          {matchedUser && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 animate-in fade-in space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-900 truncate">
                  {isMr ? matchedUser.user.nameRegional || matchedUser.user.name : matchedUser.user.name}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md">
                  {matchedUser.role === 'AUDITOR'
                    ? (isMr ? 'लेखापरीक्षक (Tier 4)' : 'Auditor (Tier 4)')
                    : (matchedUser.role === 'ANIMATOR' || matchedUser.role === 'OFFICER')
                    ? (isMr ? 'अधिकारी (Tier 3)' : 'Officer (Tier 3)')
                    : (matchedUser.role === 'OFFICE_BEARER' || matchedUser.role === 'SHG_LEAD')
                    ? (isMr ? 'गट प्रमुख (Tier 2)' : 'Lead (Tier 2)')
                    : (isMr ? 'सभासद (Tier 1)' : 'Member (Tier 1)')
                  }
                </span>
              </div>
              <p className="text-[9.5px] text-emerald-700 font-semibold truncate">
                {matchedUser.role === 'AUDITOR' || matchedUser.role === 'ANIMATOR' || matchedUser.role === 'OFFICER'
                  ? (isMr ? 'महाराष्ट्र राज्य ग्रामीण जीवनोन्नती अभियान (UMED)' : 'MSRLM / UMED Maharashtra')
                  : `${isMr ? matchedUser.group.nameRegional : matchedUser.group.name} • ${matchedUser.group.district}`}
              </p>
            </div>
          )}

          {/* LOGIN SUBMIT BUTTON */}
          <button
            type="button"
            onClick={() => handleLogin()}
            disabled={!matchedUser}
            className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-50 active:scale-[0.98] text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>
              {matchedUser
                ? t('प्रवेश करा (Enter Dashboard)', 'Enter Dashboard')
                : t('पिन टाका (Enter 4-Digit PIN)', 'Enter 4-Digit PIN')}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
          </button>
        </div>

        {/* ── 4 ONE TAP ACCESS ── */}
        <div className="space-y-1.5 pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
              {t('१-टॅप प्रवेश', '1-Tap Access')}
            </span>
            <button
              type="button"
              onClick={() => setShowDirectory(true)}
              className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3 text-emerald-700" />
              <span>{t('सर्व पिन', 'PIN Directory')}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {/* 1. MEMBER */}
            <button
              type="button"
              onClick={() => handleQuickPinSelect('1002')}
              className="p-2 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-600 active:scale-[0.98] rounded-xl border border-stone-200 text-left transition shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10.5px] font-black text-stone-900 tracking-tight">MEMBER</span>
                <span className="text-[9px] font-mono font-bold text-stone-400">1002</span>
              </div>
              <span className="text-[9.5px] font-semibold text-stone-500 truncate mt-0.5">
                {isMr ? 'अनिता पाटील' : 'Anita Patil'}
              </span>
            </button>

            {/* 2. LEAD TIER 2 */}
            <button
              type="button"
              onClick={() => handleQuickPinSelect('1001')}
              className="p-2 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-600 active:scale-[0.98] rounded-xl border border-stone-200 text-left transition shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10.5px] font-black text-stone-900 tracking-tight">LEAD TIER 2</span>
                <span className="text-[9px] font-mono font-bold text-stone-400">1001</span>
              </div>
              <span className="text-[9.5px] font-semibold text-stone-500 truncate mt-0.5">
                {isMr ? 'मीनाताई राऊत' : 'Meena Tai'}
              </span>
            </button>

            {/* 3. OFFICER TIER 3 */}
            <button
              type="button"
              onClick={() => handleQuickPinSelect('0001')}
              className="p-2 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-600 active:scale-[0.98] rounded-xl border border-stone-200 text-left transition shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10.5px] font-black text-stone-900 tracking-tight">OFFICER TIER 3</span>
                <span className="text-[9px] font-mono font-bold text-stone-400">0001</span>
              </div>
              <span className="text-[9.5px] font-semibold text-stone-500 truncate mt-0.5">
                {isMr ? 'सुरेखा मोरे' : 'Surekha More'}
              </span>
            </button>

            {/* 4. AUDITOR TIER 4 */}
            <button
              type="button"
              onClick={() => handleQuickPinSelect('0000')}
              className="p-2 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-600 active:scale-[0.98] rounded-xl border border-stone-200 text-left transition shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10.5px] font-black text-stone-900 tracking-tight">AUDITOR TIER 4</span>
                <span className="text-[9px] font-mono font-bold text-stone-400">0000</span>
              </div>
              <span className="text-[9.5px] font-semibold text-stone-500 truncate mt-0.5">
                {isMr ? 'प्रिया देशमुख' : 'Priya Deshmukh'}
              </span>
            </button>
          </div>
        </div>

        {/* ── Join SHG Link (Non-members) ── */}
        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={() => {
              setJoinSubmitted(false);
              setShowJoinModal(true);
            }}
            className="text-[9.5px] font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
          >
            <UserPlus className="w-3 h-3" />
            <span>{t('नवीन सभासद? बचत गटात सामील व्हा', 'New? Apply to Join an SHG')}</span>
          </button>
        </div>
      </div>

      {/* ── Bottom Anchor ── */}
      <div className="w-full shrink-0 h-1"></div>

      {/* ── 88 Users PIN Directory Modal ── */}
      {showDirectory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-fadeIn touch-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 border border-stone-200 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-800" />
                <h3 className="text-xs font-black text-stone-900">
                  {t('सर्व ८८ युजर्स पिन निर्देशिका', '88 Users PIN Directory')}
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
              {t('मोबाईल: 9876543210 · कोणत्याही पिनवर क्लिक करून थेट लॉगिन करा:', 'Mobile: 9876543210 · Tap any PIN to auto-login:')}
            </p>

            <div className="overflow-y-auto space-y-2.5 pr-1 text-xs">
              {/* Tier 4: Auditor */}
              <div
                onClick={() => {
                  setShowDirectory(false);
                  handleQuickPinSelect('0000');
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
                  handleQuickPinSelect('0001');
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
                    {/* Leader PIN */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowDirectory(false);
                        handleQuickPinSelect(`${(idx + 1) * 1000 + 1}`);
                      }}
                      className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md hover:bg-amber-300 transition"
                    >
                      👑 Leader: {(idx + 1) * 1000 + 1}
                    </button>
                    {/* Member PIN range */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowDirectory(false);
                        handleQuickPinSelect(`${(idx + 1) * 1000 + 2}`);
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
                {t('बचत गटात सामील व्हा', 'Join SHG')}
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
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-xs font-black text-stone-800">
                  {t('अर्ज यशस्वीपणे सादर झाला!', 'Application Submitted!')}
                </p>
                <p className="text-[10px] text-stone-500 font-semibold">
                  {t('गट प्रमुख पुढील बैठकीत मंजुरी देतील.', 'SHG Lead will review at next meeting.')}
                </p>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="w-full py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold"
                >
                  {t('बंद करा', 'Close')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                    {t('पूर्ण नाव', 'Full Name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={joinName}
                    onChange={e => setJoinName(e.target.value)}
                    placeholder="उदा. सुनिता कांबळे"
                    className="w-full text-xs py-1.5 px-2 bg-stone-50 border border-stone-200 rounded-lg outline-none font-semibold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                    {t('मोबाईल नंबर', 'Mobile Number')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={joinPhone}
                    onChange={e => setJoinPhone(e.target.value)}
                    className="w-full text-xs py-1.5 px-2 bg-stone-50 border border-stone-200 rounded-lg outline-none font-semibold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                    {t('व्यवसाय', 'Occupation')}
                  </label>
                  <input
                    type="text"
                    value={joinOccupation}
                    onChange={e => setJoinOccupation(e.target.value)}
                    placeholder="उदा. शिलाई काम, शेती"
                    className="w-full text-xs py-1.5 px-2 bg-stone-50 border border-stone-200 rounded-lg outline-none font-semibold text-stone-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#14532D] text-white py-2 rounded-xl text-xs font-black shadow transition active:scale-95"
                >
                  {t('अर्ज सादर करा', 'Submit Application')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  members: Member[];
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLoginSuccess: (session: { memberId: string; phone: string; role: Role; memberName?: string; shgId?: string }) => void;
}

const TIERS = [
  { pin: '1002', label: 'Member',        labelMr: 'सभासद',        name: 'Anita Patil',       nameMr: 'अनिता पाटील'    },
  { pin: '1001', label: 'Lead',          labelMr: 'गट प्रमुख',    name: 'Meena Tai Raut',    nameMr: 'मीनाताई राऊत'   },
  { pin: '0001', label: 'Officer',       labelMr: 'अधिकारी',      name: 'Surekha More',      nameMr: 'सुरेखा मोरे'    },
  { pin: '0000', label: 'Auditor',       labelMr: 'लेखापरीक्षक',  name: 'Priya Deshmukh',    nameMr: 'प्रिया देशमुख'  },
];

export const LoginView: React.FC<LoginViewProps> = ({
  members,
  language,
  onLanguageChange,
  onLoginSuccess
}) => {
  const isMr = language === 'mr';
  const t = (mr: string, en: string) => isMr ? mr : en;

  const [phone] = useState<string>(UNIVERSAL_PHONE);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [matchedUser, setMatchedUser] = useState<any | null>(null);
  const [showDirectory, setShowDirectory] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [joinSubmitted, setJoinSubmitted] = useState<boolean>(false);
  const [joinName, setJoinName] = useState<string>('');
  const [joinPhone, setJoinPhone] = useState<string>(UNIVERSAL_PHONE);
  const [joinOccupation, setJoinOccupation] = useState<string>('');

  // Lock viewport — no scroll on login screen
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
        setError(t('चुकीचा पिन', 'Wrong PIN'));
      }
    } else {
      setMatchedUser(null);
      setError('');
    }
  }, [pin, phone, isMr]);

  const handleLogin = (userSession = matchedUser) => {
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

  const handleQuickPinSelect = (quickPin: string) => {
    setPin(quickPin);
    const match = findUserByCredentials(UNIVERSAL_PHONE, quickPin);
    if (match) {
      setMatchedUser(match);
      handleLogin(match);
    }
  };

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

  const getRoleLabel = (role: string) => {
    if (role === 'AUDITOR') return isMr ? 'लेखापरीक्षक' : 'Auditor';
    if (role === 'ANIMATOR' || role === 'OFFICER') return isMr ? 'क्षेत्र अधिकारी' : 'Field Officer';
    if (role === 'OFFICE_BEARER' || role === 'SHG_LEAD') return isMr ? 'गट प्रमुख' : 'SHG Lead';
    return isMr ? 'सभासद' : 'Member';
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col font-sans select-none text-stone-900 bg-cover bg-center bg-no-repeat z-40 touch-none"
      style={{ backgroundImage: `url(${loginBg})`, backgroundColor: '#F5E6D3' }}
    >
      {/* Language toggle — top right, unobtrusive */}
      <div className="absolute top-3 right-3 z-20">
        <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-lg p-0.5 border border-white/60 text-[11px] font-semibold shadow-sm">
          <button
            type="button"
            onClick={() => onLanguageChange('mr')}
            className={`px-2.5 py-1 rounded-md transition ${language === 'mr' ? 'bg-stone-800 text-white' : 'text-stone-500'}`}
          >
            म
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 rounded-md transition ${language === 'en' ? 'bg-stone-800 text-white' : 'text-stone-500'}`}
          >
            A
          </button>
        </div>
      </div>

      {/* ── Main card — centered, single focal point ── */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[320px] bg-white/96 backdrop-blur-md rounded-3xl shadow-2xl border border-white/80 overflow-hidden">

          {/* Brand header */}
          <div className="px-6 pt-7 pb-5 text-center border-b border-stone-100">
            <ShgLogo size={36} className="mx-auto mb-2.5" />
            <h1 className="text-base font-black text-stone-900 tracking-tight leading-none">SHGConnect</h1>
            <p className="text-[11px] text-stone-400 font-medium mt-1">
              {t('स्वयंसहाय्यता गट डिजिटल खातेवही', 'Self-Help Group Ledger')}
            </p>
          </div>

          {/* PIN entry */}
          <div className="px-6 pt-5 pb-4 space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 mb-2 text-center">
                {t('तुमचा ४-अंकी पिन टाका', 'Enter your 4-digit PIN')}
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                autoFocus
                className="w-full text-center text-2xl font-black tracking-[0.5em] py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 rounded-2xl outline-none text-stone-900 transition placeholder:text-stone-300"
              />
            </div>

            {/* Error — inline, small */}
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-rose-600 text-[11px] font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Matched user preview — clean pill */}
            {matchedUser && !error && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-black text-emerald-900 truncate leading-none">
                    {isMr ? matchedUser.user.nameRegional || matchedUser.user.name : matchedUser.user.name}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                    {getRoleLabel(matchedUser.role)}
                    {matchedUser.group?.district ? ` · ${matchedUser.group.district}` : ''}
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
              </div>
            )}

            {/* Login button */}
            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={!matchedUser}
              className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 active:scale-[0.98] text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition"
            >
              <span>{matchedUser ? t('आत प्रवेश करा', 'Sign In') : t('पिन टाका', 'Enter PIN')}</span>
              {matchedUser && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Demo access — demarcated, secondary */}
          <div className="px-6 pb-6 space-y-2.5">
            <p className="text-[10px] font-semibold text-stone-400 text-center uppercase tracking-widest">
              {t('त्वरित प्रवेश (Demo)', 'Quick Demo Access')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TIERS.map(tier => (
                <button
                  key={tier.pin}
                  type="button"
                  onClick={() => handleQuickPinSelect(tier.pin)}
                  className="group flex flex-col items-start px-3 py-2.5 bg-stone-50 hover:bg-stone-100 active:scale-[0.97] rounded-xl border border-stone-200 transition text-left"
                >
                  <span className="text-[11px] font-bold text-stone-800 leading-none">
                    {isMr ? tier.labelMr : tier.label}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium mt-0.5 truncate w-full">
                    {isMr ? tier.nameMr : tier.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => { setJoinSubmitted(false); setShowJoinModal(true); }}
                className="text-[10px] font-medium text-stone-400 hover:text-stone-600 flex items-center gap-1 transition"
              >
                <UserPlus className="w-3 h-3" />
                {t('सामील व्हा', 'Join SHG')}
              </button>
              <button
                type="button"
                onClick={() => setShowDirectory(true)}
                className="text-[10px] font-medium text-stone-400 hover:text-stone-600 transition"
              >
                {t('सर्व पिन पाहा', 'All PINs')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PIN Directory Modal ── */}
      {showDirectory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 z-50 touch-auto">
          <div className="bg-white rounded-3xl w-full max-w-sm border border-stone-100 shadow-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
              <div>
                <h3 className="text-sm font-black text-stone-900">{t('पिन निर्देशिका', 'PIN Directory')}</h3>
                <p className="text-[10px] text-stone-400 font-medium mt-0.5">
                  {t('कोणत्याही पिनवर टॅप करा — थेट लॉगिन', 'Tap any PIN to sign in instantly')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectory(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-3 space-y-2">
              {/* Special tiers */}
              {[
                { pin: '0000', role: 'Auditor (Tier 4)', roleMr: 'लेखापरीक्षक (Tier 4)', name: 'Priya Deshmukh', nameMr: 'प्रिया देशमुख', desc: 'MSRLM / UMED — Maharashtra', bg: 'bg-violet-50 border-violet-200' },
                { pin: '0001', role: 'Officer (Tier 3)', roleMr: 'अधिकारी (Tier 3)', name: 'Surekha More', nameMr: 'सुरेखा मोरे', desc: 'UMED Cluster Coordinator', bg: 'bg-blue-50 border-blue-200' },
              ].map(item => (
                <button
                  key={item.pin}
                  type="button"
                  onClick={() => { setShowDirectory(false); handleQuickPinSelect(item.pin); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 ${item.bg} border rounded-xl hover:brightness-95 transition text-left`}
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-stone-900 leading-none">{isMr ? item.nameMr : item.name}</p>
                    <p className="text-[10px] text-stone-500 font-medium mt-0.5">{isMr ? item.roleMr : item.role} · {item.desc}</p>
                  </div>
                  <span className="font-mono text-xs font-black text-stone-600 bg-white/80 px-2 py-0.5 rounded-lg border border-stone-200 shrink-0 ml-3">{item.pin}</span>
                </button>
              ))}

              {/* 6 SHGs */}
              {SEED_GROUPS.map((g, idx) => (
                <div key={g.shgCode} className="border border-stone-100 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-stone-50">
                    <p className="text-[11px] font-bold text-stone-700 leading-tight">
                      {g.district} · {isMr ? g.nameRegional : g.name}
                    </p>
                  </div>
                  <div className="flex px-3 py-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowDirectory(false); handleQuickPinSelect(`${(idx + 1) * 1000 + 1}`); }}
                      className="flex-1 text-[10px] font-bold py-1 bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 transition"
                    >
                      Lead · {(idx + 1) * 1000 + 1}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowDirectory(false); handleQuickPinSelect(`${(idx + 1) * 1000 + 2}`); }}
                      className="flex-1 text-[10px] font-medium py-1 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition"
                    >
                      Member · {(idx + 1) * 1000 + 2}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Join SHG Modal ── */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 z-50 touch-auto">
          <div className="bg-white rounded-3xl w-full max-w-xs border border-stone-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <h3 className="text-sm font-black text-stone-900">{t('गटात सामील व्हा', 'Join an SHG')}</h3>
              <button type="button" onClick={() => setShowJoinModal(false)} className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {joinSubmitted ? (
              <div className="text-center px-6 py-8 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-black text-stone-800">{t('अर्ज सादर झाला!', 'Application Sent!')}</p>
                <p className="text-[11px] text-stone-400 font-medium">{t('गट प्रमुख पुढील बैठकीत आढावा घेतील.', 'The SHG Lead will review at the next meeting.')}</p>
                <button type="button" onClick={() => setShowJoinModal(false)} className="w-full py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold mt-1">
                  {t('बंद करा', 'Close')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="px-5 py-4 space-y-3">
                {[
                  { label: t('पूर्ण नाव', 'Full Name'), value: joinName, onChange: (v: string) => setJoinName(v), placeholder: isMr ? 'सुनिता कांबळे' : 'Sunita Kamble', type: 'text', required: true },
                  { label: t('मोबाईल', 'Mobile'), value: joinPhone, onChange: (v: string) => setJoinPhone(v), placeholder: '9876543210', type: 'tel', required: true },
                  { label: t('व्यवसाय', 'Occupation'), value: joinOccupation, onChange: (v: string) => setJoinOccupation(v), placeholder: isMr ? 'शिलाई, शेती...' : 'Tailoring, Farming...', type: 'text', required: false },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-[10px] font-semibold text-stone-500 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      required={field.required}
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full text-xs py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl outline-none font-medium text-stone-900 focus:border-stone-400 transition"
                    />
                  </div>
                ))}
                <button type="submit" className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-xs font-bold shadow transition active:scale-95 mt-1">
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

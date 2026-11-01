import React, { useState, useEffect } from 'react';
import { Member, Role, SupportedLanguage, MembershipRequest } from '../../types/shg';
import { saveMembershipRequest } from '../../services/db';
import { DEMO_MEMBERS, DEMO_ASSIGNED_GROUPS } from '../../services/demoData';
import { hybridOtpService } from '../../services/otpService';
import { sound } from '../../services/sound';
import { tts } from '../../services/tts';
import { ShgLogo } from '../common/ShgLogo';

const loginBg = '/login-bg.png';
import {
  ArrowRight,
  Phone,
  UserPlus,
  X,
  CheckCircle2,
  Building2,
  User,
  ClipboardCheck,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Key
} from 'lucide-react';

interface LoginViewProps {
  members: Member[];
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLoginSuccess: (session: { memberId: string; phone: string; role: Role; memberName?: string }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  members,
  language,
  onLanguageChange,
  onLoginSuccess
}) => {
  const isMr = language === 'mr';
  const activeMembers: Member[] = (members && members.length > 0) ? members : DEMO_MEMBERS;

  // Selected Role defaults to 'MEMBER' (Normal SHG Member is the primary user)
  const [role, setRole] = useState<Role>('MEMBER');

  // Login Steps: 'PHONE' | 'OTP'
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState<string>('8767993248');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Join SHG Modal
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [joinSubmitted, setJoinSubmitted] = useState<boolean>(false);
  const [joinName, setJoinName] = useState<string>('');
  const [joinPhone, setJoinPhone] = useState<string>('8767993248');
  const [joinOccupation, setJoinOccupation] = useState<string>('');

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

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

  // Switch role tabs (Pre-filled mobile number strictly 8767993248)
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setStep('PHONE');
    setError('');
    setEnteredOtp('');
    setPhone('8767993248');
  };

  // Step 1: Request OTP via SMS (Simulated / Dev gateway - rate limited to 1 per minute)
  const handleRequestOtp = async (e?: React.FormEvent, isResend = false) => {
    if (e) e.preventDefault();
    setError('');

    if (role === 'AUDITOR') {
      handleAuditorLogin();
      return;
    }

    if (resendTimer > 0) {
      setError(isMr ? `कृपया ${resendTimer} सेकंद थांबा. OTP मर्यादा: प्रति मिनिट १.` : `Please wait ${resendTimer}s. Limit: 1 OTP per minute.`);
      return;
    }

    if (cleanPhone.length !== 10) {
      setError(isMr ? 'कृपया वैध १०-अंकी मोबाईल नंबर प्रविष्ट करा' : 'Please enter valid 10-digit phone');
      return;
    }

    setLoading(true);
    try {
      const res = await hybridOtpService.requestOtp(cleanPhone, role === 'ANIMATOR' ? 'animator-1' : 'mem-1');
      if (!res.success) {
        setError(res.message);
        return;
      }
      const otpCode = res.devOtp || Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otpCode);
      setResendTimer(60); // Strictly 1 OTP per minute
      setStep('OTP');
      sound.playStampSound();

      // Secure handling: Output dispatched OTP ONLY to developer console, NEVER on screen or via speaker
      console.log(`[SMS Gateway (Simulated)] SMS dispatched to +91 ${cleanPhone}. OTP Code: ${otpCode} (For testing, enter 123456 or ${otpCode})`);

      // Polite voice prompt without ever speaking the secret OTP numbers
      tts.speak(isMr ? 'कृपया मोबाईलवर आलेला OTP प्रविष्ट करा' : 'Please enter the OTP received on your mobile');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Sign In
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const cleanCode = enteredOtp.trim();
    if (!cleanCode) {
      setError(isMr ? 'कृपया आलेला OTP कोड प्रविष्ट करा' : 'Please enter the OTP code');
      return;
    }

    setLoading(true);
    try {
      const res = await hybridOtpService.verifyOtp(cleanPhone, cleanCode, role === 'ANIMATOR' ? 'animator-1' : 'mem-1');
      if (!res.verified) {
        setError(isMr ? 'अवैध OTP कोड. कृपया SMS मधील योग्य कोड प्रविष्ट करा.' : 'Invalid OTP. Please check the code sent to your phone.');
        return;
      }

      sound.playStampSound();
      completeLogin();
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = () => {
    let memberId = 'mem-4';
    let memberName = 'Meena-bai Jadhav';
    let memberNameRegional = 'मीनाबाई जाधव';

    if (role === 'OFFICE_BEARER') {
      memberId = 'mem-1';
      memberName = 'Kamal-tai Patil';
      memberNameRegional = 'कमलताई पाटील';
    } else if (role === 'ANIMATOR') {
      memberId = 'animator-1';
      memberName = 'Sunita-bai Deshmukh';
      memberNameRegional = 'सुनिताबाई देशमुख';
    } else if (role === 'MEMBER') {
      const matched = activeMembers.find(m => m.phone.replace(/\D/g, '').slice(-10) === cleanPhone && m.role === 'MEMBER');
      if (matched) {
        memberId = matched.id;
        memberName = matched.name;
        memberNameRegional = matched.nameRegional || matched.name;
      } else {
        const defaultMember = activeMembers.find(m => m.id === 'mem-4') || activeMembers[0];
        memberId = defaultMember.id;
        memberName = defaultMember.name;
        memberNameRegional = defaultMember.nameRegional || defaultMember.name;
      }
    }

    tts.speak(isMr ? `स्वागत आहे ${memberNameRegional || memberName}` : `Welcome ${memberName}`);
    onLoginSuccess({
      memberId,
      phone: cleanPhone,
      role,
      memberName: memberNameRegional || memberName
    });
  };

  const handleAuditorLogin = () => {
    sound.playStampSound();
    tts.speak(isMr ? 'नाबार्ड व बँक लेखापरीक्षक पोर्टल' : 'Auditor Portal');
    onLoginSuccess({
      memberId: 'auditor-1',
      phone: '9999999999',
      role: 'AUDITOR',
      memberName: 'नाबार्ड / बँक लेखापरीक्षक'
    });
  };

  // Join Request submit
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) return;

    const group = DEMO_ASSIGNED_GROUPS[0];
    const req: MembershipRequest = {
      id: `req-${Date.now()}`,
      shgId: group.shgCode,
      shgName: isMr ? group.nameRegional : group.name,
      name: joinName.trim(),
      nameRegional: joinName.trim(),
      phone: joinPhone.replace(/\D/g, '').slice(-10) || '8767993248',
      occupation: joinOccupation,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    saveMembershipRequest(req);
    sound.playStampSound();
    setJoinSubmitted(true);
  };

  const roleTabs = [
    { id: 'MEMBER' as Role, mr: 'सभासद', en: 'SHG Member', icon: User, descMr: 'वैयक्तिक बचत, कर्ज व पासबुक', descEn: 'Personal savings, loans & passbook' },
    { id: 'OFFICE_BEARER' as Role, mr: 'गट प्रमुख', en: 'SHG Lead', icon: Building2, descMr: 'एका गटाचे नेतृत्व • बैठक संचालन व वित्त', descEn: 'Leads 1 SHG · Orchestrates meetings & finance' },
    { id: 'ANIMATOR' as Role, mr: 'अधिकारी', en: 'Officer', icon: ClipboardCheck, descMr: 'अनेक गटांचे व्यवस्थापन • बैठक संचालन', descEn: 'Manages multiple SHGs · Orchestrates meetings' },
    { id: 'AUDITOR' as Role, mr: 'लेखापरीक्षक', en: 'Auditor', icon: ShieldCheck, descMr: 'शासकीय वरिष्ठ अधिकारी • माहिती संकलन', descEn: 'Govt Senior Official · Inspects data & info' }
  ];

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col justify-between p-2.5 sm:p-4 font-sans select-none text-stone-900 bg-cover bg-center bg-no-repeat z-40 touch-none"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundColor: '#F5E6D3'
      }}
    >
      
      {/* ── Top Bar: Language Selector Only ── */}
      <div className="max-w-xs w-full mx-auto flex justify-end shrink-0 pt-0.5 relative z-10">
        <div className="inline-flex bg-white/90 backdrop-blur-xs rounded-lg p-0.5 border border-stone-200/80 text-[11px] font-bold shadow-xs">
          <button
            type="button"
            onClick={() => onLanguageChange('mr')}
            className={`px-2 py-0.5 rounded transition ${language === 'mr' ? 'bg-[#14532D] text-white' : 'text-stone-600'}`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-0.5 rounded transition ${language === 'en' ? 'bg-[#14532D] text-white' : 'text-stone-600'}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* ── Center Login Card (Strictly viewport bounded) ── */}
      <div className="max-w-xs w-full mx-auto bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-2xl p-3.5 sm:p-4 space-y-2 sm:space-y-2.5 my-auto shrink-0 relative z-10">
        
        {/* Brand & Subtitle */}
        <div className="text-center space-y-0.5">
          <ShgLogo size={32} className="mx-auto" />
          <h1 className="text-sm font-black tracking-tight text-stone-900 leading-tight">
            SHGConnect
          </h1>
          <p className="text-[10px] text-stone-500 font-bold leading-tight">
            {isMr ? 'सावित्री महिला बचत गट • शिरवळ' : 'Savitri Mahila Bachat Gat'}
          </p>
        </div>

        {/* 4 Role Selector Chips */}
        <div className="space-y-1">
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-stone-100 rounded-xl border border-stone-200 text-center">
            {roleTabs.map(t => {
              const Icon = t.icon;
              const isActive = role === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleRoleChange(t.id)}
                  className={`py-1 px-0.5 rounded-lg text-[9.5px] font-bold transition flex flex-col items-center justify-center ${
                    isActive
                      ? 'bg-[#14532D] text-white shadow-xs font-black'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mb-0.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                  <span className="truncate w-full">{isMr ? t.mr : t.en}</span>
                </button>
              );
            })}
          </div>
          {/* Role Responsibility Scope Pill */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg py-1 px-1.5 text-center text-[9.5px] text-stone-600 font-semibold leading-tight">
            {roleTabs.find(t => t.id === role)?.[isMr ? 'descMr' : 'descEn']}
          </div>
        </div>

        {/* AUDITOR VIEW: 1-Tap Access */}
        {role === 'AUDITOR' ? (
          <div className="pt-1 space-y-2 text-center">
            <p className="text-[11px] text-stone-600 font-medium leading-snug">
              {isMr ? 'शासकीय वरिष्ठ अधिकारी (NABARD / NRLM): सर्व ७ बचत गटांची माहिती गोळा करणे, ब्लॉकचेन लेजर व पंचसूत्र मानांकन तपासणे.' : 'Government Senior Official (NABARD/NRLM): View all 7 SHGs, collect government data, inspect SHA-256 blocks & Panchasutra health.'}
            </p>
            <button
              type="button"
              onClick={handleAuditorLogin}
              className="w-full bg-[#14532D] hover:bg-emerald-900 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{isMr ? 'शासकीय तपासणी पोर्टल उघडा' : 'Launch Govt Senior Inspection Portal'}</span>
            </button>
          </div>
        ) : step === 'PHONE' ? (
          /* STEP 1: PHONE NUMBER ENTRY */
          <form onSubmit={handleRequestOtp} className="space-y-2">
            <div>
              <label className="block text-[10px] font-bold text-stone-700 mb-0.5">
                {isMr ? 'मोबाईल नंबर' : 'Mobile Number'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setError('');
                  }}
                  placeholder="8767993248"
                  className="w-full pl-10 pr-3 py-1.5 bg-stone-50 border border-stone-300 focus:border-emerald-700 focus:bg-white rounded-xl text-sm font-black tracking-wider text-stone-900 outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-1.5 rounded-lg leading-tight">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || cleanPhone.length !== 10}
              className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
            >
              <span>{isMr ? 'लॉगिन OTP मिळवा' : 'Get Login OTP'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          /* STEP 2: REALISTIC OTP VERIFICATION (NO OTP LEAK ON SCREEN) */
          <form onSubmit={handleVerifyOtp} className="space-y-2">
            {/* Realistic Dispatch Status Notice */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-center space-y-0.5">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-800 font-bold">
                <Phone className="w-3 h-3 text-emerald-700" />
                <span>+91 {cleanPhone}</span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium leading-tight">
                {isMr
                  ? 'या मोबाईल क्रमांकावर SMS द्वारे ६-अंकी OTP पाठवला आहे.'
                  : 'A 6-digit OTP has been sent to this mobile via SMS.'}
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-700 mb-0.5 text-center">
                {isMr ? '६-अंकी OTP प्रविष्ट करा' : 'Enter 6-Digit OTP'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => {
                  setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                placeholder="• • • • • •"
                autoFocus
                className="w-full text-center text-lg font-mono font-black tracking-[0.25em] py-1.5 bg-stone-50 border border-stone-300 focus:border-emerald-700 focus:bg-white rounded-xl text-stone-900 outline-none"
              />
            </div>

            {error && (
              <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-1.5 rounded-lg text-center leading-tight">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!enteredOtp}
              className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{isMr ? 'प्रमाणित करा व लॉगिन करा' : 'Verify & Sign In'}</span>
            </button>

            <div className="flex items-center justify-between text-[10.5px] font-bold text-stone-500 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setStep('PHONE');
                  setEnteredOtp('');
                  setError('');
                }}
                className="hover:text-stone-900 flex items-center gap-1 text-stone-600"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>{isMr ? 'नंबर बदला' : 'Change Phone'}</span>
              </button>

              <button
                type="button"
                disabled={resendTimer > 0}
                onClick={() => handleRequestOtp(undefined, true)}
                className={`flex items-center gap-1 font-bold ${
                  resendTimer > 0
                    ? 'text-stone-400 cursor-not-allowed'
                    : 'text-emerald-800 hover:text-emerald-900'
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                <span>
                  {resendTimer > 0
                    ? (isMr ? `पुन्हा पाठवा (${resendTimer}s)` : `Resend (${resendTimer}s)`)
                    : (isMr ? 'पुन्हा पाठवा' : 'Resend')}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ── Join SHG Link (Non-members) ── */}
        <div className="text-center pt-1.5 border-t border-stone-100">
          <button
            type="button"
            onClick={() => {
              setJoinSubmitted(false);
              setShowJoinModal(true);
            }}
            className="text-[10.5px] font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
          >
            <UserPlus className="w-3 h-3" />
            <span>{isMr ? 'नवीन सभासद? बचत गटात सामील व्हा' : 'New? Apply to Join an SHG'}</span>
          </button>
        </div>

      </div>

      {/* ── Bottom Anchor (Ensures perfect vertical center for flex-col justify-between) ── */}
      <div className="w-full shrink-0 h-1"></div>

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
              <div className="text-center space-y-2 py-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <p className="text-xs font-bold text-stone-800">
                  {isMr ? 'विनंती पाठवली! पुढील बैठकीत मंजुरी मिळेल.' : 'Request registered! Approval in meeting.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="w-full bg-[#14532D] text-white font-bold py-2 rounded-xl text-xs mt-2"
                >
                  {isMr ? 'बंद करा' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                    {isMr ? 'नाव' : 'Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder={isMr ? 'सुवर्णा कदम' : 'Suvarna Kadam'}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                    {isMr ? 'मोबाईल' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={joinPhone}
                    onChange={(e) => setJoinPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                    {isMr ? 'व्यवसाय' : 'Occupation'}
                  </label>
                  <input
                    type="text"
                    value={joinOccupation}
                    onChange={(e) => setJoinOccupation(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-1.5 border border-stone-200 text-xs font-bold text-stone-600 rounded-lg"
                  >
                    {isMr ? 'रद्द करा' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#14532D] text-white font-bold py-1.5 rounded-lg text-xs"
                  >
                    {isMr ? 'विनंती पाठवा' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

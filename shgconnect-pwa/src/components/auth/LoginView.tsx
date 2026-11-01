import React, { useState, useEffect } from 'react';
import { Member, Role, SupportedLanguage, MembershipRequest } from '../../types/shg';
import { saveMembershipRequest } from '../../services/db';
import { DEMO_MEMBERS, DEMO_ASSIGNED_GROUPS } from '../../services/demoData';
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
  ClipboardCheck,
  ShieldCheck,
  Zap
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

  // Selected Role defaults to 'MEMBER'
  const [role, setRole] = useState<Role>('MEMBER');

  // Join SHG Modal
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [joinSubmitted, setJoinSubmitted] = useState<boolean>(false);
  const [joinName, setJoinName] = useState<string>('');
  const [joinPhone, setJoinPhone] = useState<string>('8767993248');
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

  // Quick 1-Tap Login Handler
  const handleQuickLogin = (selectedRole: Role = role) => {
    let memberId = 'mem-1';
    let memberName = 'Member';
    let memberNameRegional = 'सभासद';
    let phone = '8767993248';

    if (selectedRole === 'OFFICE_BEARER') {
      memberId = 'mem-1';
      memberName = 'Lead';
      memberNameRegional = 'गट प्रमुख';
      phone = '8767993248';
    } else if (selectedRole === 'ANIMATOR') {
      memberId = 'animator-1';
      memberName = 'Officer';
      memberNameRegional = 'अधिकारी';
      phone = '9822011223';
    } else if (selectedRole === 'AUDITOR') {
      memberId = 'auditor-1';
      memberName = 'Auditor';
      memberNameRegional = 'लेखापरीक्षक';
      phone = '9999999999';
    } else if (selectedRole === 'MEMBER') {
      const defaultMember = activeMembers.find(m => m.id === 'mem-4') || activeMembers[0];
      if (defaultMember) {
        memberId = defaultMember.id;
        memberName = defaultMember.name;
        memberNameRegional = defaultMember.nameRegional || defaultMember.name;
        phone = defaultMember.phone?.replace(/\D/g, '').slice(-10) || '8767993248';
      }
    }

    sound.playStampSound();
    tts.speak(isMr ? 'प्रवेश यशस्वी' : 'Login successful');
    onLoginSuccess({
      memberId,
      phone,
      role: selectedRole,
      memberName: memberNameRegional || memberName
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
    {
      id: 'MEMBER' as Role,
      mr: 'सभासद',
      en: 'Member',
      icon: User,
      descMr: 'वैयक्तिक बचत, कर्ज व पासबुक',
      descEn: 'Personal savings, loans & passbook'
    },
    {
      id: 'OFFICE_BEARER' as Role,
      mr: 'गट प्रमुख',
      en: 'Lead',
      icon: Building2,
      descMr: 'बैठक संचालन व वित्तीय व्यवहार',
      descEn: 'Meeting operations & finance'
    },
    {
      id: 'ANIMATOR' as Role,
      mr: 'अधिकारी',
      en: 'Officer',
      icon: ClipboardCheck,
      descMr: 'गटांचे व्यवस्थापन व समन्वयक',
      descEn: 'Group management & coordinator'
    },
    {
      id: 'AUDITOR' as Role,
      mr: 'लेखापरीक्षक',
      en: 'Auditor',
      icon: ShieldCheck,
      descMr: 'माहिती व लेजर तपासणी',
      descEn: 'Data & ledger inspection'
    }
  ];

  const currentRoleTab = roleTabs.find(t => t.id === role) || roleTabs[0];

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
      <div className="max-w-xs w-full mx-auto bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-2xl p-4 space-y-3 my-auto shrink-0 relative z-10">
        
        {/* Brand */}
        <div className="text-center space-y-0.5">
          <ShgLogo size={32} className="mx-auto" />
          <h1 className="text-sm font-black tracking-tight text-stone-900 leading-tight">
            SHGConnect
          </h1>
          <p className="text-[10px] text-stone-500 font-bold leading-tight">
            {isMr ? 'डिजिटल नोंदवही प्रणाली' : 'Digital Ledger System'}
          </p>
        </div>

        {/* 4 Role Selector Chips */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-stone-100 rounded-xl border border-stone-200 text-center">
            {roleTabs.map(t => {
              const Icon = t.icon;
              const isActive = role === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRole(t.id)}
                  className={`py-1.5 px-0.5 rounded-lg text-[9.5px] font-bold transition flex flex-col items-center justify-center ${
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

          {/* Role Description Scope Pill */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg py-1 px-1.5 text-center text-[9.5px] text-stone-600 font-semibold leading-tight">
            {currentRoleTab[isMr ? 'descMr' : 'descEn']}
          </div>
        </div>

        {/* ONE-TAP INSTANT LOGIN BUTTON */}
        <button
          type="button"
          onClick={() => handleQuickLogin()}
          className="w-full bg-[#14532D] hover:bg-emerald-900 active:scale-[0.98] text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>
            {isMr
              ? `${currentRoleTab.mr} म्हणून प्रवेश करा`
              : `Enter as ${currentRoleTab.en}`}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
        </button>

        {/* ── Join SHG Link (Non-members) ── */}
        <div className="text-center pt-1 border-t border-stone-100">
          <button
            type="button"
            onClick={() => {
              setJoinSubmitted(false);
              setShowJoinModal(true);
            }}
            className="text-[10px] font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
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
                    placeholder={isMr ? 'नाव प्रविष्ट करा' : 'Enter name'}
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

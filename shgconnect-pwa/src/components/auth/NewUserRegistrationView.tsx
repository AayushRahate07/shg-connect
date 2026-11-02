import React, { useState, useEffect } from 'react';
import { SupportedLanguage, GroupInfo, Member, Role, MembershipRequest } from '../../types/shg';
import { getAllCachedGroups, saveNewShgGroup, saveMembershipRequest } from '../../services/db';
import { DEMO_ASSIGNED_GROUPS } from '../../services/demoData';
import { ShgLogo } from '../common/ShgLogo';
import { ArrowLeft, UserPlus, Building2, Sparkles, Check, Phone, User, MapPin, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react';
import { sound } from '../../services/sound';
import { tts } from '../../services/tts';

interface NewUserRegistrationViewProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onBackToLogin: () => void;
  onLoginSuccess: (session: { memberId: string; phone: string; role: Role; memberName?: string }) => void;
}

export const NewUserRegistrationView: React.FC<NewUserRegistrationViewProps> = ({
  language,
  onLanguageChange,
  onBackToLogin,
  onLoginSuccess
}) => {
  const isMr = language === 'mr';
  const [mode, setMode] = useState<'MEMBER' | 'NEW_SHG'>('MEMBER');

  const [allGroups, setAllGroups] = useState<GroupInfo[]>(DEMO_ASSIGNED_GROUPS);
  const [districts, setDistricts] = useState<string[]>(['Satara']);

  // --- Member Request Form State ---
  const [memberName, setMemberName] = useState<string>('');
  const [memberPhone, setMemberPhone] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Satara');
  const [selectedShgCode, setSelectedShgCode] = useState<string>('');
  const [memberOccupation, setMemberOccupation] = useState<string>('शिवणकाम / शेती');
  const [memberSubmitted, setMemberSubmitted] = useState<boolean>(false);
  const [memberError, setMemberError] = useState<string>('');

  // --- New SHG Form State ---
  const [leadName, setLeadName] = useState<string>('');
  const [leadPhone, setLeadPhone] = useState<string>('');
  const [newShgName, setNewShgName] = useState<string>('');
  const [newDistrict, setNewDistrict] = useState<string>('Satara');
  const [newVillage, setNewVillage] = useState<string>('');
  const [newPincode, setNewPincode] = useState<string>('');
  const [newMonthlyPool, setNewMonthlyPool] = useState<number>(500);
  const [createdGroup, setCreatedGroup] = useState<GroupInfo | null>(null);
  const [createdLead, setCreatedLead] = useState<Member | null>(null);
  const [shgError, setShgError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadGroups() {
      try {
        const groups = await getAllCachedGroups();
        if (groups && groups.length > 0) {
          setAllGroups(groups);
          const uniqueDistricts = Array.from(new Set(groups.map(g => g.district || 'Satara')));
          setDistricts(uniqueDistricts);
          setSelectedDistrict(uniqueDistricts[0] || 'Satara');
          setSelectedShgCode(groups[0]?.shgCode || '');
        }
      } catch (err) {
        console.error('Failed to load groups in registration:', err);
      }
    }
    loadGroups();
  }, []);

  // Filter SHGs matching the selected district
  const filteredShgs = allGroups.filter(g => 
    !selectedDistrict || (g.district && g.district.toLowerCase() === selectedDistrict.toLowerCase())
  );

  // Keep selected SHG code valid when district changes
  useEffect(() => {
    if (filteredShgs.length > 0) {
      if (!filteredShgs.some(g => g.shgCode === selectedShgCode)) {
        setSelectedShgCode(filteredShgs[0].shgCode);
      }
    }
  }, [selectedDistrict, allGroups]);

  // Handle Option 1: New Member Join Request Submit
  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');

    if (!memberName.trim()) {
      setMemberError(isMr ? 'कृपया तुमचे पूर्ण नाव प्रविष्ट करा' : 'Please enter your full name');
      return;
    }

    const cleanPhone = memberPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setMemberError(isMr ? 'कृपया १०-अंकी वैध मोबाईल नंबर प्रविष्ट करा' : 'Please enter valid 10-digit mobile number');
      return;
    }

    const targetShg = allGroups.find(g => g.shgCode === selectedShgCode) || filteredShgs[0];
    if (!targetShg) {
      setMemberError(isMr ? 'कृपया बचत गट निवडा' : 'Please select an SHG');
      return;
    }

    sound.playStampSound();
    const req: MembershipRequest = {
      id: `req-${Date.now()}`,
      shgId: targetShg.shgCode,
      shgName: isMr ? targetShg.nameRegional : targetShg.name,
      district: targetShg.district,
      village: targetShg.village,
      name: memberName.trim(),
      nameRegional: memberName.trim(),
      phone: cleanPhone,
      occupation: memberOccupation.trim() || (isMr ? 'शेती / गृहउद्योग' : 'Farming / Enterprise'),
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      notes: `Requested for ${targetShg.nameRegional} (${targetShg.village})`
    };

    saveMembershipRequest(req);
    setMemberSubmitted(true);
    tts.speak(
      isMr
        ? `${memberName} तुमची विनंती ${targetShg.nameRegional} चे गट प्रमुख आणि प्रभाग अधिकाऱ्यांकडे पाठवण्यात आली आहे.`
        : `Your join request has been sent to the SHG Lead and Area Officer.`
    );
  };

  // Handle Option 2: New SHG Registration Submit
  const handleNewShgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShgError('');

    if (!leadName.trim()) {
      setShgError(isMr ? 'कृपया गट प्रमुखाचे नाव प्रविष्ट करा' : 'Please enter SHG Lead name');
      return;
    }

    const cleanPhone = leadPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setShgError(isMr ? 'कृपया गट प्रमुखाचा १०-अंकी मोबाईल नंबर प्रविष्ट करा' : 'Please enter valid 10-digit phone for Lead');
      return;
    }

    if (!newShgName.trim()) {
      setShgError(isMr ? 'कृपया नवीन बचत गटाचे नाव प्रविष्ट करा' : 'Please enter SHG name');
      return;
    }

    if (!newVillage.trim()) {
      setShgError(isMr ? 'कृपया गावाचे किंवा प्रभागाचे नाव प्रविष्ट करा' : 'Please enter village or town name');
      return;
    }

    if (!newPincode.trim() || newPincode.replace(/\D/g, '').length !== 6) {
      setShgError(isMr ? 'कृपया ६-अंकी वैध पिनकोड प्रविष्ट करा' : 'Please enter valid 6-digit pincode');
      return;
    }

    setIsSubmitting(true);
    try {
      sound.playStampSound();

      // Generate a unique SHG Code: SHG-MH-SAT-2024-XXXX
      const existingGroups = await getAllCachedGroups();
      const existingNumbers = existingGroups.map(g => {
        const m = g.shgCode.match(/\d+$/);
        return m ? parseInt(m[0], 10) : 90;
      });
      const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 95;
      const nextNum = String(maxNum + 1).padStart(4, '0');
      const generatedShgCode = `SHG-MH-SAT-2024-${nextNum}`;

      const groupPayload: GroupInfo = {
        name: newShgName.trim(),
        nameRegional: newShgName.trim(),
        shgCode: generatedShgCode,
        village: newVillage.trim(),
        district: newDistrict.trim() || 'Satara',
        monthlyPoolRate: Number(newMonthlyPool) || 500,
        totalGroupFund: 0,
        federation: {
          state: 'Maharashtra',
          district: newDistrict.trim() || 'Satara',
          block: newVillage.trim(),
          gramPanchayat: `${newVillage.trim()} Gram Panchayat`,
          villageOrganization: `${newVillage.trim()} Gram Sangha`,
          clfName: `${newDistrict.trim()} Mahila Cluster Federation`
        }
      };

      const leadPayload: Member = {
        id: `mem-${Date.now()}`,
        shgId: generatedShgCode,
        name: leadName.trim(),
        nameRegional: leadName.trim(),
        phone: cleanPhone,
        role: 'OFFICE_BEARER',
        totalSavings: 0,
        activeLoanBalance: 0,
        trustScore: 100,
        occupation: isMr ? 'गट प्रमुख' : 'SHG Lead',
        joinedDate: new Date().toISOString().split('T')[0],
        avatarColor: 'bg-emerald-700',
        entityVersion: 1
      };

      await saveNewShgGroup(groupPayload, leadPayload);
      setCreatedGroup(groupPayload);
      setCreatedLead(leadPayload);

      tts.speak(
        isMr
          ? `अभिनंदन! ${newShgName} बचत गट स्थापन झाला आहे आणि ${leadName} या गट प्रमुख म्हणून नियुक्त झाल्या आहेत.`
          : `Congratulations! ${newShgName} has been created with ${leadName} as SHG Lead.`
      );
    } catch (err: any) {
      console.error('Failed to create new SHG:', err);
      setShgError(err?.message || 'Error creating SHG');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F6FA] flex flex-col justify-between p-3.5 sm:p-6 font-sans select-none text-stone-900">
      
      {/* ── Top Navigation Bar ── */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isMr ? 'लॉगिनवर परत जा' : 'Back to Login'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Language Toggle (अ/A) */}
          <button
            type="button"
            onClick={() => onLanguageChange(language === 'mr' ? 'en' : 'mr')}
            className="inline-flex items-center justify-center font-bold text-xs px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <span className={language === 'mr' ? 'text-emerald-800 font-black' : 'text-stone-400 font-semibold'}>अ</span>
            <span className="text-stone-300 mx-1">/</span>
            <span className={language === 'en' ? 'text-emerald-800 font-black' : 'text-stone-400 font-semibold'}>A</span>
          </button>
        </div>
      </div>

      {/* ── Center Registration Card ── */}
      <div className="max-w-xl w-full mx-auto bg-white rounded-3xl border border-stone-200 shadow-md p-5 sm:p-7 space-y-6">
        
        {/* Brand & Subtitle */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-1">
            <ShgLogo size={42} />
          </div>
          <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full uppercase tracking-wider">
            {isMr ? 'नवीन वापरकर्ता नोंदणी पोर्टल' : 'New User Registration'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {isMr ? 'बचत गटात सामील व्हा किंवा नवीन गट स्थापन करा' : 'Join an Existing SHG or Start a New One'}
          </h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {isMr
              ? 'खालीलपैकी योग्य पर्याय निवडा. नवीन सभासद असल्यास गटात सामील होण्यासाठी अर्ज करा किंवा आपल्या गावासाठी स्वतःचा नवीन गट सुरू करा.'
              : 'Choose whether you want to apply to join an existing SHG or establish a new group as its founding Lead.'}
          </p>
        </div>

        {/* ── 2 Main Options Tabs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Option 1: New Member */}
          <button
            type="button"
            onClick={() => {
              sound.playStampSound();
              setMode('MEMBER');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition active:scale-98 cursor-pointer relative ${
              mode === 'MEMBER'
                ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                mode === 'MEMBER' ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
              }`}>
                <UserPlus className="w-5 h-5" />
              </div>
              {mode === 'MEMBER' && (
                <span className="text-[10px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> {isMr ? 'निवडलेले' : 'Selected'}
                </span>
              )}
            </div>
            <h3 className="font-black text-sm text-stone-900 leading-snug">
              {isMr ? '१. नवीन सभासद (New Member)' : '1. Join as New Member'}
            </h3>
            <p className="text-[11px] text-stone-500 font-medium mt-1">
              {isMr
                ? 'आधीपासून कार्यरत असलेल्या मान्यताप्राप्त बचत गटात नियमित बचतीसाठी सामील व्हा.'
                : 'Apply to join an existing village SHG.'}
            </p>
          </button>

          {/* Option 2: New SHG */}
          <button
            type="button"
            onClick={() => {
              sound.playStampSound();
              setMode('NEW_SHG');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition active:scale-98 cursor-pointer relative ${
              mode === 'NEW_SHG'
                ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-400'
                : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                mode === 'NEW_SHG' ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600'
              }`}>
                <Building2 className="w-5 h-5" />
              </div>
              {mode === 'NEW_SHG' && (
                <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> {isMr ? 'निवडलेले' : 'Selected'}
                </span>
              )}
            </div>
            <h3 className="font-black text-sm text-stone-900 leading-snug">
              {isMr ? '२. नवीन बचत गट (New SHG)' : '2. Register New SHG'}
            </h3>
            <p className="text-[11px] text-stone-500 font-medium mt-1">
              {isMr
                ? 'गावात स्वतःचा नवीन बचत गट सुरू करा आणि त्याचे नेतृत्व (गट प्रमुख) स्वतः स्वीकारा.'
                : 'Found a new SHG and become the SHG Lead.'}
            </p>
          </button>

        </div>

        {/* ── FORM 1: NEW MEMBER REGISTRATION ── */}
        {mode === 'MEMBER' && (
          <div className="space-y-4 pt-2 border-t border-stone-100">
            {memberSubmitted ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-black text-lg text-emerald-950">
                  {isMr ? 'सामील होण्याची विनंती पाठवली आहे!' : 'Join Request Submitted Successfully!'}
                </h3>
                <p className="text-xs text-emerald-900 font-medium max-w-sm mx-auto leading-relaxed">
                  {isMr
                    ? `तुमचा अर्ज संबंधित बचत गटाचे गट प्रमुख आणि प्रभाग अधिकारी यांच्याकडे पाठवला आहे. हेडरमधील नोटिफिकेशन (घंटी आयकॉन) द्वारे मंजूरी मिळाल्यावर तुम्ही मोबाईल नंबरने लॉगिन करू शकाल.`
                    : `Your request has been dispatched to the SHG Lead and Area Officer. Once approved via the Header Notification Desk, your account will be activated for login.`}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow transition"
                  >
                    {isMr ? 'लॉगिन पृष्ठावर परत जा' : 'Return to Login Screen'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleMemberSubmit} className="space-y-4 text-xs">
                
                {memberError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold">
                    {memberError}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isMr ? 'पूर्ण नाव' : 'Full Name'} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder={isMr ? 'उदा. सुप्रिया रमेश कदम' : 'e.g. Supriya Ramesh Kadam'}
                    className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isMr ? 'मोबाईल नंबर (१० अंक)' : 'Mobile Phone'} *</span>
                  </label>
                  <div className="flex items-center bg-[#F7F4EC] border border-stone-300 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-700">
                    <span className="text-stone-500 font-bold text-sm">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-transparent px-2 py-2.5 text-sm font-mono font-bold text-stone-900 outline-none"
                    />
                  </div>
                </div>

                {/* District Selection from All Registered SHGs */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isMr ? 'नोंदणीकृत जिल्हा निवडा' : 'Select District (from Registered SHGs)'} *</span>
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>
                        {d} ({allGroups.filter(g => g.district === d).length} {isMr ? 'बचत गट' : 'SHGs'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* SHG Group Code & Name Dropdown */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isMr ? 'बचत गट निवडा (Group Code & Name)' : 'Select SHG Group Code'} *</span>
                  </label>
                  <select
                    value={selectedShgCode}
                    onChange={(e) => setSelectedShgCode(e.target.value)}
                    className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {filteredShgs.map(g => (
                      <option key={g.shgCode} value={g.shgCode}>
                        [{g.shgCode}] {isMr ? g.nameRegional : g.name} - {g.village} (₹{g.monthlyPoolRate || 500}/महिना)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Occupation */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isMr ? 'व्यवसाय / उपजीविका' : 'Occupation / Enterprise'}</span>
                  </label>
                  <input
                    type="text"
                    value={memberOccupation}
                    onChange={(e) => setMemberOccupation(e.target.value)}
                    placeholder={isMr ? 'उदा. शिवणकाम / दुग्धव्यवसाय' : 'e.g. Tailoring / Dairy'}
                    className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['शेती', 'शिवणकाम', 'दुग्धव्यवसाय', 'किराणा', 'बचत गट काम'].map(tag => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setMemberOccupation(tag)}
                        className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] font-semibold border border-stone-200 cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-[#14532D] hover:bg-emerald-900 text-white font-black py-3 px-4 rounded-xl text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>{isMr ? 'सामील होण्याची विनंती पाठवा' : 'Send Join Request'}</span>
                </button>

              </form>
            )}
          </div>
        )}

        {/* ── FORM 2: NEW SHG REGISTRATION ── */}
        {mode === 'NEW_SHG' && (
          <div className="space-y-4 pt-2 border-t border-stone-100">
            {createdGroup && createdLead ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
                <div className="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Sparkles className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full">
                  {createdGroup.shgCode}
                </span>
                <h3 className="font-black text-xl text-amber-950">
                  {isMr ? 'नवीन बचत गट यशस्वीरीत्या स्थापन झाला!' : 'New SHG Created Successfully!'}
                </h3>
                <p className="text-xs text-amber-900 font-medium max-w-sm mx-auto leading-relaxed">
                  {isMr
                    ? `"${createdGroup.nameRegional}" हा बचत गट नोंदणीकृत झाला असून ${createdLead.name} या गटाच्या मुख्य गट प्रमुख (SHG Lead) म्हणून नियुक्त झाल्या आहेत.`
                    : `"${createdGroup.name}" has been registered. ${createdLead.name} is the registered SHG Lead.`}
                </p>

                <div className="pt-3 flex flex-col sm:flex-row gap-2.5 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      onLoginSuccess({
                        memberId: createdLead.id,
                        phone: createdLead.phone,
                        role: 'OFFICE_BEARER',
                        memberName: createdLead.name
                      });
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-[#14532D] hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{isMr ? 'गट प्रमुख म्हणून डॅशबोर्ड सुरू करा' : 'Open Dashboard as SHG Lead'}</span>
                    <ChevronRight className="w-4 h-4 text-amber-300" />
                  </button>
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="w-full sm:w-auto px-4 py-3 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    {isMr ? 'लॉगिन पृष्ठावर जा' : 'Go to Login'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleNewShgSubmit} className="space-y-4 text-xs">
                
                {/* Founding Lead Notice */}
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-950 text-xs font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    {isMr
                      ? 'नोंदणी करणारी व्यक्ती या नवीन बचत गटाची मुख्य "गट प्रमुख (SHG Lead)" असेल.'
                      : 'The registering member will become the founding SHG Lead of this new group.'}
                  </span>
                </div>

                {shgError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold">
                    {shgError}
                  </div>
                )}

                {/* Lead Name */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isMr ? 'गट प्रमुखाचे नाव (Registering Lead Name)' : 'Lead Member Name'} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder={isMr ? 'उदा. सारिकाताई विष्णू पवार' : 'e.g. Sarikatai Vishnu Pawar'}
                    className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Lead Phone */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isMr ? 'गट प्रमुखाचा मोबाईल नंबर (Login Phone)' : 'Lead Mobile Phone'} *</span>
                  </label>
                  <div className="flex items-center bg-[#F7F4EC] border border-stone-300 rounded-xl px-3 focus-within:ring-2 focus-within:ring-amber-500">
                    <span className="text-stone-500 font-bold text-sm">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-transparent px-2 py-2.5 text-sm font-mono font-bold text-stone-900 outline-none"
                    />
                  </div>
                </div>

                {/* SHG Name */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isMr ? 'नवीन बचत गटाचे नाव (SHG Name)' : 'New SHG Name'} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newShgName}
                    onChange={(e) => setNewShgName(e.target.value)}
                    placeholder={isMr ? 'उदा. प्रेरणा महिला बचत गट' : 'e.g. Prerna Mahila Bachat Gat'}
                    className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* District & Village in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      <span>{isMr ? 'जिल्हा (District)' : 'District'} *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newDistrict}
                      onChange={(e) => setNewDistrict(e.target.value)}
                      placeholder={isMr ? 'सातारा' : 'Satara'}
                      className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      <span>{isMr ? 'गाव / प्रभाग (Village)' : 'Village / Town'} *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newVillage}
                      onChange={(e) => setNewVillage(e.target.value)}
                      placeholder={isMr ? 'उदा. वाई' : 'e.g. Wai'}
                      className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Pincode & Monthly Savings in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">
                      {isMr ? 'पिनकोड (Pincode)' : 'Pincode (6 digits)'} *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="412803"
                      className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">
                      {isMr ? 'मासिक बचत दर (₹ Pool Rate)' : 'Monthly Pool Rate (₹)'}
                    </label>
                    <input
                      type="number"
                      step={50}
                      value={newMonthlyPool}
                      onChange={(e) => setNewMonthlyPool(Number(e.target.value) || 500)}
                      className="w-full bg-[#F7F4EC] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-black py-3 px-4 rounded-xl text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-stone-900" />
                  <span>
                    {isSubmitting
                      ? (isMr ? 'बचत गट स्थापन होत आहे...' : 'Creating SHG...')
                      : (isMr ? 'नवीन बचत गट नोंदणी करा (Register SHG)' : 'Register New SHG')}
                  </span>
                </button>

              </form>
            )}
          </div>
        )}

      </div>

      <div className="w-full shrink-0 h-4"></div>
    </div>
  );
};

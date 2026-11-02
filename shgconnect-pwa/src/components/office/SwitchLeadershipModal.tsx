import React, { useState, useEffect } from 'react';
import { GroupInfo, Member, SupportedLanguage } from '../../types/shg';
import { ShieldCheck, Award, Landmark, FileText, Check, X, ArrowRightLeft, Users } from 'lucide-react';
import { sound } from '../../services/sound';
import { tts } from '../../services/tts';

interface SwitchLeadershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  group: GroupInfo;
  members: Member[];
  onSaveLeadership: (
    shgCode: string,
    assignments: {
      presidentMemberId: string;
      treasurerMemberId: string;
      secretaryMemberId?: string;
    }
  ) => Promise<void> | void;
}

export const SwitchLeadershipModal: React.FC<SwitchLeadershipModalProps> = ({
  isOpen,
  onClose,
  language,
  group,
  members,
  onSaveLeadership
}) => {
  const isMr = language === 'mr';
  const groupMembers = members.filter(m => (m.shgId || 'SHG-MH-SAT-2024-0089') === group.shgCode);

  // Identify current officers or defaults
  const currentLead = groupMembers.find(m => m.role === 'OFFICE_BEARER' || m.role === 'SHG_LEAD') || groupMembers[0];
  const currentTreasurer = groupMembers.find(m => m.id !== currentLead?.id) || groupMembers[1] || groupMembers[0];
  const currentSecretary = groupMembers.find(m => m.id !== currentLead?.id && m.id !== currentTreasurer?.id) || groupMembers[2] || groupMembers[0];

  const [presidentId, setPresidentId] = useState<string>(currentLead?.id || '');
  const [treasurerId, setTreasurerId] = useState<string>(currentTreasurer?.id || '');
  const [secretaryId, setSecretaryId] = useState<string>(currentSecretary?.id || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  useEffect(() => {
    if (groupMembers.length > 0) {
      setPresidentId(currentLead?.id || groupMembers[0]?.id || '');
      setTreasurerId(currentTreasurer?.id || groupMembers[1]?.id || groupMembers[0]?.id || '');
      setSecretaryId(currentSecretary?.id || groupMembers[2]?.id || groupMembers[0]?.id || '');
      setFeedbackMsg('');
    }
  }, [group.shgCode, isOpen]);

  if (!isOpen) return null;

  const handlePresidentChange = (newId: string) => {
    if (newId === treasurerId) {
      setTreasurerId(presidentId); // Auto-swap
    } else if (newId === secretaryId) {
      setSecretaryId(presidentId); // Auto-swap
    }
    setPresidentId(newId);
  };

  const handleTreasurerChange = (newId: string) => {
    if (newId === presidentId) {
      setPresidentId(treasurerId); // Auto-swap
    } else if (newId === secretaryId) {
      setSecretaryId(treasurerId); // Auto-swap
    }
    setTreasurerId(newId);
  };

  const handleSecretaryChange = (newId: string) => {
    if (newId === presidentId) {
      setPresidentId(secretaryId); // Auto-swap
    } else if (newId === treasurerId) {
      setTreasurerId(secretaryId); // Auto-swap
    }
    setSecretaryId(newId);
  };

  const handleSave = async () => {
    if (!presidentId || !treasurerId) {
      setFeedbackMsg(isMr ? 'कृपया अध्यक्ष व खजिनदार निवडा' : 'Please select President and Treasurer');
      return;
    }

    if (presidentId === treasurerId) {
      setFeedbackMsg(isMr ? 'एकच व्यक्ती अध्यक्ष आणि खजिनदार असू शकत नाही.' : 'President and Treasurer cannot be the same member.');
      return;
    }

    setIsSaving(true);
    try {
      sound.playStampSound();
      await onSaveLeadership(group.shgCode, {
        presidentMemberId: presidentId,
        treasurerMemberId: treasurerId,
        secretaryMemberId: secretaryId
      });

      const selectedLead = groupMembers.find(m => m.id === presidentId);
      const selectedTreas = groupMembers.find(m => m.id === treasurerId);
      
      tts.speak(
        isMr
          ? `${group.nameRegional} मध्ये नवीन अध्यक्ष म्हणून ${selectedLead?.name} आणि खजिनदार म्हणून ${selectedTreas?.name} यांची नियुक्ती झाली आहे.`
          : `Leadership updated for ${group.name}.`
      );

      onClose();
    } catch (err: any) {
      console.error('Failed to update leadership:', err);
      setFeedbackMsg(err?.message || 'Error updating leadership');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn select-none font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1D5FA8] text-white flex items-center justify-center shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {isMr ? 'प्रभाग अधिकारी अधिकार (Tier 3 Authority)' : 'Officer Governance (Tier 3)'}
              </span>
              <h3 className="font-black text-base sm:text-lg text-stone-900 leading-tight mt-0.5">
                {isMr ? 'पदाधिकारी पुनर्नियुक्ती / अदलाबदल' : 'Switch Leadership & Treasurer'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Group Context Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-[#14532D] text-white px-5 py-3.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-emerald-200 font-bold block text-[11px] uppercase tracking-wider">
              {group.shgCode} · {group.village}
            </span>
            <span className="font-black text-sm text-white">
              {isMr ? group.nameRegional : group.name}
            </span>
          </div>
          <span className="bg-emerald-800/80 border border-emerald-600 text-amber-300 font-extrabold px-2.5 py-1 rounded-xl">
            {groupMembers.length} {isMr ? 'सभासद' : 'Members'}
          </span>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          <p className="text-xs text-stone-600 font-medium">
            {isMr
              ? 'बचत गटातील अंतर्गत जबाबदाऱ्या बदलण्यासाठी खालील पदाधिकाऱ्यांची निवड करा. गट प्रमुखाला बैठकांचे संचालन आणि आर्थिक नियंत्रणाचे अधिकार मिळतील.'
              : 'Select new officers from the member roster. The designated Lead will orchestrate group meetings and manage central finances.'}
          </p>

          {feedbackMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold">
              {feedbackMsg}
            </div>
          )}

          {/* Role 1: President / Lead */}
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>{isMr ? '१. गट प्रमुख / अध्यक्ष (SHG Lead & President)' : '1. SHG Lead / President'}</span>
              </label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                Tier 2 Lead
              </span>
            </div>
            <select
              value={presidentId}
              onChange={(e) => handlePresidentChange(e.target.value)}
              className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-black text-stone-900 outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            >
              {groupMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nameRegional || m.name} (+91 {m.phone}) - {m.occupation || 'सभासद'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-amber-900 font-medium">
              {isMr ? 'हा सभासद आता गट प्रमुख (Lead) म्हणून बैठकांचे संचालन करेल.' : 'This member becomes the single SHG Lead orchestrating meetings.'}
            </p>
          </div>

          {/* Role 2: Treasurer */}
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span>{isMr ? '२. खजिनदार (Treasurer - Cash Box Custodian)' : '2. Treasurer (Finance Custodian)'}</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                Quorum Officer
              </span>
            </div>
            <select
              value={treasurerId}
              onChange={(e) => handleTreasurerChange(e.target.value)}
              className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-black text-stone-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            >
              {groupMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nameRegional || m.name} (+91 {m.phone}) - {m.occupation || 'सभासद'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-emerald-900 font-medium">
              {isMr ? 'रोकड पेटी व स्वाक्षरी कोरमसाठी खजिनदार पदावर जबाबदारी राहील.' : 'Responsible for cash box reconciliation and 2-of-3 quorum sign-off.'}
            </p>
          </div>

          {/* Role 3: Secretary */}
          <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>{isMr ? '३. सचिव (Secretary - Register Keeper)' : '3. Secretary (Resolution Signatory)'}</span>
              </label>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-200 px-2 py-0.5 rounded">
                Quorum Officer
              </span>
            </div>
            <select
              value={secretaryId}
              onChange={(e) => handleSecretaryChange(e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-black text-stone-900 outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              {groupMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nameRegional || m.name} (+91 {m.phone}) - {m.occupation || 'सभासद'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-blue-900 font-medium">
              {isMr ? 'बैठक इतिवृत्त व ठराव नोंदींची पडताळणी करेल.' : 'Responsible for recording resolutions and meeting proceedings.'}
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {isMr ? 'रद्द करा' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#14532D] hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>{isMr ? 'जतन होत आहे...' : 'Saving...'}</span>
            ) : (
              <>
                <Check className="w-4 h-4 text-amber-300" />
                <span>{isMr ? 'बदल जतन करा व लागू करा' : 'Save & Apply Changes'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

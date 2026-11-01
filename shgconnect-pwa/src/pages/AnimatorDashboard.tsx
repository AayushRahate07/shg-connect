import React, { useState, useEffect } from 'react';
import { GroupInfo, getAllCachedGroups, getMembersByShg, getMembers } from '../services/db';
import { SupportedLanguage, Member, Resolution, OfficerSignature } from '../types/shg';
import { SettingsView } from '../components/settings/SettingsView';
import { AnimatorMultiSHGView } from './AnimatorMultiSHGView';
import { MeetingWizard } from '../components/MeetingWizard';
import { Calendar, Users, Building2, Sparkles, ChevronRight, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface AnimatorDashboardProps {
  group: GroupInfo;
  members: Member[];
  language: SupportedLanguage;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSyncCenter?: () => void;
  onOpenBackupModal?: () => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onToggleTts?: () => void;
  ttsEnabled?: boolean;
  onResetData?: () => void;
  onOpenAddMember?: () => void;
  onSwitchShg?: (shgId: string) => void;
  onCompleteMeetingSession?: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => Promise<void> | void;
}

export const AnimatorDashboard: React.FC<AnimatorDashboardProps> = ({
  group,
  members,
  language,
  activeTab = 'home',
  onSelectTab,
  onOpenSyncCenter = () => {},
  onOpenBackupModal = () => {},
  onLanguageChange = () => {},
  onToggleTts = () => {},
  ttsEnabled = true,
  onResetData = () => {},
  onOpenAddMember,
  onSwitchShg,
  onCompleteMeetingSession
}) => {
  const isMr = language === 'mr';

  const [allGroups, setAllGroups] = useState<GroupInfo[]>([]);
  const [meetingGroup, setMeetingGroup] = useState<GroupInfo | null>(null);
  const [meetingMembers, setMeetingMembers] = useState<Member[]>([]);
  const [isConductingMeeting, setIsConductingMeeting] = useState<boolean>(false);

  useEffect(() => {
    async function loadGroups() {
      const groups = await getAllCachedGroups();
      setAllGroups(groups);
    }
    loadGroups();
  }, []);

  const handleStartMeetingForShg = async (shgCode: string) => {
    const targetGroup = allGroups.find(g => g.shgCode === shgCode) || group;
    const groupMembers = await getMembersByShg(shgCode);
    setMeetingGroup(targetGroup);
    setMeetingMembers(groupMembers.length > 0 ? groupMembers : members);
    setIsConductingMeeting(true);
  };

  return (
    <div className="space-y-6">
      {/* Active Meeting Wizard Overlay for Selected SHG */}
      {isConductingMeeting && meetingGroup ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsConductingMeeting(false)}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">
                  {isMr ? 'अधिकारी बैठक संचालन मोड' : 'Officer Meeting Mode'}
                </span>
                <h3 className="text-sm font-black text-stone-900 mt-0.5">
                  {isMr ? meetingGroup.nameRegional : meetingGroup.name} ({meetingGroup.village})
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold text-stone-500">
              {meetingMembers.length} {isMr ? 'सभासद' : 'Members'}
            </span>
          </div>

          <MeetingWizard
            members={meetingMembers}
            language={language}
            monthlySavingsAmount={meetingGroup.monthlyPoolRate || 500}
            onCancel={() => setIsConductingMeeting(false)}
            onCompleteMeeting={async (attendance, savings, loan, resolutions, signatories, proof) => {
              if (onCompleteMeetingSession) {
                await onCompleteMeetingSession(attendance, savings, loan, resolutions, signatories, proof);
              }
            }}
          />
        </div>
      ) : (
        <>
          {/* Default Multi-SHG Portfolio Tab */}
          {(activeTab === 'home' || activeTab === 'overview') && (
            <AnimatorMultiSHGView
              currentGroup={group}
              language={language}
              onSelectSHG={(shgId) => {
                if (onSwitchShg) onSwitchShg(shgId);
              }}
              onOpenAddMember={onOpenAddMember}
              onStartMeetingForSHG={handleStartMeetingForShg}
            />
          )}

          {/* Meeting Orchestration Hub Tab */}
          {activeTab === 'meetings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 shadow-md space-y-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-white/15 text-emerald-100 border border-white/20">
                  <Calendar className="w-3.5 h-3.5" />
                  {isMr ? 'प्रभाग अधिकारी बैठक संचालन केंद्र' : 'Officer Meeting Orchestration Hub'}
                </span>
                <h2 className="text-2xl font-black">
                  {isMr ? 'कोणत्याही एका बचत गटात बैठक चालवा' : 'Orchestrate Meeting in Any Assigned SHG'}
                </h2>
                <p className="text-xs text-emerald-100 max-w-xl">
                  {isMr
                    ? 'प्रभाग अधिकारी म्हणून तुम्ही कोणत्याही एका बचत गटाची निवड करून त्या गटाची मासिक बैठक (हजेरी, बचत संकलन, कर्ज वाटप व कोरम स्वाक्षरी) चालवू शकता.'
                    : 'As an Officer managing multiple SHGs, select any group to conduct and commit their monthly meeting session.'}
                </p>
              </div>

              {/* Group Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allGroups.map((g) => (
                  <div
                    key={g.shgCode}
                    className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-500 transition space-y-3 text-left"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        {g.shgCode} · {g.village}
                      </span>
                      <h4 className="font-black text-sm text-stone-900 mt-0.5">
                        {isMr ? g.nameRegional : g.name}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium mt-1">
                        मासिक बचत: ₹{g.monthlyPoolRate || 500}/सभासद
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartMeetingForShg(g.shgCode)}
                      className="w-full bg-[#14532D] hover:bg-emerald-900 text-white font-black py-2.5 px-3 rounded-xl text-xs shadow flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isMr ? 'या गटाची बैठक चालवा' : 'Orchestrate Meeting'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Directory across all SHGs */}
          {activeTab === 'members' && (
            <AnimatorMultiSHGView
              currentGroup={group}
              language={language}
              onSelectSHG={(shgId) => {
                if (onSwitchShg) onSwitchShg(shgId);
              }}
              onOpenAddMember={onOpenAddMember}
              onStartMeetingForSHG={handleStartMeetingForShg}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              language={language}
              onLanguageChange={onLanguageChange}
              ttsEnabled={ttsEnabled}
              onToggleTts={onToggleTts}
              onOpenBackupModal={onOpenBackupModal}
              onOpenSyncCenter={onOpenSyncCenter}
              onResetData={onResetData}
              federation={group.federation}
            />
          )}
        </>
      )}
    </div>
  );
};

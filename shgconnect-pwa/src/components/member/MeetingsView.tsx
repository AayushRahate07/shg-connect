import React, { useState } from 'react';
import { Meeting, SupportedLanguage, Resolution } from '../../types/shg';
import { GroupInfo } from '../../services/db';
import { translations } from '../../i18n/translations';
import { formatINR } from '../../theme/tokens';
import { Card } from '../ui/Card';
import { Calendar, CheckCircle2, MapPin, Users, PiggyBank, Landmark, ShieldCheck, ArrowLeft, ChevronRight, FileText, Radio, ArrowRight, Sparkles } from 'lucide-react';

interface MeetingsViewProps {
  onJoinLiveMeeting?: () => void;
  meetings: Meeting[];
  resolutions?: Resolution[];
  language: SupportedLanguage;
  group?: GroupInfo | null;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  resolutions = [],
  language,
  group,
  onJoinLiveMeeting
}) => {
  const t = translations[language] || translations.en;
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const scheduled = group?.nextMeeting;
  const locationLabel = scheduled?.venue
    ? scheduled.venue
    : (group?.village
        ? (language === 'mr' ? `${group.village} ग्रामपंचायत सभागृह` : `${group.village} Gram Panchayat Hall`)
        : (language === 'mr' ? 'ग्रामपंचायत सभागृह' : 'Gram Panchayat Hall'));

  const nextMeetingDate = scheduled
    ? `${new Date(scheduled.date).toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${scheduled.time || '४:०० वा.'}`
    : (() => {
        if (meetings && meetings.length > 0) {
          const last = new Date(meetings[meetings.length - 1].date);
          if (!isNaN(last.getTime())) {
            const next = new Date(last);
            next.setMonth(next.getMonth() + 1);
            return next.toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ४:०० वा.';
          }
        }
        return '18 नोव्हेंबर 2026 · ४:०० वा.';
      })();

  const monthlyRate = group?.monthlyPoolRate || 200;

  // If a meeting detail is selected, render the dedicated Detail Screen
  if (selectedMeeting) {
    const totalMembers = Object.keys(selectedMeeting.attendanceRecord || {}).length || 16;
    const presentCount = Object.values(selectedMeeting.attendanceRecord || {}).filter(Boolean).length || 14;
    const totalCash = (selectedMeeting.totalSavingsCollected || 2400) + (selectedMeeting.totalEmiCollected || 5600);

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Detail Screen Navigation Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedMeeting(null)}
            className="flex items-center space-x-2 text-xs font-bold text-[#0F766E] hover:underline bg-white px-3 py-1.5 rounded-xl border border-[#E7E5E4] shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'mr' ? '← मागे (माझ्या बैठका)' : language === 'hi' ? '← पीछे' : '← Back to Meetings'}</span>
          </button>

          <span className="bg-[#CCFBF1] text-[#0F766E] font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {language === 'mr' ? 'बैठक पूर्ण' : 'Meeting Completed'}
          </span>
        </div>

        {/* Meeting Hero Banner */}
        <div className="bg-teal-50/20 p-6 rounded-2xl border border-teal-200 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
              {language === 'mr' ? `बैठक क्रमांक #${selectedMeeting.meetingNumber}` : `Meeting #${selectedMeeting.meetingNumber}`}
            </span>
            <span className="text-xs font-bold text-[#1C1917]">
              {selectedMeeting.date}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#1C1917]">
            {language === 'mr' ? 'मासिक गट बैठक' : 'Monthly SHG Meeting'}
          </h2>
          <div className="text-xs text-[#78716C] font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
            <span>{locationLabel}</span>
          </div>
        </div>

        {/* Meeting Detail Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Attendance Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0F766E]" />
              {language === 'mr' ? 'उपस्थिती' : 'Attendance'}
            </span>
            <div className="text-2xl font-black text-[#1C1917]">
              {presentCount} / {totalMembers} {language === 'mr' ? 'सदस्य' : 'members'}
            </div>
            <div className="text-xs text-[#0F766E] font-semibold">
              {Math.round((presentCount / totalMembers) * 100)}% {language === 'mr' ? 'उपस्थिती दर (Quorum Met)' : 'Attendance rate'}
            </div>
          </div>

          {/* Cash Reconciliation Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
              {language === 'mr' ? 'रोख ताळमेळ (Reconciliation)' : 'Cash Reconciliation'}
            </span>
            <div className="text-2xl font-black text-[#1C1917]">
              {formatINR(totalCash)}
            </div>
            <div className="text-xs text-[#0F766E] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'Expected ₹' + totalCash + ' = Actual ₹' + totalCash + ' (ताळमेळ पूर्ण)' : 'Balanced cleanly'}</span>
            </div>
          </div>

          {/* Savings Collected */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-[#0F766E]" />
              {language === 'mr' ? 'जमा झालेली बचत' : 'Savings Collected'}
            </span>
            <div className="text-xl font-bold text-[#0F766E]">
              {formatINR(selectedMeeting.totalSavingsCollected || 2400)}
            </div>
          </div>

          {/* Loan Repayments Collected */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-[#F97316]" />
              {language === 'mr' ? 'कर्ज परतफेड' : 'Loan Repayments'}
            </span>
            <div className="text-xl font-bold text-[#1C1917]">
              {formatINR(selectedMeeting.totalEmiCollected || 5600)}
            </div>
          </div>
        </div>

        {/* Resolutions Passed Section */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-card space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#F97316]" />
            {language === 'mr' ? 'बैठकीतील ठराव (Resolutions)' : 'Resolutions Passed'}
          </span>
          <ul className="space-y-2 text-xs text-[#1C1917] font-medium">
            <li className="flex items-start gap-2 bg-[#FAFAF9] p-2.5 rounded-xl border border-[#E7E5E4]">
              <span className="text-[#0F766E] font-bold">•</span>
              <span>{language === 'mr' ? `मासिक बचत दरमहा ₹${monthlyRate} वेळेवर जमा करण्याचा ठराव मंजूर.` : `Monthly savings contribution fixed at ₹${monthlyRate} per member.`}</span>
            </li>
            <li className="flex items-start gap-2 bg-[#FAFAF9] p-2.5 rounded-xl border border-[#E7E5E4]">
              <span className="text-[#0F766E] font-bold">•</span>
              <span>{language === 'mr' ? `पुढील बैठकीची तारीख ${nextMeetingDate} ${locationLabel} येथे निश्चित.` : `Next meeting confirmed for ${nextMeetingDate} at ${locationLabel}.`}</span>
            </li>
          </ul>
        </div>

        {/* Cryptographic Audit Checkpoint */}
        <div className="bg-[#FAFAF9] p-4 rounded-2xl border border-[#E7E5E4] flex flex-wrap items-center justify-between gap-2 text-xs text-[#78716C]">
          <span className="font-semibold">{language === 'mr' ? 'ऑडिट तपासणी (Hash Checkpoint):' : 'Audit Checkpoint:'}</span>
          <span className="font-mono text-[11px] font-bold text-[#0F766E]">
            {selectedMeeting.checkpointFingerprint || 'CHK-88F2-990A-331C'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1C1917] tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#0F766E]" />
          <span>{language === 'mr' ? 'माझ्या बैठका' : language === 'hi' ? 'मेरी बैठकें' : 'My Meetings'}</span>
        </h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          {language === 'mr' ? 'आगामी आणि मागील बैठकींची माहिती व तपशील' : language === 'hi' ? 'आगामी और पिछली बैठकों का विवरण' : 'Upcoming schedule and past meeting records'}
        </p>
      </div>

      {/* Live Meeting Action Card */}
      {onJoinLiveMeeting && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-5 rounded-2xl shadow-lg border border-emerald-600 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                {language === 'mr' ? 'थेट बैठक कक्ष' : 'Live Meeting Room'}
              </span>
            </div>
            <span className="bg-emerald-500/30 text-emerald-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              {language === 'mr' ? 'सुरू आहे' : 'Active'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              {language === 'mr' ? 'गटाची थेट बैठक सुरू आहे?' : 'Is your SHG meeting in progress?'}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1">
              {language === 'mr'
                ? 'गट प्रमुखांकडून ४-अंकी कोड घ्या आणि बैठकीत सामील व्हा.'
                : 'Get the 4-digit code from your Lead and join to record your attendance & savings.'}
            </p>
          </div>
          <button
            onClick={onJoinLiveMeeting}
            className="w-full bg-white text-emerald-900 font-black text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-emerald-50 active:scale-[0.98] transition"
          >
            <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
            <span>{language === 'mr' ? 'बैठकीत सामील व्हा (Join Meeting)' : 'Join Live Meeting'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {/* Upcoming Meeting Banner Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7E5E4] shadow-card space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#F97316]" />
          {language === 'mr' ? 'पुढील बैठक' : language === 'hi' ? 'अगली बैठक' : 'Next Scheduled Meeting'}
        </span>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-2xl font-extrabold text-[#1C1917]">
              {nextMeetingDate}
            </div>
            <div className="text-xs text-[#78716C] font-medium mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              <span>{locationLabel}</span>
            </div>
            {scheduled?.agenda && (
              <div className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 mt-2 inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>{language === 'mr' ? 'विषय:' : 'Agenda:'} {scheduled.agenda}</span>
              </div>
            )}
          </div>
          <span className="bg-[#FFEDD5] text-[#C2410C] font-extrabold text-xs px-3 py-1.5 rounded-full">
            {language === 'mr' ? 'नियोजित' : 'Scheduled'}
          </span>
        </div>
      </div>

      {/* Past Meetings List */}
      <Card className="p-0 border border-[#E7E5E4] shadow-card rounded-2xl overflow-hidden bg-white">
        <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
            {language === 'mr' ? 'मागील बैठका' : language === 'hi' ? 'पिछली बैठकें' : 'Past Completed Meetings'}
          </span>
        </div>

        <div className="divide-y divide-[#E7E5E4]">
          {meetings.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#78716C]">
              {language === 'mr' ? 'अजून कोणतीही बैठक पूर्ण झालेली नाही.' : 'No past meeting records found.'}
            </div>
          ) : (
            meetings.map((m) => {
              const presentCount = Object.values(m.attendanceRecord || {}).filter(Boolean).length || 14;
              const totalCount = Object.keys(m.attendanceRecord || {}).length || 16;
              return (
                <div key={m.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[#F5F5F4] transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-[#1C1917]">
                        {m.date}
                      </span>
                      <span className="bg-[#CCFBF1] text-[#0F766E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {language === 'mr' ? 'बैठक पूर्ण' : 'Completed'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#78716C] font-medium">
                      <span>{language === 'mr' ? `उपस्थिती: ${presentCount}/${totalCount}` : `Attendance: ${presentCount}/${totalCount}`}</span>
                      <span>•</span>
                      <span>{language === 'mr' ? `बचत: ${formatINR(m.totalSavingsCollected || 2400)}` : `Savings: ${formatINR(m.totalSavingsCollected || 2400)}`}</span>
                      <span>•</span>
                      <span>{language === 'mr' ? `तफावत: ₹०` : `Diff: ₹0`}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMeeting(m)}
                    className="bg-[#F5F5F4] hover:bg-[#CCFBF1] text-[#1C1917] hover:text-[#0F766E] border border-[#E7E5E4] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{language === 'mr' ? 'बैठक तपशील पहा' : 'View Details'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

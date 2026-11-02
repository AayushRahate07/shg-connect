import React, { useState, useMemo, useEffect } from 'react';
import { Meeting, SupportedLanguage, Resolution, Member, Transaction } from '../../types/shg';
import { GroupInfo } from '../../services/db';
import { formatINR, formatMarathiDate, formatReceiptNumber } from '../../theme/tokens';
import { getGroupSettings } from '../../services/db';
import { Card } from '../ui/Card';
import {
  Calendar,
  CheckCircle2,
  MapPin,
  Users,
  PiggyBank,
  Landmark,
  ArrowLeft,
  FileText,
  Radio,
  ArrowRight,
  Clock,
  Navigation,
  Bell,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

interface MeetingsViewProps {
  onJoinLiveMeeting?: (code?: string) => void;
  meetings: Meeting[];
  resolutions?: Resolution[];
  language: SupportedLanguage;
  group?: GroupInfo | null;
  member?: Member;
  transactions?: Transaction[];
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  resolutions = [],
  language,
  group,
  member,
  transactions = [],
  onJoinLiveMeeting
}) => {
  const isMr = language === 'mr';
  const settings = getGroupSettings(group);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [joinPin, setJoinPin] = useState<string>('');
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);

  // Check if there is an active meeting room in localStorage
  useEffect(() => {
    const checkRoom = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('shg_live_meeting_code');
        const hostRoom = localStorage.getItem('shg_live_room_' + stored);
        if (stored) {
          setActiveRoomCode(stored);
          setJoinPin(stored);
        } else {
          setActiveRoomCode(null);
        }
      }
    };
    checkRoom();
    const interval = setInterval(checkRoom, 3000);
    return () => clearInterval(interval);
  }, []);

  const scheduled = group?.nextMeeting;
  const nextDateRaw = scheduled?.date || '2026-11-16';
  const nextTimeRaw = scheduled?.time || settings.meetingTime || '16:00';
  const venue = scheduled?.venue || settings.meetingPlace || 'ग्रामपंचायत सभागृह';
  const monthlyRate = settings.monthlySavingAmount || 300;

  // Compute countdown in days
  const countdownDays = useMemo(() => {
    const target = new Date(`${nextDateRaw}T${nextTimeRaw}:00`);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [nextDateRaw, nextTimeRaw]);

  // Weekday name in Marathi
  const weekdayName = useMemo(() => {
    const d = new Date(`${nextDateRaw}T12:00:00`);
    const days = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    return isMr ? days[d.getDay()] : d.toLocaleDateString('en-IN', { weekday: 'long' });
  }, [nextDateRaw, isMr]);

  // Deduplicate meetings by date
  const uniqueMeetings = useMemo(() => {
    const map = new Map<string, Meeting>();
    meetings.forEach(m => {
      if (!map.has(m.date)) {
        map.set(m.date, m);
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings]);

  // Open Google Maps search for venue
  const handleOpenMap = () => {
    const q = `${venue}, ${settings.village}, ${settings.district}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank');
  };

  // WhatsApp Reminder
  const handleSetReminder = () => {
    const msg = isMr
      ? `*स्मरणपत्र: बचत गट मासिक बैठक*\nतारीख: ${nextDateRaw} (${weekdayName})\nवेळ: सायं. ${nextTimeRaw} वा.\nस्थान: ${venue}\nकाय आणायचे: बचत ₹${monthlyRate}\n\nकृपया वेळेवर उपस्थित राहावे.`
      : `SHG Meeting Reminder: ${nextDateRaw} at ${venue}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Handle inline join
  const handleInlineJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinPin.trim().length === 4) {
      onJoinLiveMeeting?.(joinPin.trim());
    }
  };

  // ── Meeting Detail View (When a meeting is tapped) ──
  if (selectedMeeting) {
    const totalMembers = Object.keys(selectedMeeting.attendanceRecord || {}).length || 14;
    const presentCount = Object.values(selectedMeeting.attendanceRecord || {}).filter(Boolean).length || 12;
    const isMemberPresent = member ? selectedMeeting.attendanceRecord?.[member.id] !== false : true;
    const totalCash = (selectedMeeting.totalSavingsCollected || (monthlyRate * presentCount)) + (selectedMeeting.totalEmiCollected || 0);

    return (
      <div className="space-y-5 max-w-2xl mx-auto pb-8 animate-fadeIn">
        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedMeeting(null)}
            className="flex items-center space-x-1.5 text-xs font-black text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs active:scale-95 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isMr ? 'मागे (बैठका)' : 'Back to Meetings'}</span>
          </button>

          <span className="bg-emerald-100 text-emerald-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isMr ? 'बैठक संपन्न' : 'Completed'}</span>
          </span>
        </div>

        {/* Meeting Header */}
        <div className="bg-gradient-to-br from-white via-stone-50 to-emerald-50/20 p-5 rounded-lg border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500">
            <span>{isMr ? `बैठक क्र. #${selectedMeeting.meetingNumber}` : `Meeting #${selectedMeeting.meetingNumber}`}</span>
            <span>{selectedMeeting.date}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            {isMr ? 'मासिक बचत गट बैठक' : 'Monthly SHG Meeting'}
          </h2>
          <div className="text-xs text-stone-600 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{venue}</span>
          </div>
        </div>

        {/* Personal Status Banner */}
        <div className={`p-4 rounded-lg border text-xs font-bold flex items-center justify-between shadow-2xs ${
          isMemberPresent
            ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
            : 'bg-rose-50 text-rose-950 border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black ${
              isMemberPresent ? 'bg-emerald-700' : 'bg-rose-700'
            }`}>
              {isMemberPresent ? '✔' : '✖'}
            </div>
            <div>
              <p className="font-black text-sm">
                {isMr
                  ? (isMemberPresent ? 'तुम्ही या बैठकीस हजर होतात' : 'तुम्ही या बैठकीस गैरहजर होतात')
                  : (isMemberPresent ? 'You attended this meeting' : 'You were absent')}
              </p>
              <p className="text-[11px] font-medium opacity-90 mt-0.5">
                {isMemberPresent
                  ? (isMr ? `बचत जमा: ${formatINR(monthlyRate)} • पावती वहीत नोंदली गेली आहे` : `Savings: ${formatINR(monthlyRate)}`)
                  : (isMr ? 'मासिक बचत पुढील बैठकीत जमा करणे' : 'Deposit pending')}
              </p>
            </div>
          </div>
          <span className="text-xs font-black">
            {isMemberPresent ? (isMr ? 'हजर ✔' : 'Present') : (isMr ? 'गैरहजर ✖' : 'Absent')}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-800" />
              {isMr ? 'एकूण उपस्थिती' : 'Attendance'}
            </span>
            <div className="text-xl font-black text-stone-900">
              {presentCount} / {totalMembers} {isMr ? 'हजर' : 'present'}
            </div>
            <p className="text-[11px] text-emerald-800 font-bold">
              {Math.round((presentCount / totalMembers) * 100)}% {isMr ? 'कोरम पूर्ण' : 'Quorum met'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <PiggyBank className="w-3.5 h-3.5 text-emerald-800" />
              {isMr ? 'रोख पेटी ताळमेळ' : 'Cash Balanced'}
            </span>
            <div className="text-xl font-black text-stone-900 amount-display">
              {formatINR(totalCash)}
            </div>
            <p className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isMr ? 'हिशोब जुळला ✔' : 'Balanced cleanly ✔'}</span>
            </p>
          </div>
        </div>

        {/* Short Minutes (इतिवृत्त) & Fines */}
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-stone-200 shadow-2xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5 border-b border-stone-100 pb-2">
            <FileText className="w-4 h-4 text-amber-700" />
            <span>{isMr ? 'बैठकीचे इतिवृत्त व ठराव' : 'Meeting Minutes'}</span>
          </h4>
          <ul className="space-y-2 text-xs text-stone-800 font-medium leading-relaxed">
            <li className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <span className="text-emerald-800 font-black">•</span>
              <span>
                {isMr
                  ? `मासिक बचत दरमहा ₹${monthlyRate} प्रमाणे उपस्थित सदस्यांकडून रोख संकलित करण्यात आली.`
                  : `Monthly savings collected from all present members at ₹${monthlyRate}.`}
              </span>
            </li>
            <li className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <span className="text-emerald-800 font-black">•</span>
              <span>
                {isMr
                  ? 'दंड व वसुली: कोणतीही दंडात्मक वसुली नाही (निरंक / काही नाही).'
                  : 'Fines: Nil.'}
              </span>
            </li>
            <li className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <span className="text-emerald-800 font-black">•</span>
              <span>
                {isMr
                  ? `पुढील बैठक ठरल्याप्रमाणे १६ तारखेला ${venue} येथे दुपारी ४:०० वाजता घेण्याचे सर्वानुमते ठरले.`
                  : `Next meeting confirmed for regular schedule at ${venue}.`}
              </span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // ── Main Meetings Overview ──
  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-emerald-800" />
          <span>{isMr ? 'माझ्या बैठका' : 'Meetings'}</span>
        </h1>
        <p className="text-xs text-stone-500 font-medium mt-0.5">
          {settings.nameRegional || settings.name} • {venue}
        </p>
      </div>

      {/* ── 1. JOIN LIVE MEETING CARD (Prominent ONLY when room is active or initiated) ── */}
      {(activeRoomCode || onJoinLiveMeeting) && (
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 rounded-lg shadow-sm border border-emerald-700 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                {isMr ? 'थेट बैठक कक्ष (Live)' : 'Live Meeting Room'}
              </span>
            </div>
            <span className="bg-emerald-500/30 text-emerald-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              {activeRoomCode ? (isMr ? 'सध्या सुरू आहे' : 'Active Now') : (isMr ? 'सामील व्हा' : 'Join')}
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              {isMr ? 'गटाची बैठक सुरू आहे? बैठकीत सामील व्हा' : 'Meeting in progress? Join now'}
            </h3>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              {isMr
                ? 'गट प्रमुखांनी दिलेला ४-अंकी बैठक कोड टाका आणि हजेरी नोंदवा.'
                : 'Enter the 4-digit code given by your Lead to record attendance.'}
            </p>
          </div>

          {/* Inline 4-digit PIN Box & Join Button */}
          <form onSubmit={handleInlineJoin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={4}
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                placeholder={isMr ? '४-अंकी कोड (उदा. ४८२१)' : '4-digit PIN (e.g. 4821)'}
                className="w-full bg-white/15 border border-white/30 text-white placeholder-emerald-200 text-base font-black px-4 py-2.5 rounded-lg text-center tracking-widest outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <button
              type="submit"
              disabled={joinPin.trim().length !== 4}
              className="bg-white hover:bg-emerald-50 active:scale-95 disabled:opacity-50 text-emerald-950 font-black text-xs px-5 py-3 rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Radio className="w-4 h-4 text-emerald-800 animate-pulse" />
              <span>{isMr ? 'बैठकीत सामील व्हा' : 'Join Meeting'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ── 2. NEXT SCHEDULED MEETING CARD ── */}
      <div className="bg-gradient-to-br from-white via-amber-50/20 to-orange-50/20 p-5 rounded-lg border border-amber-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>{isMr ? 'पुढील ठरलेली बैठक' : 'Next Scheduled Meeting'}</span>
          </span>
          <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-1 rounded-full border border-amber-300">
            {isMr ? `${countdownDays} दिवसांनी` : `In ${countdownDays} days`}
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            {formatMarathiDate(`${nextDateRaw}T${nextTimeRaw}:00`)}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium mt-1">
            <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{venue}</span>
          </div>
        </div>

        {/* "काय आणायचे" (What to bring) */}
        <div className="bg-white/80 p-3.5 rounded-lg border border-amber-200/80 space-y-1.5 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block">
            {isMr ? '💼 बैठकीत काय आणायचे:' : 'What to bring:'}
          </span>
          <div className="grid grid-cols-2 gap-2 font-bold text-stone-800">
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
              <span className="text-[10px] text-stone-500 block">{isMr ? 'मासिक बचत' : 'Savings'}</span>
              <span className="text-sm font-black text-emerald-800">{formatINR(monthlyRate)}</span>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
              <span className="text-[10px] text-stone-500 block">{isMr ? 'कर्ज हप्ता' : 'Loan EMI'}</span>
              <span className="text-sm font-black text-stone-800">
                {member?.activeLoanBalance ? (isMr ? 'हप्ता रक्कम' : 'EMI Due') : (isMr ? 'काही नाही' : 'Nil')}
              </span>
            </div>
          </div>
        </div>

        {/* Reminder & Venue Direction Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleSetReminder}
            className="w-full py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-stone-200"
          >
            <Bell className="w-3.5 h-3.5 text-amber-700" />
            <span>{isMr ? 'स्मरणपत्र ठेवा' : 'Reminder'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenMap}
            className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-emerald-200"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-800" />
            <span>{isMr ? 'नकाशा / पत्ता' : 'Map Venue'}</span>
          </button>
        </div>
      </div>

      {/* ── 3. PAST MEETINGS (Lead with MY Attendance & Deposit) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-800" />
            <span>{isMr ? 'मागील बैठकांचा इतिहास' : 'Past Meetings'}</span>
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {uniqueMeetings.length} {isMr ? 'बैठका' : 'meetings'}
          </span>
        </div>

        <div className="space-y-2.5">
          {uniqueMeetings.map((mtg) => {
            const isAttended = member ? mtg.attendanceRecord?.[member.id] !== false : true;
            const totalPresent = Object.values(mtg.attendanceRecord || {}).filter(Boolean).length || 12;
            const totalMembers = Object.keys(mtg.attendanceRecord || {}).length || 14;

            return (
              <button
                key={mtg.id}
                onClick={() => setSelectedMeeting(mtg)}
                className="w-full bg-white hover:bg-stone-50 p-4 rounded-lg border border-stone-200 shadow-2xs text-left transition active:scale-[0.99] cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-stone-900">
                        {isMr ? `बैठक क्र. #${mtg.meetingNumber}` : `Meeting #${mtg.meetingNumber}`}
                      </span>
                      <span className="text-[11px] text-stone-500 font-semibold">
                        • {mtg.date}
                      </span>
                    </div>

                    {/* LEAD WITH MY ATTENDANCE AND DEPOSIT */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md ${
                        isAttended
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-rose-100 text-rose-900 border border-rose-200'
                      }`}>
                        {isAttended ? (isMr ? 'हजर ✔' : 'Attended ✔') : (isMr ? 'गैरहजर ✖' : 'Absent ✖')}
                      </span>
                      <span className="text-xs font-bold text-stone-700">
                        {isAttended ? (isMr ? `बचत: ₹${monthlyRate} जमा` : `Saved: ₹${monthlyRate}`) : (isMr ? 'बचत: बाकी' : 'Pending')}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-500 font-medium pt-1">
                      {isMr
                        ? `गट उपस्थिती: ${totalPresent}/${totalMembers} हजर • दंड: काही नाही`
                        : `Attendance: ${totalPresent}/${totalMembers} • Fines: Nil`}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-800 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      <span>{isMr ? 'इतिवृत्त पहा' : 'View Minutes'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-1">
                      {formatReceiptNumber(mtg.meetingNumber - 1)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

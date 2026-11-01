import React, { useState } from 'react';
import { SupportedLanguage } from '../../types/shg';
import { sound } from '../../services/sound';
import { tts } from '../../services/tts';
import { Calendar, Clock, MapPin, FileText, Check, X, Sparkles, AlertCircle } from 'lucide-react';

interface ScheduleMeetingModalProps {
  shgId: string;
  shgName: string;
  defaultVenue?: string;
  language: SupportedLanguage;
  onClose: () => void;
  onSchedule: (meetingData: {
    date: string;
    time: string;
    venue: string;
    agenda: string;
  }) => Promise<void>;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  shgId,
  shgName,
  defaultVenue,
  language,
  onClose,
  onSchedule,
}) => {
  const isMr = language === 'mr';
  const t = (mr: string, en: string) => isMr ? mr : en;

  // Calculate default future date: 18th of next month, or 2 weeks from now
  const defaultDateStr = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(18);
    return d.toISOString().split('T')[0];
  })();

  const [date, setDate] = useState<string>(defaultDateStr);
  const [time, setTime] = useState<string>('16:00');
  const [venue, setVenue] = useState<string>(defaultVenue || (isMr ? 'ग्रामपंचायत सभागृह' : 'Gram Panchayat Hall'));
  const [agenda, setAgenda] = useState<string>(
    isMr ? 'मासिक बचत संकलन, कर्ज परतफेड व नवीन कर्ज वाटप' : 'Monthly savings collection, loan repayments & new loan disbursals'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const agendaPresets = [
    { mr: 'मासिक बचत व कर्ज वाटप', en: 'Monthly Savings & Loans' },
    { mr: 'दिवाळी व्यवसाय भांडवल नियोजन', en: 'Festive Business Planning' },
    { mr: 'वार्षिक लेखापरीक्षण व हिशोब तपासणी', en: 'Annual Audit Review' },
    { mr: 'बँक लिंकेज व शासकीय योजना माहिती', en: 'Bank Linkage & Schemes' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError(t('कृपया बैठकीची तारीख निवडा', 'Please select a date'));
      return;
    }
    if (!venue.trim()) {
      setError(t('कृपया बैठकीचे ठिकाण प्रविष्ट करा', 'Please enter a venue'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      sound.playStampSound();
      await onSchedule({
        date,
        time,
        venue: venue.trim(),
        agenda: agenda.trim() || (isMr ? 'मासिक गट बैठक' : 'Monthly SHG Meeting'),
      });
      tts.speak(
        isMr
          ? `पुढील बैठक ${new Date(date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long' })} रोजी नियोजित केली.`
          : `Next meeting scheduled for ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}.`
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden space-y-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900 tracking-tight">
                {t('पुढील बैठक नियोजन', 'Schedule Next Meeting')}
              </h2>
              <p className="text-[11px] font-semibold text-stone-500 line-clamp-1">
                {shgName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('बैठक तारीख', 'Date')}</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full text-xs font-bold py-2.5 px-3 bg-stone-50 border border-stone-300 rounded-xl focus:border-emerald-600 focus:bg-white outline-none text-stone-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('वेळ', 'Time')}</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                className="w-full text-xs font-bold py-2.5 px-3 bg-stone-50 border border-stone-300 rounded-xl focus:border-emerald-600 focus:bg-white outline-none text-stone-900"
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('बैठकीचे ठिकाण (Venue)', 'Meeting Venue')}</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder={t('उदा. ग्रामपंचायत सभागृह / मीनाताईंचे घर', 'e.g. Gram Panchayat Hall')}
              required
              className="w-full text-xs font-semibold py-2.5 px-3 bg-stone-50 border border-stone-300 rounded-xl focus:border-emerald-600 focus:bg-white outline-none text-stone-900"
            />
          </div>

          {/* Agenda & Topic */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('बैठकीचा मुख्य विषय (Agenda)', 'Meeting Agenda')}</span>
            </label>
            <textarea
              rows={2}
              value={agenda}
              onChange={e => setAgenda(e.target.value)}
              placeholder={t('उदा. मासिक बचत संकलन, कर्ज परतफेड...', 'e.g. Monthly savings and loan recovery')}
              className="w-full text-xs font-semibold p-3 bg-stone-50 border border-stone-300 rounded-xl focus:border-emerald-600 focus:bg-white outline-none text-stone-900 resize-none"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {agendaPresets.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAgenda(isMr ? p.mr : p.en)}
                  className="text-[10px] font-bold px-2 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-600 rounded-lg border border-stone-200 transition"
                >
                  {isMr ? p.mr : p.en}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
            >
              {t('रद्द करा', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-2.5 text-xs font-black text-white bg-emerald-800 hover:bg-emerald-900 active:scale-95 disabled:opacity-50 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? t('नोंदवत आहे...', 'Scheduling...') : t('बैठक निश्चित करा', 'Confirm Meeting')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

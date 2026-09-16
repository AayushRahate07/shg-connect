import React, { useState } from 'react';
import { Member, SupportedLanguage, Resolution, ResolutionCategory } from '../types/shg';
import { FileText, PlusCircle, CheckCircle2, Sparkles, Tag, Users, Check } from 'lucide-react';
import { sound } from '../services/sound';

interface ResolutionRegisterProps {
  members: Member[];
  resolutions: Resolution[];
  language: SupportedLanguage;
  onAddResolution: (res: Omit<Resolution, 'id' | 'resolutionNumber'>) => void;
}

export const INITIAL_RESOLUTIONS: Resolution[] = [
  {
    id: 'res-1',
    resolutionNumber: 1,
    date: '2024-07-05',
    title: 'मासिक बचत दर निश्चिती',
    category: 'LIVELIHOOD',
    description: 'सर्व सदस्यांनी दरमहा ५ तारखेला ₹५०० बचत जमा करण्याचा सर्वानुमते ठराव संमत.',
    proposedBy: 'Kamal-tai Patil',
    secondedBy: 'Sunita-bai Deshmukh',
    approvedUnanimously: true
  },
  {
    id: 'res-2',
    resolutionNumber: 2,
    date: '2024-08-05',
    title: 'सुनिताबाईंना शेळीपालनासाठी कर्ज मंजुरी',
    category: 'AGRICULTURE',
    description: 'सुनिताबाई देशमुख यांना शेळीपालन व्यवसायासाठी ₹२०,००० कर्ज १.५% व्याजाने मंजूर.',
    proposedBy: 'Anita-tai Shinde',
    secondedBy: 'Meena-bai Jadhav',
    approvedUnanimously: true
  }
];

export const ResolutionRegister: React.FC<ResolutionRegisterProps> = ({
  members,
  resolutions,
  language,
  onAddResolution
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ResolutionCategory>('LIVELIHOOD');
  const [description, setDescription] = useState<string>('');
  const [proposedBy, setProposedBy] = useState<string>(members[0]?.name || '');
  const [secondedBy, setSecondedBy] = useState<string>(members[1]?.name || '');

  const applyTemplate = (templateType: 'SAVINGS' | 'LOAN' | 'FINE') => {
    sound.playStampSound();
    if (templateType === 'SAVINGS') {
      setTitle('नियमित मासिक बचत जमा');
      setCategory('LIVELIHOOD');
      setDescription('बैठकीत उपस्थित सर्व सदस्यांची नियमित मासिक बचत ₹५०० जमा करण्यात आली.');
    } else if (templateType === 'LOAN') {
      setTitle('शेळीपालन व सण व्यवसायासाठी कर्ज मंजूर');
      setCategory('AGRICULTURE');
      setDescription(`${members[0]?.name || 'सदस्य'} यांना शेळीपालन / शिलाई कामासाठी ₹१५,००० कर्ज मंजूर करण्यात आले.`);
    } else if (templateType === 'FINE') {
      setTitle('उशिरा उपस्थिती दंड आकारणी');
      setCategory('PENALTY_FINE');
      setDescription('बैठकीस विनापरवानगी उशिरा आलेल्या सदस्यांवर नियम ५ प्रमाणे ₹२० दंड आकारला.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    sound.playStampSound();
    onAddResolution({
      date: new Date().toISOString().split('T')[0],
      title,
      category,
      description,
      proposedBy: proposedBy || members[0]?.name || 'Self',
      secondedBy: secondedBy || members[1]?.name || 'Self',
      approvedUnanimously: true
    });

    setTitle('');
    setDescription('');
    setShowAddForm(false);
  };

  const getCategoryBadge = (cat: ResolutionCategory) => {
    switch (cat) {
      case 'AGRICULTURE':
        return <span className="bg-[#14532D] text-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">🌾 शेती / शेळीपालन</span>;
      case 'LIVELIHOOD':
        return <span className="bg-amber-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">🐐 उपजीविका (Livelihood)</span>;
      case 'MEDICAL_EMERGENCY':
        return <span className="bg-rose-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">🏥 वैद्यकीय आणीबाणी (0% Interest)</span>;
      case 'EDUCATION':
        return <span className="bg-blue-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">📚 शिक्षण (Education)</span>;
      case 'PENALTY_FINE':
        return <span className="bg-stone-800 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">⚖️ दंड / शिस्त</span>;
    }
  };

  return (
    <div className="bg-[#FDFBF7] border-2 border-[#E2DDD3] rounded-3xl p-5 shadow-md space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DDD3] pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#14532D] text-amber-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-[#1C1917]">
              {language === 'mr' ? 'बैठक इतिवृत्त नोंदवही (Resolution Register)' : 'Meeting Proceedings Book'}
            </h3>
            <p className="text-xs text-stone-600">
              {language === 'mr' ? 'बैठकीतील सर्व संमत ठराव आणि निर्णयांची नोंद' : 'Formal SHG meeting resolutions and governance decisions'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#14532D] hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow flex items-center space-x-1.5 transition"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>{showAddForm ? 'बंद करा' : (language === 'mr' ? 'नवीन ठराव नोंदा' : 'New Resolution')}</span>
        </button>
      </div>

      {/* Add Resolution Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-[#E2DDD3] p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#14532D] uppercase">
              {language === 'mr' ? 'जलद ठराव साचे (Quick Templates):' : 'Quick Resolution Templates:'}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => applyTemplate('SAVINGS')}
                className="bg-[#F7F4EC] hover:bg-amber-100 border border-[#E2DDD3] text-[#1C1917] px-2 py-1 rounded-lg text-[11px] font-bold"
              >
                + मासिक बचत
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('LOAN')}
                className="bg-[#F7F4EC] hover:bg-amber-100 border border-[#E2DDD3] text-[#1C1917] px-2 py-1 rounded-lg text-[11px] font-bold"
              >
                + कर्ज मंजुरी
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('FINE')}
                className="bg-[#F7F4EC] hover:bg-amber-100 border border-[#E2DDD3] text-[#1C1917] px-2 py-1 rounded-lg text-[11px] font-bold"
              >
                + उशिरा दंड
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">ठरावाचे शीर्षक (Resolution Title)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1C1917] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">प्रवर्ग (Category)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResolutionCategory)}
                className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1C1917] outline-none"
              >
                <option value="AGRICULTURE">🌾 शेती / शेळीपालन (Agriculture)</option>
                <option value="LIVELIHOOD">🐐 उपजीविका (Livelihood)</option>
                <option value="MEDICAL_EMERGENCY">🏥 वैद्यकीय आणीबाणी (Medical Emergency)</option>
                <option value="EDUCATION">📚 शिक्षण (Education)</option>
                <option value="PENALTY_FINE">⚖️ दंड / शिस्त (Penalty/Fine)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">ठरावाचा सविस्तर मजकूर (Resolution Description)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
              className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-1.5 text-xs font-medium text-[#1C1917] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">सूचक (Proposed By)</label>
              <select
                value={proposedBy}
                onChange={(e) => setProposedBy(e.target.value)}
                className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1C1917] outline-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.nameRegional} ({m.name})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">अनुमोदक (Seconded By)</label>
              <select
                value={secondedBy}
                onChange={(e) => setSecondedBy(e.target.value)}
                className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1C1917] outline-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.nameRegional} ({m.name})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-black py-2 rounded-xl text-xs flex items-center justify-center space-x-1 shadow transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>इतिवृत्तात संमत करा (Commit Resolution)</span>
          </button>
        </form>
      )}

      {/* Resolutions History Feed */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {resolutions.length === 0 ? (
          <div className="text-center py-6 text-xs text-stone-500 font-medium">
            कोणताही ठराव नोंदवलेला नाही.
          </div>
        ) : (
          resolutions.map((r, idx) => (
            <div key={r.id || idx} className="bg-white border border-[#E2DDD3] p-3.5 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#1C1917] flex items-center gap-2">
                  <span className="bg-[#14532D] text-white px-2 py-0.5 rounded text-[10px]">
                    ठराव क्र. {r.resolutionNumber || idx + 1}
                  </span>
                  <span>{r.title}</span>
                </span>
                {getCategoryBadge(r.category)}
              </div>

              <p className="text-xs text-stone-700 font-medium leading-relaxed">
                {r.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-[#E2DDD3]/60">
                <span>सूचक: <strong className="text-stone-800">{r.proposedBy}</strong> | अनुमोदक: <strong className="text-stone-800">{r.secondedBy}</strong></span>
                <span className="text-emerald-800 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  सर्वानुमते संमत
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

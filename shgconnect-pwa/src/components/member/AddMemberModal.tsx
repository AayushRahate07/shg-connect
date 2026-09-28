import React, { useState } from 'react';
import { Role, SupportedLanguage } from '../../types/shg';
import { sound } from '../../services/sound';
import { tts } from '../../services/tts';
import { UserPlus, Check, X, Shield, Phone, User, Briefcase, IndianRupee } from 'lucide-react';

interface AddMemberModalProps {
  language: SupportedLanguage;
  onClose: () => void;
  onAddMember: (memberData: {
    name: string;
    nameRegional: string;
    phone: string;
    role: Role;
    occupation?: string;
    initialSavings: number;
  }) => Promise<void>;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  language,
  onClose,
  onAddMember
}) => {
  const [name, setName] = useState('');
  const [nameRegional, setNameRegional] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [occupation, setOccupation] = useState('');
  const [initialSavings, setInitialSavings] = useState('500');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isMr = language === 'mr';
  const isHi = language === 'hi';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isMr ? 'कृपया नाव प्रविष्ट करा' : 'Please enter full name');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError(isMr ? 'कृपया वैध १०-अंकी फोन नंबर प्रविष्ट करा' : 'Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      sound.playStampSound();
      await onAddMember({
        name: name.trim(),
        nameRegional: nameRegional.trim() || name.trim(),
        phone: phone.trim(),
        role,
        occupation: occupation.trim() || undefined,
        initialSavings: parseFloat(initialSavings) || 0
      });
      tts.speak(
        isMr
          ? `नवीन सदस्य ${nameRegional || name} यशस्वीरीत्या नोंदवले गेले.`
          : `New member ${name} registered successfully.`
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register new member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                {isMr ? 'नवीन सदस्य नोंदणी' : isHi ? 'नया सदस्य पंजीकरण' : 'Add New Member'}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {isMr ? 'बचत गटात नवीन सदस्याची भर घाला' : 'Register a new SHG member into ledger'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (English) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isMr ? 'पूर्ण नाव (इंग्रजी)' : 'Full Name (English)'} *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunita Suresh Patil"
              required
              className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-emerald-600 transition"
            />
          </div>

          {/* Regional Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isMr ? 'स्थानिक नाव (मराठी/हिंदी)' : 'Regional Name (Marathi/Hindi)'}</span>
            </label>
            <input
              type="text"
              value={nameRegional}
              onChange={(e) => setNameRegional(e.target.value)}
              placeholder="उदा. सुनिता सुरेश पाटील"
              className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-emerald-600 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isMr ? 'फोन नंबर' : 'Phone Number'} *</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98230XXXXX"
                required
                className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-emerald-600 transition"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isMr ? 'पद / भूमिका' : 'Role'}</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-emerald-600 transition"
              >
                <option value="MEMBER">{isMr ? 'सदस्य (Member)' : 'Member'}</option>
                <option value="OFFICE_BEARER">{isMr ? 'पदाधिकारी (Office Bearer)' : 'Office Bearer'}</option>
                <option value="ANIMATOR">{isMr ? 'प्रेरक / CRP (Animator)' : 'Animator / CRP'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Occupation */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isMr ? 'व्यवसाय' : 'Occupation'}</span>
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Tailoring / Farming"
                className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-emerald-600 transition"
              />
            </div>

            {/* Initial Savings Deposit */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isMr ? 'आरंभिक बचत (₹)' : 'Initial Deposit (₹)'}</span>
              </label>
              <input
                type="number"
                value={initialSavings}
                onChange={(e) => setInitialSavings(e.target.value)}
                placeholder="500"
                min="0"
                className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 bg-[#14532D] hover:bg-emerald-900 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg transition active:scale-[0.99]"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Check className="w-4 h-4 text-amber-400" />
                <span>{isMr ? 'सदस्य नोंदणी करा (Register Member)' : 'Register Member into SHG'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

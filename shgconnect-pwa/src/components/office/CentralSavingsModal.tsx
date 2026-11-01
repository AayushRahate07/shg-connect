import React, { useState } from 'react';
import { Member, SupportedLanguage, PaymentMode, SettlementStatus, GroupInfo, OfficerSignature, OfficerRole } from '../../types/shg';
import {
  X,
  Banknote,
  ShieldCheck,
  Check,
  Users,
  CheckCircle2,
  QrCode,
  ExternalLink,
  Copy,
  Layers,
  UserCheck
} from 'lucide-react';
import { sound } from '../../services/sound';
import { tts } from '../../services/tts';
import { formatINR } from '../../theme/tokens';
import { generateUpiQrDataUrl } from '../../services/upi';

interface CentralSavingsModalProps {
  group: GroupInfo;
  members: Member[];
  language: SupportedLanguage;
  onClose: () => void;
  onRecordTransaction: (
    memberId: string,
    amount: number,
    type: 'SAVINGS',
    notes?: string,
    paymentMode?: PaymentMode,
    settlementStatus?: SettlementStatus,
    utrReference?: string,
    signatories?: OfficerSignature[]
  ) => void;
}

interface QuorumWitness {
  id: string;
  name: string;
  nameRegional: string;
  role: OfficerRole;
  roleTitleRegional: string;
  verified: boolean;
}

export const CentralSavingsModal: React.FC<CentralSavingsModalProps> = ({
  group,
  members,
  language,
  onClose,
  onRecordTransaction
}) => {
  const isMr = language === 'mr';
  const groupName = group?.nameRegional || group?.name || 'सावित्री महिला बचत गट';
  const defaultRate = group?.monthlyPoolRate || 500;

  // Tabs: 'SINGLE' | 'BULK'
  const [tab, setTab] = useState<'SINGLE' | 'BULK'>('SINGLE');

  // Single Member State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || 'mem-4');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Bulk State (Collect from multiple members at once in meeting)
  const [bulkMemberIds, setBulkMemberIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    members.forEach(m => { map[m.id] = false; });
    return map;
  });

  // Quorum Witnesses (Minimum 2 witnesses required by NRLM/NABARD rules)
  const [witnesses, setWitnesses] = useState<QuorumWitness[]>([
    {
      id: 'mem-1',
      name: 'Kamal-tai Patil',
      nameRegional: 'कमलताई पाटील',
      role: 'TREASURER',
      roleTitleRegional: 'खजिनदार (Treasurer)',
      verified: false
    },
    {
      id: 'mem-2',
      name: 'Sunita-bai Deshmukh',
      nameRegional: 'सुनिताबाई देशमुख',
      role: 'PRESIDENT',
      roleTitleRegional: 'अध्यक्षा (President)',
      verified: false
    },
    {
      id: 'mem-3',
      name: 'Anita-tai Shinde',
      nameRegional: 'अनिताताई शिंदे',
      role: 'SECRETARY',
      roleTitleRegional: 'सचिव (Secretary)',
      verified: false
    }
  ]);

  const verifiedWitnessCount = witnesses.filter(w => w.verified).length;
  const isQuorumSatisfied = verifiedWitnessCount >= 2;

  const handleToggleWitness = (id: string) => {
    sound.playStampSound();
    setWitnesses(prev => prev.map(w => w.id === id ? { ...w, verified: !w.verified } : w));
  };

  const handleToggleBulkMember = (id: string) => {
    setBulkMemberIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedMember = members.find(m => m.id === selectedMemberId) || members[0];
  const selectedBulkCount = Object.values(bulkMemberIds).filter(Boolean).length;
  const totalBulkAmount = selectedBulkCount * defaultRate;

  // Submit Single Member Deposit
  const handleSingleDeposit = async () => {
    if (!isQuorumSatisfied || !selectedMember) return;
    setSubmitting(true);

    const verifiedList = witnesses.filter(w => w.verified);
    const witnessNames = verifiedList.map(w => isMr ? w.nameRegional : w.name).join(', ');
    const signatories: OfficerSignature[] = verifiedList.map(w => ({
      role: w.role,
      signedAt: new Date().toISOString(),
      officerName: isMr ? w.nameRegional : w.name
    }));

    const notes = isMr
      ? `रोख पेटीत जमा (कोरम साक्षीदार: ${witnessNames})`
      : `Cash in Box (Witnessed by: ${witnessNames})`;

    onRecordTransaction(
      selectedMember.id,
      Number(amount) || 0,
      'SAVINGS',
      notes,
      paymentMode,
      paymentMode === 'CASH' ? 'SETTLED_CASH' : 'SETTLED_DIGITAL_UTR',
      undefined,
      signatories
    );

    sound.playCashDepositChime();
    tts.speak(
      isMr
        ? `${selectedMember.nameRegional || selectedMember.name} यांची ₹${amount} बचत पेटीत जमा झाली. कोरम प्रमाणित.`
        : `Recorded savings of ₹${amount} for ${selectedMember.name} with quorum verification.`
    );

    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 300);
  };

  // Submit Bulk Meeting Collection
  const handleBulkDeposit = async () => {
    if (!isQuorumSatisfied || selectedBulkCount === 0) return;
    setSubmitting(true);

    const verifiedList = witnesses.filter(w => w.verified);
    const witnessNames = verifiedList.map(w => isMr ? w.nameRegional : w.name).join(', ');
    const signatories: OfficerSignature[] = verifiedList.map(w => ({
      role: w.role,
      signedAt: new Date().toISOString(),
      officerName: isMr ? w.nameRegional : w.name
    }));

    const notes = isMr
      ? `मासिक बैठक रोख संकलन (कोरम: ${witnessNames})`
      : `Monthly Meeting Cash Pool (Quorum: ${witnessNames})`;

    for (const m of members) {
      if (bulkMemberIds[m.id]) {
        onRecordTransaction(
          m.id,
          defaultRate,
          'SAVINGS',
          notes,
          'CASH',
          'SETTLED_CASH',
          undefined,
          signatories
        );
      }
    }

    sound.playCashDepositChime();
    tts.speak(
      isMr
        ? `एकूण ${selectedBulkCount} सदस्यांची ₹${totalBulkAmount} बचत पेटीत जमा झाली. २ पंचांनी प्रमाणित केले.`
        : `Recorded total savings of ₹${totalBulkAmount} for ${selectedBulkCount} members.`
    );

    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 print:hidden animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="bg-[#14532D] text-white p-4.5 flex justify-between items-center">
          <div className="min-w-0">
            <h3 className="font-black text-sm sm:text-base tracking-tight truncate flex items-center gap-1.5">
              <Banknote className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>{isMr ? 'बचत संकलन व पेटीत जमा' : 'Central Savings Collection'}</span>
            </h3>
            <p className="text-[11px] text-emerald-200 font-semibold truncate">
              {groupName} • {isMr ? 'खजिनदार: कमलताई पाटील' : 'Treasurer: Kamal-tai Patil'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto font-sans">
          
          {/* Mode Switcher: Single Member vs Bulk Meeting Entry */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200 gap-1 text-center">
            <button
              type="button"
              onClick={() => setTab('SINGLE')}
              className={`py-2 px-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                tab === 'SINGLE'
                  ? 'bg-white text-[#14532D] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{isMr ? 'वैयक्तिक सभासद संकलन' : 'Single Member'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('BULK')}
              className={`py-2 px-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                tab === 'BULK'
                  ? 'bg-white text-[#14532D] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isMr ? 'सर्व सभासद एकत्रित संकलन' : 'Bulk Collection'}</span>
            </button>
          </div>

          {/* TAB 1: SINGLE MEMBER SAVINGS COLLECTION */}
          {tab === 'SINGLE' && (
            <div className="space-y-3.5">
              
              {/* Member Picker */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500 mb-1">
                  {isMr ? 'सभासद निवडा:' : 'Select Member:'}
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-700 shadow-2xs"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {isMr ? m.nameRegional : m.name} ({m.phone}) — {isMr ? 'चालू बचत:' : 'Savings:'} ₹{m.totalSavings}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Entry & Quick Chips */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-center space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block">
                  {isMr ? 'जमा करायची रोख रक्कम' : 'Collection Amount'}
                </span>
                <div className="flex items-center justify-center gap-1 text-2xl font-black text-stone-900">
                  <span className="text-lg text-stone-400">₹</span>
                  <input
                    type="number"
                    value={amount}
                    placeholder="500"
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-32 text-center bg-white border border-stone-300 rounded-xl py-1 text-2xl font-black text-[#14532D] focus:border-emerald-700 outline-none"
                  />
                </div>
                <div className="flex justify-center gap-1.5 pt-0.5">
                  {[500, 1000, 1500, 2000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition ${
                        amount === val
                          ? 'bg-[#14532D] text-white border-[#14532D]'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode (Cash in Box vs UPI) */}
              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-xs font-bold text-stone-700">
                  {isMr ? 'पेमेंट प्रकार:' : 'Payment Mode:'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                      paymentMode === 'CASH'
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    {isMr ? '💵 रोख पेटीत जमा' : 'Cash in Box'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI_INTENT')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                      paymentMode === 'UPI_INTENT'
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    {isMr ? '📱 ऑनलाईन UPI' : 'Online UPI'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BULK MEETING COLLECTION */}
          {tab === 'BULK' && (
            <div className="space-y-3">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-left">
                <div className="flex items-center justify-between text-xs font-black text-amber-950">
                  <span>{isMr ? 'बैठकीत उपस्थित सभासद' : 'Members Present'}</span>
                  <span className="bg-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                    {selectedBulkCount} / {members.length} {isMr ? 'सभासद' : 'Members'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 font-medium mt-0.5">
                  {isMr
                    ? `प्रत्येक सभासदाची ₹${defaultRate} बचत पेटीत नोंदवली जाईल. एकूण संकलन: ₹${totalBulkAmount}`
                    : `Each selected member will contribute ₹${defaultRate}. Total Pool: ₹${totalBulkAmount}`}
                </p>
              </div>

              {/* Members Checklist */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 bg-stone-50 rounded-xl border border-stone-200">
                {members.map(m => {
                  const isChecked = !!bulkMemberIds[m.id];
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleBulkMember(m.id)}
                      className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer select-none transition ${
                        isChecked ? 'bg-emerald-50 border border-emerald-300' : 'bg-white border border-stone-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          isChecked ? 'bg-[#14532D] text-white' : 'border border-stone-400'
                        }`}>
                          {isChecked && '✓'}
                        </span>
                        <span className="font-bold text-stone-900">{isMr ? m.nameRegional : m.name}</span>
                      </div>
                      <span className="font-black text-[#14532D]">₹{defaultRate}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* QUORUM WITNESS VERIFICATION SECTION (MANDATORY IN SHGS)    */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{isMr ? 'कोरम पडताळणी (Quorum Witness Verification)' : 'Quorum Verification'}</span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                isQuorumSatisfied
                  ? 'bg-emerald-200 text-emerald-950 border-emerald-400 font-extrabold'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {verifiedWitnessCount}/2 {isMr ? 'साक्षीदार पूर्ण' : 'Witnesses'}
              </span>
            </div>
            <p className="text-[10px] text-emerald-800 font-medium">
              {isMr
                ? 'पेटीत रोख रक्कम जमा करण्यासाठी बैठकीतील किमान २ साक्षीदारांची स्वाक्षरी/पडताळणी बंधनकारक आहे.'
                : 'At least 2 quorum officers must verify receipt before cash is logged into the group ledger.'}
            </p>

            {/* Witnesses List */}
            <div className="space-y-1.5 pt-1">
              {witnesses.map(w => (
                <div
                  key={w.id}
                  onClick={() => handleToggleWitness(w.id)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                    w.verified
                      ? 'bg-white border-emerald-400 shadow-2xs'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                      w.verified ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {w.verified ? '✓' : w.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-xs font-black text-stone-900 leading-tight">
                        {isMr ? w.nameRegional : w.name}
                      </p>
                      <span className="text-[10px] font-bold text-stone-500">
                        {w.roleTitleRegional}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    w.verified
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}>
                    {w.verified ? (isMr ? 'प्रमाणित ✓' : 'Verified ✓') : (isMr ? 'साक्षीदार स्वाक्षरी' : 'Sign')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            {tab === 'SINGLE' ? (
              <button
                type="button"
                onClick={handleSingleDeposit}
                disabled={!isQuorumSatisfied || submitting}
                className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-40 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <Banknote className="w-4 h-4 text-amber-400" />
                <span>
                  {isQuorumSatisfied
                    ? (isMr ? `${selectedMember.nameRegional} यांची ₹${amount} बचत नोंदवा` : `Record ₹${amount} for ${selectedMember.name}`)
                    : (isMr ? 'किमान २ साक्षीदारांची पडताळणी करा' : 'Need 2 Quorum Witnesses')}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBulkDeposit}
                disabled={!isQuorumSatisfied || selectedBulkCount === 0 || submitting}
                className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-40 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>
                  {isQuorumSatisfied
                    ? (isMr ? `सर्व ₹${totalBulkAmount} रोख बचत पेटीत जमा नोंदवा` : `Collect Total ₹${totalBulkAmount} in Box`)
                    : (isMr ? 'किमान २ साक्षीदारांची पडताळणी करा' : 'Need 2 Quorum Witnesses')}
                </span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Member, SupportedLanguage, PaymentMode, SettlementStatus, GroupInfo, OfficerSignature, OfficerRole } from '../types/shg';
import { generateUpiQrDataUrl, buildUpiIntentUrl } from '../services/upi';
import {
  X,
  QrCode,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Banknote,
  ShieldCheck,
  Users,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { tts } from '../services/tts';
import { sound } from '../services/sound';
import { eventBus } from '../services/eventBus';

interface UpiPaymentModalProps {
  member: Member;
  amount: number;
  paymentType: 'SAVINGS' | 'EMI_REPAYMENT';
  shgVpa?: string;
  language: SupportedLanguage;
  onClose: () => void;
  onPaymentConfirmed: (
    amount: number,
    type: 'SAVINGS' | 'EMI_REPAYMENT',
    paymentMode?: PaymentMode,
    settlementStatus?: SettlementStatus,
    utrReference?: string,
    signatories?: OfficerSignature[]
  ) => void;
  group?: GroupInfo | null;
  members?: Member[];
}

interface QuorumWitness {
  id: string;
  name: string;
  nameRegional: string;
  role: OfficerRole | 'MEMBER';
  roleTitle: string;
  roleTitleRegional: string;
  verified: boolean;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  member,
  amount: initialAmount,
  paymentType,
  shgVpa = 'savitri.shg@upi',
  language,
  onClose,
  onPaymentConfirmed,
  group,
  members = []
}) => {
  const isMr = language === 'mr';
  const groupName = group?.nameRegional || group?.name || (isMr ? 'सावित्री महिला बचत गट' : 'Savitri Mahila Bachat Gat');
  const groupCode = group?.shgCode || 'SHG-MH-SAT-2024-0089';

  // Mode: 'CASH' (Default in rural SHG meetings) | 'UPI'
  const [activeMode, setActiveMode] = useState<PaymentMode>('CASH');

  const [amount, setAmount] = useState<number>(initialAmount || 0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [utrInput, setUtrInput] = useState<string>('');
  const [utrError, setUtrError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Quorum Witnesses for Cash Verification (NABARD / NRLM Mandate: Min 2 Witnesses)
  const [witnesses, setWitnesses] = useState<QuorumWitness[]>([
    {
      id: 'mem-1',
      name: 'Kamal-tai Patil',
      nameRegional: 'कमलताई पाटील',
      role: 'TREASURER',
      roleTitle: 'Treasurer',
      roleTitleRegional: 'खजिनदार',
      verified: false
    },
    {
      id: 'mem-2',
      name: 'Sunita-bai Deshmukh',
      nameRegional: 'सुनिताबाई देशमुख',
      role: 'PRESIDENT',
      roleTitle: 'President',
      roleTitleRegional: 'अध्यक्षा',
      verified: false
    },
    {
      id: 'mem-3',
      name: 'Anita-tai Shinde',
      nameRegional: 'अनिताताई शिंदे',
      role: 'SECRETARY',
      roleTitle: 'Secretary',
      roleTitleRegional: 'सचिव',
      verified: false
    }
  ]);

  const verifiedWitnessCount = witnesses.filter(w => w.verified).length;
  const isQuorumSatisfied = verifiedWitnessCount >= 2;

  const note = paymentType === 'EMI_REPAYMENT'
    ? `EMI Repayment: ${member.name} (${groupName})`
    : `Monthly Savings: ${member.name} (${groupName})`;

  // Toggle witness verification
  const handleToggleWitness = (id: string) => {
    sound.playStampSound();
    setWitnesses(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, verified: !w.verified };
      }
      return w;
    }));
  };

  useEffect(() => {
    async function loadQr() {
      const url = await generateUpiQrDataUrl({
        vpa: shgVpa,
        payeeName: group?.name || 'Savitri Mahila Bachat Gat',
        amount: amount,
        transactionNote: note
      });
      setQrCodeUrl(url);
    }
    if (activeMode === 'UPI_INTENT') {
      loadQr();
    }
  }, [amount, shgVpa, note, activeMode, group]);

  const upiIntentUrl = buildUpiIntentUrl({
    vpa: shgVpa,
    payeeName: group?.name || 'Savitri Mahila Bachat Gat',
    amount: amount,
    transactionNote: note
  });

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(shgVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. CASH DEPOSIT CONFIRMATION WITH QUORUM WITNESSING
  const handleConfirmCashDeposit = async () => {
    if (!isQuorumSatisfied) return;

    setSubmitting(true);
    const verifiedList = witnesses.filter(w => w.verified);
    const signatories: OfficerSignature[] = verifiedList.map(w => ({
      role: w.role as OfficerRole,
      signedAt: new Date().toISOString(),
      officerName: isMr ? w.nameRegional : w.name
    }));

    const witnessNames = verifiedList.map(w => isMr ? w.nameRegional : w.name).join(', ');
    const auditNotes = isMr
      ? `रोख जमा (कोरम साक्षीदार: ${witnessNames})`
      : `Cash in Box (Witnessed by: ${witnessNames})`;

    // Emit event
    await eventBus.emit(
      {
        type: 'SAVINGS_RECORDED',
        payload: {
          memberId: member.id,
          amount,
          paymentMode: 'CASH',
          settlementStatus: 'SETTLED_CASH'
        }
      },
      {
        shgId: groupCode,
        actorId: member.id,
        actorRole: 'TREASURER',
        deviceId: 'dev-pwa-local'
      }
    );

    sound.playCashDepositChime();
    tts.speak(
      isMr
        ? `${member.nameRegional || member.name} यांची ₹${amount} रोख बचत पेटीत जमा झाली. २ पंचांनी प्रमाणित केले.`
        : `Cash deposit of ₹${amount} for ${member.name} verified by quorum.`
    );

    setTimeout(() => {
      onPaymentConfirmed(amount, paymentType, 'CASH', 'SETTLED_CASH', auditNotes, signatories);
      onClose();
    }, 400);
  };

  // 2. UPI PAYMENT CONFIRMATION WITH 12-CHAR UTR
  const handleConfirmUtr = async () => {
    const cleanUtr = utrInput.trim();
    const utrRegex = /^[a-zA-Z0-9]{12}$/;
    if (!utrRegex.test(cleanUtr)) {
      setUtrError(
        isMr
          ? 'कृपया १२-अंकी वैध बँक संदर्भ (UTR) क्रमांक प्रविष्ट करा'
          : 'Please enter a valid 12-character alphanumeric UTR reference number'
      );
      return;
    }

    setUtrError('');
    setSubmitting(true);

    await eventBus.emit(
      {
        type: 'SAVINGS_RECORDED',
        payload: {
          memberId: member.id,
          amount,
          paymentMode: 'UPI_INTENT',
          settlementStatus: 'SETTLED_DIGITAL_UTR',
          utrReference: cleanUtr
        }
      },
      {
        shgId: groupCode,
        actorId: member.id,
        actorRole: 'TREASURER',
        deviceId: 'dev-pwa-local'
      }
    );

    sound.playStampSound();
    tts.speakTransaction(member.name, member.nameRegional, amount, paymentType);

    setTimeout(() => {
      onPaymentConfirmed(amount, paymentType, 'UPI_INTENT', 'SETTLED_DIGITAL_UTR', cleanUtr);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 print:hidden animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
        
        {/* Modal Header */}
        <div className="bg-[#14532D] text-white p-4.5 flex justify-between items-center">
          <div className="min-w-0">
            <h3 className="font-black text-sm sm:text-base tracking-tight truncate">
              {paymentType === 'EMI_REPAYMENT'
                ? (isMr ? 'कर्ज हप्ता जमा करा' : 'Repay Loan EMI')
                : (isMr ? 'बचत जमा करा' : 'Deposit Monthly Savings')}
            </h3>
            <p className="text-[11px] text-emerald-200 font-semibold truncate">
              {language === 'mr' ? member.nameRegional : member.name} • {groupName}
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
          
          {/* Amount Selector Header */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-center space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block">
              {isMr ? 'जमा करायची रक्कम' : 'Deposit Amount'}
            </span>
            <div className="flex items-center justify-center gap-1 text-3xl font-black text-stone-900">
              <span className="text-xl text-stone-400">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-36 text-center bg-white border border-stone-300 rounded-xl py-1 text-2xl font-black text-[#14532D] focus:border-emerald-700 outline-none"
              />
            </div>
            {/* Quick Chips */}
            <div className="flex justify-center gap-1.5 pt-1">
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

          {/* Payment Mode Selector Tabs (Cash in Box vs UPI) */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200 gap-1 text-center">
            <button
              type="button"
              onClick={() => setActiveMode('CASH')}
              className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                activeMode === 'CASH'
                  ? 'bg-white text-[#14532D] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Banknote className="w-4 h-4 text-emerald-700" />
              <span>{isMr ? 'रोख पेटीत जमा' : 'Cash in Box'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('UPI_INTENT')}
              className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                activeMode === 'UPI_INTENT'
                  ? 'bg-white text-[#14532D] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>{isMr ? 'ऑनलाईन UPI / QR' : 'Online UPI / QR'}</span>
            </button>
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* MODE 1: CASH DEPOSIT WITH QUORUM WITNESS VERIFICATION     */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeMode === 'CASH' ? (
            <div className="space-y-3.5">
              
              {/* Quorum Notice Header */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>{isMr ? 'कोरम पडताळणी (Quorum Witness)' : 'Quorum Witness Verification'}</span>
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    isQuorumSatisfied
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {verifiedWitnessCount}/2 {isMr ? 'साक्षीदार पूर्ण' : 'Witnesses'}
                  </span>
                </div>
                <p className="text-[10px] text-amber-900 font-medium leading-relaxed">
                  {isMr
                    ? 'गावातील बैठकीत रोख रक्कम पेटीत जमा करताना पारदर्शकतेसाठी किमान २ पदाधिकाऱ्यांची / पंचांची पडताळणी आवश्यक आहे.'
                    : 'To record physical cash in the SHG meeting box, at least 2 quorum officers must verify receipt.'}
                </p>
              </div>

              {/* Witness Selection Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 block text-left">
                  {isMr ? 'उपस्थित साक्षीदार निवडा (किमान २):' : 'Select Present Witnesses (Min 2):'}
                </span>
                {witnesses.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => handleToggleWitness(w.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                      w.verified
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        w.verified ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {w.verified ? <Check className="w-3.5 h-3.5" /> : w.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-stone-900 leading-tight">
                          {isMr ? w.nameRegional : w.name}
                        </p>
                        <span className="text-[10px] font-bold text-stone-500">
                          {isMr ? w.roleTitleRegional : w.roleTitle}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      w.verified
                        ? 'bg-emerald-700 text-white font-black'
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {w.verified ? (<span className="inline-flex items-center gap-1"><span>{isMr ? 'प्रमाणित' : 'Verified'}</span><Check className="w-2.5 h-2.5" /></span>) : (isMr ? 'पडताळणी करा' : 'Sign')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cash Deposit Action Button */}
              <button
                type="button"
                onClick={handleConfirmCashDeposit}
                disabled={!isQuorumSatisfied || submitting}
                className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-40 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <Banknote className="w-4 h-4 text-amber-400" />
                <span>
                  {isQuorumSatisfied
                    ? (isMr ? `₹${amount} पेटीत रोख जमा नोंदवा` : `Record ₹${amount} Cash in Box`)
                    : (isMr ? 'किमान २ साक्षीदार निवडा' : 'Need Min 2 Witnesses')}
                </span>
              </button>

            </div>
          ) : (
            /* ═════════════════════════════════════════════════════════ */
            /* MODE 2: DYNAMIC UPI QR & 12-CHAR UTR BANK VERIFICATION    */
            /* ═════════════════════════════════════════════════════════ */
            <div className="space-y-3.5 text-center">
              
              {/* QR Code Card */}
              {qrCodeUrl ? (
                <div className="p-3 bg-white border-2 border-emerald-600/30 rounded-2xl shadow-inner max-w-[190px] mx-auto">
                  <img src={qrCodeUrl} alt="UPI QR Code" className="w-40 h-40 rounded-lg mx-auto" />
                  <span className="text-[10px] text-stone-500 font-bold mt-1 block">
                    PhonePe • Google Pay • Paytm
                  </span>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-stone-400 text-xs">
                  {isMr ? 'QR कोड तयार होत आहे...' : 'Generating Dynamic QR...'}
                </div>
              )}

              {/* VPA ID Copy Pill */}
              <div className="bg-stone-50 rounded-xl p-2.5 flex items-center justify-between text-xs border border-stone-200">
                <span className="font-mono text-stone-700 truncate font-bold text-[11px]">UPI: {shgVpa}</span>
                <button
                  type="button"
                  onClick={handleCopyVpa}
                  className="flex items-center gap-1 text-emerald-800 font-bold px-2 py-0.5 bg-emerald-100 rounded-md transition hover:bg-emerald-200"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Direct UPI Intent Button */}
              <a
                href={upiIntentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-stone-900 hover:bg-black text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>{isMr ? 'UPI ॲपमध्ये उघडा' : 'Open in PhonePe / GPay'}</span>
              </a>

              {/* UTR Input Section */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-left space-y-2">
                <label className="block text-[11px] font-black text-emerald-950">
                  {isMr ? 'बँक संदर्भ क्रमांक (UTR - १२ अक्षरे)' : 'Bank UTR Reference (12 Characters)'}
                </label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="उदा. 425619083412"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-black text-stone-900 outline-none uppercase tracking-wider"
                />
                {utrError && (
                  <p className="text-[10px] font-bold text-rose-700">{utrError}</p>
                )}
                <button
                  type="button"
                  onClick={handleConfirmUtr}
                  disabled={submitting}
                  className="w-full bg-[#14532D] hover:bg-emerald-900 text-white font-black py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isMr ? 'UTR संदर्भ नोंदवा व जमा करा' : 'Confirm UTR & Deposit'}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Member, SupportedLanguage, PaymentMode, SettlementStatus } from '../types/shg';
import { generateUpiQrDataUrl, buildUpiIntentUrl } from '../services/upi';
import { X, QrCode, ExternalLink, CheckCircle2, Copy, Check, Banknote, ShieldAlert } from 'lucide-react';
import { tts } from '../services/tts';
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
    utrReference?: string
  ) => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  member,
  amount: initialAmount,
  paymentType,
  shgVpa = 'mahila.shg@upi',
  language,
  onClose,
  onPaymentConfirmed
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [utrInput, setUtrInput] = useState<string>('');
  const [utrError, setUtrError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const note = paymentType === 'EMI_REPAYMENT' ? `EMI Repayment by ${member.name}` : `Monthly Savings Deposit by ${member.name}`;

  useEffect(() => {
    async function loadQr() {
      const url = await generateUpiQrDataUrl({
        vpa: shgVpa,
        payeeName: 'Mahila Pragati SHG',
        amount: amount,
        transactionNote: note
      });
      setQrCodeUrl(url);
    }
    loadQr();
  }, [amount, shgVpa, note]);

  const upiIntentUrl = buildUpiIntentUrl({
    vpa: shgVpa,
    payeeName: 'Mahila Pragati SHG',
    amount: amount,
    transactionNote: note
  });

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(shgVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmUtr = async () => {
    const cleanUtr = utrInput.trim();
    const utrRegex = /^[a-zA-Z0-9]{12}$/;
    if (!utrRegex.test(cleanUtr)) {
      setUtrError(
        language === 'mr'
          ? 'कृपया १२-अंकी वैध बँक संदर्भ (UTR) क्रमांक प्रविष्ट करा'
          : 'Please enter a valid 12-character alphanumeric UTR reference number'
      );
      return;
    }

    setUtrError('');
    setSubmitting(true);

    // Emit SAVINGS_RECORDED event via audit-first eventBus
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
        shgId: 'SHG-MH-2024-884',
        actorId: member.id,
        actorRole: 'TREASURER',
        deviceId: 'dev-pwa-local'
      }
    );

    tts.speakTransaction(member.name, member.nameRegional, amount, paymentType);

    setTimeout(() => {
      onPaymentConfirmed(amount, paymentType, 'UPI_INTENT', 'SETTLED_DIGITAL_UTR', cleanUtr);
      onClose();
    }, 300);
  };

  const handleRecordAsCashInBox = async () => {
    setSubmitting(true);

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
        shgId: 'SHG-MH-2024-884',
        actorId: member.id,
        actorRole: 'TREASURER',
        deviceId: 'dev-pwa-local'
      }
    );

    tts.speakTransaction(member.name, member.nameRegional, amount, paymentType);

    setTimeout(() => {
      onPaymentConfirmed(amount, paymentType, 'CASH', 'SETTLED_CASH');
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">
              {language === 'mr' ? 'UPI द्वारे ऑनलाईन / QR पेमेंट' : 'Dynamic UPI Payment QR'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 text-center space-y-4 max-h-[85vh] overflow-y-auto">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              {paymentType === 'EMI_REPAYMENT' ? 'EMI Repayment' : 'Savings Deposit'}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {language === 'mr' ? member.nameRegional : member.name}
            </div>
          </div>

          {/* Editable Amount */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 inline-block w-full max-w-xs">
            <label className="block text-[11px] font-bold text-amber-900 mb-1">
              {language === 'mr' ? 'पेमेंट रक्कम (₹)' : 'Payment Amount (₹)'}
            </label>
            <div className="flex items-center justify-center space-x-1 text-2xl font-black text-emerald-800">
              <span>₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-32 text-center bg-white border border-amber-300 rounded-xl py-1 text-xl font-extrabold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Step 1: QR Code Canvas rendering */}
          {qrCodeUrl ? (
            <div className="flex flex-col items-center justify-center p-3 bg-white border-2 border-emerald-600/30 rounded-2xl shadow-inner max-w-[200px] mx-auto">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-44 h-44 rounded-lg" />
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Scan with PhonePe, Google Pay, Paytm
              </span>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
              Generating QR Code...
            </div>
          )}

          {/* VPA Details & Copy */}
          <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs border border-slate-200">
            <span className="font-mono text-slate-700 truncate font-semibold">UPI ID: {shgVpa}</span>
            <button
              onClick={handleCopyVpa}
              className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 bg-emerald-100/80 rounded-lg transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Mobile Direct Intent App Button */}
          <a
            href={upiIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow"
          >
            <ExternalLink className="w-4 h-4 text-amber-400" />
            <span>{language === 'mr' ? 'UPI ॲपमध्ये उघडा (Open UPI App)' : 'Open in PhonePe / GPay App'}</span>
          </a>

          {/* Step 2: UTR Reference Capture (12-char validation) */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-left space-y-2">
            <label className="block text-xs font-extrabold text-emerald-950">
              {language === 'mr' ? 'बँक संदर्भ क्रमांक / UTR Reference (12 Characters)' : 'Bank Reference Number / UTR (12 Alphanumeric)'}
            </label>
            <input
              type="text"
              maxLength={12}
              placeholder="e.g. 425619083412"
              value={utrInput}
              onChange={(e) => setUtrInput(e.target.value.toUpperCase())}
              className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600 uppercase tracking-wider"
            />
            {utrError && (
              <p className="text-[11px] font-bold text-rose-700">{utrError}</p>
            )}
            <button
              onClick={handleConfirmUtr}
              disabled={submitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow transition"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>{language === 'mr' ? 'UTR संदर्भ नोंदवा (Confirm UTR Reference)' : 'Confirm UTR Reference'}</span>
            </button>
          </div>

          {/* Step 3: Fallback Cash Path */}
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={handleRecordAsCashInBox}
              disabled={submitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-black py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow transition"
            >
              <Banknote className="w-4 h-4 text-amber-950" />
              <span>{language === 'mr' ? 'पेटीत रोख जमा करा (Record as Cash in Box)' : 'Record as Cash in Box'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


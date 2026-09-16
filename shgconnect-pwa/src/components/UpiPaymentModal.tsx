import React, { useState, useEffect } from 'react';
import { Member, SupportedLanguage } from '../types/shg';
import { generateUpiQrDataUrl, buildUpiIntentUrl } from '../services/upi';
import { X, QrCode, ExternalLink, CheckCircle2, Copy, Check } from 'lucide-react';
import { tts } from '../services/tts';

interface UpiPaymentModalProps {
  member: Member;
  amount: number;
  paymentType: 'SAVINGS' | 'EMI_REPAYMENT';
  shgVpa?: string;
  language: SupportedLanguage;
  onClose: () => void;
  onPaymentConfirmed: (amount: number, type: 'SAVINGS' | 'EMI_REPAYMENT') => void;
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

  const handleConfirmLocalRecord = () => {
    setSubmitting(true);
    // TTS voice confirmation
    tts.speakTransaction(member.name, member.nameRegional, amount, paymentType);

    setTimeout(() => {
      onPaymentConfirmed(amount, paymentType);
      onClose();
    }, 400);
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
        <div className="p-6 text-center space-y-4">
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

          {/* QR Code Canvas rendering */}
          {qrCodeUrl ? (
            <div className="flex flex-col items-center justify-center p-3 bg-white border-2 border-emerald-600/30 rounded-2xl shadow-inner max-w-[220px] mx-auto">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48 rounded-lg" />
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Scan with PhonePe, Google Pay, Paytm
              </span>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
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

          {/* Offline Manual Confirmation Action */}
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={handleConfirmLocalRecord}
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg transition transform active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {language === 'mr' ? 'स्थानिक नोंदवहीत जमा करा (Record Offline)' : 'Record Transaction Offline'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { SupportedLanguage } from '../types/shg';
import { sound } from '../services/sound';
import { hybridOtpService } from '../services/otpService';
import { ShieldCheck, CheckCircle2, X, Send, Smartphone, Wifi, WifiOff, Key, RefreshCw } from 'lucide-react';

interface OtpAttendanceModalProps {
  memberId: string;
  memberName: string;
  memberPhone?: string;
  language: SupportedLanguage;
  onClose: () => void;
  onVerified: (memberId: string) => void;
}

export const OtpAttendanceModal: React.FC<OtpAttendanceModalProps> = ({
  memberId,
  memberName,
  memberPhone = '',
  language,
  onClose,
  onVerified
}) => {
  const isMr = language === 'mr';
  const isHi = language === 'hi';

  const cleanPhone = (memberPhone || '').replace(/\D/g, '').slice(-10);
  const initialMasked = cleanPhone.length === 10
    ? `+91 ${cleanPhone.slice(0, 2)}•••••${cleanPhone.slice(-3)}`
    : memberPhone || 'No Phone';

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : false);
  const [activeMode, setActiveMode] = useState<'SMS' | 'OFFLINE_PIN'>('SMS');
  const [phoneMasked, setPhoneMasked] = useState<string>(initialMasked);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [verified, setVerified] = useState<boolean>(false);
  const [verificationMethod, setVerificationMethod] = useState<string>('');

  useEffect(() => {
    setPhoneMasked(initialMasked);
  }, [memberPhone]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setActiveMode('OFFLINE_PIN');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial send request
    handleRequestOtp();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [memberId, memberPhone]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRequestOtp = async () => {
    if (cooldown > 0) return;
    setSending(true);
    setError('');

    const targetPhone = cleanPhone || '9823011223';

    try {
      const result = await hybridOtpService.requestOtp(targetPhone, memberId);
      if (result.phoneMasked) setPhoneMasked(result.phoneMasked);
      if (result.devOtp) setDevOtpHint(result.devOtp);

      if (result.mode === 'OFFLINE_FALLBACK' || !isOnline) {
        setActiveMode('OFFLINE_PIN');
      } else {
        setActiveMode('SMS');
        setCooldown(45); // 45 seconds resend cooldown
      }
    } catch (err: any) {
      console.warn('Failed to dispatch SMS, falling back to offline:', err);
      setActiveMode('OFFLINE_PIN');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.length < 4) {
      setError(isMr ? 'कृपया वैध ४ ते ६ अंकी कोड प्रविष्ट करा.' : 'Please enter a valid 4 to 6 digit code.');
      return;
    }

    const targetPhone = cleanPhone || '9823011223';
    const mode = activeMode === 'SMS' && isOnline ? 'ONLINE_SMS' : 'OFFLINE_FALLBACK';
    const result = await hybridOtpService.verifyOtp(targetPhone, enteredOtp, memberId, mode);

    if (result.verified) {
      sound.playStampSound();
      setVerified(true);
      setVerificationMethod(result.method);
      setTimeout(() => {
        onVerified(memberId);
        onClose();
      }, 1200);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-center">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <h3 className="font-extrabold text-sm text-stone-900">
              {isMr ? 'हायब्रिड OTP व हजेरी प्रमाणीकरण' : 'Hybrid OTP Verification'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector & Network Badge */}
        <div className="flex items-center justify-between bg-stone-50 p-2 rounded-2xl border border-stone-200 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-700">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online (Telecom SMS)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline (PIN/HMAC)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveMode('SMS')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition ${
                activeMode === 'SMS' ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              SMS
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('OFFLINE_PIN')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition ${
                activeMode === 'OFFLINE_PIN' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              Offline PIN
            </button>
          </div>
        </div>

        {verified ? (
          <div className="py-6 space-y-3 animate-fadeIn">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-black text-emerald-950 text-base">
              {isMr ? 'हजेरी प्रमाणित झाली!' : 'Attendance Verified!'}
            </h4>
            <p className="text-xs text-stone-600 font-medium">
              {memberName} · Verified via {verificationMethod}
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {/* Member Card */}
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider block">
                  {isMr ? 'सदस्य नाव' : 'Member'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">{phoneMasked}</span>
              </div>
              <span className="text-sm font-black text-emerald-950 block">
                {memberName}
              </span>

              {activeMode === 'SMS' ? (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {isMr ? 'SMS द्वारे OTP पाठवला गेला' : 'OTP dispatched via SMS'}
                  </span>
                  <button
                    type="button"
                    disabled={sending || cooldown > 0}
                    onClick={handleRequestOtp}
                    className="text-[11px] font-bold text-emerald-900 hover:underline disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${sending ? 'animate-spin' : ''}`} />
                    <span>{cooldown > 0 ? `${cooldown}s` : (isMr ? 'पुन्हा पाठवा' : 'Resend')}</span>
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-amber-800 font-medium pt-1">
                  {isMr ? 'ऑफलाइन सदस्य PIN किंवा HMAC कोड वापरा' : 'Enter Member Secret PIN or Passbook HMAC'}
                </p>
              )}
            </div>

            {/* Dev Simulator OTP Hint for local testing */}
            {devOtpHint && (
              <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-[11px] text-amber-900 font-medium flex items-center justify-between">
                <span>{activeMode === 'SMS' ? 'Simulated SMS Code:' : 'Offline Handshake Code:'}</span>
                <strong className="font-mono font-black text-xs bg-amber-200 px-2 py-0.5 rounded">{devOtpHint}</strong>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 text-left">
                {activeMode === 'SMS'
                  ? (isMr ? 'फोनवर आलेला ६-अंकी OTP प्रविष्ट करा' : 'Enter 6-Digit SMS OTP')
                  : (isMr ? 'सदस्य गोपनीय ४-अंकी PIN किंवा कोड प्रविष्ट करा' : 'Enter 4-Digit Member PIN / Passbook Code')}
              </label>
              <input
                type="text"
                value={enteredOtp}
                onChange={(e) => {
                  setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                maxLength={6}
                placeholder={activeMode === 'SMS' ? '••••••' : '••••'}
                autoFocus
                className="w-full text-center text-2xl font-black font-mono tracking-widest bg-[#F7F4EC] border border-[#E2DDD3] rounded-2xl py-3 text-stone-900 outline-none focus:border-emerald-700"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enteredOtp.length < 4}
              className="w-full bg-[#14532D] hover:bg-emerald-900 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow transition min-h-[48px]"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{isMr ? 'हजेरी प्रमाणित करा (Verify)' : 'Verify Presence'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

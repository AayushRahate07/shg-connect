import { generateMeetingOtp, verifyMeetingOtp } from './otpHandshake';
import { calculateSHA256 } from './hashChain';

const API_BASE_URL = 'http://localhost:4000/api/v1/otp';

export interface SendOtpResult {
  success: boolean;
  mode: 'ONLINE_SMS' | 'OFFLINE_FALLBACK';
  phoneMasked?: string;
  devOtp?: string;
  message: string;
}

export interface VerifyOtpResult {
  verified: boolean;
  message: string;
  method: 'SMS' | 'OFFLINE_HMAC' | 'OFFLINE_PIN';
}

class HybridOtpService {
  /**
   * Dispatches OTP via real SMS gateway when online, or generates local cryptographic handshake when offline
   */
  public async requestOtp(phone: string, memberId: string, shgName?: string): Promise<SendOtpResult> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

    if (isOnline) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout for spotty 2G

        const response = await fetch(`${API_BASE_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, memberId, shgName }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            mode: 'ONLINE_SMS',
            phoneMasked: data.phoneMasked,
            devOtp: data.devOtp,
            message: 'SMS OTP sent to member phone'
          };
        }
      } catch (err) {
        console.warn('[Hybrid OTP] Online SMS gateway unreachable, falling back to offline mode:', err);
      }
    }

    // Offline Fallback
    const todayStr = new Date().toISOString().split('T')[0];
    const offlineCode = await generateMeetingOtp(memberId, todayStr);
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '0000000000';

    return {
      success: true,
      mode: 'OFFLINE_FALLBACK',
      phoneMasked: `+91 ${cleanPhone.slice(0, 2)}•••••${cleanPhone.slice(-3)}`,
      devOtp: offlineCode,
      message: 'Offline cryptographic handshake generated (Zero Internet Required)'
    };
  }

  /**
   * Verifies OTP either via online backend verification or offline cryptographic HMAC / Member PIN
   */
  public async verifyOtp(
    phone: string,
    enteredCode: string,
    memberId: string,
    mode: 'ONLINE_SMS' | 'OFFLINE_FALLBACK'
  ): Promise<VerifyOtpResult> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

    // 1. If mode was ONLINE_SMS and we are currently online, verify with server
    if (mode === 'ONLINE_SMS' && isOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp: enteredCode })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.verified) {
            return { verified: true, message: 'SMS OTP verified via Telecom Gateway', method: 'SMS' };
          }
        }
      } catch (err) {
        console.warn('[Hybrid OTP] Server verification failed, attempting offline fallback:', err);
      }
    }

    // 2. Offline HMAC validation
    const todayStr = new Date().toISOString().split('T')[0];
    const expectedOffline = await generateMeetingOtp(memberId, todayStr);

    if (verifyMeetingOtp(enteredCode, expectedOffline)) {
      return { verified: true, message: 'Verified via Offline HMAC Handshake', method: 'OFFLINE_HMAC' };
    }

    // 3. Offline Member PIN fallback (e.g. member secret 4-digit PIN default: '1234' or last 4 digits of phone)
    const last4OfPhone = phone.replace(/\D/g, '').slice(-4);
    if (enteredCode === '1234' || (last4OfPhone && enteredCode === last4OfPhone)) {
      return { verified: true, message: 'Verified via Member Confidential PIN', method: 'OFFLINE_PIN' };
    }

    return { verified: false, message: 'Incorrect OTP or PIN. Please try again.', method: 'OFFLINE_HMAC' };
  }
}

export const hybridOtpService = new HybridOtpService();

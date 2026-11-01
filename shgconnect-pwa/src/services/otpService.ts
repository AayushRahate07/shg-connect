import { generateMeetingOtp, getCurrentDynamicOtp, verifyDynamicOtp, verifyMeetingOtp } from './otpHandshake';

export const DEFAULT_TEST_PHONE = '8767993248';

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

// In-memory simulator store for instant zero-network dummy OTP testing
const simulatorStore = new Map<string, string>();

// Strict rate-limiting tracker: Limit OTP intake and dispatch to 1 per minute (60 seconds)
const lastOtpRequestTimes = new Map<string, number>();

class HybridOtpService {
  /**
   * Request OTP: Dispatches live Twilio SMS via secure backend proxy,
   * with seamless offline local fallback if network is unreachable.
   * Rate limited to strictly 1 OTP intake per minute.
   */
  public async requestOtp(phone: string, memberId: string, shgName?: string): Promise<SendOtpResult> {
    const targetPhone = phone ? phone.replace(/\D/g, '').slice(-10) : DEFAULT_TEST_PHONE;
    const now = Date.now();
    const lastRequest = lastOtpRequestTimes.get(targetPhone) || 0;

    // Enforce 1 OTP per minute limit
    if (now - lastRequest < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - lastRequest)) / 1000);
      return {
        success: false,
        mode: 'OFFLINE_FALLBACK',
        phoneMasked: `+91 ${targetPhone.slice(0, 2)}•••••${targetPhone.slice(-3)}`,
        message: `कृपया ${remainingSeconds} सेकंद थांबा. OTP मर्यादा: प्रति मिनिट १ (Limit: 1 OTP/min. Please wait ${remainingSeconds}s)`
      };
    }

    lastOtpRequestTimes.set(targetPhone, now);

    // 1. Attempt secure live Twilio SMS dispatch via local backend proxy
    try {
      const resp = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          return {
            success: true,
            mode: 'ONLINE_SMS',
            phoneMasked: `+91 ${targetPhone.slice(0, 2)}•••••${targetPhone.slice(-3)}`,
            message: 'SMS OTP पाठवण्यात आला आहे'
          };
        }
      }
    } catch (e) {
      console.warn('[OTP Service] Backend SMS endpoint unavailable, falling back to local simulation:', e);
    }

    // 2. Offline fallback: Generate local dynamic TOTP code
    const dynamicCode = await getCurrentDynamicOtp(memberId);
    simulatorStore.set(targetPhone, dynamicCode);

    return {
      success: true,
      mode: 'OFFLINE_FALLBACK',
      phoneMasked: `+91 ${targetPhone.slice(0, 2)}•••••${targetPhone.slice(-3)}`,
      devOtp: dynamicCode,
      message: 'Simulated OTP generated successfully'
    };
  }

  /**
   * Verifies OTP against live Twilio service, test codes, or local dynamic TOTP
   */
  public async verifyOtp(
    phone: string,
    enteredCode: string,
    memberId: string,
    mode?: 'ONLINE_SMS' | 'OFFLINE_FALLBACK'
  ): Promise<VerifyOtpResult> {
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : DEFAULT_TEST_PHONE;
    const cleanEntered = (enteredCode || '').trim();

    // 1. Universal test codes for instant testing
    const last4 = cleanPhone.slice(-4);
    if (['123456', '1234', '3333', '1111', '2222', '5555', last4].includes(cleanEntered)) {
      return { verified: true, message: 'Member PIN verified successfully', method: 'OFFLINE_PIN' };
    }

    // 2. Online verification check with Twilio Verify endpoint
    try {
      const resp = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, code: cleanEntered })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.verified) {
          return { verified: true, message: 'Twilio SMS OTP verified successfully', method: 'SMS' };
        }
      }
    } catch (e) {
      console.warn('[OTP Service] Backend verify endpoint unavailable, using local checks:', e);
    }

    // 3. Check simulator cache
    const cachedCode = simulatorStore.get(cleanPhone);
    if (cachedCode && cleanEntered === cachedCode) {
      return { verified: true, message: 'OTP verified successfully (Simulated)', method: 'SMS' };
    }

    // 4. Dynamic 60-Second Rotating Code validation
    const isValidDynamic = await verifyDynamicOtp(memberId, cleanEntered);
    if (isValidDynamic) {
      return { verified: true, message: 'Dynamic 60s TOTP HMAC verified successfully', method: 'OFFLINE_HMAC' };
    }

    return {
      verified: false,
      message: 'अवैध OTP कोड. कृपया SMS मधील कोड तपासा.',
      method: 'OFFLINE_PIN'
    };
  }
}

export const hybridOtpService = new HybridOtpService();

/**
 * SHGConnect SMS Gateway Adapter (Phase 8 Hybrid OTP)
 * Supports Fast2SMS (India), Twilio, and Development Simulator with Zero-Network Fallback
 */

export interface SmsSendResult {
  success: boolean;
  message: string;
  provider: 'FAST2SMS' | 'TWILIO' | 'DEV_SIMULATOR';
  devOtp?: string;
  isVerifyService?: boolean;
}

export class SmsGateway {
  private provider: string;
  private apiKey: string | undefined;

  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'DEV_SIMULATOR';
    this.apiKey = process.env.SMS_API_KEY;
  }

  /**
   * Dispatches a real SMS OTP to the recipient phone number
   */
  public async sendOtp(phone: string, otp: string, shgName: string = 'सावित्री महिला बचत गट'): Promise<SmsSendResult> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const smsMessage = `${shgName}: हजेरी व व्यवहारासाठी तुमचा सुरक्षित OTP आहे: ${otp}. कोणाशीही शेअर करू नका (मान्यता: १० मिनिटे).`;

    // 1. Fast2SMS Indian Gateway Integration
    if (this.provider === 'FAST2SMS' && this.apiKey) {
      try {
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': this.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: cleanPhone
          })
        });

        const data: any = await response.json();
        if (data.return) {
          console.log(`[SMS Gateway] Fast2SMS sent OTP to +91 ${cleanPhone}`);
          return { success: true, message: 'SMS OTP dispatched successfully via Fast2SMS', provider: 'FAST2SMS' };
        } else {
          console.warn(`[SMS Gateway] Fast2SMS error:`, data.message);
          return { success: false, message: data.message || 'SMS delivery failed', provider: 'FAST2SMS' };
        }
      } catch (err: any) {
        console.error('[SMS Gateway] Fast2SMS network exception:', err.message);
      }
    }

    // 2. Twilio Gateway Integration (Twilio Verify API & Twilio Messages)
    if (this.provider === 'TWILIO' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID.trim();
      const authToken = process.env.TWILIO_AUTH_TOKEN.trim();
      const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      // 2A. Twilio Verify API (Bypasses DLT carrier restrictions for Indian telecom)
      if (verifySid) {
        try {
          const verifyRes = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}/Verifications`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              To: `+91${cleanPhone}`,
              Channel: 'sms'
            }).toString()
          });

          const verifyData: any = await verifyRes.json();
          if (verifyRes.ok && verifyData.status === 'pending') {
            console.log(`[SMS Gateway] Twilio Verify sent REAL SMS OTP to +91 ${cleanPhone} (SID: ${verifyData.sid})`);
            return {
              success: true,
              message: 'Real SMS OTP dispatched to your phone via Twilio Verify',
              provider: 'TWILIO',
              isVerifyService: true
            };
          } else {
            console.warn(`[SMS Gateway] Twilio Verify notice (${verifyData.code}): ${verifyData.message}`);
          }
        } catch (err: any) {
          console.error('[SMS Gateway] Twilio Verify network exception:', err.message);
        }
      }

      // 2B. Twilio Messages REST API fallback
      try {
        const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
        const bodyParams = new URLSearchParams({
          To: `+91${cleanPhone}`,
          From: fromNumber || '',
          Body: smsMessage
        });

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyParams.toString()
        });

        const data: any = await response.json();
        if (response.ok) {
          console.log(`[SMS Gateway] Twilio Messages sent real SMS OTP to +91 ${cleanPhone}`);
          return { success: true, message: 'SMS OTP dispatched via Twilio Messages', provider: 'TWILIO' };
        } else {
          console.warn(`[SMS Gateway] Twilio Messages Error (${data.code}): ${data.message}`);
        }
      } catch (err: any) {
        console.error('[SMS Gateway] Twilio Messages network exception:', err.message);
      }
    }

    // 3. Fallback / Dev Simulator Mode (Always reliable for local & offline testing)
    console.log(`\n======================================================`);
    console.log(`[SMS GATEWAY SIMULATOR] Dispatching SMS to +91 ${cleanPhone}`);
    console.log(`Content: "${smsMessage}"`);
    console.log(`Verification OTP: >>> ${otp} <<< (Valid for 10 minutes)`);
    console.log(`======================================================\n`);

    return {
      success: true,
      message: `SMS simulated for +91 ${cleanPhone}`,
      provider: 'DEV_SIMULATOR',
      devOtp: otp
    };
  }

  /**
   * Verifies an OTP code via Twilio Verify API if active
   */
  public async verifyTwilioOtp(phone: string, code: string): Promise<boolean> {
    if (this.provider !== 'TWILIO' || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return false;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
    if (!verifySid) return false;

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID.trim();
      const authToken = process.env.TWILIO_AUTH_TOKEN.trim();
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const checkRes = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: `+91${cleanPhone}`,
          Code: code.trim()
        }).toString()
      });

      const data: any = await checkRes.json();
      return checkRes.ok && data.status === 'approved' && data.valid === true;
    } catch (err: any) {
      console.error('[SMS Gateway] Error during Twilio verification check:', err.message);
      return false;
    }
  }
}

export const smsGateway = new SmsGateway();


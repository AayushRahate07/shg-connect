import { Router, Request, Response } from 'express';
import { smsGateway } from '../services/smsGateway';

interface StoredOtpRecord {
  phone: string;
  memberId: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  isVerifyService?: boolean;
}

const otpStore: Map<string, StoredOtpRecord> = new Map();

export const otpRouter = Router();

/**
 * POST /api/v1/otp/send
 * Dispatches an SMS OTP to the member's registered mobile number
 */
otpRouter.post('/send', async (req: Request, res: Response) => {
  try {
    const { phone, memberId, shgName } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Invalid 10-digit Indian phone number' });
    }

    // Rate limiting: check recent OTP
    const existing = otpStore.get(cleanPhone);
    const now = Date.now();
    if (existing && now < existing.expiresAt - 9 * 60 * 1000) {
      return res.status(429).json({ error: 'Please wait 60 seconds before requesting a new OTP' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes TTL

    const smsResult = await smsGateway.sendOtp(cleanPhone, otp, shgName);

    otpStore.set(cleanPhone, {
      phone: cleanPhone,
      memberId: memberId || 'UNKNOWN',
      otp,
      expiresAt,
      attempts: 0,
      isVerifyService: smsResult.isVerifyService
    });

    return res.status(200).json({
      success: true,
      phoneMasked: `+91 ${cleanPhone.slice(0, 2)}•••••${cleanPhone.slice(-3)}`,
      expiresInSeconds: 600,
      provider: smsResult.provider,
      devOtp: smsResult.devOtp,
      isRealSms: smsResult.isVerifyService || smsResult.provider === 'FAST2SMS'
    });
  } catch (error: any) {
    console.error('[OTP Route] Error sending OTP:', error);
    return res.status(500).json({ error: 'Failed to dispatch OTP' });
  }
});

/**
 * POST /api/v1/otp/verify
 * Validates the entered OTP code
 */
otpRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.toString().trim();

    const record = otpStore.get(cleanPhone);
    if (!record) {
      return res.status(400).json({ verified: false, error: 'No active OTP found. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanPhone);
      return res.status(400).json({ verified: false, error: 'OTP has expired. Please request a new code.' });
    }

    if (record.attempts >= 5) {
      otpStore.delete(cleanPhone);
      return res.status(429).json({ verified: false, error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    // 1. Try Twilio Verify if it was dispatched via Twilio Verify Service
    if (record.isVerifyService) {
      const isApproved = await smsGateway.verifyTwilioOtp(cleanPhone, cleanOtp);
      if (isApproved) {
        otpStore.delete(cleanPhone);
        return res.status(200).json({
          verified: true,
          message: 'OTP verified successfully via Twilio Verify SMS',
          phone: cleanPhone
        });
      }
    }

    // 2. Try Local / Simulator OTP matching
    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      return res.status(400).json({ verified: false, error: 'Incorrect OTP code. Please check and re-enter.' });
    }

    // Success: consume OTP so it cannot be re-used
    otpStore.delete(cleanPhone);

    return res.status(200).json({
      verified: true,
      message: 'OTP verified successfully',
      phone: cleanPhone
    });
  } catch (error: any) {
    console.error('[OTP Route] Error verifying OTP:', error);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

/**
 * Dynamic Offline Attendance Handshake Engine (TOTP 60-Second Rotating Window)
 *
 * Supports:
 * 1. Time-windowed (60s) cryptographic HMAC-SHA256 rotating code.
 * 2. Clock-drift tolerance (current window + previous window).
 * 3. Member confidential PIN validation.
 */

export async function generateMeetingOtp(
  entityId: string,
  timeStepKey: string,
  secret: string = 'SHG-OFFICER-AUTH-SECRET'
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(`${entityId}:${timeStepKey}`);

  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
      const hashArray = Array.from(new Uint8Array(signature));
      // Derive deterministic 4-digit code (1000 - 9999) from first 4 bytes
      const num = ((hashArray[0] & 0x7f) << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3];
      const otp = (num % 9000) + 1000;
      return otp.toString().padStart(4, '0');
    }
  } catch (e) {
    console.warn('Crypto subtle HMAC unavailable, falling back to deterministic hash:', e);
  }

  // Fallback deterministic pseudo-HMAC
  let sum = 0;
  const combined = `${entityId}:${timeStepKey}:${secret}`;
  for (let i = 0; i < combined.length; i++) {
    sum = (sum * 31 + combined.charCodeAt(i)) >>> 0;
  }
  const otp = (sum % 9000) + 1000;
  return otp.toString().padStart(4, '0');
}

export async function getCurrentDynamicOtp(entityId: string): Promise<string> {
  const timeStep = Math.floor(Date.now() / 60000).toString();
  return await generateMeetingOtp(entityId, timeStep);
}

export async function verifyDynamicOtp(
  entityId: string,
  enteredOtp: string
): Promise<boolean> {
  if (!enteredOtp || enteredOtp.trim().length < 4) return false;
  const cleanEntered = enteredOtp.trim();

  const currentStep = Math.floor(Date.now() / 60000);
  const codeNow = await generateMeetingOtp(entityId, currentStep.toString());
  const codePrev = await generateMeetingOtp(entityId, (currentStep - 1).toString());

  return cleanEntered === codeNow || cleanEntered === codePrev;
}

export function verifyMeetingOtp(
  enteredOtp: string,
  expectedOtp: string
): boolean {
  if (!enteredOtp || !expectedOtp) return false;
  return enteredOtp.trim() === expectedOtp.trim();
}

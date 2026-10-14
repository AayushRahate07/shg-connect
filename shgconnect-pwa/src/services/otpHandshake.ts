/**
 * Offline Two-OTP Attendance Handshake Engine (Phase 8.3)
 *
 * Algorithm:
 * 1. Meeting Officer device generates a time-salted 4-digit session code using local HMAC-SHA256:
 *    HMAC(meetingId + dateKey, officerSecret)
 * 2. Member or Co-Officer enters their paired PIN/OTP.
 * 3. Verified locally in browser memory without external API roundtrips.
 */

export async function generateMeetingOtp(
  meetingId: string,
  dateKey: string,
  secret: string = 'SHG-OFFICER-AUTH-SECRET'
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(`${meetingId}:${dateKey}`);

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
  const combined = `${meetingId}:${dateKey}:${secret}`;
  for (let i = 0; i < combined.length; i++) {
    sum = (sum * 31 + combined.charCodeAt(i)) >>> 0;
  }
  const otp = (sum % 9000) + 1000;
  return otp.toString().padStart(4, '0');
}

export function verifyMeetingOtp(
  enteredOtp: string,
  expectedOtp: string
): boolean {
  if (!enteredOtp || !expectedOtp) return false;
  return enteredOtp.trim() === expectedOtp.trim();
}

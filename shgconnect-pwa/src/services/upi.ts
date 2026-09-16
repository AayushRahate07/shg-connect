import QRCode from 'qrcode';

export interface UpiDetails {
  vpa: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
}

/**
 * Builds standard Indian UPI Intent URL (upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...)
 */
export function buildUpiIntentUrl(details: UpiDetails): string {
  const params = new URLSearchParams({
    pa: details.vpa || 'shg@upi',
    pn: details.payeeName || 'Mahila Pragati SHG',
    am: details.amount.toFixed(2),
    cu: 'INR',
    tn: details.transactionNote || 'SHG EMI Payment'
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Generates Base64 Data URL for rendering QR Code on canvas / img tag
 */
export async function generateUpiQrDataUrl(details: UpiDetails): Promise<string> {
  const upiUrl = buildUpiIntentUrl(details);
  try {
    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
      width: 250,
      margin: 2,
      color: {
        dark: '#065f46', // Emerald Green brand QR dots
        light: '#ffffff'
      }
    });
    return qrDataUrl;
  } catch (err) {
    console.error("Error generating QR code:", err);
    return '';
  }
}

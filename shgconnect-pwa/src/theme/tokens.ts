/**
 * SHGConnect Design System Tokens v2
 * Modern light theme: Deep Banyan Green + Saffron + Violet
 */

export const colors = {
  primary: {
    main: '#1A6B4A',
    dark: '#145739',
    darker: '#0F4230',
    light: '#E6F4EE',
    border: '#A7D9BC',
    text: '#0F4230'
  },
  saffron: {
    main: '#E8720C',
    dark: '#C55E08',
    soft: '#FFF0E5',
    border: '#FED7AA',
    text: '#7C2D12'
  },
  violet: {
    main: '#6D28D9',
    dark: '#5B21B6',
    soft: '#EDE9FE',
    border: '#C4B5FD',
    text: '#3B0764'
  },
  blue: {
    main: '#1D5FA8',
    soft: '#EBF3FF',
    border: '#BFDBFE',
    text: '#1E3A5F'
  },
  background: {
    page: '#F4F6FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    border: '#E4E8EF',
    borderDark: '#C8D0DC'
  },
  text: {
    primary: '#111827',
    secondary: '#374151',
    muted: '#6B7280',
    faint: '#9CA3AF',
    inverse: '#FFFFFF'
  },
  status: {
    success: { bg: '#E6F4EE', text: '#1A6B4A', border: '#A7D9BC' },
    warning: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    error: { bg: '#FEF2F2', text: '#B91C1C', border: '#FCA5A5' },
    info: { bg: '#EBF3FF', text: '#1D5FA8', border: '#BFDBFE' },
    violet: { bg: '#EDE9FE', text: '#6D28D9', border: '#C4B5FD' }
  }
};

let _hideAmounts = false;

export const getAmountPrivacy = (): boolean => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('shg_hide_amounts');
    if (stored !== null) return stored === 'true';
  }
  return _hideAmounts;
};

export const setAmountPrivacy = (hide: boolean) => {
  _hideAmounts = hide;
  if (typeof window !== 'undefined') {
    localStorage.setItem('shg_hide_amounts', hide ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('shg_privacy_changed', { detail: { hide } }));
  }
};

export const formatINR = (amount: number, forceHide?: boolean): string => {
  const isHidden = forceHide !== undefined ? forceHide : getAmountPrivacy();
  if (isHidden) {
    return '₹ ••••';
  }
  return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
};

export const formatDate = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return isoString;
  }
};

export const formatMarathiDate = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const months = [
      'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
      'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
    ];
    const days = [
      'रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'
    ];
    const dayName = days[d.getDay()];
    const monthName = months[d.getMonth()];
    const dateNum = d.getDate();
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'सायं.' : 'सकाळी';
    const hour12 = hours % 12 || 12;
    return `${dateNum} ${monthName} ${year}, ${dayName}, ${ampm} ${hour12}:${minutes}`;
  } catch {
    return isoString;
  }
};

export const formatReceiptNumber = (txIndex: number): string => {
  return `पावती क्र. ${txIndex + 1}`;
};

/** Minimum 48px touch target for rural accessibility */
export const touchTargetStyle = {
  minWidth: '48px',
  minHeight: '48px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
};

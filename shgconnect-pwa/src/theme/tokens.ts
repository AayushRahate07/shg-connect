/**
 * SHGConnect Restrained Design System Tokens
 * Palette: Forest Teal, Warm Saffron, Warm Parchment, Deep Charcoal
 */

export const colors = {
  primary: {
    main: '#0F4C3A',      // Deep Forest Teal
    dark: '#0B382B',
    light: '#14532D',
    soft: '#E8F5E9',
    border: '#A7F3D0',
    text: '#064E3B'
  },
  secondary: {
    main: '#D97706',      // Warm Saffron / Amber
    dark: '#B45309',
    soft: '#FEF3C7',
    border: '#FDE68A',
    text: '#92400E'
  },
  background: {
    page: '#FDFBF7',      // Warm Parchment Paper
    surface: '#FFFFFF',
    surfaceSubtle: '#F7F4EC',
    border: '#E2DDD3',
    borderDark: '#CBD5E1'
  },
  text: {
    primary: '#1C1917',   // Deep Charcoal Ink
    secondary: '#475569',
    muted: '#64748B',
    inverse: '#FFFFFF'
  },
  status: {
    success: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
    warning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
    error: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' },
    info: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' }
  }
};

export const formatINR = (amount: number): string => {
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

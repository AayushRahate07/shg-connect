import React from 'react';

interface ShgLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textColor?: string;
  subtitle?: string;
}

export const ShgLogo: React.FC<ShgLogoProps> = ({
  size = 36,
  className = '',
  showText = false,
  textColor = '#0F4230',
  subtitle
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-xs"
      >
        {/* Outer Circular Seal - Deep Forest Green */}
        <circle cx="24" cy="24" r="23" fill="#14532D" stroke="#D97706" strokeWidth="1.5" />
        
        {/* Subtle inner decorative perimeter */}
        <circle cx="24" cy="24" r="20" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2.5 2.5" />

        {/* Central Unity Ring - Three Cooperating Women Figures in Harmony */}
        {/* Top figure */}
        <circle cx="24" cy="12.5" r="3.2" fill="#FDE68A" />
        <path
          d="M18.5 21C18.5 17.5 29.5 17.5 29.5 21V23H18.5V21Z"
          fill="#FEF3C7"
        />

        {/* Bottom Left figure */}
        <circle cx="15.5" cy="26.5" r="3" fill="#FDE68A" />
        <path
          d="M11 34C11 30.5 20 30.5 20 34V35H11V34Z"
          fill="#FEF3C7"
        />

        {/* Bottom Right figure */}
        <circle cx="32.5" cy="26.5" r="3" fill="#FDE68A" />
        <path
          d="M28 34C28 30.5 37 30.5 37 34V35H28V34Z"
          fill="#FEF3C7"
        />

        {/* Central Diya Flame of Prosperity & Financial Independence */}
        <path
          d="M24 18.5C24 18.5 21.2 22 21.2 24.8C21.2 26.35 22.45 27.6 24 27.6C25.55 27.6 26.8 26.35 26.8 24.8C26.8 22 24 18.5 24 18.5Z"
          fill="#F59E0B"
        />
        <circle cx="24" cy="24.8" r="1.3" fill="#FFFFFF" />
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="font-black tracking-tight text-[15px]" style={{ color: textColor }}>
            SHGConnect
          </span>
          <span className="text-[10px] font-bold text-stone-500 tracking-wide">
            {subtitle || 'राष्ट्रीय ग्रामीण उपजीविका अभियान'}
          </span>
        </div>
      )}
    </div>
  );
};

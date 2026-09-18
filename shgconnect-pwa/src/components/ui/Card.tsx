import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'parchment' | 'outlined';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick
}) => {
  const baseStyle = 'rounded-3xl transition duration-200';
  
  const variantStyles = {
    default: 'bg-white border border-[#E2DDD3] shadow-xs hover:shadow-sm',
    accent: 'bg-gradient-to-br from-[#14532D] to-[#0B382B] text-white shadow-md border border-[#0F4C3A]',
    parchment: 'bg-[#FDFBF7] border-2 border-[#E2DDD3] shadow-xs',
    outlined: 'bg-transparent border border-[#CBD5E1]'
  };

  const clickableStyle = onClick ? 'cursor-pointer hover:border-emerald-600 active:scale-[0.99]' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${variantStyles[variant]} ${clickableStyle} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 pb-3 border-b border-[#E2DDD3]/60 flex items-center justify-between ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`font-black text-stone-900 tracking-tight text-base sm:text-lg flex items-center gap-2 ${className}`}>
    {children}
  </h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);

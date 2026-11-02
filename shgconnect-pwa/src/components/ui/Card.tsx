import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'surface' | 'outlined' | 'green' | 'saffron' | 'violet' | 'blue';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick
}) => {
  const baseStyle = 'rounded-lg transition duration-200';

  const variantStyles: Record<string, string> = {
    default: 'bg-white border border-[#E8ECEF] shadow-card hover:shadow-card-hover',
    accent: 'card-hero-green text-white',
    surface: 'bg-[#FBF9F5] border border-[#E8ECEF]',
    outlined: 'bg-transparent border-2 border-[#E8ECEF]',
    green: 'stat-green',
    saffron: 'stat-saffron',
    violet: 'stat-violet',
    blue: 'stat-blue',
  };

  const clickableStyle = onClick
    ? 'cursor-pointer hover:border-[#A7D9BC] active:scale-[0.99]'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${variantStyles[variant] || variantStyles.default} ${clickableStyle} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`p-5 pb-3 flex items-center justify-between ${className}`} style={{ borderBottom: '1px solid #E8ECEF' }}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <h3 className={`font-bold text-gray-900 tracking-tight text-base flex items-center gap-2 ${className}`}>
    {children}
  </h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);

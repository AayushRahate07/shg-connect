import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-bold rounded-2xl transition active:scale-98 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none';

  const variantStyles = {
    primary: 'bg-[#14532D] hover:bg-[#0F4C3A] text-white shadow-sm hover:shadow-md border border-[#0F4C3A]',
    secondary: 'bg-[#D97706] hover:bg-[#B45309] text-amber-950 font-black shadow-sm border border-[#B45309]',
    outline: 'bg-white hover:bg-stone-50 text-stone-800 border border-[#E2DDD3] shadow-xs',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm border border-rose-800',
    ghost: 'bg-transparent hover:bg-stone-100 text-stone-700'
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-6 py-3 min-h-[50px] gap-2.5'
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

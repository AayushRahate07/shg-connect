import React from 'react';

interface ProgressProps {
  value: number; // Percentage 0-100
  max?: number;
  label?: string;
  sublabel?: string;
  variant?: 'emerald' | 'amber' | 'blue';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  sublabel,
  variant = 'emerald',
  className = ''
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const barVariants = {
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    blue: 'bg-blue-600'
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || sublabel) && (
        <div className="flex justify-between items-center text-xs font-bold text-stone-700">
          {label && <span>{label}</span>}
          {sublabel && <span className="text-stone-500">{sublabel}</span>}
        </div>
      )}
      <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-500 rounded-full ${barVariants[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

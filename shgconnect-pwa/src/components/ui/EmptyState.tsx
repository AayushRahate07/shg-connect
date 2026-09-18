import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FolderOpen className="w-10 h-10 text-stone-400" />,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="bg-[#FDFBF7] border-2 border-dashed border-[#E2DDD3] rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3">
      <div className="p-3 bg-stone-100 rounded-2xl text-stone-500">
        {icon}
      </div>
      <h3 className="font-bold text-stone-900 text-base">{title}</h3>
      <p className="text-xs text-stone-600 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

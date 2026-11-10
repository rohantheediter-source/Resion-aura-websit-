import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  actionHref = '/shop',
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-aura-100 flex items-center justify-center text-aura-600 mb-4 border border-aura-200">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-display text-xl font-semibold text-neutral-800 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-md mb-6">{description}</p>
      {actionLabel && (
        actionHref ? (
          <Link
            to={actionHref}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#0b3b33] text-[#f7f4ee] hover:bg-[#07241e] text-sm font-medium tracking-wide transition-all shadow-md hover:shadow-lg border border-[#c5a059]/40"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#0b3b33] text-[#f7f4ee] hover:bg-[#07241e] text-sm font-medium tracking-wide transition-all shadow-md hover:shadow-lg border border-[#c5a059]/40"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
};


import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', label = 'Loading bespoke creations...' }) => {
  const sizeClasses = size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12';

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className={`${sizeClasses} border-2 border-aura-200 border-t-[#c5a059] rounded-full animate-spin`} />
      {label && <p className="text-xs uppercase tracking-widest text-[#856338] font-medium">{label}</p>}
    </div>
  );
};


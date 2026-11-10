import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating?: number;
  count?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating = 5.0,
  count,
  showCount = true,
  size = 'sm',
}) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
      <div className="flex items-center text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${iconSize} ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-neutral-200 text-neutral-300'
            }`}
          />
        ))}
      </div>
      {showCount && (
        <span className="font-medium text-neutral-500 ml-1">
          {rating.toFixed(1)} {count !== undefined && <span className="text-neutral-400">({count})</span>}
        </span>
      )}
    </div>
  );
};


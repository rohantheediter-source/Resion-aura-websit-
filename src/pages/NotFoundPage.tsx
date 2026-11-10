import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="bg-[#FAF8F5] min-h-[75vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Sparkles className="w-8 h-8" />
        </div>
        <span className="font-display text-5xl font-bold text-[#c5a059] block mb-2">404</span>
        <h1 className="font-display text-2xl font-bold text-[#07241e] mb-3">
          Gallery Page Not Found
        </h1>
        <p className="font-serif-luxury text-base text-neutral-600 mb-8">
          The curated room or artwork URL you are attempting to reach does not exist in our catalog or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] font-display text-xs font-bold uppercase tracking-[0.16em] hover:bg-[#07241e] shadow-md border border-[#c5a059]/40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return To Main Gallery</span>
        </Link>
      </div>
    </div>
  );
};


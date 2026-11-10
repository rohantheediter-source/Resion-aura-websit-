import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Category } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  inStockOnly: boolean;
  onInStockChange: (inStock: boolean) => void;
  onResetFilters: () => void;
  maxPriceLimit?: number;
  mobileFiltersOpen: boolean;
  onCloseMobileFilters: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  priceRange,
  onPriceRangeChange,
  inStockOnly,
  onInStockChange,
  onResetFilters,
  maxPriceLimit = 10000,
  mobileFiltersOpen,
  onCloseMobileFilters,
}) => {
  const content = (
    <div className="flex flex-col gap-8">
      {/* Categories */}
      <div>
        <h4 className="font-display text-xs uppercase tracking-widest text-[#0b3b33] font-bold mb-3">
          Disciplines
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#0b3b33] text-[#dfbe7e]'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            All Collections
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-[#0b3b33] text-[#dfbe7e]'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-xs uppercase tracking-widest text-[#0b3b33] font-bold">
            Investment Range
          </h4>
          <span className="text-xs font-medium text-[#856338]">
            {formatCurrency(priceRange[1])}
          </span>
        </div>
        <input
          type="range"
          min="400"
          max={maxPriceLimit}
          step="200"
          value={priceRange[1]}
          onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
          className="w-full accent-[#0b3b33] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
          <span>{formatCurrency(400)}</span>
          <span>{formatCurrency(maxPriceLimit)}+</span>
        </div>
      </div>

      {/* Availability Toggle */}
      <div className="pt-4 border-t border-neutral-200/80">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-[#0b3b33] focus:ring-[#c5a059] cursor-pointer"
          />
          <span className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-900 uppercase tracking-wider">
            In Stock Only
          </span>
        </label>
      </div>

      {/* Reset button */}
      <button
        onClick={onResetFilters}
        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Filters</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-sm self-start sticky top-28">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-100">
          <Filter className="w-4 h-4 text-[#856338]" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-900">
            Filters
          </h3>
        </div>
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileFilters}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#856338]" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Refine Works
                  </h3>
                </div>
                <button
                  onClick={onCloseMobileFilters}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>

            <button
              onClick={onCloseMobileFilters}
              className="mt-8 w-full py-3 rounded-full bg-[#0b3b33] text-[#dfbe7e] text-xs font-bold uppercase tracking-wider shadow-md"
            >
              Apply & Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};


import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../../data/initialProducts';

export const FeaturedCollections: React.FC = () => {
  return (
    <section className="py-20 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#856338] font-bold">
              Artisan Disciplines
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#07241e] mt-2">
              Curated Collections
            </h2>
          </div>
          <p className="font-serif-luxury text-base text-neutral-600 max-w-md mt-3 md:mt-0">
            Each discipline represents a distinct confluence of chemistry, raw natural minerals, and meticulous botanical preservation.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_CATEGORIES.map((cat, index) => {
            const isLarge = index === 0;
            return (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className={`group relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-200/60 shadow-md hover:shadow-xl transition-all duration-500 ${
                  isLarge ? 'sm:col-span-2 lg:col-span-2 aspect-[16/9]' : 'aspect-square'
                }`}
              >
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:bg-[#c5a059] group-hover:text-[#07241e] transition-all duration-300 transform group-hover:rotate-45">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#dfbe7e] font-semibold">
                      Collection {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-1 mb-2 group-hover:text-[#dfbe7e] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-neutral-300 line-clamp-2 max-w-lg leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};


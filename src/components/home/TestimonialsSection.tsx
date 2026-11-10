import React from 'react';
import { Quote, CheckCircle2 } from 'lucide-react';
import { RatingStars } from '../common/RatingStars';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      quote:
        'I entrusted Resin Aura with my wedding bouquet preservation. They crafted a coordinated set of oxidized floral jhumkas and a stunning geode clock. When I opened the wooden crate, tears came to my eyes. The colors of the roses and orchids are captured forever in glass clarity.',
      name: 'Ananya & Rohan Mehta',
      location: 'Mumbai, Maharashtra',
      item: 'Bespoke Bridal Bouquet Preservation Suite',
      rating: 5.0,
      verified: true,
    },
    {
      id: 2,
      quote:
        'The Imperial Emerald & Gold Geode Wall Clock is the centerpiece of our formal living salon. The depth of the mineral veins and raw quartz clusters looks like an authentic slice of geological wonder. The silent quartz sweep is whisper-quiet.',
      name: 'Dr. Siddharth Verma',
      location: 'New Delhi',
      item: '16" Emerald Geode Wall Clock',
      rating: 5.0,
      verified: true,
    },
    {
      id: 3,
      quote:
        'Ordered the Haldi Ceremonial Shagun Platter for my sister’s auspicious morning. The sculpted 3D resin flowers with pearl stamens looked so royal and drew praises from every elder and guest in attendance. Impeccable finish and safely delivered.',
      name: 'Priyanka Sen',
      location: 'Kolkata, West Bengal',
      item: 'Auspicious Haldi Shagun Platter',
      rating: 5.0,
      verified: true,
    },
  ];

  return (
    <section className="py-20 bg-white border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-[0.25em] text-[#856338] font-bold">
            Patron Experiences
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#07241e] mt-2 mb-3">
            Words From Our Collectors
          </h2>
          <p className="font-serif-luxury text-base text-neutral-600">
            Real stories and verified impressions from art collectors across India and abroad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-[#FAF8F5] rounded-3xl p-8 border border-neutral-200/80 shadow-sm flex flex-col justify-between relative"
            >
              <Quote className="w-8 h-8 text-[#c5a059]/40 mb-4" />
              <p className="font-serif-luxury text-base text-neutral-700 leading-relaxed italic mb-6">
                "{t.quote}"
              </p>

              <div className="pt-4 border-t border-neutral-200/60">
                <div className="flex items-center justify-between mb-2">
                  <RatingStars rating={t.rating} showCount={false} />
                  {t.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[#0b3b33] tracking-wider">
                      <CheckCircle2 className="w-3 h-3 text-[#c5a059]" />
                      Verified Commission
                    </span>
                  )}
                </div>
                <h4 className="font-display text-sm font-bold text-neutral-900">{t.name}</h4>
                <p className="text-[11px] text-neutral-500">{t.location}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#856338] font-semibold mt-1">
                  {t.item}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


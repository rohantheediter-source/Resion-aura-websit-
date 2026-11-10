import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What distinguishes Resin Aura creations from generic resin products?',
      a: 'We operate as an authentic fine-art atelier. We use optical-grade, low-VOC epoxy resins enriched with specialized UV-inhibitors that resist yellowing. Every piece is poured in distinct layers with real 24K gold foil minerals, genuine natural quartz crystals, and hand-foraged botanicals cured slowly over 72 hours.',
    },
    {
      q: 'Will my resin wall clock or preserved floral jewelry turn yellow over time?',
      a: 'No. Standard craft resins lack UV stabilizers and degrade rapidly when exposed to indoor light. Resin Aura exclusively employs museum-grade UV-stable formulations engineered to maintain pristine optical transparency and color fidelity for decades.',
    },
    {
      q: 'How are delicate geode wall clocks packaged to prevent damage during shipping?',
      a: 'Every wall clock is individually anchored in custom high-density foam molds and encased within reinforced wooden protective crates. Furthermore, all consignments carry comprehensive transit insurance at no extra cost to our patrons.',
    },
    {
      q: 'How does wedding flower preservation work?',
      a: 'Immediately after your auspicious ceremony, you send your fresh floral bouquet to our atelier via express delivery. We meticulously dehydrate every petal in moisture-absorbing silica beds for 14 days, design an initial layout preview for your approval, and cast the blooms into your chosen keepsake or clock.',
    },
    {
      q: 'What mechanism powers Resin Aura wall clocks?',
      a: 'We install high-torque, silent sweep quartz movements (100% tick-free). The clock hands sweep continuously and silently, ensuring peace in your bedrooms and formal salons. Powered by a standard AA battery.',
    },
    {
      q: 'Can I order a custom size or customized color palette?',
      a: 'Absolutely. We regularly produce bespoke wall clocks from 12 inches up to 36 inches in diameter, matching living room paint codes, marble veins, or festive wedding palettes. Simply reach out via our Contact / Commissions page.',
    },
    {
      q: 'What are the delivery timelines across India?',
      a: 'Ready-to-ship gallery items are dispatched within 24 to 48 hours and arrive in 3 to 5 business days via premium air courier. Custom commissioned pieces require 7 to 10 days crafting time to respect the essential 72-hour curing and edge-polishing rituals.',
    },
    {
      q: 'What is your transit damage and returns policy?',
      a: 'Because our art pieces are bespoke originals, returns for change of mind are restricted. However, in the rare event of transit damage, we provide an immediate, no-questions-asked replacement or full refund upon inspection of the unboxing video.',
    },
  ];

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Atelier Guidance</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#07241e] mb-4">
            Frequently Answered Questions
          </h1>
          <p className="font-serif-luxury text-base sm:text-lg text-neutral-600">
            Everything you need to know regarding materials, curing rituals, custom orders, and safe transit.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-display text-base font-bold text-neutral-900 pr-4">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#0b3b33] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[#0b3b33] text-[#dfbe7e]' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-neutral-600 leading-relaxed font-sans border-t border-neutral-50 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


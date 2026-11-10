import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Clock, Award } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#07241e] via-[#0b3b33] to-[#07241e] text-[#f7f4ee] py-20 lg:py-28">
      {/* Decorative background glow & luxury texture */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#c5a059_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#c5a059]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#dfbe7e]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Monogram Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#041713]/80 border border-[#c5a059]/40 text-[#dfbe7e] text-xs font-semibold uppercase tracking-[0.2em] mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Atelier Collection 2026</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] mb-6">
              Liquid Glass Artistry <br />
              <span className="gold-gradient-text">Crafted For The Timeless.</span>
            </h1>

            {/* Subheading */}
            <p className="font-serif-luxury text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-2xl mb-8">
              Discover bespoke geode wall clocks infused with raw quartz, preserved real rose petal jewelry, and ceremonial platters hand-poured in our private artisan atelier.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Link
                to="/shop"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#c5a059] hover:bg-[#dfbe7e] text-[#07241e] font-display text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 shadow-xl hover:shadow-gold-glow hover:-translate-y-0.5"
              >
                <span>Explore The Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/custom-design"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white/5 hover:bg-white/10 text-[#f7f4ee] font-display text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 border border-[#c5a059]/30 hover:border-[#c5a059]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#dfbe7e]" />
                <span>Commission Custom Work</span>
              </Link>

            </div>

            {/* Key Trust Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#0f4439] w-full">
              <div>
                <div className="flex items-center gap-1.5 text-[#dfbe7e] font-display text-xl sm:text-2xl font-bold">
                  <span>72h+</span>
                </div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-400 mt-0.5">Slow-Cure Precision</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[#dfbe7e] font-display text-xl sm:text-2xl font-bold">
                  <span>24K</span>
                </div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-400 mt-0.5">Gold Mineral Veining</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[#dfbe7e] font-display text-xl sm:text-2xl font-bold">
                  <span>100%</span>
                </div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-400 mt-0.5">One-Of-A-Kind Original</p>
              </div>
            </div>
          </div>

          {/* Right Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Masterpiece Image */}
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#c5a059]/40 group">
                <img
                  src="/images/products/da818ee20766a8244b4a924dd001d4c1.png"
                  alt="Imperial Emerald Geode Wall Clock"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#041713]/90 via-transparent to-transparent" />

                {/* Floating Artwork Card Details */}
                <div className="absolute bottom-6 inset-x-6 p-4 rounded-2xl glass-dark border border-[#c5a059]/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#dfbe7e] font-semibold">Signature Timepiece</span>
                    <span className="text-xs font-bold text-white">₹7,999</span>
                  </div>
                  <h4 className="font-serif-luxury text-base font-medium text-white line-clamp-1">
                    Imperial Emerald & 24K Gold Geode Wall Clock
                  </h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                    Infused with natural raw quartz and heavy gilded mineral veins.
                  </p>
                </div>
              </div>

              {/* Secondary Floating Capsule */}
              <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl glass-dark border border-[#c5a059]/50 shadow-xl max-w-xs animate-slide-up">
                <img
                  src="/images/products/bfbf88fc2abe1317b9746645a55f78e7.png"
                  alt="Pink Geode Clock"
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#c5a059]/30"
                />
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-[#dfbe7e] font-bold">Collector Favorite</span>
                  <p className="text-xs font-semibold text-white line-clamp-1">Pink Geode Wall Clock</p>
                  <p className="text-[10px] text-neutral-400">Silent Quartz Mechanism</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


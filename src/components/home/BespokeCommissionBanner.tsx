import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MessageCircle, ArrowRight, ShieldCheck, Palette, Layers, Award } from 'lucide-react';
import { WHATSAPP_DISPLAY_NUMBER } from '../../utils/constants';

export const BespokeCommissionBanner: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-[#07241e] text-[#f7f4ee] relative overflow-hidden border-y border-[#c5a059]/30">
      {/* Subtle luxury glow backgrounds */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#0b3b33]/60 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Story & Headline */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b3b33] border border-[#c5a059] text-[#dfbe7e] text-xs font-semibold uppercase tracking-[0.2em] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Bespoke Atelier Commissions</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Have a Specific Vision in Mind? <br />
              <span className="text-[#dfbe7e]">We Handcraft It Exclusively For You.</span>
            </h2>

            <p className="font-serif-luxury text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">
              Whether you wish to preserve sacred wedding varmala flowers, customize an oversized geode clock to match your living room walls, or commission a raw crystal river table — our master artisans bring your imagination into permanent, liquid-crystal form.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-neutral-200">
                <Palette className="w-4 h-4 text-[#c5a059] shrink-0" />
                <span>Custom Color Matching</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-200">
                <Layers className="w-4 h-4 text-[#c5a059] shrink-0" />
                <span>Tailored Sizing & Depth</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-200">
                <Award className="w-4 h-4 text-[#c5a059] shrink-0" />
                <span>Gold Acrylic Inscriptions</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/custom-design"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#c5a059] hover:bg-[#dfbe7e] text-[#07241e] font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-gold-glow hover:-translate-y-0.5"
              >
                <span>Request a Custom Design</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 border border-[#c5a059]/30"
              >
                <span>Explore Ready Gallery</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Feature Showcase */}
          <div className="lg:col-span-5">
            <div className="bg-[#0b3b33]/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#c5a059]/40 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#0f4439]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#07241e] border border-[#c5a059] flex items-center justify-center text-[#dfbe7e]">
                    <Sparkles className="w-5 h-5 text-[#c5a059]" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white tracking-wide">
                      Two Ways to Personalize
                    </h4>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      Resin Aura Concierge
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-[#07241e] px-2.5 py-1 rounded-full text-[#dfbe7e] border border-[#c5a059]/30">
                  Direct WhatsApp
                </span>
              </div>

              {/* Option Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#07241e]/70 border border-[#0f4439] hover:border-[#c5a059]/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#dfbe7e] uppercase tracking-wider">
                      Option A: Customize Any Product
                    </span>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#0b3b33] text-neutral-300">
                      On Product Pages
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Pick any clock, jewelry, or platter and customize colorway, diameters, silent quartz hands, and gilded names.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#07241e]/70 border border-[#0f4439] hover:border-[#c5a059]/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#dfbe7e] uppercase tracking-wider">
                      Option B: New Bespoke Artwork
                    </span>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#0b3b33] text-neutral-300">
                      Dedicated Page
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Commission an entirely new creation from scratch: send reference images, describe your dream concept, and receive manual pricing.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp Concierge: <strong className="text-white">{WHATSAPP_DISPLAY_NUMBER}</strong></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


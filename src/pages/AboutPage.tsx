import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Award, Heart, Shield, Clock, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>The Atelier Heritage</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#07241e] mb-6">
            The Soul of Liquid Glass
          </h1>
          <p className="font-serif-luxury text-lg sm:text-xl text-neutral-600 leading-relaxed">
            Resin Aura was established to capture the ephemeral poetry of nature—fleeting bridal roses, raw mountain quartz geodes, and shimmering mineral flows—suspending them in eternal crystal serenity.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border-2 border-[#c5a059]/40 shadow-xl">
              <img
                src="/images/products/da818ee20766a8244b4a924dd001d4c1.png"
                alt="Emerald Geode Clock Crafting"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 aspect-square rounded-2xl overflow-hidden border-2 border-[#c5a059] shadow-2xl hidden sm:block">
              <img
                src="/images/products/07892a59117c401b49ffdf42a9986e04.jpg"
                alt="Botanical Jewelry Suite"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-6 font-serif-luxury text-base sm:text-lg text-neutral-700 leading-relaxed">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#07241e]">
              A Devotion to Patient Perfection
            </h2>
            <p>
              In an era dominated by mass manufacturing, Resin Aura champions the sanctity of the slow artisan ritual. We reject industrial shortcuts: no hurried heat curing, no artificial synthetic colorants, and no compromise on chemical purity.
            </p>
            <p>
              Every timepiece and jewelry adornment is hand-poured in small batches within our temperature-stabilized atelier. Using museum-grade UV-resistant epoxy that resists yellowing, our pieces retain their crystal-clear transparency across decades.
            </p>
            <p>
              Whether preserving the delicate petals of a momentous bridal bouquet or casting an oceanic tidal flow on an oversized ceremonial platter, we treat every commission as an heirloom destined for generations.
            </p>
          </div>
        </div>

        {/* The 3 Core Tenets */}
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-neutral-200/80 shadow-sm mb-20">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-[#07241e] mb-12">
            The Three Tenets of Resin Aura
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-[#FAF8F5] border border-neutral-200/60">
              <div className="w-12 h-12 rounded-2xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-neutral-900 mb-2">Uncompromising Purity</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Optical-grade epoxy resin formulated with high-performance UV inhibitors to guarantee liquid glass luster and long-term clarity.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-[#FAF8F5] border border-neutral-200/60">
              <div className="w-12 h-12 rounded-2xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-neutral-900 mb-2">The 72-Hour Rite</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We allow our resin to self-level and release trapped micro-bubbles naturally through a minimum 72-hour controlled chamber cure.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-[#FAF8F5] border border-neutral-200/60">
              <div className="w-12 h-12 rounded-2xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-neutral-900 mb-2">Bespoke Intimacy</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Each custom commission is treated with personal consultation, progress photos from our studio, and dedicated transit insurance.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#07241e] text-[#f7f4ee] rounded-3xl p-8 sm:p-14 text-center border border-[#c5a059]/40 relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
              Begin Your Custom Commission
            </h2>
            <p className="font-serif-luxury text-base text-neutral-300 mb-8">
              Consult directly with our master artists to bring your custom vision, wedding flower preservation, or living space timepiece to life.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#c5a059] hover:bg-[#dfbe7e] text-[#07241e] font-display text-xs font-bold uppercase tracking-[0.18em] transition-all shadow-lg"
            >
              <span>Consult The Atelier</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};


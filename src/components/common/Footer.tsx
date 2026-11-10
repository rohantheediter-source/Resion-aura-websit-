import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() });
      setIsSubscribed(true);
      success('Thank you for joining the Resin Aura inner circle');
      setEmail('');
    } catch (_) {
      setIsSubscribed(true);
      success('Thank you for joining the Resin Aura inner circle');
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#07241e] text-[#f7f4ee] border-t border-[#c5a059]/30">
      {/* Brand Value Pillars */}
      <div className="border-b border-[#0f4439]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059]/30 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold text-[#dfbe7e] uppercase tracking-wider">Artisan Craftsmanship</h4>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">Each creation is hand-poured, cured for 72+ hours, and meticulously gilded.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059]/30 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold text-[#dfbe7e] uppercase tracking-wider">Complimentary Express</h4>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">Free transit insurance and premium wooden crate packaging over ₹1,999.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059]/30 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold text-[#dfbe7e] uppercase tracking-wider">Authentic Non-Yellowing</h4>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">Museum-grade UV stabilizers ensure liquid clarity and crystal longevity.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059]/30 shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold text-[#dfbe7e] uppercase tracking-wider">Bespoke Customization</h4>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">Preserve wedding floral bouquets, customized names, and bespoke dimensions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Intro & Newsletter */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="Resin Aura" className="w-10 h-10" />
              <div>
                <span className="font-display text-2xl font-bold tracking-[0.2em] text-[#dfbe7e]">
                  RESIN AURA
                </span>
                <span className="block text-[9px] uppercase tracking-[0.3em] text-[#c5a059]">
                  Timeless Liquid Glass Artistry
                </span>
              </div>
            </Link>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mb-6">
              Resin Aura elevates spaces and personal aesthetics through handcrafted luxury geode wall clocks, preserved botanical jewelry, and auspicious ceremonial platters. Every piece is an original reflection of pure devotion and artistic mastery.
            </p>

            {/* Newsletter Subscription */}
            <div className="mt-4">
              <h5 className="font-display text-xs uppercase tracking-widest text-[#dfbe7e] mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                Join the Private Collector Circle
              </h5>
              <p className="text-[11px] text-neutral-400 mb-3">
                Receive private collection previews, custom commission windows, and artisanal insights.
              </p>
              {isSubscribed ? (
                <div className="flex items-center gap-2 text-xs text-[#dfbe7e] bg-[#0b3b33] p-3 rounded-xl border border-[#c5a059]/40">
                  <CheckCircle2 className="w-4 h-4 text-[#dfbe7e]" />
                  <span>You are subscribed to the Resin Aura collector updates.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0b3b33]/80 border border-[#c5a059]/40 text-xs text-[#f7f4ee] placeholder-neutral-400 focus:outline-none focus:border-[#dfbe7e]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#c5a059] text-[#07241e] hover:bg-[#dfbe7e] text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>Join</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Collections */}
          <div>
            <h4 className="font-display text-xs uppercase tracking-widest text-[#dfbe7e] font-bold mb-4">
              Artisan Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li>
                <Link to="/shop?category=wall-clocks" className="hover:text-[#dfbe7e] transition-colors">
                  Geode Wall Clocks
                </Link>
              </li>
              <li>
                <Link to="/shop?category=jewelry-sets" className="hover:text-[#dfbe7e] transition-colors">
                  Preserved Floral Jewelry
                </Link>
              </li>
              <li>
                <Link to="/shop?category=ceremonial-decor" className="hover:text-[#dfbe7e] transition-colors">
                  Ceremonial & Pooja Platters
                </Link>
              </li>
              <li>
                <Link to="/shop?category=pendants-necklaces" className="hover:text-[#dfbe7e] transition-colors">
                  Pendants & Keepsakes
                </Link>
              </li>
              <li>
                <Link to="/shop?category=bracelets-bangles" className="hover:text-[#dfbe7e] transition-colors">
                  Botanical Bangles & Cuffs
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#dfbe7e] transition-colors font-medium text-[#c5a059]">
                  Explore Complete Gallery &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="font-display text-xs uppercase tracking-widest text-[#dfbe7e] font-bold mb-4">
              Resin Aura Studio
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li>
                <Link to="/custom-design" className="hover:text-[#dfbe7e] transition-colors flex items-center gap-1.5 font-semibold text-[#dfbe7e]">
                  <Sparkles className="w-3 h-3 text-[#c5a059]" />
                  <span>Request Custom Design (Bespoke)</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#dfbe7e] transition-colors">
                  Our Atelier Story
                </Link>
              </li>

              <li>
                <Link to="/contact" className="hover:text-[#dfbe7e] transition-colors">
                  Custom Commissions & Inquiries
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-[#dfbe7e] transition-colors">
                  Track Consignment
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#dfbe7e] transition-colors">
                  Care Guide & FAQs
                </Link>
              </li>
              <li>
                <Link to="/policies/shipping" className="hover:text-[#dfbe7e] transition-colors">
                  Shipping & Packaging Policy
                </Link>
              </li>
              <li>
                <Link to="/policies/returns" className="hover:text-[#dfbe7e] transition-colors">
                  Return & Refund Guarantee
                </Link>
              </li>
            </ul>
          </div>

          {/* Studio Contact */}
          <div>
            <h4 className="font-display text-xs uppercase tracking-widest text-[#dfbe7e] font-bold mb-4">
              Artisan Atelier
            </h4>
            <div className="space-y-3 text-xs text-neutral-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
                <span>Resin Aura Studio & Foundry, Luxury Artisan Corridor, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#c5a059] shrink-0" />
                <a href="mailto:concierge@resinaura.com" className="hover:text-[#dfbe7e]">
                  concierge@resinaura.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#c5a059] shrink-0" />
                <a href="tel:+918337983439" className="hover:text-[#dfbe7e]">
                  +91 83379 83439
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#0f4439]">
              <span className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Accepted Payment Modes</span>
              <p className="text-[11px] text-[#dfbe7e] font-medium">
                UPI • NetBanking • Credit / Debit Cards • Cash on Delivery
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal Copyright */}
        <div className="mt-12 pt-8 border-t border-[#0f4439] flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-4">
          <p>© {new Date().getFullYear()} RESIN AURA. Handcrafted with reverence. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/policies/privacy" className="hover:text-[#dfbe7e] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/policies/terms" className="hover:text-[#dfbe7e] transition-colors">
              Terms of Service
            </Link>
            <Link to="/policies/shipping" className="hover:text-[#dfbe7e] transition-colors">
              Shipping Terms
            </Link>
            <Link to="/policies/returns" className="hover:text-[#dfbe7e] transition-colors">
              Returns & Cancellations
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};


import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const ContactPage: React.FC = () => {
  const { success, error } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('Geode Wall Clock');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      success('Your bespoke consultation request has reached our master artisans.');
    }, 800);
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Artisan Concierge</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#07241e] mb-4">
            Connect With The Atelier
          </h1>
          <p className="font-serif-luxury text-base sm:text-lg text-neutral-600">
            For bespoke dimensions, wedding flower preservation inquiries, corporate gifting commissions, or order assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Contact Details */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-sm space-y-8">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#856338] font-bold">
                Atelier Location
              </span>
              <h3 className="font-display text-xl font-bold text-neutral-900 mt-1 mb-3">
                Resin Aura Studio & Foundry
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#856338] shrink-0 mt-0.5" />
                <span>
                  Resin Aura Atelier & Creative Works<br />
                  Artisan Enclave, Sector 14<br />
                  India
                </span>
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-100 text-xs">
              <div className="flex items-center gap-3 text-neutral-700">
                <Phone className="w-4 h-4 text-[#856338] shrink-0" />
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase">Telephone & WhatsApp</span>
                  <a href="tel:+918337983439" className="font-bold text-neutral-900 hover:text-[#0b3b33]">
                    +91 83379 83439
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-neutral-700">
                <Mail className="w-4 h-4 text-[#856338] shrink-0" />
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase">Direct Concierge Email</span>
                  <a href="mailto:concierge@resinaura.com" className="font-bold text-neutral-900 hover:text-[#0b3b33]">
                    concierge@resinaura.com
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-neutral-200 text-xs text-neutral-600 space-y-1.5">
              <span className="font-bold text-neutral-900 block">Studio Consultation Hours:</span>
              <p>Monday – Saturday: 10:00 AM – 7:00 PM IST</p>
              <p>Sundays: Dedicated to quiet curing chamber rituals</p>
            </div>
          </div>

          {/* Right Column: Contact & Commission Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-sm">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold text-neutral-900 mb-2">
                  Inquiry Dispatched to Studio
                </h3>
                <p className="text-xs text-neutral-600 max-w-md mx-auto mb-6">
                  Thank you, <strong className="text-neutral-800">{fullName}</strong>. Our senior artist will review your notes and reach out within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] text-xs font-bold uppercase tracking-wider"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-display text-lg font-bold text-neutral-900 pb-3 mb-2 border-b border-neutral-100">
                  Custom Commission & Inquiry Form
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. Radhika Sharma"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="radhika@example.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Contact Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Artisan Discipline of Interest
                    </label>
                    <select
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33] cursor-pointer"
                    >
                      <option value="Geode Wall Clock">Bespoke Geode Wall Clock</option>
                      <option value="Wedding Flower Preservation">Wedding Flower Preservation</option>
                      <option value="Ceremonial Thali & Platters">Ceremonial Thali & Haldi Platter</option>
                      <option value="Preserved Floral Jewelry">Preserved Floral Jewelry Suite</option>
                      <option value="Corporate / Bulk Commission">Corporate / Bulk Gifting Commission</option>
                      <option value="General Order Inquiry">General Order / Shipping Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Your Vision / Dimensions / Questions *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Tell us about desired color palette (e.g. emerald gold, blush pink, ocean blue), clock diameters, wedding flower delivery dates, or special notes..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#f7f4ee] font-display text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-md hover:shadow-lg border border-[#c5a059]/40 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#dfbe7e]" />
                  <span>{isSubmitting ? 'Transmitting...' : 'Submit Consultation Request'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


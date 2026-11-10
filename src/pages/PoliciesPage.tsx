import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, FileText, Lock } from 'lucide-react';

export const PoliciesPage: React.FC = () => {
  const { policyType } = useParams<{ policyType?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'shipping' | 'returns' | 'privacy' | 'terms'>(
    (policyType as any) || 'shipping'
  );

  useEffect(() => {
    if (policyType && ['shipping', 'returns', 'privacy', 'terms'].includes(policyType)) {
      setActiveTab(policyType as any);
    }
  }, [policyType]);

  const handleTabChange = (tab: 'shipping' | 'returns' | 'privacy' | 'terms') => {
    setActiveTab(tab);
    navigate(`/policies/${tab}`);
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-[#856338] font-bold">
            Transparency & Trust
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#07241e] mt-2 mb-3">
            Business Policies & Guidelines
          </h1>
          <p className="font-serif-luxury text-base text-neutral-600">
            Clear, transparent commitments regarding shipping, returns, privacy, and service terms.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => handleTabChange('shipping')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'shipping'
                ? 'bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] shadow-sm'
                : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Shipping Policy</span>
          </button>

          <button
            onClick={() => handleTabChange('returns')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'returns'
                ? 'bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] shadow-sm'
                : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return & Refund</span>
          </button>

          <button
            onClick={() => handleTabChange('terms')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'terms'
                ? 'bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] shadow-sm'
                : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </button>

          <button
            onClick={() => handleTabChange('privacy')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'privacy'
                ? 'bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] shadow-sm'
                : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200/80 shadow-sm font-sans text-sm text-neutral-700 leading-relaxed space-y-6">
          {activeTab === 'shipping' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-[#07241e] border-b pb-4">
                Shipping & Packaging Policy
              </h2>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">1. Dedicated Protective Packaging</h3>
                <p>
                  Every Resin Aura creation, especially our oversized geode wall clocks and ceremonial platters, is packaged with extreme care. Clocks are housed inside custom high-density protective foam molds and reinforced wooden shipping crates to prevent any flex or glass impact during transit.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">2. Processing & Dispatch Timelines</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Ready-to-Ship Inventory:</strong> Dispatched within 24 to 48 hours of order confirmation.</li>
                  <li><strong>Custom Commissions & Made-to-Order Pieces:</strong> Require 7 to 10 working days of crafting and curing before dispatch.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">3. Shipping Fees & Delivery Windows</h3>
                <p>
                  We offer complimentary express shipping across India on all orders valued above ₹1,999. For orders below this threshold, a standard packaging and courier fee of ₹149 applies. Transit typically takes 3 to 5 business days depending on destination PIN code.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">4. Transit Insurance</h3>
                <p>
                  All shipments dispatched by Resin Aura are fully covered by comprehensive transit insurance. In the unlikely circumstance of damage during delivery, your piece is 100% protected.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-[#07241e] border-b pb-4">
                Return, Replacement & Refund Policy
              </h2>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">1. Handcrafted Nature & Bespoke Originals</h3>
                <p>
                  Due to the bespoke, artistic, and fragile nature of hand-poured epoxy resin artworks, all pieces are non-returnable for simple change of mind once received. Slight organic variations in color swirls, mica flows, and botanical petals are intended aesthetic characteristics.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">2. Damaged or Defective in Transit (Immediate Replacement)</h3>
                <p>
                  If your package arrives with visible physical damage:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Please record an uninterrupted unboxing video upon receiving the wooden crate or parcel.</li>
                  <li>Notify our concierge team within 48 hours at <strong>concierge@resinaura.com</strong> or via WhatsApp at <strong>+91 83379 83439</strong> with the video clip.</li>
                  <li>Upon verification, we will immediately initiate a replacement build or full refund to your original payment mode.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">3. Refund Processing</h3>
                <p>
                  Approved refunds are processed within 5 to 7 business days directly to the original bank account, UPI ID, or card used during checkout.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-[#07241e] border-b pb-4">
                Terms and Conditions
              </h2>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">1. Artisan Agreement</h3>
                <p>
                  By accessing and placing an order on the Resin Aura platform, you acknowledge and agree that each artwork is hand-poured and individually crafted by human artisans.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">2. Intellectual Property</h3>
                <p>
                  All proprietary product photography, brand imagery, logos, descriptive copy, and unique clock designs featured on this website are the intellectual property of Resin Aura. Reproduction without prior written authorization is strictly prohibited.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">3. Pricing and Stock Availability</h3>
                <p>
                  Prices are displayed in Indian Rupees (INR) and are inclusive of all applicable statutory taxes. We reserve the right to revise pricing or retire specific product molds without prior notification.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-[#07241e] border-b pb-4">
                Privacy & Data Security Policy
              </h2>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">1. Information Collection</h3>
                <p>
                  We collect only the essential personal details required to process, fulfill, and deliver your orders: your full name, shipping address, contact phone number, and email address.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">2. Payment Security</h3>
                <p>
                  Resin Aura never stores raw credit card details, debit card numbers, or banking credentials on our servers. All digital transactions are processed through encrypted, PCI-DSS compliant payment gateways.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">3. Zero Third-Party Selling</h3>
                <p>
                  Your information is strictly protected and will never be rented, sold, or shared with unauthorized commercial third parties. Data is used exclusively for consignment updates and internal service improvement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


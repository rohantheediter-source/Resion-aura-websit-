import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Upload,
  MessageCircle,
  ShieldCheck,
  Clock,
  Palette,
  Layers,
  FileText,
  CheckCircle2,
  ChevronRight,
  Info,
  Award,
  ArrowRight,
  Heart,
  Camera,
} from 'lucide-react';
import { customRequestService } from '../services/customRequestService';
import { storageService } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';
import {
  WHATSAPP_DISPLAY_NUMBER,
  POPULAR_COLOR_PALETTES,
  BESPOKE_PRODUCT_CATEGORIES,
} from '../utils/constants';

export const CustomDesignPage: React.FC = () => {
  const { error, success } = useToast();

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [category, setCategory] = useState(BESPOKE_PRODUCT_CATEGORIES[0]);
  const [designDescription, setDesignDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(POPULAR_COLOR_PALETTES[0]);
  const [customColorText, setCustomColorText] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [customText, setCustomText] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Reference Image Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Workflow states: 'form' | 'summary' | 'submitted'
  const [step, setStep] = useState<'form' | 'summary' | 'submitted'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedRequestNumber, setGeneratedRequestNumber] = useState('');
  const [whatsAppUrl, setWhatsAppUrl] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file (JPEG, PNG, or WebP)');
      return;
    }

    setUploadedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setIsUploading(true);
    try {
      const res = await storageService.uploadProductImage(file);
      if (res.url) {
        setPreviewUrl(res.url);
      }
    } catch (_) {
      // Retain preview url
    } finally {
      setIsUploading(false);
    }
  };

  const handleReviewSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      error('Please enter your full name');
      return;
    }
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      error('Please enter a valid 10-digit mobile or WhatsApp number');
      return;
    }
    if (!designDescription.trim()) {
      error('Please provide a short description of your dream design');
      return;
    }

    setStep('summary');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const finalColor = selectedColor.includes('Custom')
    ? (customColorText.trim() || 'Custom Palette')
    : (customColorText.trim() ? `${selectedColor} (${customColorText.trim()})` : selectedColor);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await customRequestService.submitCustomRequest({
        requestType: 'new_custom_design',
        customerName,
        customerPhone,
        customerEmail,
        productName: `Bespoke ${category}`,
        quantity,
        referenceImageUrl: previewUrl,
        customizationDetails: {
          category,
          colors: finalColor,
          size: dimensions.trim() || 'Custom Dimensions to be discussed',
          custom_text: customText.trim(),
          design_preferences: designDescription.trim(),
          additional_notes: additionalInstructions.trim(),
        },
      });

      setGeneratedRequestNumber(result.request.request_number);
      setWhatsAppUrl(result.whatsAppUrl);
      setStep('submitted');
      success('Bespoke inquiry recorded! Opening WhatsApp...');

      // Open WhatsApp in new tab
      window.open(result.whatsAppUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error submitting custom design request:', err);
      error('Could not submit request. Please reach out to us directly on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Luxury Hero Banner */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] text-xs font-semibold uppercase tracking-[0.2em] mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Option B • Bespoke Commissions</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#07241e] tracking-tight mb-4">
            Request a Custom Design
          </h1>
          <p className="font-serif-luxury text-base sm:text-xl text-neutral-600 leading-relaxed">
            From wedding varmala flower preservations to grand boardroom geode tables and custom aerial ocean timepieces — let our master resin artisans turn your vision into heirloom art.
          </p>
        </div>

        {/* 4-Step Process Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#0b3b33] text-[#dfbe7e] font-display font-bold text-sm flex items-center justify-center shrink-0">
              01
            </div>
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-neutral-900">
                Share Your Vision
              </h4>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                Tell us your preferred category, color shades, dimensions, and reference photos.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#0b3b33] text-[#dfbe7e] font-display font-bold text-sm flex items-center justify-center shrink-0">
              02
            </div>
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-neutral-900">
                Artisan WhatsApp Quote
              </h4>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                Our atelier reviews the design and provides final customized pricing and timeline.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#0b3b33] text-[#dfbe7e] font-display font-bold text-sm flex items-center justify-center shrink-0">
              03
            </div>
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-neutral-900">
                Hand-Poured Crafting
              </h4>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                Multi-layer resin casting, authentic 24K leaf gilding, and 72-hour chamber curing.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#0b3b33] text-[#dfbe7e] font-display font-bold text-sm flex items-center justify-center shrink-0">
              04
            </div>
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-neutral-900">
                Insured Wooden Delivery
              </h4>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                Dispatched with custom wood-crate padding, transit insurance, and tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="max-w-4xl mx-auto">
          {step === 'form' && (
            <div className="bg-white rounded-3xl p-6 sm:p-12 border border-neutral-200/80 shadow-sm">
              {/* Mandatory Business Owner Pricing Control Banner */}
              <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3.5">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block uppercase tracking-wider text-[11px] text-amber-800">
                    Artisan Pricing Approval Notice
                  </span>
                  <p className="leading-relaxed">
                    "Your custom design request will be reviewed by our team. Final pricing and delivery details will be shared with you through WhatsApp."
                  </p>
                </div>
              </div>

              <form onSubmit={handleReviewSummary} className="space-y-8">
                {/* 1. Category Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#856338]" />
                    <span>1. Select Desired Product Form or Category *</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {BESPOKE_PRODUCT_CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`p-3 rounded-2xl text-left text-xs font-semibold transition-all border ${
                          category === cat
                            ? 'bg-[#0b3b33] text-[#dfbe7e] border-[#c5a059] shadow-sm'
                            : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Design Vision Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#856338]" />
                    <span>2. Describe Your Desired Design & Creative Ideas *</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your creative ideas freely (e.g., Deep navy ocean waves with white seafoam, raw agate crystal slice centerpiece, natural wooden live-edge border, or preserving wedding vermilion roses in an eternal resin block)..."
                    value={designDescription}
                    onChange={(e) => setDesignDescription(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-neutral-300 text-xs text-neutral-800 focus:ring-2 focus:ring-[#0b3b33] focus:border-transparent outline-none leading-relaxed bg-[#FAF8F5]"
                  />
                </div>

                {/* 3. Color Palette */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#856338]" />
                    <span>3. Preferred Color Palette</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {POPULAR_COLOR_PALETTES.map((pal) => (
                      <button
                        type="button"
                        key={pal}
                        onClick={() => setSelectedColor(pal)}
                        className={`p-3 rounded-xl text-left text-xs font-medium transition-all border ${
                          selectedColor === pal
                            ? 'bg-[#0b3b33] text-[#dfbe7e] border-[#c5a059] font-bold shadow-sm'
                            : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {pal}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Specific color codes, pigments, metallic leaf (Gold, Silver, Rose Gold, Copper)..."
                    value={customColorText}
                    onChange={(e) => setCustomColorText(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                  />
                </div>

                {/* 4. Dimensions & Custom Inscription */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">
                      4. Preferred Size or Dimensions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 18 Inches Round, 24x36 Inches, 3-tier platter..."
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">
                      5. Custom Name / Text / Inscription
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 'Sharma Family • Est. 2024' or Shubh Labh..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                    />
                  </div>
                </div>

                {/* 5. Quantity & Reference Image Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">
                      Quantity Needed
                    </label>
                    <div className="flex items-center border border-neutral-300 rounded-xl bg-[#FAF8F5] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2.5 text-neutral-700 font-bold hover:bg-neutral-200"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-bold text-xs">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-2.5 text-neutral-700 font-bold hover:bg-neutral-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2 flex items-center justify-between">
                      <span>Upload Reference / Inspiration Image</span>
                      <span className="text-[10px] text-neutral-400 font-normal lowercase">(optional)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 hover:border-[#0b3b33] cursor-pointer bg-[#FAF8F5] text-xs text-neutral-600 transition-colors">
                        <Upload className="w-4 h-4 text-[#856338]" />
                        <span className="truncate">
                          {isUploading ? 'Uploading...' : uploadedFile ? uploadedFile.name : 'Choose photo (Room decor, sketch, inspiration)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Inspiration Preview"
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Additional Instructions */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">
                    6. Additional Instructions or Timeline Requirements
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. We will courier dried varmala flowers next week; required before anniversary on 18th..."
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                  />
                </div>

                {/* 7. Contact Details */}
                <div className="pt-6 border-t border-neutral-200 space-y-4">
                  <h4 className="font-display text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    7. Customer Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="WhatsApp Mobile Number *"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address (Optional, for formal quotation & invoices)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-neutral-500">
                    Artisans respond on WhatsApp within a few hours.
                  </span>
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#dfbe7e] font-display text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-xl transition-all border border-[#c5a059]"
                  >
                    <span>Proceed to WhatsApp Summary</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Summary Before WhatsApp */}
          {step === 'summary' && (
            <div className="bg-white rounded-3xl p-6 sm:p-12 border border-neutral-200/80 shadow-sm space-y-8 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-display text-2xl font-bold text-neutral-900">
                  Verify Custom Commission Details
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Review your personalized requirements below before transferring to the Resin Aura WhatsApp Concierge.
                </p>
              </div>

              {/* Summary Breakdown */}
              <div className="bg-[#FAF8F5] rounded-3xl p-6 border border-neutral-200 space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-3 border-b border-neutral-200 gap-1">
                  <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">Commission Type:</span>
                  <span className="font-bold text-neutral-900 text-sm">{category}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-3 border-b border-neutral-200 gap-1">
                  <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">Customer:</span>
                  <span className="font-semibold text-neutral-900">{customerName} • {customerPhone}</span>
                </div>

                <div className="pb-3 border-b border-neutral-200">
                  <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    Design Concept:
                  </span>
                  <p className="text-neutral-800 leading-relaxed font-sans bg-white p-3 rounded-xl border border-neutral-200">
                    {designDescription}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-neutral-200">
                  <div>
                    <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px] block mb-1">Color Palette:</span>
                    <span className="font-medium text-neutral-900">{finalColor}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px] block mb-1">Dimensions:</span>
                    <span className="font-medium text-neutral-900">{dimensions || 'To be finalized'}</span>
                  </div>
                </div>

                {customText && (
                  <div className="pb-3 border-b border-neutral-200">
                    <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px] block mb-1">Custom Inscription:</span>
                    <span className="font-medium text-neutral-900">"{customText}"</span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">Quantity:</span>
                  <span className="font-bold text-neutral-900">{quantity} piece{quantity > 1 ? 's' : ''}</span>
                </div>

                {previewUrl && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">Reference Photo:</span>
                    <img
                      src={previewUrl}
                      alt="Ref"
                      className="w-14 h-14 rounded-xl object-cover border border-neutral-300"
                    />
                  </div>
                )}
              </div>

              {/* Crucial Pricing Disclaimer */}
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800 uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Important Pricing & Quotation Notice</span>
                </div>
                <p className="leading-relaxed font-medium">
                  "Your custom design request will be reviewed by our team. Final pricing and delivery details will be shared with you through WhatsApp."
                </p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Note: Clicking the button below opens WhatsApp with all your selections pre-filled into the chat. Opening WhatsApp does not finalize an order — you will have the chance to review and tap send, and attach more reference photos directly in the conversation.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-6 py-4 rounded-2xl border border-neutral-300 text-neutral-700 font-semibold text-xs hover:bg-neutral-50 transition-colors"
                >
                  Edit Information
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="flex-1 flex items-center justify-center gap-2.5 py-4 px-8 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-display text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>{isSubmitting ? 'Recording In Atelier...' : 'Send Custom Request on WhatsApp'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Submitted State */}
          {step === 'submitted' && (
            <div className="bg-white rounded-3xl p-8 sm:p-14 border border-neutral-200 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-[#856338] font-bold block mb-1">
                  Commission Inquiry Logged
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900">
                  Request #{generatedRequestNumber}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto mt-2 leading-relaxed">
                  Your custom design request has been saved to the Resin Aura atelier database and forwarded to WhatsApp.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-neutral-200 max-w-md mx-auto text-xs text-neutral-600 text-left space-y-3">
                <span className="font-bold text-neutral-900 block">Next Simple Steps:</span>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0b3b33] text-[#dfbe7e] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Open WhatsApp and tap <strong>Send</strong> on the prepared message to {WHATSAPP_DISPLAY_NUMBER}.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0b3b33] text-[#dfbe7e] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Share any extra photos or dimension sketches directly in your chat.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0b3b33] text-[#dfbe7e] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Our senior artist will reply with your personalized quotation and crafting schedule.</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-display text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Launch WhatsApp Now</span>
                </a>
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-[#0b3b33] text-[#dfbe7e] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#07241e] transition-all"
                >
                  Explore Ready Masterpieces
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


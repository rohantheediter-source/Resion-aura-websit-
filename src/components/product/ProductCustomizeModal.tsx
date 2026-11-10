import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Clock,
  Layers,
  Palette,
  FileText,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Product } from '../../types';
import { storageService } from '../../services/storageService';
import { customRequestService } from '../../services/customRequestService';
import { useToast } from '../../contexts/ToastContext';
import {
  WHATSAPP_DISPLAY_NUMBER,
  POPULAR_COLOR_PALETTES,
} from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

interface ProductCustomizeModalProps {
  product: Product;
  selectedVariant?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductCustomizeModal: React.FC<ProductCustomizeModalProps> = ({
  product,
  selectedVariant,
  isOpen,
  onClose,
}) => {
  const { error, success } = useToast();

  // Category detection for product-specific customization options
  const isClock = (product.category_slug || '').includes('clock') || product.name.toLowerCase().includes('clock');
  const isJewelry = (product.category_slug || '').includes('jewelry') || (product.category_slug || '').includes('pendant') || (product.category_slug || '').includes('bangle') || product.name.toLowerCase().includes('ring') || product.name.toLowerCase().includes('pendant') || product.name.toLowerCase().includes('necklace');
  const isPlatter = (product.category_slug || '').includes('ceremonial') || product.name.toLowerCase().includes('thali') || product.name.toLowerCase().includes('platter') || product.name.toLowerCase().includes('coaster') || product.name.toLowerCase().includes('tray');

  // Category-specific states
  const [clockHandsFinish, setClockHandsFinish] = useState('Silent Sweep • Polished 24K Gold Hands');
  const [clockDialStyle, setClockDialStyle] = useState('Roman Numerals (Gold Acrylic)');
  const [jewelryFinding, setJewelryFinding] = useState('24K Gold-Plated Setting (Hypoallergenic)');
  const [botanicalInclusion, setBotanicalInclusion] = useState('Preserved Rose Petals & Gold Flakes');
  const [platterEdgeTrim, setPlatterEdgeTrim] = useState('Hand-Gilded 24K Gold Leaf Rim');
  const [platterHandles, setPlatterHandles] = useState('Polished Vintage Brass Handles');

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState(POPULAR_COLOR_PALETTES[0]);
  const [customColorText, setCustomColorText] = useState('');
  const [preferredSize, setPreferredSize] = useState(
    product.dimensions || (isClock ? '16 Inches (Round)' : isPlatter ? '10 Inches Platter' : 'Standard Edition')
  );
  const [customText, setCustomText] = useState('');
  const [designPreferences, setDesignPreferences] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [quantity, setQuantity] = useState(1);


  // File upload state
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Workflow states: 'form' | 'summary' | 'submitted'
  const [step, setStep] = useState<'form' | 'summary' | 'submitted'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedWhatsAppUrl, setGeneratedWhatsAppUrl] = useState('');
  const [generatedRequestNumber, setGeneratedRequestNumber] = useState('');

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file (JPEG, PNG, or WebP)');
      return;
    }

    setUploadedImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreviewUrl(localUrl);

    // Upload immediately in background to get public url
    setIsUploadingImage(true);
    try {
      const res = await storageService.uploadProductImage(file);
      if (res.url) {
        setImagePreviewUrl(res.url);
      }
    } catch (_) {
      // Keep local preview url
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleProceedToSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      error('Please provide your name');
      return;
    }
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      error('Please enter a valid 10-digit mobile or WhatsApp number');
      return;
    }

    setStep('summary');
  };

  const handleFinalSubmitAndWhatsApp = async () => {
    setIsSubmitting(true);
    try {
      const finalColor = selectedColor.includes('Custom')
        ? (customColorText.trim() || 'Custom Palette')
        : (customColorText.trim() ? `${selectedColor} (${customColorText.trim()})` : selectedColor);

      const result = await customRequestService.submitCustomRequest({
        requestType: 'existing_product',
        customerName,
        customerPhone,
        customerEmail,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        quantity,
        referenceImageUrl: imagePreviewUrl,
        customizationDetails: {
          category: product.category_name,
          colors: finalColor,
          size: preferredSize,
          custom_text: customText.trim(),
          design_preferences: designPreferences.trim(),
          additional_notes: additionalNotes.trim(),
          selected_variant: selectedVariant,
          ...(isClock ? { clock_hands: clockHandsFinish, dial_style: clockDialStyle } : {}),
          ...(isJewelry ? { metal_setting: jewelryFinding, floral_element: botanicalInclusion } : {}),
          ...(isPlatter ? { edge_trim: platterEdgeTrim, handles_style: platterHandles } : {}),
        },

      });

      setGeneratedRequestNumber(result.request.request_number);
      setGeneratedWhatsAppUrl(result.whatsAppUrl);
      setStep('submitted');
      success('Customization request recorded! Opening WhatsApp...');

      // Open WhatsApp in new tab
      window.open(result.whatsAppUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error submitting custom request:', err);
      error('Could not complete request. Please contact us directly on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalColorDisplay = selectedColor.includes('Custom')
    ? (customColorText.trim() || 'Custom Palette')
    : (customColorText.trim() ? `${selectedColor} (${customColorText.trim()})` : selectedColor);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#c5a059]/40 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="bg-[#07241e] text-[#dfbe7e] px-6 py-4 flex items-center justify-between border-b border-[#c5a059]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0b3b33] border border-[#c5a059] flex items-center justify-center text-[#dfbe7e] shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold tracking-widest uppercase">
                Bespoke Atelier Customization
              </h3>
              <p className="text-[10px] text-neutral-300 tracking-wider uppercase font-mono">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Customization Form */}
          {step === 'form' && (
            <form onSubmit={handleProceedToSummary} className="space-y-6">
              {/* Product Reference Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-neutral-200">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-neutral-200 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-[#856338] font-bold block">
                    Base Model • {product.category_name}
                  </span>
                  <h4 className="font-display text-sm font-bold text-neutral-900 truncate">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs mt-0.5">
                    <span className="font-bold text-[#0b3b33]">Catalog Base: {formatCurrency(product.price)}</span>
                    {selectedVariant && (
                      <span className="text-neutral-500">• {selectedVariant}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* CRITICAL BUSINESS DISCLOSURE BANNER */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block uppercase tracking-wider text-[11px] text-amber-800">
                    Artisan Pricing Approval Notice
                  </span>
                  <p className="leading-relaxed">
                    "Your custom design request will be reviewed by our team. Final pricing and delivery details will be shared with you through WhatsApp."
                  </p>
                </div>
              </div>

              {/* Section A: Customer Contact */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
                  1. Your Contact Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] focus:border-transparent outline-none bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp Phone Number *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] focus:border-transparent outline-none bg-white"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email Address (Optional, for formal PDF quote)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] focus:border-transparent outline-none bg-white"
                  />
                </div>
              </div>

              {/* Section B: Color Selection */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#856338]" />
                  <span>2. Preferred Color Palette</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_COLOR_PALETTES.map((palette) => (
                    <button
                      type="button"
                      key={palette}
                      onClick={() => setSelectedColor(palette)}
                      className={`px-3 py-2 rounded-xl text-left text-xs transition-all border ${
                        selectedColor === palette
                          ? 'bg-[#0b3b33] text-[#dfbe7e] border-[#c5a059] font-bold shadow-sm'
                          : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {palette}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or describe specific pigment / metallic flake shades..."
                  value={customColorText}
                  onChange={(e) => setCustomColorText(e.target.value)}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                />
              </div>

              {/* Section C: Dimensions / Size */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#856338]" />
                  <span>3. Preferred Size or Dimensions</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    isClock
                      ? 'e.g. 14", 16", 18", 24" Round or Custom Size'
                      : isPlatter
                      ? 'e.g. 8" Thali, 10" Tray, 12" Grand Platter'
                      : 'e.g. Universal Ring, 18" Chain, or Custom Dimensions'
                  }
                  value={preferredSize}
                  onChange={(e) => setPreferredSize(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                />
              </div>

              {/* Product-Specific Customization Controls (Filtered by Product Category) */}
              {isClock && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#0b3b33]/5 border border-[#c5a059]/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b3b33] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#856338]" />
                    <span>Wall Clock Atelier Specifications</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Clock Hands Movement & Finish
                      </label>
                      <select
                        value={clockHandsFinish}
                        onChange={(e) => setClockHandsFinish(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-800 focus:ring-2 focus:ring-[#0b3b33]"
                      >
                        <option>Silent Sweep • Polished 24K Gold Hands</option>
                        <option>Silent Sweep • Mirror Silver Hands</option>
                        <option>Silent Sweep • Matte Midnight Black Hands</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Dial Style / Hour Markers
                      </label>
                      <select
                        value={clockDialStyle}
                        onChange={(e) => setClockDialStyle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-800 focus:ring-2 focus:ring-[#0b3b33]"
                      >
                        <option>Roman Numerals (Gold Acrylic)</option>
                        <option>Minimalist Line Dash Markers</option>
                        <option>Raw Natural Quartz Geode Points</option>
                        <option>Numberless Minimalist Dial</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {isJewelry && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#0b3b33]/5 border border-[#c5a059]/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b3b33] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#856338]" />
                    <span>Jewelry Setting & Botanical Inclusions</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Setting / Hardware Metal
                      </label>
                      <select
                        value={jewelryFinding}
                        onChange={(e) => setJewelryFinding(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-800 focus:ring-2 focus:ring-[#0b3b33]"
                      >
                        <option>24K Gold-Plated Setting (Hypoallergenic)</option>
                        <option>925 Sterling Silver Setting</option>
                        <option>Rose Gold Finish Setting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Botanical / Mineral Elements
                      </label>
                      <select
                        value={botanicalInclusion}
                        onChange={(e) => setBotanicalInclusion(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-800 focus:ring-2 focus:ring-[#0b3b33]"
                      >
                        <option>Preserved Rose Petals & Gold Flakes</option>
                        <option>Baby's Breath (Gypsophila) & Silver Leaf</option>
                        <option>Forget-Me-Nots & Crushed Opal</option>
                        <option>Custom Customer Dried Flowers</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {isPlatter && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#0b3b33]/5 border border-[#c5a059]/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b3b33] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#856338]" />
                    <span>Platter Rim & Hardware Finish</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Rim Bevel & Gilded Edge
                      </label>
                      <select
                        value={platterEdgeTrim}
                        onChange={(e) => setPlatterEdgeTrim(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-800 focus:ring-2 focus:ring-[#0b3b33]"
                      >
                        <option>Hand-Gilded 24K Gold Leaf Rim</option>
                        <option>Raw Natural Agate Geode Edge</option>
                        <option>Silver Foil Crystal Beveled Edge</option>
                        <option>Smooth Clear Polished Rim</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Handles / Hardware
                      </label>
                      <select
                        value={platterHandles}
                        onChange={(e) => setPlatterHandles(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-800 focus:ring-2 focus:ring-[#0b3b33]"
                      >
                        <option>Polished Vintage Brass Handles</option>
                        <option>Natural Quartz Cluster Knob Handles</option>
                        <option>Flush Beveled Edge (No Handles)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Section D: Custom Name / Inscription */}

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#856338]" />
                  <span>4. Custom Name, Monogram or Inscription</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 'The Kapoors • 2024' or couple initials in gold acrylic"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                />
              </div>

              {/* Section E: Design Preferences & Special Instructions */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
                  5. Design Preferences & Additional Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Heavy geode crystal cluster on top-right, translucent resin ripples, metallic gold rim beveling..."
                  value={designPreferences}
                  onChange={(e) => setDesignPreferences(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="Any deadline or special requirements (e.g. Wedding gift needed by 25th)..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#0b3b33] outline-none"
                />
              </div>

              {/* Section F: Quantity & Reference Image Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1.5">
                    Quantity
                  </label>
                  <div className="flex items-center border border-neutral-300 rounded-xl bg-[#FAF8F5] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3.5 py-2 text-neutral-600 font-bold hover:text-neutral-900"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 text-xs font-bold text-center flex-1">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3.5 py-2 text-neutral-600 font-bold hover:text-neutral-900"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1.5">
                    Reference Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 hover:border-[#0b3b33] cursor-pointer bg-[#FAF8F5] text-xs text-neutral-600 transition-colors">
                      <Upload className="w-4 h-4 text-[#856338]" />
                      <span>{isUploadingImage ? 'Uploading image...' : uploadedImageFile ? uploadedImageFile.name : 'Upload sample photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imagePreviewUrl && (
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Submit to Summary Button */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#dfbe7e] font-display text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all border border-[#c5a059]/40"
                >
                  <span>Review Customization Summary</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Customization Summary */}
          {step === 'summary' && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-display text-lg font-bold text-neutral-900">
                  Customization Summary
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Please verify your personalized selections before connecting to WhatsApp.
                </p>
              </div>

              {/* Summary Details Card */}
              <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-neutral-200/80 space-y-3 text-xs">
                <div className="flex justify-between pb-3 border-b border-neutral-200">
                  <span className="text-neutral-500">Base Product:</span>
                  <span className="font-bold text-neutral-900 text-right">{product.name}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-neutral-200">
                  <span className="text-neutral-500">Customer:</span>
                  <span className="font-semibold text-neutral-900 text-right">{customerName} ({customerPhone})</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-neutral-200">
                  <span className="text-neutral-500">Selected Colors:</span>
                  <span className="font-semibold text-neutral-900 text-right max-w-[280px]">{finalColorDisplay}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-neutral-200">
                  <span className="text-neutral-500">Dimensions:</span>
                  <span className="font-semibold text-neutral-900 text-right">{preferredSize}</span>
                </div>
                {isClock && (
                  <div className="flex justify-between pb-3 border-b border-neutral-200">
                    <span className="text-neutral-500">Clock Movement & Dial:</span>
                    <span className="font-semibold text-neutral-900 text-right max-w-[280px]">
                      {clockHandsFinish} • {clockDialStyle}
                    </span>
                  </div>
                )}
                {isJewelry && (
                  <div className="flex justify-between pb-3 border-b border-neutral-200">
                    <span className="text-neutral-500">Jewelry Metal & Botanical:</span>
                    <span className="font-semibold text-neutral-900 text-right max-w-[280px]">
                      {jewelryFinding} • {botanicalInclusion}
                    </span>
                  </div>
                )}
                {isPlatter && (
                  <div className="flex justify-between pb-3 border-b border-neutral-200">
                    <span className="text-neutral-500">Platter Rim & Hardware:</span>
                    <span className="font-semibold text-neutral-900 text-right max-w-[280px]">
                      {platterEdgeTrim} • {platterHandles}
                    </span>
                  </div>
                )}
                {customText && (

                  <div className="flex justify-between pb-3 border-b border-neutral-200">
                    <span className="text-neutral-500">Inscription / Name:</span>
                    <span className="font-semibold text-neutral-900 text-right">"{customText}"</span>
                  </div>
                )}
                {designPreferences && (
                  <div className="flex justify-between pb-3 border-b border-neutral-200">
                    <span className="text-neutral-500">Design Preferences:</span>
                    <span className="font-medium text-neutral-800 text-right max-w-[280px]">{designPreferences}</span>
                  </div>
                )}
                <div className="flex justify-between pb-3 border-b border-neutral-200">
                  <span className="text-neutral-500">Quantity:</span>
                  <span className="font-bold text-neutral-900">{quantity} units</span>
                </div>
                {imagePreviewUrl && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-neutral-500">Reference Image:</span>
                    <img
                      src={imagePreviewUrl}
                      alt="Ref"
                      className="w-12 h-12 rounded-lg object-cover border border-neutral-300"
                    />
                  </div>
                )}
              </div>

              {/* Crucial Price Disclaimer Notice */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Atelier Price & Delivery Notice
                </span>
                <p className="leading-relaxed">
                  "Your custom design request will be reviewed by our team. Final pricing and delivery details will be shared with you through WhatsApp."
                </p>
                <p className="text-[11px] text-amber-700/90 pt-1">
                  * Note: Opening WhatsApp does not confirm an order immediately. You can review the pre-filled message and tap send. You may also send additional reference photos directly in the WhatsApp chat.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-5 py-3 rounded-2xl border border-neutral-300 text-neutral-700 font-semibold text-xs hover:bg-neutral-50"
                >
                  Edit Selections
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmitAndWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-display text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>{isSubmitting ? 'Recording Request...' : 'Send Custom Request on WhatsApp'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Submitted Confirmation State */}
          {step === 'submitted' && (
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#856338] font-bold block mb-1">
                  Request Dispatched to Atelier
                </span>
                <h4 className="font-display text-xl font-bold text-neutral-900">
                  Request #{generatedRequestNumber}
                </h4>
                <p className="text-xs text-neutral-600 max-w-md mx-auto mt-2 leading-relaxed">
                  Your customization request has been stored and pre-filled into WhatsApp. If WhatsApp did not open automatically, click the button below.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-neutral-200 max-w-md mx-auto text-xs text-neutral-600 text-left space-y-2">
                <span className="font-bold text-neutral-900 block">Next Steps:</span>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#0b3b33] text-[#dfbe7e] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Tap <strong>Send</strong> in your WhatsApp chat with {WHATSAPP_DISPLAY_NUMBER}.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#0b3b33] text-[#dfbe7e] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Attach any high-resolution photos or inspiration images in the chat.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#0b3b33] text-[#dfbe7e] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Our artisan team will review and quote your final personalized price and delivery timeline.</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={generatedWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-display text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Re-open WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-2xl bg-[#0b3b33] text-[#dfbe7e] font-display text-xs font-bold uppercase tracking-wider"
                >
                  Back to Artwork
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


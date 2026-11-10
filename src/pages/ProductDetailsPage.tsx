import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Product } from '../types';
import { productsService } from '../services/productsService';
import { formatCurrency } from '../utils/formatters';
import { RatingStars } from '../components/common/RatingStars';
import { ProductCard } from '../components/common/ProductCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { ProductCustomizeModal } from '../components/product/ProductCustomizeModal';

export const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<string>('Standard Artisan Edition');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'care'>('details');
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const found = await productsService.getProductBySlug(slug);
        if (isMounted && found) {
          setProduct(found);
          setSelectedImage(found.image || (found.images && found.images[0]) || '');
          setQuantity(1);

          // Load related products
          const allInCat = await productsService.getProducts(found.category_slug);
          if (isMounted) {
            setRelatedProducts(allInCat.filter((p) => p.id !== found.id).slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProduct();
    window.scrollTo(0, 0);
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingSpinner label="Revealing artisanal details..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h2 className="font-display text-2xl font-bold text-neutral-800 mb-4">Masterpiece Not Found</h2>
        <p className="text-neutral-500 mb-6">
          The requested resin artwork may have been retired or moved to the private archive.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] text-xs font-bold uppercase tracking-wider shadow-md"
        >
          Return to Gallery
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const clockVariants = ['14 Inches (Standard)', '16 Inches (Grand Salon)', '18 Inches (Statement)'];
  const jewelryVariants = ['Gold-Plated Findings', 'Sterling Silver Findings'];
  const isClock = product.category_slug === 'wall-clocks';
  const variants = isClock ? clockVariants : jewelryVariants;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant);
    navigate('/cart');
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider mb-8">
          <Link to="/" className="hover:text-neutral-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <Link to="/shop" className="hover:text-neutral-900">Gallery</Link>
          {product.category_slug && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              <Link to={`/shop?category=${product.category_slug}`} className="hover:text-neutral-900">
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-900 font-semibold truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main Product Showcase Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-white p-6 sm:p-10 rounded-3xl border border-neutral-200/80 shadow-sm mb-16">
          {/* Left: Gallery & Zoom Display */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnail Row/Column */}
            {product.images && product.images.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible shrink-0 pb-2 sm:pb-0">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === imgUrl ? 'border-[#0b3b33] shadow-md scale-95' : 'border-neutral-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-inner group">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />

              {/* Floating badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_featured && (
                  <span className="px-3 py-1 rounded-full bg-[#0b3b33] text-[#dfbe7e] text-[10px] font-bold uppercase tracking-widest border border-[#c5a059]/40 shadow-sm">
                    Signature Atelier
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    {discountPercent}% Savings
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md shadow-md transition-all ${
                  inWishlist
                    ? 'bg-rose-50 text-rose-500 border border-rose-200'
                    : 'bg-white/80 text-neutral-600 hover:text-rose-500 hover:bg-white'
                }`}
                title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right: Product Purchase Details */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#856338] font-bold mb-2">
                <span>{product.category_name}</span>
                <span className="text-neutral-400 font-mono text-[11px]">SKU: {product.sku}</span>
              </div>

              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-neutral-900 mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
                <RatingStars rating={product.rating || 5.0} count={product.review_count || 12} size="md" />
                <span className="text-xs text-neutral-400">•</span>
                <span className="text-xs text-[#0b3b33] font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#c5a059]" /> Verified Atelier Original
                </span>
              </div>

              {/* Price Block */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-display text-3xl font-bold text-[#0b3b33]">
                  {formatCurrency(product.price)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-base text-neutral-400 line-through">
                    {formatCurrency(product.compare_at_price)}
                  </span>
                )}
                <span className="text-xs text-neutral-500">Taxes included</span>
              </div>

              {/* Description Snippet */}
              <p className="text-sm text-neutral-600 leading-relaxed mb-6 font-sans">
                {product.description}
              </p>

              {/* Variant Selector */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest font-bold text-neutral-700 mb-2">
                  Select Dimension / Finish:
                </label>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        selectedVariant === v
                          ? 'bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] shadow-sm'
                          : 'bg-[#FAF8F5] text-neutral-700 border border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity and Stock */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-neutral-300 rounded-xl bg-[#FAF8F5] overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2 text-neutral-600 hover:text-neutral-900 font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold text-neutral-900 min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                    className="px-3.5 py-2 text-neutral-600 hover:text-neutral-900 font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="text-xs">
                  {product.stock > 0 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      In Studio Stock ({product.stock} units available)
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">
                      Made To Order (5-7 days crafting time)
                    </span>
                  )}
                </div>
              </div>

              {/* Option A: Customize This Product Button & Bespoke Banner */}
              <div className="mb-6 p-4 rounded-2xl bg-[#07241e]/5 border border-[#c5a059]/40 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#856338]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#07241e]">
                      Need Bespoke Colors or Sizing?
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#856338] bg-[#dfbe7e]/20 px-2.5 py-0.5 rounded-full border border-[#c5a059]/30">
                    Bespoke Available
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Personalize with custom color palettes, specific wall dimensions, or golden family name inscriptions.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCustomizeModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#07241e] font-display text-xs font-bold uppercase tracking-[0.16em] transition-all border border-[#c5a059] shadow-sm hover:shadow"
                >
                  <Sparkles className="w-4 h-4 text-[#c5a059]" />
                  <span>Customize This Product</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#f7f4ee] font-display text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-md hover:shadow-lg border border-[#c5a059]/40 disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4 text-[#dfbe7e]" />
                  <span>Add To Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#07241e] font-display text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-md hover:shadow-gold-glow disabled:opacity-50"
                >
                  <span>Buy Now</span>
                </button>
              </div>
            </div>

            {/* Assurance Perks */}
            <div className="pt-6 border-t border-neutral-100 grid grid-cols-2 gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#856338] shrink-0" />
                <span>Complimentary Wooden Crate Shipping</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#856338] shrink-0" />
                <span>Transit Insurance Included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed In-Depth Specifications & Care */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm mb-20">
          <div className="flex border-b border-neutral-200 gap-8 mb-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'details'
                  ? 'border-[#0b3b33] text-[#0b3b33]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Artisanal Story
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'specs'
                  ? 'border-[#0b3b33] text-[#0b3b33]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('care')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'care'
                  ? 'border-[#0b3b33] text-[#0b3b33]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Care & Longevity
            </button>
          </div>

          <div className="font-sans text-sm text-neutral-700 leading-relaxed">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <p>{product.story || 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.'}</p>
                <p>
                  Every artwork in the Resin Aura collection is made with high-clarity optical resin, 24K gold foil minerals, and naturally preserved flora. Because each step is executed by hand, slight natural variations in veining and floral geometry are celebrated hallmarks of authentic art.
                </p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-neutral-200">
                  <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">Dimensions</span>
                  <p className="font-semibold text-neutral-900">{product.dimensions || 'Custom Artisan Proportions'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-neutral-200">
                  <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">Core Materials</span>
                  <p className="font-semibold text-neutral-900">{product.material || 'Optical Grade UV Epoxy, Gold Minerals'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-neutral-200">
                  <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">Curing Chamber Cycle</span>
                  <p className="font-semibold text-neutral-900">{product.cure_time || '72 Hours Multi-Stage Curing'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-neutral-200">
                  <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">Crafting Origin</span>
                  <p className="font-semibold text-neutral-900">Resin Aura Artisan Atelier, India</p>
                </div>
              </div>
            )}

            {activeTab === 'care' && (
              <div className="space-y-3">
                <p className="font-semibold text-neutral-900">To maintain the crystal clarity and luster of your resin piece:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
                  <li>Gently dust using a dry, ultra-soft microfiber cloth.</li>
                  <li>Avoid using abrasive sponges, harsh alcohol, ammonia, or chemical window cleaners.</li>
                  <li>Although our formula contains premium UV inhibitors, avoid prolonged direct outdoor desert sunlight to preserve pigments for decades.</li>
                  <li>For wall clocks, handle with clean hands when hanging; the clock mechanism is delicate quartz sweep.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related Creations */}
        {relatedProducts.length > 0 && (
          <div className="mb-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-[#856338] font-bold">Harmonious Pairings</span>
                <h3 className="font-display text-2xl font-bold text-[#07241e] mt-1">
                  More From {product.category_name}
                </h3>
              </div>
              <Link
                to={`/shop?category=${product.category_slug}`}
                className="text-xs font-bold uppercase tracking-wider text-[#0b3b33] hover:text-[#c5a059]"
              >
                View Category &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}

        {/* Bespoke Product Customization Modal */}
        <ProductCustomizeModal
          product={product}
          selectedVariant={selectedVariant}
          isOpen={isCustomizeModalOpen}
          onClose={() => setIsCustomizeModalOpen(false)}
        />
      </div>
    </div>
  );
};



import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { RatingStars } from './RatingStars';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div
      className={`group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-luxury-hover transition-all duration-500 ${className}`}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50 product-card-zoom">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.image || '/images/products/da818ee20766a8244b4a924dd001d4c1.png'}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/products/da818ee20766a8244b4a924dd001d4c1.png';
            }}
          />
        </Link>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.is_featured && (
            <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059]/40 shadow-sm">
              Signature
            </span>
          )}
          {product.is_bestseller && (
            <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-[#c5a059] text-white shadow-sm">
              Bestseller
            </span>
          )}
          {product.is_new_arrival && !product.is_bestseller && (
            <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-neutral-900 text-white shadow-sm">
              New
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-tight rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {discountPercent}% OFF
            </span>
          )}
          {product.stock <= 0 && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full bg-red-600 text-white shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Action Buttons Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button
            onClick={() => toggleWishlist(product)}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
              inWishlist
                ? 'bg-rose-50 text-rose-500 border border-rose-200'
                : 'bg-white/80 text-neutral-600 hover:text-rose-500 hover:bg-white border border-neutral-200/60'
            }`}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500' : ''}`} />
          </button>
          
          <Link
            to={`/product/${product.slug}`}
            className="p-2.5 rounded-full bg-white/80 text-neutral-600 hover:text-[#0b3b33] hover:bg-white backdrop-blur-md transition-all duration-300 shadow-md border border-neutral-200/60 opacity-0 group-hover:opacity-100"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Add To Cart Slide-up button on desktop */}
        {product.stock > 0 && (
          <div className="absolute bottom-3 inset-x-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hidden sm:block">
            <button
              onClick={() => addToCart(product, 1)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0b3b33]/95 hover:bg-[#07241e] text-[#f7f4ee] text-xs font-semibold uppercase tracking-wider backdrop-blur-md border border-[#c5a059]/40 shadow-lg transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#dfbe7e]" />
              Quick Add
            </button>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
            <span>{product.category_name || 'Handmade Resin Art'}</span>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-amber-600 font-medium">Only {product.stock} left</span>
            )}
          </div>

          <Link to={`/product/${product.slug}`} className="block group-hover:text-[#0b3b33] transition-colors">
            <h3 className="font-serif-luxury text-base font-semibold text-neutral-900 line-clamp-1 group-hover:underline">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-neutral-500 line-clamp-2 mt-1 mb-2.5 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div>
          <div className="mb-2">
            <RatingStars rating={product.rating || 5.0} count={product.review_count} />
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-neutral-100">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-base font-bold text-[#0b3b33]">
                {formatCurrency(product.price)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatCurrency(product.compare_at_price)}
                </span>
              )}
            </div>

            {/* Mobile quick add button */}
            <button
              onClick={() => addToCart(product, 1)}
              disabled={product.stock <= 0}
              className="sm:hidden p-2 rounded-lg bg-[#0b3b33] text-[#dfbe7e] disabled:bg-neutral-200 disabled:text-neutral-400"
              aria-label="Add to cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


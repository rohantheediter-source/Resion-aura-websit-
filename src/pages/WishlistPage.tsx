import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';

export const WishlistPage: React.FC = () => {
  const { wishlist, totalWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (totalWishlist === 0) {
    return (
      <div className="bg-[#FAF8F5] min-h-[70vh] flex items-center justify-center py-20 px-4">
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Save your favorite geode clocks, botanical pendants, and ceremonial platters to admire or commission later."
          actionLabel="Explore Collections"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-[#856338] font-bold">
            Private Curation
          </span>
          <h1 className="font-display text-3xl font-bold text-[#07241e] mt-1">
            Saved Bespoke Works ({totalWishlist})
          </h1>
          <p className="font-serif-luxury text-base text-neutral-600 mt-1">
            Artworks reserved in your private consideration list.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                <Link to={`/product/${item.product.slug}`}>
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </Link>
                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-neutral-400 hover:text-red-500 shadow-md backdrop-blur-sm"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#856338] font-bold">
                    {item.product.category_name}
                  </span>
                  <Link to={`/product/${item.product.slug}`}>
                    <h3 className="font-serif-luxury text-base font-semibold text-neutral-900 hover:text-[#0b3b33] line-clamp-1 mt-0.5">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="font-display text-base font-bold text-[#0b3b33] mt-2">
                    {formatCurrency(item.product.price)}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100">
                  <button
                    onClick={() => {
                      addToCart(item.product, 1);
                      removeFromWishlist(item.productId);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0b3b33] hover:bg-[#07241e] text-[#f7f4ee] text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#dfbe7e]" />
                    <span>Move To Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


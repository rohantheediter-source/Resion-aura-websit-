import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    totalItems,
    subtotal,
    shippingFee,
    freeShippingThreshold,
    finalTotal,
    isFreeShipping,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (cart.length === 0) {
    return (
      <div className="bg-[#FAF8F5] min-h-[70vh] flex items-center justify-center py-20 px-4">
        <EmptyState
          icon={ShoppingBag}
          title="Your Artisan Cart is Empty"
          description="Explore our gallery of luxury resin clocks, floral jewelry suites, and auspicious pooja platters to begin your bespoke collection."
          actionLabel="Explore Gallery"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#856338] font-bold">
              Shopping Consignment
            </span>
            <h1 className="font-display text-3xl font-bold text-[#07241e] mt-1">
              Your Curated Bag ({totalItems} {totalItems === 1 ? 'Piece' : 'Pieces'})
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-neutral-400 hover:text-red-600 transition-colors"
          >
            Clear Entire Bag
          </button>
        </div>

        {/* Free Shipping Progress Notification */}
        <div className="mb-8 p-4 rounded-2xl bg-white border border-[#c5a059]/40 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="flex items-center gap-2 text-[#0b3b33]">
              <Truck className="w-4 h-4 text-[#c5a059]" />
              {isFreeShipping ? (
                <span>Unlocked Complimentary Express Shipping!</span>
              ) : (
                <span>
                  Add <strong className="text-[#856338]">{formatCurrency(amountNeededForFreeShipping)}</strong> more to unlock Free Express Delivery
                </span>
              )}
            </span>
            <span className="text-neutral-500">{progressPercent}%</span>
          </div>
          <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0b3b33] h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-sm gap-4 transition-all hover:border-[#c5a059]/40"
              >
                {/* Image & Basic Details */}
                <div className="flex items-center gap-4 flex-1">
                  <Link
                    to={`/product/${item.product.slug}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#856338] font-bold">
                      {item.product.category_name}
                    </span>
                    <Link to={`/product/${item.product.slug}`}>
                      <h3 className="font-serif-luxury text-base font-semibold text-neutral-900 hover:text-[#0b3b33] line-clamp-1">
                        {item.product.name}
                      </h3>
                    </Link>
                    {item.selectedVariant && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[11px] text-neutral-600 border border-neutral-200 mt-1">
                        {item.selectedVariant}
                      </span>
                    )}
                    <div className="text-xs font-bold text-[#0b3b33] mt-1.5 sm:hidden">
                      {formatCurrency(item.product.price)} each
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <div className="flex items-center border border-neutral-300 rounded-xl bg-[#FAF8F5] overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900 font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-neutral-900 min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900 font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[5rem]">
                    <span className="font-display text-base font-bold text-[#0b3b33]">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-4 flex justify-between items-center text-xs text-neutral-500">
              <Link to="/shop" className="hover:text-[#0b3b33] font-semibold flex items-center gap-1">
                &larr; Continue Exploring Gallery
              </Link>
            </div>
          </div>

          {/* Right: Order Summary Card */}
          <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-sm sticky top-28">
            <h3 className="font-display text-lg font-bold text-neutral-900 pb-4 mb-4 border-b border-neutral-100">
              Summary of Investment
            </h3>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Artisan Wooden Crate & Shipping</span>
                <span>
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-bold uppercase tracking-wider">Free</span>
                  ) : (
                    <span className="font-semibold text-neutral-900">{formatCurrency(shippingFee)}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Transit Insurance</span>
                <span className="text-emerald-700 font-bold uppercase tracking-wider">Included</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Applicable Taxes (GST)</span>
                <span className="text-neutral-500">Inclusive</span>
              </div>

              <div className="pt-4 mt-2 border-t border-neutral-200 flex justify-between items-baseline">
                <div>
                  <span className="font-display text-sm font-bold text-neutral-900">Total Investment</span>
                  <p className="text-[10px] text-neutral-400">Final checkout price</p>
                </div>
                <span className="font-display text-2xl font-bold text-[#0b3b33]">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#f7f4ee] font-display text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-md hover:shadow-lg border border-[#c5a059]/40"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 text-[#dfbe7e]" />
            </button>

            <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2 text-[11px] text-neutral-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#856338]" />
                <span>Encrypted 256-bit Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#856338]" />
                <span>Certificate of Authenticity with each order</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


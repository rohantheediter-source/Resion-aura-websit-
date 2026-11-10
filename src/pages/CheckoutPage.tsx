import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  QrCode,
  Building,
  Banknote,
  Lock,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ordersService } from '../services/ordersService';
import { formatCurrency } from '../utils/formatters';
import { ShippingAddress, PaymentMethod } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, subtotal, shippingFee, finalTotal, clearCart } = useCart();
  const { user, profile, isLoading } = useAuth();
  const { error } = useToast();

  // 1. Mandatory customer authentication check
  useEffect(() => {
    if (!isLoading && !user) {
      // Store redirect target in sessionStorage for OAuth resilience
      sessionStorage.setItem('resin_aura_auth_redirect', '/checkout');
      // Redirect to /login with state and query param
      navigate('/login?redirect=/checkout', {
        replace: true,
        state: { from: location },
      });
    }
  }, [user, isLoading, navigate, location]);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country] = useState('India');
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync user profile fields when loaded
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (profile?.full_name && !fullName) {
      setFullName(profile.full_name);
    }
    if (profile?.phone && !phone) {
      setPhone(profile.phone);
    }
  }, [user, profile]);

  // Loading state handling to avoid flash
  if (isLoading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen flex items-center justify-center py-20">
        <LoadingSpinner label="Verifying Customer Clearance..." />
      </div>
    );
  }

  // If unauthenticated, render spinner while redirecting
  if (!user) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen flex items-center justify-center py-20">
        <LoadingSpinner label="Directing to Sign In..." />
      </div>
    );
  }

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      error('Please sign in to complete your order.');
      navigate('/login?redirect=/checkout', { state: { from: location } });
      return;
    }

    if (!fullName.trim() || !phone.trim() || !streetAddress.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      error('Please complete all required delivery details');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      error('Please enter a valid notification email');
      return;
    }

    setIsSubmitting(true);
    try {
      const shippingAddress: ShippingAddress = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        streetAddress: streetAddress.trim(),
        apartment: apartment.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country,
      };

      const order = await ordersService.createOrder({
        userId: user?.id,
        guestEmail: email.trim(),
        guestName: fullName.trim(),
        guestPhone: phone.trim(),
        shippingAddress,
        cart,
        subtotal,
        shippingFee,
        totalAmount: finalTotal,
        paymentMethod,
        notes: notes.trim(),
      });

      // Clear the cart
      clearCart();

      // Navigate to order confirmation
      navigate(`/order-confirmation/${order.order_number}`);
    } catch (err: any) {
      error(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Back */}
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Curated Bag</span>
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold text-[#07241e] mb-8">
          Secure Bespoke Checkout
        </h1>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Delivery & Payment Details */}
          <div className="lg:col-span-7 space-y-8">
            {/* Contact Information */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-sm">
              <h2 className="font-display text-base font-bold text-neutral-900 uppercase tracking-wider mb-4 pb-3 border-b border-neutral-100">
                1. Contact & Consignment Updates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="collector@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-sm">
              <h2 className="font-display text-base font-bold text-neutral-900 uppercase tracking-wider mb-4 pb-3 border-b border-neutral-100">
                2. Shipping & Delivery Destination
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Collector or Recipient Name"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Street Address & House/Villa Number *
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    required
                    placeholder="Plot / Flat, Building Name, Street / Sector"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Apartment / Suite / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Near Grand Central or Floor 4"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder="e.g. Mumbai"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      placeholder="e.g. Maharashtra"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      placeholder="400001"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Custom Commission Notes or Gift Message
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Include custom name engraving instructions, wedding gift card message, or special delivery timing..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-sm">
              <h2 className="font-display text-base font-bold text-neutral-900 uppercase tracking-wider mb-4 pb-3 border-b border-neutral-100">
                3. Payment Method
              </h2>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#0b3b33] bg-[#0b3b33]/5 ring-1 ring-[#0b3b33]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-[#0b3b33] focus:ring-[#c5a059]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#856338]" />
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Cash On Delivery (COD) / Pay on Delivery
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Pay via cash or UPI upon delivery. Our logistics agent will provide a digital receipt.
                    </p>
                  </div>
                </label>

                {/* UPI QR & Studio VPA */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-[#0b3b33] bg-[#0b3b33]/5 ring-1 ring-[#0b3b33]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="mt-1 text-[#0b3b33] focus:ring-[#c5a059]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#856338]" />
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Direct Studio UPI (GPay / PhonePe / Paytm)
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      VPA: <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800 font-bold">resinaura@upi</code>. Order will be confirmed upon transaction ID receipt.
                    </p>
                  </div>
                </label>

                {/* Direct Bank Wire */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#0b3b33] bg-[#0b3b33]/5 ring-1 ring-[#0b3b33]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={() => setPaymentMethod('bank_transfer')}
                    className="mt-1 text-[#0b3b33] focus:ring-[#c5a059]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#856338]" />
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Atelier Direct NEFT / IMPS Bank Wire
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Recommended for high-value grand timepieces. Studio account credentials will be issued on order confirmation.
                    </p>
                  </div>
                </label>

                {/* Credit / Debit Card Gateway */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-[#0b3b33] bg-[#0b3b33]/5 ring-1 ring-[#0b3b33]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mt-1 text-[#0b3b33] focus:ring-[#c5a059]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#856338]" />
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Online Cards / Gateway (Pre-Configured)
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Pending merchant gateway credentials; order will be saved safely with pending verification status.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order Button */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-sm sticky top-28">
            <h3 className="font-display text-base font-bold text-neutral-900 pb-3 mb-4 border-b border-neutral-100 uppercase tracking-wider">
              Consignment Summary
            </h3>

            {/* List items */}
            <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto mb-6 pr-1">
              {cart.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-neutral-200"
                    />
                    <div>
                      <h4 className="font-semibold text-neutral-900 line-clamp-1">{item.product.name}</h4>
                      <p className="text-neutral-500 text-[11px]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#0b3b33]">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs pb-4 mb-4 border-b border-neutral-100">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Wooden Crate & Shipping</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase tracking-wider">Complimentary</span>
                  ) : (
                    <span className="font-semibold text-neutral-900">{formatCurrency(shippingFee)}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Transit Insurance</span>
                <span className="text-emerald-700 font-bold uppercase tracking-wider">Included</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline mb-6">
              <span className="font-display text-base font-bold text-neutral-900">Total Payable</span>
              <span className="font-display text-2xl font-bold text-[#0b3b33]">
                {formatCurrency(finalTotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#f7f4ee] font-display text-xs font-bold uppercase tracking-[0.18em] transition-all shadow-md hover:shadow-lg border border-[#c5a059]/40 disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-[#dfbe7e]" />
              <span>{isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
            </button>

            <div className="mt-6 pt-4 border-t border-neutral-100 text-[11px] text-neutral-500 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#856338]" />
                <span>Zero Risk Guarantee • 100% Authentic Handcraft</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#856338]" />
                <span>Trackable Consignment with SMS & Email Updates</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


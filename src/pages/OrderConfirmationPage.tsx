import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Package, Sparkles, Printer, ArrowRight, MapPin, Truck } from 'lucide-react';
import { Order } from '../types';
import { ordersService } from '../services/ordersService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fire celebratory luxury confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#c5a059', '#dfbe7e', '#0b3b33', '#114d41', '#ffffff'],
      });
    } catch (_) {}

    async function fetchOrder() {
      if (!orderNumber) return;
      try {
        const found = await ordersService.trackOrder(orderNumber);
        setOrder(found);
      } catch (e) {
        console.error('Error fetching order:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingSpinner label="Generating your bespoke consignment docket..." />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200/80 shadow-sm text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-[#0b3b33] text-[#dfbe7e] border-2 border-[#c5a059] flex items-center justify-center mx-auto mb-6 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase tracking-[0.28em] text-[#856338] font-bold">
            Consignment Confirmed
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#07241e] mt-2 mb-3">
            Thank You For Honoring Handcraft
          </h1>
          <p className="font-serif-luxury text-base sm:text-lg text-neutral-600 max-w-xl mx-auto leading-relaxed mb-6">
            Your bespoke commission has been accepted by the Resin Aura atelier. Our master artisans are now preparing your pieces for delicate inspection and secured transit packaging.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-6 px-6 py-3.5 rounded-2xl bg-[#FAF8F5] border border-[#c5a059]/40 text-xs">
            <div>
              <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Order Docket</span>
              <strong className="text-[#0b3b33] font-mono text-sm">{orderNumber}</strong>
            </div>
            <div className="hidden sm:block w-px h-6 bg-neutral-300" />
            <div>
              <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Order Status</span>
              <span className="font-semibold text-emerald-700 capitalize">
                {order?.status || 'Placed & Scheduled for Curation'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Invoice Docket */}
        {order && (
          <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm mb-10">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-neutral-100">
              <div>
                <span className="font-display text-lg font-bold text-neutral-900">
                  Consignment Details
                </span>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Placed on {formatDate(order.created_at)}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>

            {/* Delivery & Payment Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 pb-8 border-b border-neutral-100 text-xs">
              <div>
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#0b3b33] mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#856338]" />
                  Delivery Destination
                </h4>
                <div className="text-neutral-600 space-y-1">
                  <p className="font-bold text-neutral-900">{order.shipping_address?.fullName}</p>
                  <p>{order.shipping_address?.streetAddress}</p>
                  {order.shipping_address?.apartment && <p>{order.shipping_address?.apartment}</p>}
                  <p>
                    {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postalCode}
                  </p>
                  <p>{order.shipping_address?.country}</p>
                  <p className="pt-1 text-neutral-500 font-medium">Contact: {order.shipping_address?.phone}</p>
                </div>
              </div>

              <div>
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#0b3b33] mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#856338]" />
                  Payment & Delivery Status
                </h4>
                <div className="text-neutral-600 space-y-2">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">Payment Mode</span>
                    <span className="font-bold text-neutral-900 uppercase">
                      {order.payment_method === 'cod' ? 'Cash / UPI On Delivery' : order.payment_method}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">Payment Verification</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                      {order.payment_status}
                    </span>
                  </div>
                  {order.notes && (
                    <div className="pt-2">
                      <span className="text-[10px] uppercase text-neutral-400 block">Commission Notes</span>
                      <p className="italic text-neutral-500">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Itemized Order Rows */}
            <div className="space-y-4 mb-8">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#0b3b33] mb-3">
                Curated Items
              </h4>
              <div className="divide-y divide-neutral-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                        />
                      )}
                      <div>
                        <h5 className="font-bold text-neutral-900">{item.product_name}</h5>
                        <p className="text-neutral-400 text-[11px]">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-neutral-900">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Recap */}
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-600 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shipping_fee === 0 ? 'Complimentary' : formatCurrency(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-neutral-900 text-sm pt-2 border-t border-neutral-200">
                <span>Total Amount</span>
                <span className="text-[#0b3b33]">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={`/track-order?number=${orderNumber}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] font-display text-xs font-bold uppercase tracking-[0.16em] hover:bg-[#07241e] shadow-md border border-[#c5a059]/40"
          >
            <Package className="w-4 h-4" />
            <span>Track Live Consignment</span>
          </Link>
          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-neutral-700 font-display text-xs font-bold uppercase tracking-[0.16em] hover:bg-neutral-50 shadow-sm border border-neutral-200"
          >
            <span>Return to Gallery</span>
            <ArrowRight className="w-4 h-4 text-[#856338]" />
          </Link>
        </div>
      </div>
    </div>
  );
};


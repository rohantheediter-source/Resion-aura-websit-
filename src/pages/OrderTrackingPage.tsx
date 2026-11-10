import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Clock, Truck, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { ordersService } from '../services/ordersService';
import { Order, OrderStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const OrderTrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialNumber = searchParams.get('number') || '';

  const [orderNumber, setOrderNumber] = useState(initialNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const stages: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'placed', label: 'Order Received', desc: 'Docket recorded and authenticated in atelier registry' },
    { key: 'confirmed', label: 'Artisan Allocated', desc: 'Master artisan assigned for inspection and materials selection' },
    { key: 'crafting', label: 'Layer Pouring & Curing', desc: 'Optical resin poured; undergoing 72-hour curing cycle' },
    { key: 'dispatched', label: 'Dispatched in Crate', desc: 'Hand-beveled, transit insured, and handed to express courier' },
    { key: 'delivered', label: 'Delivered', desc: 'Successfully received by collector' },
  ];

  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 0;
      case 'confirmed': return 1;
      case 'crafting': return 2;
      case 'dispatched': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const handleTrack = async (numToSearch: string) => {
    const clean = numToSearch.trim();
    if (!clean) return;

    setIsSearching(true);
    setSearched(true);
    try {
      const found = await ordersService.trackOrder(clean);
      setOrder(found);
      const newParams = new URLSearchParams();
      newParams.set('number', clean);
      setSearchParams(newParams);
    } catch (err) {
      console.error('Error tracking order:', err);
      setOrder(null);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialNumber) {
      handleTrack(initialNumber);
    }
  }, [initialNumber]);

  const currentStageIdx = order ? getStageIndex(order.status) : 0;

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-[#856338] font-bold">
            Live Dispatch Radar
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#07241e] mt-2 mb-3">
            Track Your Consignment
          </h1>
          <p className="font-serif-luxury text-base text-neutral-600">
            Monitor the progress of your handcrafted resin art from studio pouring to your doorstep.
          </p>
        </div>

        {/* Tracking Input Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm mb-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack(orderNumber);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Package className="w-5 h-5 text-neutral-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="Enter Consignment Number (e.g. RA-8492-4102)"
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#FAF8F5] border border-neutral-300 text-xs font-mono font-bold text-neutral-900 uppercase focus:outline-none focus:border-[#0b3b33]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#dfbe7e] font-display text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-md disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'Searching...' : 'Locate Docket'}</span>
            </button>
          </form>
        </div>

        {/* Results */}
        {isSearching ? (
          <LoadingSpinner label="Contacting studio dispatch hub..." />
        ) : searched && !order ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-neutral-200">
            <Package className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <h3 className="font-display text-base font-bold text-neutral-800 mb-1">
              Consignment Not Located
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              We couldn't find an active order matching "<strong className="text-neutral-800">{orderNumber}</strong>". Please verify your docket number or check your confirmation email.
            </p>
          </div>
        ) : order ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm">
            {/* Docket Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-neutral-100 gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                  Order Docket
                </span>
                <span className="font-mono text-lg font-bold text-[#0b3b33]">
                  {order.order_number}
                </span>
                <span className="text-xs text-neutral-500 ml-3">
                  Initiated on {formatDate(order.created_at)}
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                  Current Status
                </span>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {order.status}
                </span>
              </div>
            </div>

            {/* Visual 5-Stage Stepper */}
            <div className="relative mb-12">
              <div className="hidden sm:block absolute top-1/2 left-0 w-full h-1 bg-neutral-100 -translate-y-1/2 z-0" />
              <div
                className="hidden sm:block absolute top-1/2 left-0 h-1 bg-[#0b3b33] -translate-y-1/2 z-0 transition-all duration-700"
                style={{ width: `${(currentStageIdx / (stages.length - 1)) * 100}%` }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                {stages.map((st, idx) => {
                  const isDone = idx <= currentStageIdx;
                  const isCurrent = idx === currentStageIdx;
                  return (
                    <div key={st.key} className="flex sm:flex-col items-center gap-3 sm:text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                          isDone
                            ? 'bg-[#0b3b33] text-[#dfbe7e] border-2 border-[#c5a059] shadow-md'
                            : 'bg-white text-neutral-400 border-2 border-neutral-200'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4 text-[#dfbe7e]" /> : idx + 1}
                      </div>
                      <div>
                        <h4
                          className={`text-xs font-bold ${
                            isCurrent ? 'text-[#0b3b33]' : isDone ? 'text-neutral-800' : 'text-neutral-400'
                          }`}
                        >
                          {st.label}
                        </h4>
                        <p className="text-[10px] text-neutral-400 hidden sm:block mt-1 leading-snug">
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courier & Transit Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#FAF8F5] border border-neutral-200 text-xs mb-8">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Destination Address
                </span>
                <p className="font-bold text-neutral-900">{order.shipping_address?.fullName}</p>
                <p className="text-neutral-600">{order.shipping_address?.streetAddress}, {order.shipping_address?.city}</p>
                <p className="text-neutral-600">{order.shipping_address?.state} - {order.shipping_address?.postalCode}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Shipping Courier & Tracking
                </span>
                <p className="text-neutral-700">
                  Carrier: <strong className="text-neutral-900">{order.carrier || 'Resin Aura Priority Express Fleet'}</strong>
                </p>
                <p className="text-neutral-700">
                  Waybill Number: <strong className="font-mono text-neutral-900">{order.tracking_number || 'Generated at dispatch'}</strong>
                </p>
                <p className="text-neutral-500 text-[11px] mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#856338]" /> Transit insurance active
                </p>
              </div>
            </div>

            {/* Items in Consignment */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#0b3b33] mb-4">
                Consignment Contents
              </h4>
              <div className="divide-y divide-neutral-100">
                {order.items?.map((it) => (
                  <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {it.product_image && (
                        <img
                          src={it.product_image}
                          alt={it.product_name}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0"
                        />
                      )}
                      <div>
                        <h5 className="font-bold text-neutral-900">{it.product_name}</h5>
                        <p className="text-neutral-400 text-[11px]">Qty: {it.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-neutral-900">{formatCurrency(it.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};


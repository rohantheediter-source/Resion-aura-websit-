import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  Save,
  Package,
  MapPin,
  CreditCard,
  User,
} from 'lucide-react';
import { ordersService } from '../../services/ordersService';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [status, setStatus] = useState<OrderStatus>('placed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      setIsLoading(true);
      try {
        const all = await ordersService.getAllAdminOrders();
        const found = all.find((o) => o.id === id);
        if (found) {
          setOrder(found);
          setStatus(found.status);
          setPaymentStatus(found.payment_status);
          setTrackingNumber(found.tracking_number || '');
          setCarrier(found.carrier || 'BlueDart Express / Delhivery Air');
        }
      } catch (err) {
        console.error('Failed to load order details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsSaving(true);
    try {
      await ordersService.updateOrderStatus(order.id, status, trackingNumber.trim(), carrier.trim());
      await ordersService.updatePaymentStatus(order.id, paymentStatus);
      success('Consignment status and dispatch records updated');
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status,
              payment_status: paymentStatus,
              tracking_number: trackingNumber.trim(),
              carrier: carrier.trim(),
            }
          : null
      );
    } catch {
      error('Failed to update consignment details');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Accessing consignment vault..." />;
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-neutral-400">
        Order not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#0f3830]">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 rounded-xl bg-[#0b241e] text-neutral-400 hover:text-white border border-[#c5a059]/30"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#dfbe7e] font-mono">
              CONSIGNMENT DETAILS
            </span>
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <span>{order.order_number}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 capitalize font-sans">
                {order.status}
              </span>
            </h1>
          </div>
        </div>

        <span className="text-xs text-neutral-400">
          Placed on {formatDateTime(order.created_at)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Items & Customer Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Items Card */}
          <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#dfbe7e] mb-4 pb-2 border-b border-[#0f3830]">
              Ordered Artworks ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-[#0f3830]">
              {order.items?.map((it) => (
                <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {it.product_image && (
                      <img
                        src={it.product_image}
                        alt={it.product_name}
                        className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-neutral-700 shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-bold text-white">{it.product_name}</p>
                      <p className="text-[11px] text-neutral-400">
                        Qty: {it.quantity} × {formatCurrency(it.unit_price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#dfbe7e] font-display">
                    {formatCurrency(it.total_price)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-2 border-t border-[#0f3830] space-y-1.5 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Wooden Crate & Shipping:</span>
                <span className="text-white">
                  {order.shipping_fee === 0 ? 'Free' : formatCurrency(order.shipping_fee)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-[#0f3830]">
                <span>Total Amount:</span>
                <span className="text-[#dfbe7e]">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Card */}
          <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#dfbe7e] pb-2 border-b border-[#0f3830]">
              Patron & Delivery Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                  Recipient Contact
                </span>
                <p className="font-bold text-white text-sm">
                  {order.shipping_address?.fullName || order.guest_name}
                </p>
                <p className="text-neutral-300">{order.guest_email}</p>
                <p className="text-neutral-300">{order.shipping_address?.phone || order.guest_phone}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                  Delivery Destination
                </span>
                <p className="text-neutral-300">{order.shipping_address?.streetAddress}</p>
                {order.shipping_address?.apartment && (
                  <p className="text-neutral-400">{order.shipping_address?.apartment}</p>
                )}
                <p className="text-neutral-300">
                  {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postalCode}
                </p>
                <p className="text-neutral-400">{order.shipping_address?.country}</p>
              </div>
            </div>

            {order.notes && (
              <div className="pt-3 border-t border-[#0f3830]">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                  Custom Inscription / Patron Notes
                </span>
                <p className="text-neutral-300 italic bg-[#071915] p-3 rounded-xl border border-neutral-700">
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Manage Order & Dispatch Form */}
        <div className="lg:col-span-5 bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 sm:p-8">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#dfbe7e] mb-6 pb-2 border-b border-[#0f3830]">
            Update Order Status & Dispatch
          </h3>

          <form onSubmit={handleSaveChanges} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Consignment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-white focus:outline-none focus:border-[#c5a059] capitalize cursor-pointer"
              >
                <option value="placed">Placed (Received in Atelier)</option>
                <option value="confirmed">Confirmed (Artisan Assigned)</option>
                <option value="crafting">Crafting & 72h Curing</option>
                <option value="dispatched">Dispatched in Crate</option>
                <option value="delivered">Delivered to Patron</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-white focus:outline-none focus:border-[#c5a059] capitalize cursor-pointer"
              >
                <option value="pending">Pending Verification</option>
                <option value="paid">Verified Paid</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Express Carrier Fleet
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="BlueDart Express / Delhivery Air"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Consignment Tracking Waybill #
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. BD-892348123"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#071915] border border-neutral-700 text-white focus:outline-none focus:border-[#c5a059] font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#071915] font-display text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating...' : 'Commit Dispatch Updates'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


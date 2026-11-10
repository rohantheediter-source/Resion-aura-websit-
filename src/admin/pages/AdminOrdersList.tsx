import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Filter, Eye, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react';
import { ordersService } from '../../services/ordersService';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminOrdersList: React.FC = () => {
  const { success, error } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        const list = await ordersService.getAllAdminOrders();
        setOrders(list);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      success(`Updated order status to ${newStatus}`);
    } catch {
      error('Failed to update status');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        searchQuery === '' ||
        o.order_number.toLowerCase().includes(q) ||
        (o.shipping_address?.fullName && o.shipping_address.fullName.toLowerCase().includes(q)) ||
        (o.guest_email && o.guest_email.toLowerCase().includes(q)) ||
        (o.shipping_address?.city && o.shipping_address.city.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  if (isLoading) {
    return <LoadingSpinner label="Loading consignment records..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#dfbe7e] font-mono">
            DISPATCH & FULFILLMENT
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Consignment Orders ({orders.length})
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0b241e] p-4 rounded-2xl border border-[#c5a059]/30">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by docket number, recipient name, city, email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#dfbe7e] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#071915] border border-neutral-700 text-xs text-neutral-200 focus:outline-none focus:border-[#c5a059] cursor-pointer capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="crafting">Crafting & Curing</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            No matching orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="uppercase tracking-wider text-[10px] text-neutral-400 bg-[#071915] border-b border-[#0f3830]">
                <tr>
                  <th className="py-3.5 px-4">Docket #</th>
                  <th className="py-3.5 px-4">Patron / Recipient</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Investment</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0f3830]">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#071915]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#dfbe7e]">
                      {ord.order_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">
                        {ord.shipping_address?.fullName || ord.guest_name || 'Valued Patron'}
                      </p>
                      <p className="text-[10px] text-neutral-400">{ord.guest_email || '—'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-neutral-300">
                        {ord.shipping_address?.city}, {ord.shipping_address?.state}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-400">
                      {formatDate(ord.created_at)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white font-display">
                      {formatCurrency(ord.total_amount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ord.payment_status === 'paid'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {ord.payment_method} ({ord.payment_status})
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                        className="px-2.5 py-1 rounded-lg bg-[#071915] border border-neutral-700 text-[11px] font-semibold text-white focus:outline-none focus:border-[#c5a059] cursor-pointer capitalize"
                      >
                        <option value="placed">Placed</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="crafting">Crafting & Curing</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-[#071915] text-[#dfbe7e] hover:bg-[#c5a059] hover:text-[#071915] border border-neutral-700 transition-colors"
                        title="View Detailed Docket"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


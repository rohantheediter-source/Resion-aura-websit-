import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  PlusCircle,
  ExternalLink,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Database,
  Copy,
  Check,
} from 'lucide-react';
import { productsService } from '../../services/productsService';
import { ordersService } from '../../services/ordersService';
import { customRequestService } from '../../services/customRequestService';
import { checkSupabaseConnection } from '../../services/supabase';
import { Product, Order, CustomizationRequest } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminDashboardOverview: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomizationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const [prods, ords, reqs, isConn] = await Promise.all([
          productsService.getAllAdminProducts(),
          ordersService.getAllAdminOrders(),
          customRequestService.getAllRequests(),
          checkSupabaseConnection(),
        ]);
        setProducts(prods);
        setOrders(ords);
        setCustomRequests(reqs);
        setDbConnected(isConn);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);


  const copyMigrationPath = () => {
    navigator.clipboard.writeText('supabase/migrations/001_initial_schema.sql');
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (isLoading) {
    return <LoadingSpinner label="Compiling studio metrics..." />;
  }

  // Calculate KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? o.total_amount : o.total_amount), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const uniqueCustomers = new Set(orders.map(o => o.user_id || o.guest_email)).size;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#dfbe7e] font-mono">
            COMMAND CENTER
          </span>
          <h1 className="font-display text-3xl font-bold text-white mt-1">
            Studio Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Live DB indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b241e] border border-neutral-700 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-neutral-300 font-mono text-[11px]">
              {dbConnected ? 'Supabase: Synced' : 'Catalog: Active'}
            </span>
          </div>

          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#071915] font-display text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-gold-glow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Database Setup Info Card if not yet migrated in Supabase */}
      {!dbConnected && (
        <div className="p-5 rounded-2xl bg-[#0d221d] border border-[#c5a059]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#071915] text-[#dfbe7e] border border-[#c5a059]/30 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-white">
                Supabase Schema Ready for Execution
              </h4>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                The storefront is operating seamlessly using the local curated catalog of 56 works. To enable cloud syncing, run <code className="bg-black/50 px-1.5 py-0.5 rounded text-[#dfbe7e] font-mono">001_initial_schema.sql</code> and <code className="bg-black/50 px-1.5 py-0.5 rounded text-[#dfbe7e] font-mono">seed.sql</code> in your Supabase SQL Editor.
              </p>
            </div>
          </div>
          <button
            onClick={copyMigrationPath}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071915] hover:bg-[#0b241e] text-xs font-mono font-bold text-[#dfbe7e] border border-[#c5a059]/40 transition-colors"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Path Copied!' : 'Copy Migration File Path'}</span>
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Total Gross Bookings</span>
            <div className="p-2.5 rounded-xl bg-[#071915] text-[#dfbe7e] border border-[#c5a059]/40">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-neutral-400">Based on authenticated customer orders</p>
        </div>

        {/* Total Orders */}
        <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Total Consignments</span>
            <div className="p-2.5 rounded-xl bg-[#071915] text-[#dfbe7e] border border-[#c5a059]/40">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
            {totalOrders}
          </div>
          <p className="text-[11px] text-neutral-400">
            {orders.filter(o => o.status === 'placed').length} pending dispatch
          </p>
        </div>

        {/* Total Products */}
        <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Catalog Works</span>
            <div className="p-2.5 rounded-xl bg-[#071915] text-[#dfbe7e] border border-[#c5a059]/40">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
            {totalProducts}
          </div>
          <p className="text-[11px] text-neutral-400">
            {activeProducts} active • {lowStockProducts} low in stock
          </p>
        </div>

        {/* Customer Reach */}
        <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Registered Patrons</span>
            <div className="p-2.5 rounded-xl bg-[#071915] text-[#dfbe7e] border border-[#c5a059]/40">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
            {Math.max(1, uniqueCustomers)}
          </div>
          <p className="text-[11px] text-neutral-400">Verified buyers & commission patrons</p>
        </div>
      </div>

      {/* Bespoke Commissions & WhatsApp Inquiries Hub */}
      <div className="bg-gradient-to-r from-[#0b241e] via-[#0e352d] to-[#0b241e] border border-[#c5a059]/40 rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#071915] border border-[#c5a059] flex items-center justify-center text-[#dfbe7e] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-white tracking-wide">
                Bespoke Commissions & WhatsApp Requests
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#c5a059] text-[#071915] text-[10px] font-bold uppercase tracking-wider">
                {customRequests.filter((r) => r.status === 'Pending').length} Pending
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              {customRequests.length} total custom inquiries recorded ({customRequests.filter((r) => r.status === 'Pending').length} awaiting atelier review and price quotes).
            </p>
          </div>
        </div>
        <Link
          to="/admin/custom-requests"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#071915] font-display text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0"
        >
          <span>Manage Custom Requests</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Recent Orders Section */}

      <div className="bg-[#0b241e] border border-[#c5a059]/30 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#0f3830]">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Recent Consignment Dockets</h3>
            <p className="text-xs text-neutral-400">Incoming commissions and orders</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs text-[#dfbe7e] hover:underline font-bold flex items-center gap-1"
          >
            <span>View All Orders ({totalOrders})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No orders recorded yet. Place an order on the storefront to test end-to-end processing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="uppercase tracking-wider text-[10px] text-neutral-400 border-b border-[#0f3830]">
                <tr>
                  <th className="pb-3">Docket Number</th>
                  <th className="pb-3">Recipient</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0f3830]">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#071915]/50 transition-colors">
                    <td className="py-3 font-mono font-bold text-[#dfbe7e]">
                      {ord.order_number}
                    </td>
                    <td className="py-3 font-medium text-white">
                      {ord.shipping_address?.fullName || ord.guest_name || 'Anonymous Collector'}
                    </td>
                    <td className="py-3 text-neutral-400">{formatDate(ord.created_at)}</td>
                    <td className="py-3 font-bold text-white">{formatCurrency(ord.total_amount)}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="text-xs text-[#dfbe7e] hover:underline font-bold"
                      >
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Launchpad & Catalog Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0b241e] border border-[#c5a059]/30 flex flex-col justify-between">
          <div>
            <h4 className="font-display text-base font-bold text-white mb-2">Manage Categories</h4>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Inspect all 5 artisan disciplines: Wall Clocks, Preserved Jewelry, Platters, Pendants, and Bangles.
            </p>
          </div>
          <Link
            to="/admin/categories"
            className="text-xs text-[#dfbe7e] hover:underline font-bold inline-flex items-center gap-1"
          >
            <span>Review Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b241e] border border-[#c5a059]/30 flex flex-col justify-between">
          <div>
            <h4 className="font-display text-base font-bold text-white mb-2">Inventory Alerts</h4>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              {lowStockProducts} products have 5 or fewer items remaining in studio stock.
            </p>
          </div>
          <Link
            to="/admin/products"
            className="text-xs text-[#dfbe7e] hover:underline font-bold inline-flex items-center gap-1"
          >
            <span>Inspect Inventory Stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b241e] border border-[#c5a059]/30 flex flex-col justify-between">
          <div>
            <h4 className="font-display text-base font-bold text-white mb-2">Patron Registry</h4>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Review registered customer profiles, shipping destinations, and lifetime patronage values.
            </p>
          </div>
          <Link
            to="/admin/customers"
            className="text-xs text-[#dfbe7e] hover:underline font-bold inline-flex items-center gap-1"
          >
            <span>Open Patron Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

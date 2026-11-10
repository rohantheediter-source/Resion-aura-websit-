import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Filter,
  MessageCircle,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Layers,
  Palette,
  FileText,
  DollarSign,
  ChevronRight,
  X,
  Send,
  ShoppingBag,
} from 'lucide-react';

import { CustomizationRequest, CustomRequestStatus, CustomRequestType } from '../../types';
import { customRequestService } from '../../services/customRequestService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const STATUS_CONFIG: Record<
  CustomRequestStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  Pending: {
    label: 'Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  'Under Review': {
    label: 'Under Review',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  'Price Quoted': {
    label: 'Price Quoted',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  'Awaiting Customer Approval': {
    label: 'Awaiting Approval',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  Approved: {
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  'In Production': {
    label: 'In Production',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
  Completed: {
    label: 'Completed',
    bg: 'bg-neutral-100',
    text: 'text-neutral-800',
    border: 'border-neutral-300',
  },
  Rejected: {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  Cancelled: {
    label: 'Cancelled',
    bg: 'bg-neutral-50',
    text: 'text-neutral-500',
    border: 'border-neutral-200',
  },
};

const ALL_STATUSES: CustomRequestStatus[] = [
  'Pending',
  'Under Review',
  'Price Quoted',
  'Awaiting Customer Approval',
  'Approved',
  'In Production',
  'Completed',
  'Rejected',
  'Cancelled',
];

export const AdminCustomRequestsList: React.FC = () => {
  const { success, error } = useToast();

  const [requests, setRequests] = useState<CustomizationRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal / Edit state
  const [selectedRequest, setSelectedRequest] = useState<CustomizationRequest | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editDelivery, setEditDelivery] = useState<string>('');
  const [editStatus, setEditStatus] = useState<CustomRequestStatus>('Pending');
  const [editAdminNotes, setEditAdminNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isConvertingToOrder, setIsConvertingToOrder] = useState(false);

  const loadRequests = async (silent = false) => {

    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await customRequestService.getAllRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load custom requests:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const openManageModal = (req: CustomizationRequest) => {
    setSelectedRequest(req);
    setEditPrice(req.final_price !== null && req.final_price !== undefined ? req.final_price.toString() : '');
    setEditDelivery(req.estimated_delivery || '');
    setEditStatus(req.status);
    setEditAdminNotes(req.admin_notes || '');
  };

  const closeManageModal = () => {
    setSelectedRequest(null);
  };

  const handleSaveAdminUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setIsSaving(true);
    try {
      const parsedPrice = editPrice.trim() ? parseFloat(editPrice.trim()) : null;
      const updated = await customRequestService.updateRequestByAdmin(selectedRequest.id, {
        status: editStatus,
        final_price: parsedPrice,
        estimated_delivery: editDelivery.trim() || null,
        admin_notes: editAdminNotes.trim() || null,
      });

      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? updated : r))
      );
      setSelectedRequest(updated);
      success(`Request #${updated.request_number} updated successfully`);
    } catch (err: any) {
      console.error('Failed to update request:', err);
      error('Failed to update customization request.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunchWhatsAppQuote = (req: CustomizationRequest) => {
    const url = customRequestService.getAdminToCustomerWhatsAppUrl(req);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleConvertToOrder = async () => {
    if (!selectedRequest) return;
    const finalPriceVal = editPrice.trim() ? parseFloat(editPrice.trim()) : selectedRequest.final_price;
    if (!finalPriceVal || finalPriceVal <= 0) {
      error('Please set and save a valid final price before converting to an order.');
      return;
    }

    setIsConvertingToOrder(true);
    try {
      // First ensure latest price is saved on the request object
      const requestWithPrice = { ...selectedRequest, final_price: finalPriceVal };
      const { order, updatedRequest } = await customRequestService.convertCustomRequestToOrder(requestWithPrice);

      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? updatedRequest : r))
      );
      setSelectedRequest(updatedRequest);
      setEditStatus('In Production');
      success(`Request #${selectedRequest.request_number} moved to Active Store Orders as Order #${order.order_number}!`);
    } catch (err: any) {
      console.error('Error converting request to order:', err);
      error('Could not convert request to order.');
    } finally {
      setIsConvertingToOrder(false);
    }
  };


  // Filter computation
  const filteredRequests = requests.filter((r) => {
    // Type filter
    if (typeFilter !== 'all' && r.request_type !== typeFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = r.request_number.toLowerCase().includes(q);
      const matchName = r.customer_name.toLowerCase().includes(q);
      const matchPhone = r.customer_phone.toLowerCase().includes(q);
      const matchProd = (r.product_name || '').toLowerCase().includes(q);
      const matchCategory = (r.customization_details?.category || '').toLowerCase().includes(q);
      if (!matchNumber && !matchName && !matchPhone && !matchProd && !matchCategory) {
        return false;
      }
    }

    return true;
  });

  // Counters
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const underReviewCount = requests.filter((r) => r.status === 'Under Review').length;
  const quotedCount = requests.filter((r) => r.status === 'Price Quoted').length;
  const inProdCount = requests.filter((r) => r.status === 'In Production').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;

  if (isLoading) {
    return <LoadingSpinner label="Retrieving custom commissions registry..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#dfbe7e] font-mono">
              BESPOKE ORDERS & COMMISSIONS
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#c5a059]" />
            <span>Custom Requests Registry</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage custom product inquiries, quote final handcrafted prices, and communicate directly with clients on WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadRequests(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c2c25] hover:bg-[#103a31] text-[#dfbe7e] border border-[#c5a059]/40 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#0c2c25] p-4 rounded-2xl border border-[#c5a059]/20">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-semibold">Total Inquiries</span>
          <span className="font-display text-2xl font-bold text-white mt-1 block">{requests.length}</span>
        </div>
        <div className="bg-[#0c2c25] p-4 rounded-2xl border border-amber-500/30">
          <span className="text-[10px] uppercase tracking-wider text-amber-400 block font-semibold">Pending Review</span>
          <span className="font-display text-2xl font-bold text-amber-300 mt-1 block">{pendingCount}</span>
        </div>
        <div className="bg-[#0c2c25] p-4 rounded-2xl border border-purple-500/30">
          <span className="text-[10px] uppercase tracking-wider text-purple-400 block font-semibold">Price Quoted</span>
          <span className="font-display text-2xl font-bold text-purple-300 mt-1 block">{quotedCount}</span>
        </div>
        <div className="bg-[#0c2c25] p-4 rounded-2xl border border-emerald-500/30">
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 block font-semibold">Approved</span>
          <span className="font-display text-2xl font-bold text-emerald-300 mt-1 block">{approvedCount}</span>
        </div>
        <div className="bg-[#0c2c25] p-4 rounded-2xl border border-teal-500/30">
          <span className="text-[10px] uppercase tracking-wider text-teal-400 block font-semibold">In Production</span>
          <span className="font-display text-2xl font-bold text-teal-300 mt-1 block">{inProdCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0c2c25] p-4 sm:p-5 rounded-2xl border border-[#c5a059]/20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, request ID, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#071915] border border-[#0f3830] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-[#071915] p-1 rounded-xl border border-[#0f3830] text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                typeFilter === 'all' ? 'bg-[#c5a059] text-[#071915] font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('existing_product')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                typeFilter === 'existing_product' ? 'bg-[#c5a059] text-[#071915] font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Existing Catalog
            </button>
            <button
              onClick={() => setTypeFilter('new_custom_design')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                typeFilter === 'new_custom_design' ? 'bg-[#c5a059] text-[#071915] font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              New Bespoke
            </button>
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-[#071915] border border-[#0f3830] text-xs text-white focus:outline-none focus:border-[#c5a059]"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table / Requests List */}
      <div className="bg-[#0c2c25] rounded-3xl border border-[#c5a059]/20 overflow-hidden shadow-xl">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <Sparkles className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              No Custom Requests Found
            </h4>
            <p className="text-xs text-neutral-500 mt-1">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try clearing your filters or search keywords.'
                : 'Custom inquiries submitted from product pages or the /custom-design page will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#071915] text-[#dfbe7e] uppercase tracking-wider text-[10px] font-mono border-b border-[#0f3830]">
                <tr>
                  <th className="py-4 px-6">Request ID</th>
                  <th className="py-4 px-6">Client Info</th>
                  <th className="py-4 px-6">Artwork / Product</th>
                  <th className="py-4 px-6">Palette & Specs</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Final Quoted Price</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0f3830] text-neutral-300">
                {filteredRequests.map((req) => {
                  const statusBadge = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
                  const isExisting = req.request_type === 'existing_product';

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-[#0e352d]/60 transition-colors cursor-pointer"
                      onClick={() => openManageModal(req)}
                    >
                      {/* Request ID & Date */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-mono font-bold text-white block">
                          {req.request_number}
                        </span>
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#c5a059]" />
                          {formatDate(req.created_at)}
                        </span>
                      </td>

                      {/* Client Info */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white block">
                          {req.customer_name}
                        </span>
                        <span className="text-neutral-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#dfbe7e]" />
                          {req.customer_phone}
                        </span>
                      </td>

                      {/* Product Name & Type */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {req.product_image ? (
                            <img
                              src={req.product_image}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-[#0f3830] shrink-0"
                            />
                          ) : req.reference_image_url ? (
                            <img
                              src={req.reference_image_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-[#0f3830] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#071915] border border-[#0f3830] flex items-center justify-center text-[#dfbe7e] shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[200px]">
                            <span className="font-medium text-white truncate block">
                              {req.product_name}
                            </span>
                            <span
                              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                isExisting
                                  ? 'bg-amber-900/40 text-amber-300 border border-amber-700/40'
                                  : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40'
                              }`}
                            >
                              {isExisting ? 'Catalog Custom' : 'New Bespoke'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Palette & Specs */}
                      <td className="py-4 px-6 max-w-[220px]">
                        <span className="text-neutral-200 block truncate font-medium">
                          {req.customization_details?.colors || 'Standard'}
                        </span>
                        <span className="text-neutral-400 text-[10px] block truncate mt-0.5">
                          {req.customization_details?.size || 'Custom size'} • Qty: {req.quantity}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Final Quoted Price */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {req.final_price ? (
                          <span className="font-display font-bold text-[#dfbe7e] text-sm">
                            {formatCurrency(req.final_price)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-500 italic">
                            Awaiting Quote
                          </span>
                        )}
                        {req.estimated_delivery && (
                          <span className="text-[10px] text-neutral-400 block mt-0.5 truncate max-w-[140px]">
                            {req.estimated_delivery}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-6 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleLaunchWhatsAppQuote(req)}
                            title="Chat / Send Quote on WhatsApp"
                            className="p-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-colors border border-[#25D366]/30"
                          >
                            <MessageCircle className="w-4 h-4 fill-current" />
                          </button>
                          <button
                            onClick={() => openManageModal(req)}
                            className="px-3 py-1.5 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#071915] text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANAGE CUSTOM REQUEST MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-[#0c2c25] rounded-3xl shadow-2xl border border-[#c5a059]/40 overflow-hidden my-8 max-h-[92vh] flex flex-col text-white">
            {/* Modal Header */}
            <div className="bg-[#071915] px-6 py-5 flex items-center justify-between border-b border-[#0f3830] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b3b33] border border-[#c5a059] flex items-center justify-center text-[#dfbe7e] shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-white tracking-wide">
                      Commission #{selectedRequest.request_number}
                    </h3>
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        STATUS_CONFIG[selectedRequest.status]?.bg || ''
                      } ${STATUS_CONFIG[selectedRequest.status]?.text || ''}`}
                    >
                      {selectedRequest.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Submitted on {formatDateTime(selectedRequest.created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={closeManageModal}
                className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs">
              {/* Customer Contact & Quick WhatsApp Action Banner */}
              <div className="bg-[#071915] rounded-2xl p-4 sm:p-5 border border-[#0f3830] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#dfbe7e] font-bold block">
                    Client Details
                  </span>
                  <h4 className="font-display text-base font-bold text-white">
                    {selectedRequest.customer_name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-neutral-300 text-xs pt-1">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                      <strong>{selectedRequest.customer_phone}</strong>
                    </span>
                    {selectedRequest.customer_email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#dfbe7e]" />
                        <span>{selectedRequest.customer_email}</span>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchWhatsAppQuote(selectedRequest)}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-display text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all shrink-0"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send Quote on WhatsApp</span>
                </button>
              </div>

              {/* Commission Specifications */}
              <div className="bg-[#071915] rounded-2xl p-5 border border-[#0f3830] space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-[#dfbe7e] font-bold block">
                  Artisan Specifications
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[#0f3830]">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Product / Commission Title:</span>
                    <span className="font-bold text-white text-sm">{selectedRequest.product_name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Quantity:</span>
                    <span className="font-bold text-white text-sm">{selectedRequest.quantity} Unit(s)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[#0f3830]">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Selected Colors:</span>
                    <span className="font-semibold text-white">
                      {selectedRequest.customization_details?.colors || 'Default'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Requested Dimensions:</span>
                    <span className="font-semibold text-white">
                      {selectedRequest.customization_details?.size || 'Standard'}
                    </span>
                  </div>
                </div>

                {selectedRequest.customization_details?.custom_text && (
                  <div className="pb-3 border-b border-[#0f3830]">
                    <span className="text-neutral-400 block text-[10px]">Custom Inscription / Name:</span>
                    <span className="font-serif-luxury text-sm text-[#dfbe7e]">
                      "{selectedRequest.customization_details.custom_text}"
                    </span>
                  </div>
                )}

                {selectedRequest.customization_details?.design_preferences && (
                  <div className="pb-3 border-b border-[#0f3830]">
                    <span className="text-neutral-400 block text-[10px]">Creative Vision / Design Preferences:</span>
                    <p className="text-neutral-200 mt-0.5 leading-relaxed bg-[#0c2c25] p-3 rounded-xl border border-[#0f3830]">
                      {selectedRequest.customization_details.design_preferences}
                    </p>
                  </div>
                )}

                {selectedRequest.customization_details?.additional_notes && (
                  <div className="pb-3 border-b border-[#0f3830]">
                    <span className="text-neutral-400 block text-[10px]">Special Instructions:</span>
                    <p className="text-neutral-300 mt-0.5">
                      {selectedRequest.customization_details.additional_notes}
                    </p>
                  </div>
                )}

                {/* Reference Images */}
                {(selectedRequest.reference_image_url || selectedRequest.product_image) && (
                  <div className="pt-2">
                    <span className="text-neutral-400 block text-[10px] mb-2">Attached Imagery:</span>
                    <div className="flex items-center gap-4">
                      {selectedRequest.reference_image_url && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">Customer Reference:</span>
                          <a
                            href={selectedRequest.reference_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group relative"
                          >
                            <img
                              src={selectedRequest.reference_image_url}
                              alt="Customer Reference"
                              className="w-24 h-24 rounded-xl object-cover border border-[#c5a059]/40 group-hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl transition-opacity">
                              <ExternalLink className="w-5 h-5 text-white" />
                            </div>
                          </a>
                        </div>
                      )}
                      {selectedRequest.product_image && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">Catalog Product:</span>
                          <img
                            src={selectedRequest.product_image}
                            alt="Catalog Product"
                            className="w-24 h-24 rounded-xl object-cover border border-[#0f3830]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Processing Flow: Converted Order Status or Move to Active Orders */}
              {selectedRequest.converted_order_number ? (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-400">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Commission Converted to Official Store Order
                      </span>
                      <span className="text-[11px] text-emerald-300 font-mono">
                        Store Order #{selectedRequest.converted_order_number}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/admin/orders/${selectedRequest.converted_order_id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors"
                  >
                    <span>View In Orders</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                (selectedRequest.status === 'Approved' || editStatus === 'Approved') && (
                  <div className="p-4 rounded-2xl bg-[#0b3b33] border border-[#c5a059]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#dfbe7e] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#c5a059]" />
                        <span>Client Accepted Quotation</span>
                      </span>
                      <p className="text-[11px] text-neutral-300">
                        Move this approved commission into active store orders to start studio crafting and tracking.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConvertToOrder}
                      disabled={isConvertingToOrder || !editPrice}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#071915] font-display text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg shrink-0 transition-all disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isConvertingToOrder ? 'Processing...' : 'Move to Active Orders'}</span>
                    </button>
                  </div>
                )
              )}

              {/* ADMIN CONTROLS FORM: FINAL PRICE & DELIVERY */}

              <form onSubmit={handleSaveAdminUpdates} className="bg-[#071915] rounded-2xl p-5 border border-[#c5a059]/40 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#0f3830]">
                  <span className="text-xs uppercase tracking-wider text-[#dfbe7e] font-bold flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-[#c5a059]" />
                    <span>Business Owner & Pricing Controls</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">Strictly Admin Controlled</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Final Quoted Price */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                      Final Agreed Price (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 5499"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#0c2c25] border border-[#0f3830] text-sm font-bold text-[#dfbe7e] focus:outline-none focus:border-[#c5a059]"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      Customers cannot modify this price.
                    </span>
                  </div>

                  {/* Estimated Delivery Time */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                      Estimated Delivery / Crafting Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5-7 days curing + 3 days express transit"
                      value={editDelivery}
                      onChange={(e) => setEditDelivery(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0c2c25] border border-[#0f3830] text-xs text-white focus:outline-none focus:border-[#c5a059]"
                    />
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                    Request Lifecycle Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as CustomRequestStatus)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c2c25] border border-[#0f3830] text-xs font-semibold text-white focus:outline-none focus:border-[#c5a059]"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Internal Admin Notes */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                    Internal Atelier Notes (Private to Admin)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Customer approved on call; using deep green pigment #4 and natural quartz rock..."
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0c2c25] border border-[#0f3830] text-xs text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeManageModal}
                    className="px-5 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#071915] font-display text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


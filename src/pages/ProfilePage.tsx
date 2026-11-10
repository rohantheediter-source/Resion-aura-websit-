import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  LogOut,
  Save,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ordersService } from '../services/ordersService';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);

  // Edit profile state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    async function loadOrders() {
      if (!user) return;
      try {
        const list = await ordersService.getCustomerOrders(user.id);
        setOrders(list);
      } catch (err) {
        console.error('Failed to load user orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    }
    if (user) {
      loadOrders();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { error: updateError } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      if (updateError) {
        error(updateError.message || 'Failed to update profile');
      } else {
        success('Profile updated successfully');
      }
    } catch (err: any) {
      error(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24">
        <LoadingSpinner label="Accessing collector profile..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] flex items-center justify-center font-display text-2xl font-bold shadow-sm overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Collector Avatar'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                (profile?.full_name || user.email || 'RA')[0].toUpperCase()
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#856338] font-bold">
                Collector Account
              </span>
              <h1 className="font-display text-2xl font-bold text-neutral-900">
                {profile?.full_name || 'Valued Patron'}
              </h1>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-300 hover:border-red-400 text-xs font-semibold text-neutral-700 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-neutral-200 mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'orders'
                ? 'border-[#0b3b33] text-[#0b3b33]'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Consignment History ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#0b3b33] text-[#0b3b33]'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Details</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <div>
            {ordersLoading ? (
              <LoadingSpinner label="Fetching your consignment records..." />
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200">
                <Package className="w-12 h-12 text-[#c5a059] mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold text-neutral-800 mb-2">
                  No Past Orders Found
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
                  You haven't commissioned any bespoke pieces with this account yet.
                </p>
                <Link
                  to="/shop"
                  className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#0b3b33] text-[#dfbe7e] text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Explore Gallery
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-neutral-100 gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                          Consignment Docket
                        </span>
                        <span className="font-mono text-sm font-bold text-[#0b3b33]">
                          {ord.order_number}
                        </span>
                        <span className="text-xs text-neutral-400 ml-3">
                          Placed on {formatDate(ord.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ord.status}
                        </span>
                        <Link
                          to={`/track-order?number=${ord.order_number}`}
                          className="flex items-center gap-1 text-xs font-bold text-[#0b3b33] hover:underline"
                        >
                          <span>Live Tracking</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-neutral-100 mb-4">
                      {ord.items?.map((it) => (
                        <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            {it.product_image && (
                              <img
                                src={it.product_image}
                                alt={it.product_name}
                                className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                              />
                            )}
                            <div>
                              <p className="font-bold text-neutral-900">{it.product_name}</p>
                              <p className="text-neutral-400 text-[11px]">Quantity: {it.quantity}</p>
                            </div>
                          </div>
                          <span className="font-bold text-neutral-900">
                            {formatCurrency(it.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                      <span className="text-neutral-500">
                        Payment: <strong className="text-neutral-800 uppercase">{ord.payment_method}</strong> ({ord.payment_status})
                      </span>
                      <div className="text-right">
                        <span className="text-neutral-500 mr-2">Total Investment:</span>
                        <strong className="font-display text-base text-[#0b3b33]">
                          {formatCurrency(ord.total_amount)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm max-w-xl">
            <h2 className="font-display text-base font-bold text-neutral-900 uppercase tracking-wider mb-6 pb-3 border-b border-neutral-100">
              Update Personal Details
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-neutral-400">Email cannot be changed directly</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#f7f4ee] font-display text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                <Save className="w-4 h-4 text-[#dfbe7e]" />
                <span>{isUpdating ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};


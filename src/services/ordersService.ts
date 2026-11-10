import { supabase } from './supabase';
import { Order, OrderStatus, PaymentStatus, ShippingAddress, CartItem } from '../types';
import { generateOrderNumber } from '../utils/formatters';

const LOCAL_ORDERS_KEY = 'resin_aura_orders_v1';

function isValidUUID(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function getLocalOrders(): Order[] {
  try {
    const saved = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return [];
}

function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch (_) {}
}

export const ordersService = {
  /**
   * Create a new order
   */
  async createOrder(params: {
    userId?: string | null;
    guestEmail?: string;
    guestName?: string;
    guestPhone?: string;
    shippingAddress: ShippingAddress;
    cart: CartItem[];
    subtotal: number;
    shippingFee: number;
    discountAmount?: number;
    totalAmount: number;
    paymentMethod: 'cod' | 'upi' | 'card' | 'bank_transfer';
    notes?: string;
  }): Promise<Order> {
    // 1. Mandatory Authentication Verification: Must have an active Supabase authenticated session
    const { data: { session } } = await supabase.auth.getSession();
    const sessionUserId = session?.user?.id;
    const verifiedUserId = isValidUUID(sessionUserId)
      ? sessionUserId
      : (isValidUUID(params.userId) ? params.userId : null);

    if (!verifiedUserId) {
      throw new Error('Authentication required. Please sign in to place your order.');
    }

    const orderNumber = generateOrderNumber();
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();
    const safeUserId = verifiedUserId;

    const orderRecord: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: safeUserId,
      guest_email: params.guestEmail || '',
      guest_name: params.guestName || params.shippingAddress.fullName,
      guest_phone: params.guestPhone || params.shippingAddress.phone,
      shipping_address: params.shippingAddress,
      status: 'placed',
      subtotal: params.subtotal,
      shipping_fee: params.shippingFee,
      discount_amount: params.discountAmount || 0,
      total_amount: params.totalAmount,
      payment_method: params.paymentMethod,
      payment_status: params.paymentMethod === 'cod' ? 'pending' : 'pending',
      notes: params.notes || '',
      created_at: now,
      items: params.cart.map((c) => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: isValidUUID(c.productId) ? c.productId : null,
        product_name: c.product.name,
        product_image: c.product.image,
        unit_price: c.product.price,
        quantity: c.quantity,
        total_price: c.product.price * c.quantity,
        variant_details: c.selectedVariant ? { variant: c.selectedVariant } : undefined,
      })),
    };

    // Attempt to persist to Supabase via secure atomic place_order RPC
    let remoteOrderPlaced = false;
    try {
      const rpcItems = params.cart.map((c) => ({
        product_id: c.productId,
        quantity: c.quantity,
        variant_details: c.selectedVariant ? { variant: c.selectedVariant } : null,
      }));

      const { data: rpcData, error: rpcError } = await supabase.rpc('place_order', {
        p_order_number: orderRecord.order_number,
        p_guest_name: orderRecord.guest_name,
        p_guest_email: orderRecord.guest_email,
        p_guest_phone: orderRecord.guest_phone,
        p_shipping_address: orderRecord.shipping_address,
        p_payment_method: orderRecord.payment_method,
        p_notes: orderRecord.notes || '',
        p_items: rpcItems,
      });

      if (!rpcError && rpcData) {
        remoteOrderPlaced = true;
        if (rpcData.id) orderRecord.id = rpcData.id;
        if (rpcData.total_amount !== undefined) orderRecord.total_amount = Number(rpcData.total_amount);
        if (rpcData.subtotal !== undefined) orderRecord.subtotal = Number(rpcData.subtotal);
        if (rpcData.shipping_fee !== undefined) orderRecord.shipping_fee = Number(rpcData.shipping_fee);
      } else if (rpcError) {
        console.warn('Supabase place_order RPC returned error, attempting direct insert fallback:', rpcError);
      }
    } catch (rpcEx) {
      console.warn('Supabase place_order RPC exception, attempting direct insert fallback:', rpcEx);
    }

    // Direct insert fallback if RPC is not present
    if (!remoteOrderPlaced) {
      try {
        const { error: orderError } = await supabase.from('orders').insert({
          id: orderRecord.id,
          order_number: orderRecord.order_number,
          user_id: safeUserId,
          guest_email: orderRecord.guest_email,
          guest_name: orderRecord.guest_name,
          guest_phone: orderRecord.guest_phone,
          shipping_address: orderRecord.shipping_address,
          status: orderRecord.status,
          subtotal: orderRecord.subtotal,
          shipping_fee: orderRecord.shipping_fee,
          discount_amount: orderRecord.discount_amount,
          total_amount: orderRecord.total_amount,
          payment_method: orderRecord.payment_method,
          payment_status: orderRecord.payment_status,
          notes: orderRecord.notes,
          created_at: now,
        });

        if (orderError) {
          console.warn('Supabase order direct insert warning:', orderError);
        } else if (orderRecord.items && orderRecord.items.length > 0) {
          const itemInserts = orderRecord.items.map((it) => ({
            id: isValidUUID(it.id) ? it.id : crypto.randomUUID(),
            order_id: it.order_id,
            product_id: isValidUUID(it.product_id) ? it.product_id : null,
            product_name: it.product_name,
            product_image: it.product_image,
            unit_price: it.unit_price,
            quantity: it.quantity,
            total_price: it.total_price,
            variant_details: it.variant_details || null,
          }));
          const { error: itemError } = await supabase.from('order_items').insert(itemInserts);
          if (itemError) {
            console.warn('Supabase order_items insert warning:', itemError);
          }
        }
      } catch (e) {
        console.warn('Could not save to Supabase orders table, using local storage:', e);
      }
    }

    // Always record locally
    const local = getLocalOrders();
    local.unshift(orderRecord);
    saveLocalOrders(local);

    return orderRecord;
  },

  /**
   * Helper to sync a local order to Supabase
   */
  async syncOrderToSupabase(order: Order): Promise<boolean> {
    try {
      const safeUserId = isValidUUID(order.user_id) ? order.user_id : null;
      const { error: ordErr } = await supabase.from('orders').upsert({
        id: order.id,
        order_number: order.order_number,
        user_id: safeUserId,
        guest_email: order.guest_email || null,
        guest_name: order.guest_name || null,
        guest_phone: order.guest_phone || null,
        shipping_address: order.shipping_address,
        status: order.status,
        subtotal: order.subtotal,
        shipping_fee: order.shipping_fee,
        discount_amount: order.discount_amount || 0,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        notes: order.notes || null,
        created_at: order.created_at,
      }, { onConflict: 'id' });

      if (!ordErr && order.items && order.items.length > 0) {
        const itemInserts = order.items.map((it) => ({
          id: isValidUUID(it.id) ? it.id : crypto.randomUUID(),
          order_id: order.id,
          product_id: isValidUUID(it.product_id) ? it.product_id : null,
          product_name: it.product_name,
          product_image: it.product_image,
          unit_price: it.unit_price,
          quantity: it.quantity,
          total_price: it.total_price,
          variant_details: it.variant_details || null,
        }));
        await supabase.from('order_items').upsert(itemInserts, { onConflict: 'id' });
      }
      return !ordErr;
    } catch (_) {
      return false;
    }
  },

  /**
   * Get orders for a customer
   */
  async getCustomerOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Order[];
      }
    } catch (_) {}

    const local = getLocalOrders();
    return local.filter((o) => o.user_id === userId);
  },

  /**
   * Admin: Get all orders
   */
  async getAllAdminOrders(): Promise<Order[]> {
    let supabaseOrders: Order[] = [];
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        supabaseOrders = data as Order[];
      } else if (error) {
        console.warn('Error fetching admin orders from Supabase:', error);
      }
    } catch (err) {
      console.warn('Supabase getAllAdminOrders exception:', err);
    }

    const localOrders = getLocalOrders();

    // Background sync: If any local orders are missing from Supabase, sync them
    if (localOrders.length > 0) {
      const supabaseIds = new Set(supabaseOrders.map((o) => o.id));
      const supabaseNumbers = new Set(supabaseOrders.map((o) => o.order_number));

      for (const locOrder of localOrders) {
        if (!supabaseIds.has(locOrder.id) && !supabaseNumbers.has(locOrder.order_number)) {
          this.syncOrderToSupabase(locOrder).catch((e) => console.warn('Background sync failed:', e));
        }
      }
    }

    // Merge Supabase orders with local orders (prevent duplicates)
    const map = new Map<string, Order>();
    for (const o of localOrders) {
      map.set(o.id || o.order_number, o);
    }
    for (const o of supabaseOrders) {
      map.set(o.id || o.order_number, o);
    }

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return combined;
  },

  /**
   * Admin: Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string, carrier?: string): Promise<boolean> {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (trackingNumber) payload.tracking_number = trackingNumber;
    if (carrier) payload.carrier = carrier;

    try {
      const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
      if (error) console.warn('Supabase updateOrderStatus error:', error);
    } catch (err) {
      console.warn('Supabase updateOrderStatus exception:', err);
    }

    const local = getLocalOrders();
    const order = local.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      if (trackingNumber) order.tracking_number = trackingNumber;
      if (carrier) order.carrier = carrier;
      saveLocalOrders(local);
    }
    return true;
  },

  /**
   * Admin: Update payment status
   */
  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) console.warn('Supabase updatePaymentStatus error:', error);
    } catch (err) {
      console.warn('Supabase updatePaymentStatus exception:', err);
    }

    const local = getLocalOrders();
    const order = local.find((o) => o.id === orderId);
    if (order) {
      order.payment_status = paymentStatus;
      saveLocalOrders(local);
    }
    return true;
  },

  /**
   * Track order by order number and phone or email
   */
  async trackOrder(orderNumber: string, identifier?: string): Promise<Order | null> {
    const cleanNumber = orderNumber.trim().toUpperCase();

    // 1. Try secure RPC function (works for guests with verification & authenticated owners)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('track_order_secure', {
        p_order_number: cleanNumber,
        p_verification: identifier || null,
      });

      if (!rpcError && rpcData) {
        return rpcData as Order;
      }
    } catch (_) {}

    // 2. Direct table query (works for authenticated owners and authorized admins via RLS)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('order_number', cleanNumber)
        .maybeSingle();

      if (!error && data) {
        return data as Order;
      }
    } catch (e) {
      console.warn('Error querying trackOrder in Supabase:', e);
    }

    const local = getLocalOrders();
    return local.find((o) => o.order_number.toUpperCase() === cleanNumber) || null;
  },
};


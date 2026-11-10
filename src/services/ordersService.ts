import { supabase } from './supabase';
import { Order, OrderStatus, PaymentStatus, ShippingAddress, CartItem } from '../types';
import { generateOrderNumber } from '../utils/formatters';

const LOCAL_ORDERS_KEY = 'resin_aura_orders_v1';

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
    const orderNumber = generateOrderNumber();
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    const orderRecord: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: params.userId || null,
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
        product_id: c.productId,
        product_name: c.product.name,
        product_image: c.product.image,
        unit_price: c.product.price,
        quantity: c.quantity,
        total_price: c.product.price * c.quantity,
        variant_details: c.selectedVariant ? { variant: c.selectedVariant } : undefined,
      })),
    };

    // Attempt to persist to Supabase
    try {
      const { error: orderError } = await supabase.from('orders').insert({
        id: orderRecord.id,
        order_number: orderRecord.order_number,
        user_id: orderRecord.user_id,
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

      if (!orderError && orderRecord.items) {
        const itemInserts = orderRecord.items.map((it) => ({
          id: it.id,
          order_id: it.order_id,
          product_id: it.product_id,
          product_name: it.product_name,
          product_image: it.product_image,
          unit_price: it.unit_price,
          quantity: it.quantity,
          total_price: it.total_price,
          variant_details: it.variant_details,
        }));
        await supabase.from('order_items').insert(itemInserts);
      }
    } catch (e) {
      console.warn('Could not save to Supabase orders table, using local storage:', e);
    }

    // Always record locally
    const local = getLocalOrders();
    local.unshift(orderRecord);
    saveLocalOrders(local);

    return orderRecord;
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
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Order[];
      }
    } catch (_) {}

    return getLocalOrders();
  },

  /**
   * Admin: Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string, carrier?: string): Promise<boolean> {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (trackingNumber) payload.tracking_number = trackingNumber;
    if (carrier) payload.carrier = carrier;

    try {
      await supabase.from('orders').update(payload).eq('id', orderId);
    } catch (_) {}

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
      await supabase.from('orders').update({ payment_status: paymentStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    } catch (_) {}

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

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('order_number', cleanNumber);

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return data as Order;
      }
    } catch (_) {}

    const local = getLocalOrders();
    return local.find((o) => o.order_number.toUpperCase() === cleanNumber) || null;
  },
};


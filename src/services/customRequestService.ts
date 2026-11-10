import { supabase } from './supabase';
import { ordersService } from './ordersService';
import {
  CustomizationRequest,
  CustomRequestType,
  CustomRequestStatus,
  CustomizationDetails,
  Order,
} from '../types';

import {
  WHATSAPP_BUSINESS_NUMBER,
  WHATSAPP_DISPLAY_NUMBER,
  buildWhatsAppChatUrl,
} from '../utils/constants';

const LOCAL_CUSTOM_REQ_KEY = 'resin_aura_custom_requests_v1';

function getLocalCustomRequests(): CustomizationRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_REQ_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

function saveLocalCustomRequests(list: CustomizationRequest[]) {
  try {
    localStorage.setItem(LOCAL_CUSTOM_REQ_KEY, JSON.stringify(list));
  } catch (_) {}
}

export function generateRequestNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${year}-${rand}`;
}

/**
 * Formats a clean, luxury WhatsApp message for custom orders
 */
export function formatCustomRequestWhatsAppMessage(
  req: Pick<
    CustomizationRequest,
    | 'request_number'
    | 'request_type'
    | 'customer_name'
    | 'customer_phone'
    | 'customer_email'
    | 'product_name'
    | 'quantity'
    | 'customization_details'
    | 'reference_image_url'
  >
): string {
  const isExisting = req.request_type === 'existing_product';
  const typeLabel = isExisting ? 'Customize Existing Atelier Product' : 'New Bespoke Custom Design';
  const itemTitle = req.product_name || 'Bespoke Handmade Resin Artwork';
  const details = req.customization_details || {};

  let msg = `✨ *RESIN AURA — BESPOKE COMMISSION INQUIRY* ✨\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*Request ID:* ${req.request_number}\n`;
  msg += `*Commission Type:* ${typeLabel}\n`;
  msg += `*Item / Design:* ${itemTitle}\n`;
  msg += `*Quantity:* ${req.quantity || 1}\n\n`;

  msg += `👤 *Customer Information:*\n`;
  msg += `• *Name:* ${req.customer_name}\n`;
  msg += `• *WhatsApp / Phone:* ${req.customer_phone}\n`;
  if (req.customer_email) {
    msg += `• *Email:* ${req.customer_email}\n`;
  }
  msg += `\n`;

  msg += `🎨 *Customization Preferences:*\n`;
  if (details.category) {
    msg += `• *Category / Form:* ${details.category}\n`;
  }
  if (details.colors) {
    msg += `• *Color Palette:* ${details.colors}\n`;
  }
  if (details.size) {
    msg += `• *Dimensions / Size:* ${details.size}\n`;
  }
  if (details.clock_hands) {
    msg += `• *Clock Hands:* ${details.clock_hands}\n`;
  }
  if (details.dial_style) {
    msg += `• *Dial Markers:* ${details.dial_style}\n`;
  }
  if (details.metal_setting) {
    msg += `• *Jewelry Hardware:* ${details.metal_setting}\n`;
  }
  if (details.floral_element) {
    msg += `• *Botanical Inclusions:* ${details.floral_element}\n`;
  }
  if (details.edge_trim) {
    msg += `• *Platter Edge Trim:* ${details.edge_trim}\n`;
  }
  if (details.handles_style) {
    msg += `• *Handles / Hardware:* ${details.handles_style}\n`;
  }
  if (details.custom_text) {

    msg += `• *Custom Inscription / Name:* "${details.custom_text}"\n`;
  }
  if (details.design_preferences) {
    msg += `• *Design Aesthetics:* ${details.design_preferences}\n`;
  }
  if (details.additional_notes) {
    msg += `• *Special Instructions:* ${details.additional_notes}\n`;
  }
  if (details.selected_variant) {
    msg += `• *Base Finish:* ${details.selected_variant}\n`;
  }
  msg += `\n`;

  if (req.reference_image_url) {
    if (req.reference_image_url.startsWith('http')) {
      msg += `📷 *Reference Image URL:*\n${req.reference_image_url}\n\n`;
    } else {
      msg += `📷 *Reference Image:* [Attached by customer in WhatsApp]\n\n`;
    }
  } else {
    msg += `📷 *Reference Image:* [None uploaded]\n\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💬 *Price & Production Notice:*\n`;
  msg += `I understand that final pricing, customization charges, and delivery schedule will be quoted directly by Resin Aura atelier artisans.\n`;
  msg += `Thank you!`;

  return msg;
}

/**
 * Prepares the admin's quote response to send to customer on WhatsApp
 */
export function formatAdminQuoteWhatsAppMessage(req: CustomizationRequest): string {
  const itemTitle = req.product_name || 'Bespoke Resin Art Commission';
  const priceDisplay = req.final_price ? `₹${req.final_price.toLocaleString('en-IN')}` : 'To be confirmed';
  const deliveryDisplay = req.estimated_delivery || '5–7 business days crafting + transit';

  let msg = `Greetings ${req.customer_name}! ✨\n\n`;
  msg += `This is *RESIN AURA Luxury Atelier* regarding your custom request *${req.request_number}* for *${itemTitle}*.\n\n`;
  msg += `We have reviewed your creative requirements and are excited to bring this artwork to life for you:\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `• *Final Quoted Price:* ${priceDisplay}\n`;
  msg += `• *Estimated Crafting & Delivery:* ${deliveryDisplay}\n`;
  if (req.admin_notes) {
    msg += `• *Atelier Notes:* ${req.admin_notes}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `To confirm and begin hand-pouring your artwork, kindly reply *CONFIRM* to this message, or let us know if you would like any adjustments to the palette or dimensions.`;

  return msg;
}

export const customRequestService = {
  /**
   * Submit a new customization request
   */
  async submitCustomRequest(params: {
    requestType: CustomRequestType;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    productId?: string | null;
    productName?: string;
    productImage?: string;
    customizationDetails: CustomizationDetails;
    referenceImageUrl?: string;
    quantity: number;
  }): Promise<{
    request: CustomizationRequest;
    whatsAppUrl: string;
    whatsAppMessage: string;
  }> {
    const requestNumber = generateRequestNumber();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newRequest: CustomizationRequest = {
      id,
      request_number: requestNumber,
      request_type: params.requestType,
      customer_name: params.customerName.trim(),
      customer_phone: params.customerPhone.trim(),
      customer_email: params.customerEmail?.trim() || '',
      product_id: params.productId || null,
      product_name: params.productName || (params.requestType === 'existing_product' ? 'Customized Product' : 'Bespoke Resin Commission'),
      product_image: params.productImage || '',
      customization_details: params.customizationDetails,
      reference_image_url: params.referenceImageUrl || '',
      quantity: Math.max(1, params.quantity || 1),
      final_price: null,
      estimated_delivery: null,
      admin_notes: null,
      status: 'Pending',
      created_at: now,
      updated_at: now,
    };

    // Format WhatsApp message
    const whatsAppMessage = formatCustomRequestWhatsAppMessage(newRequest);
    const whatsAppUrl = buildWhatsAppChatUrl(whatsAppMessage);

    // Save to Supabase
    try {
      const { data, error } = await supabase
        .from('customization_requests')
        .insert({
          id: newRequest.id,
          request_number: newRequest.request_number,
          request_type: newRequest.request_type,
          customer_name: newRequest.customer_name,
          customer_phone: newRequest.customer_phone,
          customer_email: newRequest.customer_email || null,
          product_id: newRequest.product_id,
          product_name: newRequest.product_name,
          product_image: newRequest.product_image || null,
          customization_details: newRequest.customization_details,
          reference_image_url: newRequest.reference_image_url || null,
          quantity: newRequest.quantity,
          final_price: null,
          estimated_delivery: null,
          admin_notes: null,
          status: 'Pending',
        })
        .select()
        .single();

      if (!error && data) {
        newRequest.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase insert failed, saving to local offline storage:', err);
    }

    // Always keep in local storage for instantaneous admin view & resilient offline fallback
    const local = getLocalCustomRequests();
    saveLocalCustomRequests([newRequest, ...local]);

    return {
      request: newRequest,
      whatsAppUrl,
      whatsAppMessage,
    };
  },

  /**
   * Get all custom requests (Admin)
   */
  async getAllRequests(): Promise<CustomizationRequest[]> {
    const localList = getLocalCustomRequests();
    try {
      const { data, error } = await supabase
        .from('customization_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Merge Supabase with any local-only records
        const remoteIds = new Set(data.map((r: any) => r.id));
        const combined = [
          ...data,
          ...localList.filter((l) => !remoteIds.has(l.id)),
        ];
        saveLocalCustomRequests(combined);
        return combined;
      }
    } catch (err) {
      console.warn('Error fetching custom requests from Supabase:', err);
    }

    return localList;
  },

  /**
   * Get single request by ID
   */
  async getRequestById(id: string): Promise<CustomizationRequest | null> {
    try {
      const { data, error } = await supabase
        .from('customization_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) return data;
    } catch (_) {}

    const localList = getLocalCustomRequests();
    return localList.find((r) => r.id === id) || null;
  },

  /**
   * Update request status, final price, estimated delivery, and admin notes (Admin)
   */
  async updateRequestByAdmin(
    id: string,
    updates: {
      status?: CustomRequestStatus;
      final_price?: number | null;
      estimated_delivery?: string | null;
      admin_notes?: string | null;
    }
  ): Promise<CustomizationRequest> {
    const now = new Date().toISOString();
    const payload: any = {
      updated_at: now,
    };

    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.final_price !== undefined) payload.final_price = updates.final_price;
    if (updates.estimated_delivery !== undefined) payload.estimated_delivery = updates.estimated_delivery;
    if (updates.admin_notes !== undefined) payload.admin_notes = updates.admin_notes;
    if ((updates as any).converted_order_id !== undefined) payload.converted_order_id = (updates as any).converted_order_id;
    if ((updates as any).converted_order_number !== undefined) payload.converted_order_number = (updates as any).converted_order_number;


    // Try Supabase update
    try {
      await supabase
        .from('customization_requests')
        .update(payload)
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase update failed for custom request:', err);
    }

    // Update in local storage
    const localList = getLocalCustomRequests();
    const index = localList.findIndex((r) => r.id === id);
    let updatedRecord: CustomizationRequest;

    if (index >= 0) {
      updatedRecord = {
        ...localList[index],
        ...payload,
      };
      localList[index] = updatedRecord;
    } else {
      updatedRecord = {
        id,
        request_number: `REQ-2026-${id.slice(0, 4)}`,
        request_type: 'new_custom_design',
        customer_name: 'Customer',
        customer_phone: '',
        customization_details: {},
        quantity: 1,
        status: updates.status || 'Pending',
        created_at: now,
        ...payload,
      };
      localList.unshift(updatedRecord);
    }

    saveLocalCustomRequests(localList);
    return updatedRecord;
  },

  /**
   * Convert an approved custom request into an official store order for production processing
   */
  async convertCustomRequestToOrder(
    request: CustomizationRequest,
    shippingAddress?: {
      streetAddress?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    }
  ): Promise<{ order: Order; updatedRequest: CustomizationRequest }> {
    const finalAmount = (request.final_price || 0) * (request.quantity || 1);

    const order = await ordersService.createOrder({
      guestName: request.customer_name,
      guestPhone: request.customer_phone,
      guestEmail: request.customer_email || 'patron@resinaura.com',
      shippingAddress: {
        fullName: request.customer_name,
        phone: request.customer_phone,
        streetAddress: shippingAddress?.streetAddress || 'Bespoke Atelier Order (Confirmed via WhatsApp)',
        city: shippingAddress?.city || 'Studio Transit',
        state: shippingAddress?.state || 'India',
        postalCode: shippingAddress?.postalCode || '110001',
        country: 'India',
      },
      cart: [
        {
          id: crypto.randomUUID(),
          productId: request.product_id || request.id,
          product: {
            id: request.product_id || request.id,
            category_id: '',
            name: `${request.product_name} (#${request.request_number})`,
            slug: `custom-${request.request_number.toLowerCase()}`,
            description: request.customization_details?.design_preferences || 'Bespoke Resin Art Commission',
            price: request.final_price || 0,
            stock: 1,
            sku: request.request_number,
            is_active: true,
            is_featured: false,
            is_bestseller: false,
            is_new_arrival: false,
            image: request.product_image || request.reference_image_url || '/images/products/da818ee20766a8244b4a924dd001d4c1.png',
            images: [request.product_image || request.reference_image_url || '/images/products/da818ee20766a8244b4a924dd001d4c1.png'],
          },
          quantity: request.quantity,
          selectedVariant: request.customization_details?.size || request.customization_details?.colors,
        },
      ],
      subtotal: finalAmount,
      shippingFee: 0,
      totalAmount: finalAmount,
      paymentMethod: 'upi',
      notes: `Custom Commission #${request.request_number}. Palette: ${request.customization_details?.colors || ''}. Inscription: ${request.customization_details?.custom_text || 'None'}. Delivery: ${request.estimated_delivery || 'Standard'}.`,
    });

    // Update custom request to 'In Production' and record order reference
    const updatedRequest = await this.updateRequestByAdmin(request.id, {
      status: 'In Production',
      converted_order_id: order.id,
      converted_order_number: order.order_number,
      admin_notes: `${request.admin_notes || ''} [Converted to Order #${order.order_number}]`.trim(),
    } as any);

    return { order, updatedRequest };
  },

  /**
   * Generates WhatsApp link for admin to contact customer
   */
  getAdminToCustomerWhatsAppUrl(request: CustomizationRequest): string {

    const text = formatAdminQuoteWhatsAppMessage(request);
    return buildWhatsAppChatUrl(text, request.customer_phone);
  },
};


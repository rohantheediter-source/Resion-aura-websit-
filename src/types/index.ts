export type UserRole = 'customer' | 'admin' | 'editor';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role?: UserRole;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_featured: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  category_slug?: string;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  story?: string;
  price: number;
  compare_at_price?: number;
  stock: number;
  sku: string;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  dimensions?: string;
  material?: string;
  cure_time?: string;
  care_instructions?: string;
  rating?: number;
  review_count?: number;
  image: string;
  images: string[];
  created_at?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface WishlistItem {
  productId: string;
  product: Product;
  addedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = 'placed' | 'confirmed' | 'crafting' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'upi' | 'card' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  variant_details?: Record<string, any>;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  guest_email?: string;
  guest_name?: string;
  guest_phone?: string;
  shipping_address: ShippingAddress;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  tracking_number?: string;
  carrier?: string;
  created_at: string;
  items?: OrderItem[];
}

export type CustomRequestType = 'existing_product' | 'new_custom_design';

export type CustomRequestStatus =
  | 'Pending'
  | 'Under Review'
  | 'Price Quoted'
  | 'Awaiting Customer Approval'
  | 'Approved'
  | 'In Production'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export interface CustomizationDetails {
  category?: string;
  colors?: string;
  size?: string;
  custom_text?: string;
  design_preferences?: string;
  additional_notes?: string;
  selected_variant?: string;
  [key: string]: any;
}

export interface CustomizationRequest {
  id: string;
  request_number: string;
  request_type: CustomRequestType;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  product_id?: string | null;
  product_name?: string;
  product_image?: string;
  customization_details: CustomizationDetails;
  reference_image_url?: string;
  quantity: number;
  final_price?: number | null;
  estimated_delivery?: string | null;
  admin_notes?: string | null;
  status: CustomRequestStatus;
  converted_order_id?: string | null;
  converted_order_number?: string | null;
  created_at: string;
  updated_at?: string;
}




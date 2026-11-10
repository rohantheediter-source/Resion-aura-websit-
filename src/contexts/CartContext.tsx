import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CartItem, Product } from '../types';
import { useToast } from './ToastContext';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: CartItem[];
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  finalTotal: number;
  isFreeShipping: boolean;
  addToCart: (product: Product, quantity?: number, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'resin_aura_cart_v1';
const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING_FEE = 149;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { success } = useToast();
  const { user } = useAuth();

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  // Sync with Supabase when logged in
  useEffect(() => {
    if (!user) return;
    const currentUserId = user.id;
    async function syncRemoteCart() {
      try {
        const { data: cartData } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', currentUserId)
          .maybeSingle();

        let cartId = cartData?.id;
        if (!cartId) {
          const { data: newCart } = await supabase
            .from('carts')
            .insert({ user_id: currentUserId })
            .select('id')
            .single();
          cartId = newCart?.id;
        }
      } catch (err) {
        // Silent catch for initial setup
      }
    }
    syncRemoteCart();
  }, [user]);

  const addToCart = useCallback((product: Product, quantity: number = 1, variant?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, product.stock || 99),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            product,
            quantity: Math.min(quantity, product.stock || 99),
            selectedVariant: variant,
          },
        ];
      }
    });
    success(`Added "${product.name}" to your cart`);
  }, [success]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const maxStock = item.product.stock || 99;
          return {
            ...item,
            quantity: Math.min(quantity, maxStock),
          };
        }
        return item;
      })
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
  const shippingFee = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItems,
        subtotal,
        shippingFee,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        finalTotal,
        isFreeShipping,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

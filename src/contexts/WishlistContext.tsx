import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, WishlistItem } from '../types';
import { useToast } from './ToastContext';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  wishlist: WishlistItem[];
  totalWishlist: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'resin_aura_wishlist_v1';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { success, info } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist:', e);
    }
  }, [wishlist]);

  // Sync with Supabase wishlists
  useEffect(() => {
    if (!user) return;
    const currentUserId = user.id;
    async function syncRemoteWishlist() {
      try {
        const { data: wishlistRecord } = await supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (wishlistRecord) {
          const { data: items } = await supabase
            .from('wishlist_items')
            .select('product_id, products(*)')
            .eq('wishlist_id', wishlistRecord.id);

          if (items && items.length > 0) {
            // merge remote with local
            const remoteMapped: WishlistItem[] = items
              .filter((it: any) => it.products)
              .map((it: any) => ({
                productId: it.product_id,
                product: it.products,
                addedAt: new Date().toISOString(),
              }));
            setWishlist((prev) => {
              const existingIds = new Set(prev.map(p => p.productId));
              const additions = remoteMapped.filter(r => !existingIds.has(r.productId));
              return [...prev, ...additions];
            });
          }
        }
      } catch (_) {}
    }
    syncRemoteWishlist();
  }, [user]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some((item) => item.productId === productId);
  }, [wishlist]);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
    info('Removed from your wishlist');
  }, [info]);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.productId === product.id);
      if (exists) {
        info(`Removed "${product.name}" from your wishlist`);
        return prev.filter((item) => item.productId !== product.id);
      } else {
        success(`Saved "${product.name}" to your wishlist`);
        return [
          ...prev,
          {
            productId: product.id,
            product,
            addedAt: new Date().toISOString(),
          },
        ];
      }
    });
  }, [success, info]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        totalWishlist: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

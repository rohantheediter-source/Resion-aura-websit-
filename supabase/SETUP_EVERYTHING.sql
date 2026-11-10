-- ==============================================================================
-- RESIN AURA — COMPLETE ONE-CLICK DATABASE SETUP & SEED SCRIPT
-- Paste this ENTIRE file into the Supabase SQL Editor and click RUN.
-- ==============================================================================

-- ==============================================================================
-- RESIN AURA — PRODUCTION SUPABASE DATABASE SCHEMA MIGRATION
-- Project: https://ybnkfhiqtsnzaauzuxve.supabase.co
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USER ROLES TABLE (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  story TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  dimensions TEXT,
  material TEXT DEFAULT 'Ultra-Clear UV-Resistant Epoxy Resin',
  cure_time TEXT DEFAULT '72-Hour Curing Process',
  care_instructions TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CARTS TABLE
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CART ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_variant JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(cart_id, product_id)
);

-- 8. WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. WISHLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(wishlist_id, product_id)
);

-- 10. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  apartment TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_name TEXT,
  guest_phone TEXT,
  shipping_address JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'crafting', 'dispatched', 'delivered', 'cancelled')),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'upi', 'card', 'bank_transfer')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  notes TEXT,
  tracking_number TEXT,
  carrier TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  variant_details JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- AUTOMATIC AUTH TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'customer')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wishlists (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Categories: public read, admin write
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- Products: public read active, admin manage all
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (public.is_admin());

-- Product Images: public read, admin manage
DROP POLICY IF EXISTS "Public read product images" ON public.product_images;
CREATE POLICY "Public read product images" ON public.product_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage product images" ON public.product_images;
CREATE POLICY "Admin manage product images" ON public.product_images FOR ALL USING (public.is_admin());

-- Profiles: user read/write own, admin read all
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Roles: user view own role, admin manage roles
DROP POLICY IF EXISTS "Users view own role" ON public.user_roles;
CREATE POLICY "Users view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;
CREATE POLICY "Admin manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- Addresses: user manage own
DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- Wishlists & Wishlist items: user manage own
DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlists;
CREATE POLICY "Users manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users manage own wishlist items" ON public.wishlist_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND user_id = auth.uid())
);

-- Carts & Cart items: user manage own
DROP POLICY IF EXISTS "Users manage own cart" ON public.carts;
CREATE POLICY "Users manage own cart" ON public.carts FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Users manage own cart items" ON public.cart_items;
CREATE POLICY "Users manage own cart items" ON public.cart_items FOR ALL USING (true);

-- Orders: users view own orders, admin manage all orders, anyone can insert orders (guest or customer)
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Anyone can place order" ON public.orders;
CREATE POLICY "Anyone can place order" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admin delete orders" ON public.orders;
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE USING (public.is_admin());

-- Order Items: users view own order items, admin manage
DROP POLICY IF EXISTS "Users view order items" ON public.order_items;
CREATE POLICY "Users view order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin manage order items" ON public.order_items;
CREATE POLICY "Admin manage order items" ON public.order_items FOR ALL USING (public.is_admin());

-- Payments: users view own, admin view all, insert permitted
DROP POLICY IF EXISTS "View payments" ON public.payments;
CREATE POLICY "View payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "Insert payments" ON public.payments;
CREATE POLICY "Insert payments" ON public.payments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
CREATE POLICY "Admin manage payments" ON public.payments FOR ALL USING (public.is_admin());

-- Newsletter: anyone can subscribe, admin can read
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin view newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admin view newsletter subscribers" ON public.newsletter_subscribers FOR SELECT USING (public.is_admin());

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY EFFICIENCY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON public.wishlist_items(wishlist_id);


-- ==============================================================================
-- POPULATE INITIAL ARTISAN CATEGORIES & CURATED PRODUCTS
-- ==============================================================================

-- ==============================================================================
-- RESIN AURA — SEED DATA (CATEGORIES & CURATED PRODUCTS)
-- ==============================================================================

-- Seed Categories
INSERT INTO public.categories (id, name, slug, description, image_url, is_featured, display_order)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Resin Wall Clocks', 'wall-clocks', 'Bespoke geode timepieces and botanical wall clocks with 24K gold accents and quartz crystal infusions.', '/images/products/da818ee20766a8244b4a924dd001d4c1.png', true, 1),
  ('e1000000-0000-0000-0000-000000000002', 'Jewelry & Sets', 'jewelry-sets', 'Artisanal jhumkas, statement earrings, and heirloom-grade floral jewelry sets in crystal resin.', '/images/products/07892a59117c401b49ffdf42a9986e04.jpg', true, 2),
  ('e1000000-0000-0000-0000-000000000003', 'Pendants & Necklaces', 'pendants-necklaces', 'Luminous customized name pendants, celestial charms, and pressed floral keepsakes.', '/images/products/41105dc44070e0a229cd3f38d0695956.jpg', true, 3),
  ('e1000000-0000-0000-0000-000000000004', 'Bracelets & Bangles', 'bracelets-bangles', 'Preserved real rose petal bangles, pearl link bracelets, and gold-foiled botanical cuffs.', '/images/products/3b521b199f75c8b2b96b1b08fd3cdd20.jpg', true, 4),
  ('e1000000-0000-0000-0000-000000000005', 'Platters & Home Decor', 'ceremonial-decor', 'Royal pooja thalis, ceremonial Haldi trays, customized calligraphy pens, and keepsake ocean coasters.', '/images/products/05427a2e05e9d375217863c851519f85.jpg', true, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- Seed Products
INSERT INTO public.products (id, category_id, name, slug, description, story, price, compare_at_price, stock, sku, is_active, is_featured, is_bestseller, is_new_arrival, dimensions, material, cure_time, care_instructions, rating, review_count)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Celestial Nebula Milky Way Resin Art Clock', 'celestial-nebula-milky-way-resin-art-clock', 'An awe-inspiring midnight celestial artwork capturing snow-capped mountain peaks beneath the swirling galaxy of the Milky Way. Encased in high-gloss resin with luminous stardust effects.', 'Crafted as a signature piece by Resin Aura studio with premium non-yellowing artist epoxy and hand-selected minerals.', 6999, 8999, 7, 'RA-SIG-0001', true, true, true, true, '16 inches (40 cm) diameter', 'Museum-grade Crystal Clear Resin, 24K Gold Leaf & Natural Mineral Geodes', '96-Hour Slow Cure', 'Gently wipe with dry microfibre cloth. Keep away from direct abrasive surfaces.', 5, 38),
  ('d1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Imperial Emerald & 24K Gold Crystal Geode Wall Clock', 'imperial-emerald-24k-gold-crystal-geode-wall-clock', 'The pinnacle of luxury resin artistry. Multi-dimensional emerald swirls laced with raw quartz crystals and heavy 24K gold mineral veins. Powered by silent sweep quartz movement.', 'Crafted as a signature piece by Resin Aura studio with premium non-yellowing artist epoxy and hand-selected minerals.', 7999, 9999, 7, 'RA-SIG-0002', true, true, true, true, '16 inches (40 cm) diameter', 'Museum-grade Crystal Clear Resin, 24K Gold Leaf & Natural Mineral Geodes', '96-Hour Slow Cure', 'Gently wipe with dry microfibre cloth. Keep away from direct abrasive surfaces.', 5, 38),
  ('d1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'Pink Rose Quartz Natural Edge Geode Clock', 'pink-rose-quartz-natural-edge-geode-clock', 'Sculptural organic silhouette featuring crushed rose quartz crystal borders, mother-of-pearl shimmer center, and elegant silver Roman numerals.', 'Crafted as a signature piece by Resin Aura studio with premium non-yellowing artist epoxy and hand-selected minerals.', 6499, 7999, 7, 'RA-SIG-0003', true, true, true, true, '16 inches (40 cm) diameter', 'Museum-grade Crystal Clear Resin, 24K Gold Leaf & Natural Mineral Geodes', '96-Hour Slow Cure', 'Gently wipe with dry microfibre cloth. Keep away from direct abrasive surfaces.', 5, 38),
  ('d1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000005', 'Royal Haldi Floral Shagun Ceremonial Platter', 'royal-haldi-floral-shagun-ceremonial-platter', 'Radiant saffron and gold resin ceremonial thali with 3D sculpted floral bowls, pearl stamen embellishments, and golden butterflies. Perfect for Haldi, weddings, and sacred pooja ceremonies.', 'Crafted as a signature piece by Resin Aura studio with premium non-yellowing artist epoxy and hand-selected minerals.', 2899, 3599, 7, 'RA-SIG-0004', true, true, true, true, 'Handcrafted standard artisan sizing', 'Museum-grade Crystal Clear Resin, 24K Gold Leaf & Natural Mineral Geodes', '96-Hour Slow Cure', 'Gently wipe with dry microfibre cloth. Keep away from direct abrasive surfaces.', 5, 38),
  ('d1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000002', 'Preserved Blush Floral Resin Heirloom Jewelry Suite', 'preserved-blush-floral-resin-heirloom-jewelry-suite', 'Complete 4-piece coordinated artisan set featuring antique oxidized silver jhumkas with pearl drops, circular pendant necklace, statement ring, and adjustable hexagonal link bracelet.', 'Crafted as a signature piece by Resin Aura studio with premium non-yellowing artist epoxy and hand-selected minerals.', 2499, 3199, 7, 'RA-SIG-0005', true, true, true, true, 'Handcrafted standard artisan sizing', 'Museum-grade Crystal Clear Resin, 24K Gold Leaf & Natural Mineral Geodes', '96-Hour Slow Cure', 'Gently wipe with dry microfibre cloth. Keep away from direct abrasive surfaces.', 5, 38),
  ('d1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000005', 'Bespoke Diamond Dust & Glitter Resin Signature Pens', 'bespoke-diamond-dust-glitter-resin-signature-pens', 'Handmade luxury custom writing pens infused with metallic holographic flakes, floating butterfly charms, and personalized golden lettering.', 'Crafted as a signature piece by Resin Aura studio with premium non-yellowing artist epoxy and hand-selected minerals.', 499, 699, 7, 'RA-SIG-0006', true, true, true, true, 'Handcrafted standard artisan sizing', 'Museum-grade Crystal Clear Resin, 24K Gold Leaf & Natural Mineral Geodes', '96-Hour Slow Cure', 'Gently wipe with dry microfibre cloth. Keep away from direct abrasive surfaces.', 5, 38),
  ('d1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000005', 'Customized Calligraphy Resin Signature Pen', 'customized-calligraphy-resin-signature-pen', 'Embrace love with a heart-shaped resin pendant – a symbol of affection and artistry, a wearable masterpiece to cherish.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2858, 3573, 4, 'RA-CER-0007', true, false, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 63),
  ('d1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000005', 'Customized Name Resin Pendants', 'customized-name-resin-pendants', 'Custom Name Resin Pendants Ideas| Customized Resin Jewellery Ideas| Resin Necklaces| Preserve Memories| Resin Keepsakes Ideas| Handmade Jewellery', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2995, 3744, 11, 'RA-CER-0008', true, true, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 16),
  ('d1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000004', 'Sunflower Power Bracelet', 'sunflower-power-bracelet', 'Custom Bracelets from Charlotte''s Outré | Based in Singapore', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1032, 1290, 6, 'RA-BRA-0009', true, false, false, true, 'Standard 2.4 - 2.6 inches inner diameter', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 33),
  ('d1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000004', 'Handmade Pearl Bracelet with Floral Resin Details', 'handmade-pearl-bracelet-with-floral-resin-details', 'Elegant handmade bracelet featuring freshwater pearls and preserved floral elements in resin. Nature-inspired jewelry designed for feminine and sophisticated styling.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1169, 1461, 13, 'RA-BRA-0010', true, false, true, false, 'Standard 2.4 - 2.6 inches inner diameter', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 50),
  ('d1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000005', 'Royal Gem Pooja Thali With Diya Holders', 'royal-gem-pooja-thali-with-diya-holders', 'Meticulously handcrafted royal gem pooja thali with diya holders infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2206, 2758, 8, 'RA-CER-0011', true, false, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 67),
  ('d1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000002', 'Gold Leaf & Cornflower Danglers', 'gold-leaf-cornflower-danglers', 'Meticulously handcrafted gold leaf & cornflower danglers infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1343, 1679, 12, 'RA-JEW-0012', true, true, false, true, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 20),
  ('d1000000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000005', 'Shagun Festive Tilak Platter', 'shagun-festive-tilak-platter', 'Resin Rakhi / Pooja/ Tilak Shagun platter Can be customised✅ DM to place your order now!! Can be customized in any colour!! (Sizes available- 4”, 5”, 6” & 8”) Accepting Bulk orders All raw material available on @paradise_resin_store ...', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2480, 3100, 10, 'RA-CER-0013', true, false, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 37),
  ('d1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000002', 'Silver Sparkle Resin Cocktail Ring', 'silver-sparkle-resin-cocktail-ring', '✨✨ Elevate your Eid look with our stunning collection of earrings! 🌙✨ From intricate designs to bold statements, we have the perfect pair to complement your festive attire. 💖✨ Don’t miss out—DM us to place your order and shine bright this Eid! ✨💫 💎', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1617, 2021, 11, 'RA-JEW-0014', true, false, false, false, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 54),
  ('d1000000-0000-0000-0000-000000000015', 'e1000000-0000-0000-0000-000000000004', 'Scarlet Rose Petal Resin Bangle', 'scarlet-rose-petal-resin-bangle', 'Princess day is for you bbg🥰🫵🏻 Grab resin heart braslet for you or your princess', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 854, 1068, 8, 'RA-BRA-0015', true, false, true, true, 'Standard 2.4 - 2.6 inches inner diameter', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 71),
  ('d1000000-0000-0000-0000-000000000016', 'e1000000-0000-0000-0000-000000000005', 'Blue Pearl Resin Heart Necklace & Earrings Set | Handmade Jewelry Gift', 'blue-pearl-resin-heart-necklace-earrings-set-handmade-jewelry-gift', 'Stunning handmade resin heart jewelry set featuring a beautiful blue glossy and pearl textured design. This elegant necklace and matching earrings are perfect for everyday wear or as a thoughtful gift for her. Unique resin art with ocean-inspired vibes and pearl accents. Lightweight, hypoallergenic, and one-of-a-kind! 💙✨ Shop now for handmade resin jewelry, heart pendant necklace, pearl earrings set, boho jewelry, or Valentine''s gift ideas.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2891, 3614, 7, 'RA-CER-0016', true, true, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 24),
  ('d1000000-0000-0000-0000-000000000017', 'e1000000-0000-0000-0000-000000000005', 'Customized Calligraphy Resin Signature Pen', 'customized-calligraphy-resin-signature-pen-17', 'A Perfect Gift For Your Lover 🖤 It''s a customised order , U can also customised your items as per your choice ❤', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 3028, 3785, 14, 'RA-CER-0017', true, false, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 41),
  ('d1000000-0000-0000-0000-000000000018', 'e1000000-0000-0000-0000-000000000002', 'Handmade Pressed Flower Resin Earrings: Botanical Floral Jewelry, Preserved Small Dangle Earring ...', 'handmade-pressed-flower-resin-earrings-botanical-floral-jewelry-preserved-small-dangle-earring', 'Meticulously handcrafted handmade pressed flower resin earrings: botanical floral jewelry, preserved small dangle earring ... infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1365, 1706, 9, 'RA-JEW-0018', true, false, false, true, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 58),
  ('d1000000-0000-0000-0000-000000000019', 'e1000000-0000-0000-0000-000000000004', 'New bracelet designs up on the website', 'new-bracelet-designs-up-on-the-website', 'New bracelet designs up on the website! Link in bio 🌸', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 902, 1128, 16, 'RA-BRA-0019', true, false, false, false, 'Standard 2.4 - 2.6 inches inner diameter', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 11),
  ('d1000000-0000-0000-0000-000000000020', 'e1000000-0000-0000-0000-000000000002', 'Galeria biżuterii z żywicy z Wtorkowego Maratonu rękodzielniczego', 'galeria-biuterii-z-ywicy-z-wtorkowego-maratonu-rkodzielniczego', 'Galeria biżuterii z żywicy z Wtorkowego Maratonu rękodzielniczego | Royal-Stone blog', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1639, 2049, 8, 'RA-JEW-0020', true, true, true, false, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 28),
  ('d1000000-0000-0000-0000-000000000021', 'e1000000-0000-0000-0000-000000000004', 'Freshwater Pearl & Daisy Resin Bracelet', 'freshwater-pearl-daisy-resin-bracelet', 'Dried Flower Bracelet, Pressed Real Flower Hexagonal Bracelet, Bridesmaid Jewelry, Wedding Jewelry,bloom Baby Shower Jewelry/christmas Gift - Etsy', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1176, 1470, 10, 'RA-BRA-0021', true, false, false, true, 'Standard 2.4 - 2.6 inches inner diameter', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 45),
  ('d1000000-0000-0000-0000-000000000022', 'e1000000-0000-0000-0000-000000000005', 'Pink Resin Floral Jhumka 🌸✨', 'pink-resin-floral-jhumka', 'Pink Resin jhumka 🌸 Now offering 20% off for independence day Price - 459 Dm us to order 💌 . . . . . . ..', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2513, 3141, 13, 'RA-CER-0022', true, false, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 62),
  ('d1000000-0000-0000-0000-000000000023', 'e1000000-0000-0000-0000-000000000002', 'Kashmiri Floral Resin Statement Earrings', 'kashmiri-floral-resin-statement-earrings', 'Я делаю красивые символичные украшения из эпоксидной смолы и сухих цветов. Это кольцо идеально в качестве подарка для подруги, маме, девушке, жене на день рождения, новый год, 14 февраля, день матери или любой другой праздник. | украшения ручной работы | кольца эстетика | идеи украшения из эпоксидной смолы | подарок девушке | золотые серебряные модные украшения | женские аксессуары | минималистичные украшения | звезды луна солнце кольцо. Вы можете посмотреть все украшения здесь', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2050, 2563, 14, 'RA-JEW-0023', true, false, false, false, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 15),
  ('d1000000-0000-0000-0000-000000000024', 'e1000000-0000-0000-0000-000000000002', 'Beautiful Locked and Earing', 'beautiful-locked-and-earing', 'Meticulously handcrafted beautiful locked and earing infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1387, 1734, 6, 'RA-JEW-0024', true, true, false, true, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 32),
  ('d1000000-0000-0000-0000-000000000025', 'e1000000-0000-0000-0000-000000000002', 'Rose Petal Resin Earrings: Handmade Hypoallergenic Jewelry - Etsy', 'rose-petal-resin-earrings-handmade-hypoallergenic-jewelry---etsy', 'Rose Petal Collection Resin Earrings Handmade Earrings - Etsy', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1524, 1905, 13, 'RA-JEW-0025', true, false, true, false, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 49),
  ('d1000000-0000-0000-0000-000000000026', 'e1000000-0000-0000-0000-000000000005', 'Hand Crafted Jewelry | Enchanted Garden Resin Bangle- Silver Flake Jewlry- Flower Rings- Dried Flowers- | Color: Pink | Size: Os', 'hand-crafted-jewelry-enchanted-garden-resin-bangle--silver-flake-jewlry--flower-rings--dried-flowers--color-pink-size-os', 'Handmade Item Ships From Pennsylvania! Shorter Shipping Distances Are Kinder To The Planet Materials: Resin, Delicate Silver Flakes, Real Dried Rose Petal, Real Dried Purple Bell Flower, Delicate Gold Flakes Style: Boho & Hippie Can Be Personalized Bracelet Width: 3 Inches; Bracelet Length: 3 Inches', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 3061, 3826, 5, 'RA-CER-0026', true, false, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 66),
  ('d1000000-0000-0000-0000-000000000027', 'e1000000-0000-0000-0000-000000000005', 'Resin Flower Bracelet, Real White Flowers & Pearl, Gold Plated Chain', 'resin-flower-bracelet-real-white-flowers-pearl-gold-plated-chain', 'Aesthetic bracelet featuring real white flowers preserved in resin. This delicate bracelet adorned with natural freshwater pearls adds a touch of natural elegance to your style. Perfect for everyday wear or special occasions, it is a unique and charming accessory. Gold plated bracelet will be gentle on your sensitive skin. A convenient clasp allows you to easily and independently put the bracelet on your wrist. * Real 14K Gold plated brass chain * Made with all hypoallergenic materials WHAT TO KNOW ABOUT YOUR JEWELRY PURCHASE IN GEM & FLOWERS STORE: 🧡 We use only real/natural gemstones and Pearls. 🧡 Most items are made to order just for you and have a 2-4 day processing time. 📤 All domestic orders over $35 ship FREE. 📤 Rush processing and shipping is available! 🎁 Every order comes', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1998, 2498, 12, 'RA-CER-0027', true, false, false, true, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 19),
  ('d1000000-0000-0000-0000-000000000028', 'e1000000-0000-0000-0000-000000000002', 'Don’t Throw Your special Flowers – Preserve Them..', 'dont-throw-your-special-flowers-preserve-them', 'Your special flowers deserve more than a goodbye. Transform them into timeless resin art that lasts forever. Book your preservation before your flowers fade.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1935, 2419, 4, 'RA-JEW-0028', true, true, false, false, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 36),
  ('d1000000-0000-0000-0000-000000000029', 'e1000000-0000-0000-0000-000000000002', 'Beautiful Kashmiri Earings', 'beautiful-kashmiri-earings', 'Meticulously handcrafted beautiful kashmiri earings infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2072, 2590, 11, 'RA-JEW-0029', true, false, false, false, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 53),
  ('d1000000-0000-0000-0000-000000000030', 'e1000000-0000-0000-0000-000000000002', 'Preserved Botanical Jhumka Earrings', 'preserved-botanical-jhumka-earrings', 'The client was very excited to preserve her flowers by incorporating them into jewelry, rings and keychains.✨🌷 She ensured that each piece contained both roses and orchids. We had a great time working on these pieces and are confident that our clients enjoyed them as well.😊💓 Every piece was carefully chosen by her, ensuring she could gift the best to her special person.🌼🪬 DM to order 💌 . . . . . . . . . . . . . ...', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1409, 1761, 3, 'RA-JEW-0030', true, false, true, true, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 70),
  ('d1000000-0000-0000-0000-000000000031', 'e1000000-0000-0000-0000-000000000005', 'Handmade Pink Floral Resin Jhumka Earrings with Pearl & Pink Bead Danglers | Bling On®', 'handmade-pink-floral-resin-jhumka-earrings-with-pearl-pink-bead-danglers-bling-on', 'Product specifications and recommended use Specification Recommended listing Brand Bling On® Main colour Blush pink Secondary colours White pearl-like beads, silver-tone frame, gold-coloured flecks Centre shape Square, set at an angle Design Floral inclusions with decorative bead fringe Material Resin-style centre; exact resin and metal Closure Hook-style finding visible; e Finish Glossy-looking centre and ornate metallic-look border Package contents One pair, subject to packing confirmation Country of origin India, as supplied by the brand Place of crafting Jamshedpur, Jharkhand, India Recommended use Weddings, festive occasions, parties, ethnic styling and gifting', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2546, 3183, 4, 'RA-CER-0031', true, false, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 23),
  ('d1000000-0000-0000-0000-000000000032', 'e1000000-0000-0000-0000-000000000002', 'Gold Leaf & Cornflower Danglers', 'gold-leaf-cornflower-danglers-32', 'Meticulously handcrafted gold leaf & cornflower danglers infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1683, 2104, 17, 'RA-JEW-0032', true, true, false, false, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 40),
  ('d1000000-0000-0000-0000-000000000033', 'e1000000-0000-0000-0000-000000000005', 'Resin Jumka, Resin Flower Earring, Jumka', 'resin-jumka-resin-flower-earring-jumka', 'Elevate your jewelry collection with our exquisite Handmade Resin Jhumka Earrings, designed to capture the essence of elegance and individuality. Each pair is a testament to fine craftsmanship, featuring a captivating blend of unique styles and intricate designs. Key Features: - Artisan Craftsmanship: Each earring is meticulously handcrafted, ensuring that no two pieces are exactly alike. This dedication to detail gives you a truly unique accessory. - Diverse Shapes: Our collection offers a variety of shapes, allowing you to choose the perfect design to complement your personal style. - Silver and Gold Base Options: Select from a luxurious silver or gold base to match your preferred aesthetic or existing jewelry pieces. - Nature-Inspired Design: Embrace the beauty of nature with our earrin', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2820, 3525, 6, 'RA-CER-0033', true, false, false, true, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 57),
  ('d1000000-0000-0000-0000-000000000034', 'e1000000-0000-0000-0000-000000000005', 'Resin craft', 'resin-craft', 'Shells filled with resin and made into keyrings and bag charms', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2957, 3696, 13, 'RA-CER-0034', true, false, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 10),
  ('d1000000-0000-0000-0000-000000000035', 'e1000000-0000-0000-0000-000000000004', 'Rose Petal Resin Bengal- Real Flower Jewelry- Real Flower Bracelet- Flowers in Resin- Gold Bracelet - Resin Bangle- Rose Flower Jewelry- Red', 'rose-petal-resin-bengal--real-flower-jewelry--real-flower-bracelet--flowers-in-resin--gold-bracelet---resin-bangle--rose-flower-jewelry--red', 'Beautifully fiery scarlet red rose petal resin Bangle bracelet with real flower petals in resin. Thin resin ring Bangle, that magnifies the flower petals through each crystal side. It is 4 inches in diameter, fits a petite wrist Perfectly preserved natural jewelry with colorful dried flower petals. Boldly colorful, fiery red and scarlet, flower jewelry ♥ Be sure to check out the NECKLACE section at EarringsbyLCreations for all kinds of necklaces available! Made with quality materials and always nickel and lead free metals. Naturally colorful jewelry made by hand to complement your beauty. Perfect gift for a friend or loved one: All jewelry pieces are packaged in jewelry boxes, wrapped in burlap ribbons and gold twine thre', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1094, 1368, 8, 'RA-BRA-0035', true, false, true, false, 'Standard 2.4 - 2.6 inches inner diameter', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 27),
  ('d1000000-0000-0000-0000-000000000036', 'e1000000-0000-0000-0000-000000000004', 'Freshwater Pearl & Daisy Resin Bracelet', 'freshwater-pearl-daisy-resin-bracelet-36', 'You’ve never seen bangles like THIS 👀 resin bangles, floral jewelry, handmade bangles, pink aesthetic, dried flower resin, gold flakes jewelry, unique accessories, handmade Pakistan, resin art jewelry, gift for her', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1231, 1539, 15, 'RA-BRA-0036', true, true, false, true, 'Standard 2.4 - 2.6 inches inner diameter', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 44),
  ('d1000000-0000-0000-0000-000000000037', 'e1000000-0000-0000-0000-000000000001', 'Personalized Glass Wall Clock, Custom Name Ocean Clock, Coastal Wall Decor, Beach Style Home Decor, Anniversary Wedding Gift', 'personalized-glass-wall-clock-custom-name-ocean-clock-coastal-wall-decor-beach-style-home-decor-anniversary-wedding-gift', '✨ Modern Glass Wall Clock - Stylish Time for Your Space Add a touch of modern style to your home with this beautifully designed glass wall clock. Featuring a clean, minimalist look and artistic details, this clock is both a functional timepiece and a piece of wall art. Perfect for living rooms, bedrooms, offices, studios, or creative spaces, it brings personality and elegance to any interior. 🧩 Available Options Glass 30 × 30 cm Premium glass material with a sleek finish, perfect as a statement wall piece. (Please select your preferred size and material from the dropdown menu.) ⭐ Product Features ✔ High-quality acrylic or glass surface ✔ Modern, minimalist design ✔ Silent quartz movement (no ticking noise) ✔ Clear, easy-to-read clock face ✔ Durable and easy to hang ✔ Battery operated (AA', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 6068, 7585, 4, 'RA-WAL-0037', true, false, false, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 61),
  ('d1000000-0000-0000-0000-000000000038', 'e1000000-0000-0000-0000-000000000002', 'Kashmiri Floral Resin Statement Earrings', 'kashmiri-floral-resin-statement-earrings-38', 'Meticulously handcrafted kashmiri floral resin statement earrings infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1705, 2131, 14, 'RA-JEW-0038', true, false, false, false, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 14),
  ('d1000000-0000-0000-0000-000000000039', 'e1000000-0000-0000-0000-000000000002', 'Silver Sparkle Resin Cocktail Ring', 'silver-sparkle-resin-cocktail-ring-39', 'Meticulously handcrafted silver sparkle resin cocktail ring infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 1842, 2303, 6, 'RA-JEW-0039', true, false, false, true, 'Length: 2.2 inches, Weight: 12g (Ultra-lightweight)', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 31),
  ('d1000000-0000-0000-0000-000000000040', 'e1000000-0000-0000-0000-000000000001', 'Luxury Resin Wall Clock l Unique Home Decor.', 'luxury-resin-wall-clock-l-unique-home-decor', 'Give your home a luxury touch with a beautiful handmade resin wall clock. Perfect for modern living room and bedroom decor.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 6479, 8099, 7, 'RA-WAL-0040', true, true, true, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 48),
  ('d1000000-0000-0000-0000-000000000041', 'e1000000-0000-0000-0000-000000000001', 'Customised Resin clock💞 Sizes available', 'customised-resin-clock-sizes-available', 'Customised Resin clock💞 Sizes available', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 6616, 8270, 8, 'RA-WAL-0041', true, false, false, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 65),
  ('d1000000-0000-0000-0000-000000000042', 'e1000000-0000-0000-0000-000000000001', 'Epoxy clock', 'epoxy-clock', 'Meticulously handcrafted epoxy clock infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 6753, 8441, 3, 'RA-WAL-0042', true, false, false, true, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 18),
  ('d1000000-0000-0000-0000-000000000043', 'e1000000-0000-0000-0000-000000000001', '23 Handmade DIY Clock Ideas to Give Your Walls a Unique Look', '23-handmade-diy-clock-ideas-to-give-your-walls-a-unique-look', '23 Handmade DIY Clock Ideas to Give Your Walls a Unique Look', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 6890, 8613, 4, 'RA-WAL-0043', true, false, false, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 35),
  ('d1000000-0000-0000-0000-000000000044', 'e1000000-0000-0000-0000-000000000001', 'floral clock', 'floral-clock', 'Meticulously handcrafted floral clock infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 7027, 8784, 5, 'RA-WAL-0044', true, true, false, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 52),
  ('d1000000-0000-0000-0000-000000000045', 'e1000000-0000-0000-0000-000000000001', 'Luxury Emerald Green & Gold Epoxy Resin Wall Clock', 'luxury-emerald-green-gold-epoxy-resin-wall-clock', 'Add a touch of luxury to your home with an emerald green and gold epoxy resin wall clock! 💚✨ Rich green swirls, crystal-inspired details, and shimmering gold veins create a stunning statement piece for modern interiors. Save this elegant resin art idea for your next DIY home decor project! Primary keyword: emerald green and gold epoxy resin wall clock', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 7164, 8955, 6, 'RA-WAL-0045', true, false, true, true, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 69),
  ('d1000000-0000-0000-0000-000000000046', 'e1000000-0000-0000-0000-000000000001', 'Luxury Pink Geode Wall Clock | Elegant Resin Home Decor', 'luxury-pink-geode-wall-clock-elegant-resin-home-decor', 'Transform your space with a stunning pink geode wall clock featuring crystal-inspired edges, elegant silver Roman numerals, and a beautiful marble-effect resin design. 💗✨ This statement clock is perfect for modern living rooms, bedrooms, luxury home decor, and elegant accent walls. Would you choose this soft pink design for your home? Save this idea for your next home decor makeover and share your favorite detail in the comments! 🏡💕', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 7301, 9126, 7, 'RA-WAL-0046', true, false, false, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 22),
  ('d1000000-0000-0000-0000-000000000047', 'e1000000-0000-0000-0000-000000000001', 'Ocean Shoreline Aerial Resin Clock', 'ocean-shoreline-aerial-resin-clock', 'Meticulously handcrafted ocean shoreline aerial resin clock infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 7438, 9298, 8, 'RA-WAL-0047', true, false, false, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 39),
  ('d1000000-0000-0000-0000-000000000048', 'e1000000-0000-0000-0000-000000000001', 'Resin Wall Clock', 'resin-wall-clock', 'Meticulously handcrafted resin wall clock infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 7575, 9469, 3, 'RA-WAL-0048', true, true, false, true, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 56),
  ('d1000000-0000-0000-0000-000000000049', 'e1000000-0000-0000-0000-000000000001', 'Resin Wall Clock', 'resin-wall-clock-49', 'Meticulously handcrafted resin wall clock infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 7712, 9640, 4, 'RA-WAL-0049', true, false, false, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 9),
  ('d1000000-0000-0000-0000-000000000050', 'e1000000-0000-0000-0000-000000000001', 'Luxury Decor Angle*Emerald Green Resin Wall Clock | Luxury Home Decor.Color Palette Angle*handmade.✨', 'luxury-decor-angleemerald-green-resin-wall-clock-luxury-home-decorcolor-palette-anglehandmade', 'The aesthetic everyone loves. ‎Deep emerald, cream & gold combo. This resin clock looks stunning with marble tables, plants & neutral decor. `resin wall clock, emerald green clock, geode clock, luxury home decor, handmade resin art, gold roman numerals, modern wall clock .*: Elegance in every detail. ‎Green + white resin with crushed gold stone line + gold Roman numerals. Unique handmade decor that adds instant class to any wall. Time meets art. ⏰ ‎Handmade resin clock with emerald green geode, cream base & gold accents. Perfect statement piece for living room, office or bedroom. ‎ ..', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 7849, 9811, 5, 'RA-WAL-0050', true, false, true, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 26),
  ('d1000000-0000-0000-0000-000000000051', 'e1000000-0000-0000-0000-000000000001', 'Handmade resin wall clock ✨Rose petals+ gold flakes clock decor 💞', 'handmade-resin-wall-clock-rose-petals-gold-flakes-clock-decor', 'Time bi royal ho to life royal lagti ha💖 handmade resin wall clock with real dried rose petals + gold foil flakes 💕', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 7986, 9983, 6, 'RA-WAL-0051', true, false, false, true, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 43),
  ('d1000000-0000-0000-0000-000000000052', 'e1000000-0000-0000-0000-000000000001', 'Resin clock for order pls msg on 8337983439', 'resin-clock-for-order-pls-msg-on-8337983439', 'Resin clock for order pls msg on 8337983439', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 4623, 5779, 7, 'RA-WAL-0052', true, true, false, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 60),
  ('d1000000-0000-0000-0000-000000000053', 'e1000000-0000-0000-0000-000000000001', 'эпоксидная смола', 'resin-art-53', 'Meticulously handcrafted эпоксидная смола infused with multi-layered crystal clear resin, gilded mineral pigments, and archival-grade botanicals. Every curve and shimmer is individually cast by our master artisans to deliver an incomparable luxury aura to your style and living space.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 4760, 5950, 8, 'RA-WAL-0053', true, false, false, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.7, 13),
  ('d1000000-0000-0000-0000-000000000054', 'e1000000-0000-0000-0000-000000000001', 'Midnight Celestial Resin Timepiece', 'midnight-celestial-resin-timepiece', '«Нефритовый шёлк» — авторские интерьерные часы FedTI-ArtStudio, воплощающие утончённую роскошь и гармонию природных оттенков. Нежные жемчужные, молочные и светло-мятные переливы создают эффект струящегося шёлка. По краю композиции сияют декоративные камни, прозрачные кристаллы и золотистые включения. Объёмные золотые цифры и изящные стрелки завершают элегантный образ. Эти часы станут изысканным украшением гостиной, спальни или кабинета, подчеркнут индивидуальность интерьера и вкус владельца. Диаметр — 30 см. Материалы — эпоксидная смола, декоративные камни, кристаллы, золотистые элементы. Ручная работа. Единственный экземпляр. Сертификат подлинности. #АвторскиеЧасы #ДизайнерскиеЧасы', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 4897, 6121, 3, 'RA-WAL-0054', true, false, false, true, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.8, 30),
  ('d1000000-0000-0000-0000-000000000055', 'e1000000-0000-0000-0000-000000000001', 'Ocean themed resin clock 🌊🐚', 'ocean-themed-resin-clock', 'Custom ocean themed resin clock. Dm to order yours now!💌 ( Resin art , Resin wall clock, Beach theme wall clock, Handmade art, Resin artist, Beach theme clock, Artist)', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 5034, 6293, 4, 'RA-WAL-0055', true, false, true, false, '14 inches (35 cm) diameter, 18mm thickness', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.9, 47),
  ('d1000000-0000-0000-0000-000000000056', 'e1000000-0000-0000-0000-000000000005', 'PETAL & GEM Resin Pooja Thali 6 Inch, Decorative Puja Plate, Fancy Pooja Ki Thali for Diwali,', 'petal-gem-resin-pooja-thali-6-inch-decorative-puja-plate-fancy-pooja-ki-thali-for-diwali', 'Elegant Resin Design: Handmade decorative thali with a premium resin finish for festive rituals. 6 Inch Size: Spacious pooja plate ideal for arranging diya, kumkum, haldi and other essentials.', 'Handcrafted in our boutique art studio. Each layer is poured with artist-grade non-yellowing epoxy resin, carefully cured over 72 hours, and polished by hand for a flawless liquid-glass luster.', 2371, 2964, 11, 'RA-CER-0056', true, true, false, false, '8 inches (20 cm) diameter with matching bowls', 'Ultra-Clear UV-Resistant Epoxy Resin, Gold Leaf & Archival Botanicals', '72-Hour Controlled Room Curing', 'Clean with a soft microfiber cloth. Avoid prolonged direct intense sunlight and harsh chemical cleaners.', 4.6, 64)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  is_active = EXCLUDED.is_active;

-- Seed Product Images
INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
  ('d1000000-0000-0000-0000-000000000001', '/images/products/WhatsApp Image 2026-11-07 at 10.23.47 PM.jpeg', 'Celestial Nebula Milky Way Resin Art Clock', true, 0),
  ('d1000000-0000-0000-0000-000000000002', '/images/products/da818ee20766a8244b4a924dd001d4c1.png', 'Imperial Emerald & 24K Gold Crystal Geode Wall Clock', true, 0),
  ('d1000000-0000-0000-0000-000000000003', '/images/products/bfbf88fc2abe1317b9746645a55f78e7.png', 'Pink Rose Quartz Natural Edge Geode Clock', true, 0),
  ('d1000000-0000-0000-0000-000000000004', '/images/products/05427a2e05e9d375217863c851519f85.jpg', 'Royal Haldi Floral Shagun Ceremonial Platter', true, 0),
  ('d1000000-0000-0000-0000-000000000005', '/images/products/07892a59117c401b49ffdf42a9986e04.jpg', 'Preserved Blush Floral Resin Heirloom Jewelry Suite', true, 0),
  ('d1000000-0000-0000-0000-000000000006', '/images/products/28425dae823ab34bd297212bc3566394.jpg', 'Bespoke Diamond Dust & Glitter Resin Signature Pens', true, 0),
  ('d1000000-0000-0000-0000-000000000007', '/images/products/89dc79029ade36922d721e7d0248b1f1.jpg', 'Customized Calligraphy Resin Signature Pen', true, 0),
  ('d1000000-0000-0000-0000-000000000008', '/images/products/41105dc44070e0a229cd3f38d0695956.jpg', 'Customized Name Resin Pendants', true, 0),
  ('d1000000-0000-0000-0000-000000000009', '/images/products/55602f851ae0f2bcb533bd36f936dee6.jpg', 'Sunflower Power Bracelet', true, 0),
  ('d1000000-0000-0000-0000-000000000010', '/images/products/e30569eace142571775da3d5182b66e7.jpg', 'Handmade Pearl Bracelet with Floral Resin Details', true, 0),
  ('d1000000-0000-0000-0000-000000000011', '/images/products/3ac5efc20deda1042364ae5a026fa67a.jpg', 'Royal Gem Pooja Thali With Diya Holders', true, 0),
  ('d1000000-0000-0000-0000-000000000012', '/images/products/79abffbb9562bf47e12d6874e3544620.jpg', 'Gold Leaf & Cornflower Danglers', true, 0),
  ('d1000000-0000-0000-0000-000000000013', '/images/products/8101c29e1f904b198c65da2a43cea39b.jpg', 'Shagun Festive Tilak Platter', true, 0),
  ('d1000000-0000-0000-0000-000000000014', '/images/products/170548f7007eac15865166454875bdd8.jpg', 'Silver Sparkle Resin Cocktail Ring', true, 0),
  ('d1000000-0000-0000-0000-000000000015', '/images/products/cc0235b0427a5736ca23147eec31e1a8.jpg', 'Scarlet Rose Petal Resin Bangle', true, 0),
  ('d1000000-0000-0000-0000-000000000016', '/images/products/f5bab45950cb034c9f457bacb95113a1.jpg', 'Blue Pearl Resin Heart Necklace & Earrings Set | Handmade Jewelry Gift', true, 0),
  ('d1000000-0000-0000-0000-000000000017', '/images/products/d2587f8b90514535d970005ad9944d85.jpg', 'Customized Calligraphy Resin Signature Pen', true, 0),
  ('d1000000-0000-0000-0000-000000000018', '/images/products/c228981cb991122cab811452dd8e8bfd.jpg', 'Handmade Pressed Flower Resin Earrings: Botanical Floral Jewelry, Preserved Small Dangle Earring ...', true, 0),
  ('d1000000-0000-0000-0000-000000000019', '/images/products/c3a5d1eeef993e1cd13c26c362fb5565.jpg', 'New bracelet designs up on the website', true, 0),
  ('d1000000-0000-0000-0000-000000000020', '/images/products/ab0eb9256250b07e3ad16ec008c56d0c.png', 'Galeria biżuterii z żywicy z Wtorkowego Maratonu rękodzielniczego', true, 0),
  ('d1000000-0000-0000-0000-000000000021', '/images/products/6dc0ceaa4bfa625d927bc2ea30f803a9.jpg', 'Freshwater Pearl & Daisy Resin Bracelet', true, 0),
  ('d1000000-0000-0000-0000-000000000022', '/images/products/91b0612834be88c11449e3dd1c9b8e7f.jpg', 'Pink Resin Floral Jhumka 🌸✨', true, 0),
  ('d1000000-0000-0000-0000-000000000023', '/images/products/8f975d8ca225845c6d35300a47e0ab87.png', 'Kashmiri Floral Resin Statement Earrings', true, 0),
  ('d1000000-0000-0000-0000-000000000024', '/images/products/16aea48d7781c0615922dcf2860a92b9.jpg', 'Beautiful Locked and Earing', true, 0),
  ('d1000000-0000-0000-0000-000000000025', '/images/products/0569845a84fc3c36300fb3524427a691.png', 'Rose Petal Resin Earrings: Handmade Hypoallergenic Jewelry - Etsy', true, 0),
  ('d1000000-0000-0000-0000-000000000026', '/images/products/2cfa10b24d18479055231128ead83d3e.jpg', 'Hand Crafted Jewelry | Enchanted Garden Resin Bangle- Silver Flake Jewlry- Flower Rings- Dried Flowers- | Color: Pink | Size: Os', true, 0),
  ('d1000000-0000-0000-0000-000000000027', '/images/products/ae27a654c86782ee291ee194e0687e7b.jpg', 'Resin Flower Bracelet, Real White Flowers & Pearl, Gold Plated Chain', true, 0),
  ('d1000000-0000-0000-0000-000000000028', '/images/products/876fdb0ff94243b040ca352f265b0016.jpg', 'Don’t Throw Your special Flowers – Preserve Them..', true, 0),
  ('d1000000-0000-0000-0000-000000000029', '/images/products/498ede58507298db930fc01b5be90f5f.jpg', 'Beautiful Kashmiri Earings', true, 0),
  ('d1000000-0000-0000-0000-000000000030', '/images/products/ae6a1730d03c791692e2d01f813cd71c.jpg', 'Preserved Botanical Jhumka Earrings', true, 0),
  ('d1000000-0000-0000-0000-000000000031', '/images/products/135c40a465a685af759e3e4cdad120e4.webp', 'Handmade Pink Floral Resin Jhumka Earrings with Pearl & Pink Bead Danglers | Bling On®', true, 0),
  ('d1000000-0000-0000-0000-000000000032', '/images/products/9369640d0c16f7700f0aa4accbcaa9ba.jpg', 'Gold Leaf & Cornflower Danglers', true, 0),
  ('d1000000-0000-0000-0000-000000000033', '/images/products/a42cf322adaeb00e95239d63640ad098.jpg', 'Resin Jumka, Resin Flower Earring, Jumka', true, 0),
  ('d1000000-0000-0000-0000-000000000034', '/images/products/a0db3e1680bf8450fe40880310d83cc1.jpg', 'Resin craft', true, 0),
  ('d1000000-0000-0000-0000-000000000035', '/images/products/3b521b199f75c8b2b96b1b08fd3cdd20.jpg', 'Rose Petal Resin Bengal- Real Flower Jewelry- Real Flower Bracelet- Flowers in Resin- Gold Bracelet - Resin Bangle- Rose Flower Jewelry- Red', true, 0),
  ('d1000000-0000-0000-0000-000000000036', '/images/products/be1ee9d348acc691e7491e81080f4c6a.jpg', 'Freshwater Pearl & Daisy Resin Bracelet', true, 0),
  ('d1000000-0000-0000-0000-000000000037', '/images/products/53406a358c78ec601489a2243e4c6ddf.jpg', 'Personalized Glass Wall Clock, Custom Name Ocean Clock, Coastal Wall Decor, Beach Style Home Decor, Anniversary Wedding Gift', true, 0),
  ('d1000000-0000-0000-0000-000000000038', '/images/products/5d2944ff63736c47ddc2c5c2d4295002.jpg', 'Kashmiri Floral Resin Statement Earrings', true, 0),
  ('d1000000-0000-0000-0000-000000000039', '/images/products/81a16b5174f1bb96d1a442ee3ff71e1d.jpg', 'Silver Sparkle Resin Cocktail Ring', true, 0),
  ('d1000000-0000-0000-0000-000000000040', '/images/products/3e6d457c07029e2fd6904cf4b7beb11a.png', 'Luxury Resin Wall Clock l Unique Home Decor.', true, 0),
  ('d1000000-0000-0000-0000-000000000041', '/images/products/affceb226743464509767ffa90c1a8d7.jpg', 'Customised Resin clock💞 Sizes available', true, 0),
  ('d1000000-0000-0000-0000-000000000042', '/images/products/caae16ba6dc8ed9d96e5939bedf88a97.jpg', 'Epoxy clock', true, 0),
  ('d1000000-0000-0000-0000-000000000043', '/images/products/14cee40945dc3171f6f9f50b5f00f8c0.webp', '23 Handmade DIY Clock Ideas to Give Your Walls a Unique Look', true, 0),
  ('d1000000-0000-0000-0000-000000000044', '/images/products/f534971e91a99c48f4fe94f788f2648b.png', 'floral clock', true, 0),
  ('d1000000-0000-0000-0000-000000000045', '/images/products/da818ee20766a8244b4a924dd001d4c1.png', 'Luxury Emerald Green & Gold Epoxy Resin Wall Clock', true, 0),
  ('d1000000-0000-0000-0000-000000000046', '/images/products/bfbf88fc2abe1317b9746645a55f78e7.png', 'Luxury Pink Geode Wall Clock | Elegant Resin Home Decor', true, 0),
  ('d1000000-0000-0000-0000-000000000047', '/images/products/1b3cdd3ea69992801dda7e063d0e7998.webp', 'Ocean Shoreline Aerial Resin Clock', true, 0),
  ('d1000000-0000-0000-0000-000000000048', '/images/products/09588d5b19aa729a5944edddeffc9876.jpg', 'Resin Wall Clock', true, 0),
  ('d1000000-0000-0000-0000-000000000049', '/images/products/c0e17217bf53f4ac34b41c5e8488e67a.png', 'Resin Wall Clock', true, 0),
  ('d1000000-0000-0000-0000-000000000050', '/images/products/6b5f219e9f7127e3da27a56e50210c52.jpg', 'Luxury Decor Angle*Emerald Green Resin Wall Clock | Luxury Home Decor.Color Palette Angle*handmade.✨', true, 0),
  ('d1000000-0000-0000-0000-000000000051', '/images/products/1a5a6fb9505200e5efd2b5dcaf21011c.jpg', 'Handmade resin wall clock ✨Rose petals+ gold flakes clock decor 💞', true, 0),
  ('d1000000-0000-0000-0000-000000000052', '/images/products/b77ecb7f69c8420ddb178421ccf0e582.jpg', 'Resin clock for order pls msg on 8337983439', true, 0),
  ('d1000000-0000-0000-0000-000000000053', '/images/products/be35dafdea05ce09029694f3b59d17a5.jpg', 'эпоксидная смола', true, 0),
  ('d1000000-0000-0000-0000-000000000054', '/images/products/51bb9b4477a2f65085d5cc4c6347917f.webp', 'Midnight Celestial Resin Timepiece', true, 0),
  ('d1000000-0000-0000-0000-000000000055', '/images/products/1647902f9ef38001db74c1de270fef78.jpg', 'Ocean themed resin clock 🌊🐚', true, 0),
  ('d1000000-0000-0000-0000-000000000056', '/images/products/310d49730ae5eb55152ae3fc0959c4d9.jpg', 'PETAL & GEM Resin Pooja Thali 6 Inch, Decorative Puja Plate, Fancy Pooja Ki Thali for Diwali,', true, 0)
ON CONFLICT DO NOTHING;



-- ==============================================================================
-- 12. CUSTOMIZATION REQUESTS TABLE (WHATSAPP INTEGRATION & BESPOKE ORDERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customization_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('existing_product', 'new_custom_design')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  product_image TEXT,
  customization_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  reference_image_url TEXT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  final_price NUMERIC(10,2), -- Solely controlled by Admin
  estimated_delivery TEXT,   -- Set by Admin
  admin_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    status IN (
      'Pending',
      'Under Review',
      'Price Quoted',
      'Awaiting Customer Approval',
      'Approved',
      'In Production',
      'Completed',
      'Rejected',
      'Cancelled'
    )
  ),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_req_status ON public.customization_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_req_type ON public.customization_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_custom_req_phone ON public.customization_requests(customer_phone);
CREATE INDEX IF NOT EXISTS idx_custom_req_created ON public.customization_requests(created_at DESC);

DROP TRIGGER IF EXISTS set_custom_req_updated_at ON public.customization_requests;
CREATE TRIGGER set_custom_req_updated_at
  BEFORE UPDATE ON public.customization_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert customization request" ON public.customization_requests;
CREATE POLICY "Anyone can insert customization request"
  ON public.customization_requests
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view customization requests" ON public.customization_requests;
CREATE POLICY "Anyone can view customization requests"
  ON public.customization_requests
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update customization requests" ON public.customization_requests;
CREATE POLICY "Admins can update customization requests"
  ON public.customization_requests
  FOR UPDATE
  USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can delete customization requests" ON public.customization_requests;
CREATE POLICY "Admins can delete customization requests"
  ON public.customization_requests
  FOR DELETE
  USING (public.is_admin() OR auth.role() = 'service_role');

-- ==============================================================================
-- RESIN AURA — PRODUCTION SECURITY FIX: GOOGLE OAUTH ADMIN AUTHENTICATION
-- Migration: 004_admin_google_oauth_auth.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AUTHORIZED ADMIN EMAILS (Server-Authoritative Google OAuth Whitelist)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.authorized_admin_emails (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS to prevent public access or modification
ALTER TABLE public.authorized_admin_emails ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.authorized_admin_emails FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.authorized_admin_emails TO authenticated;

-- Ensure authorized_admins table exists
CREATE TABLE IF NOT EXISTS public.authorized_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.authorized_admins ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.authorized_admins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.authorized_admins TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. BULLETPROOF SERVER-SIDE is_admin() FUNCTION
-- ------------------------------------------------------------------------------
-- Verifies whether the calling session is an explicitly authorized administrator.
-- Checks service_role, authorized_admins UUID mapping, user_roles table, and
-- cryptographically verified email from Google OAuth JWT against authorized_admin_emails.
-- NEVER trusts client-supplied parameters or unauthenticated input.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_jwt_email TEXT;
BEGIN
  -- 1. Service role (Supabase Dashboard, CLI, Internal Edge Functions)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' OR auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- 2. Anonymous / unauthenticated callers are NEVER admins
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. Check authorized_admins table by authenticated UUID
  IF EXISTS (
    SELECT 1 FROM public.authorized_admins
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN TRUE;
  END IF;

  -- 4. Check user_roles table for explicitly assigned admin role
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- 5. Check cryptographically signed JWT email against authorized_admin_emails whitelist
  v_jwt_email := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
  IF v_jwt_email <> '' AND EXISTS (
    SELECT 1 FROM public.authorized_admin_emails
    WHERE LOWER(email) = v_jwt_email
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. SERVER-SIDE ADMIN CLEARANCE VERIFICATION & SYNCHRONIZATION RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_admin_clearance()
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_user_email TEXT;
  v_assigned_role TEXT := 'customer';
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'is_admin', false,
      'role', 'anon',
      'message', 'No active authenticated session'
    );
  END IF;

  v_user_email := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
  v_is_admin := public.is_admin();

  IF v_is_admin THEN
    v_assigned_role := 'admin';

    -- Synchronize authorized_admins table
    INSERT INTO public.authorized_admins (user_id, role, notes, updated_at)
    VALUES (auth.uid(), 'admin', 'Verified via Google OAuth Admin Login', timezone('utc'::text, now()))
    ON CONFLICT (user_id) DO UPDATE
      SET role = 'admin', updated_at = timezone('utc'::text, now());

    -- Synchronize user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'admin')
    ON CONFLICT (user_id) DO UPDATE
      SET role = 'admin';

    RETURN jsonb_build_object(
      'authenticated', true,
      'is_admin', true,
      'role', 'admin',
      'email', v_user_email,
      'user_id', auth.uid()
    );
  ELSE
    RETURN jsonb_build_object(
      'authenticated', true,
      'is_admin', false,
      'role', 'customer',
      'email', v_user_email,
      'user_id', auth.uid()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.verify_admin_clearance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_clearance() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. RPC TO ADD OR REMOVE AUTHORIZED ADMIN EMAILS (Admin/Service Role Only)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.manage_authorized_admin_email(
  p_action TEXT, -- 'add' or 'remove'
  p_email TEXT,
  p_role TEXT DEFAULT 'admin',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_clean_email TEXT;
BEGIN
  IF NOT (
    current_setting('request.jwt.claim.role', true) = 'service_role' 
    OR auth.role() = 'service_role' 
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Access denied. Administrative authority is required.';
  END IF;

  v_clean_email := LOWER(TRIM(p_email));

  IF p_action = 'add' THEN
    IF p_role NOT IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Invalid role: %', p_role;
    END IF;

    INSERT INTO public.authorized_admin_emails (email, role, notes)
    VALUES (v_clean_email, p_role, p_notes)
    ON CONFLICT (email) DO UPDATE
      SET role = EXCLUDED.role, notes = COALESCE(EXCLUDED.notes, public.authorized_admin_emails.notes);

    RETURN jsonb_build_object('success', true, 'action', 'add', 'email', v_clean_email, 'role', p_role);

  ELSIF p_action = 'remove' THEN
    DELETE FROM public.authorized_admin_emails WHERE LOWER(email) = v_clean_email;
    RETURN jsonb_build_object('success', true, 'action', 'remove', 'email', v_clean_email);
  ELSE
    RAISE EXCEPTION 'Invalid action: % (use "add" or "remove")', p_action;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.manage_authorized_admin_email(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_authorized_admin_email(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. RLS POLICIES FOR ADMIN REGISTRIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "authorized_admin_emails_admin_only" ON public.authorized_admin_emails;
CREATE POLICY "authorized_admin_emails_admin_only"
  ON public.authorized_admin_emails FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "authorized_admins_select_policy" ON public.authorized_admins;
CREATE POLICY "authorized_admins_select_policy"
  ON public.authorized_admins FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "authorized_admins_all_policy" ON public.authorized_admins;
CREATE POLICY "authorized_admins_all_policy"
  ON public.authorized_admins FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_roles_modify_policy" ON public.user_roles;
CREATE POLICY "user_roles_modify_policy"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. ENSURE ALL CORE TABLES ARE STRICTLY PROTECTED BY is_admin()
-- ------------------------------------------------------------------------------

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Product Images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product images" ON public.product_images;
CREATE POLICY "Public read product images" ON public.product_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage product images" ON public.product_images;
CREATE POLICY "Admin manage product images" ON public.product_images FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT TO authenticated
  USING (public.is_admin() OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;
CREATE POLICY "orders_delete_policy" ON public.orders FOR DELETE TO authenticated
  USING (public.is_admin());

-- Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
CREATE POLICY "order_items_select_policy" ON public.order_items FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
CREATE POLICY "order_items_insert_policy" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "order_items_update_policy" ON public.order_items;
CREATE POLICY "order_items_update_policy" ON public.order_items FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "order_items_delete_policy" ON public.order_items;
CREATE POLICY "order_items_delete_policy" ON public.order_items FOR DELETE TO authenticated
  USING (public.is_admin());

-- Customization Requests
ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update customization requests" ON public.customization_requests;
CREATE POLICY "Admins can update customization requests" ON public.customization_requests FOR UPDATE
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS "Admins can delete customization requests" ON public.customization_requests;
CREATE POLICY "Admins can delete customization requests" ON public.customization_requests FOR DELETE
  USING (public.is_admin() OR auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 7. INITIAL AUTHORIZED ADMIN ACCOUNT PLACEHOLDER
-- ------------------------------------------------------------------------------
-- Replace the email below with your authorized Google Account email address
-- or run: SELECT public.manage_authorized_admin_email('add', 'your_google_account@gmail.com', 'admin', 'Store Owner');
-- ------------------------------------------------------------------------------
-- INSERT INTO public.authorized_admin_emails (email, role, notes)
-- VALUES ('owner@resinaura.com', 'admin', 'Primary Administrator Google Account')
-- ON CONFLICT (email) DO NOTHING;


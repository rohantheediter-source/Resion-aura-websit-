-- ==============================================================================
-- RESIN AURA — PRODUCTION HARDENED RLS, STRICT ADMIN RBAC & SECURE CHECKOUT
-- Migration: 003_secure_orders_rls.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DYNAMICALLY PURGE ALL EXISTING POLICIES (Zero Permissive Leaks)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('orders', 'order_items', 'payments', 'user_roles', 'authorized_admins', 'coupons')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 2. HARDENED ADMIN REGISTRY (Strict UUID Primary Key Binding)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.authorized_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.authorized_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- REVOKE ALL DIRECT CLIENT WRITE PRIVILEGES ON ADMIN & ROLE TABLES
REVOKE ALL ON public.authorized_admins FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.authorized_admins TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;


-- ------------------------------------------------------------------------------
-- 3. BULLETPROOF is_admin() FUNCTION (Strict UUID Lookup — No Email Fallback)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Service role (Supabase Dashboard / Internal Background Tasks)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' OR auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- 2. Anonymous / unauthenticated callers are never admins
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. Strict UUID foreign-key match in authorized_admins
  IF EXISTS (
    SELECT 1 FROM public.authorized_admins
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 4. CONTROLLED ADMIN PROMOTION HELPER (Service Role / Super Admin Only)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_admin_by_email(
  p_email TEXT,
  p_role TEXT DEFAULT 'admin',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_target_uid UUID;
BEGIN
  IF NOT (
    current_setting('request.jwt.claim.role', true) = 'service_role' 
    OR auth.role() = 'service_role' 
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Access denied. Administrative authority or service_role is required.';
  END IF;

  IF p_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid administrative role: %', p_role;
  END IF;

  SELECT id INTO v_target_uid
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  IF v_target_uid IS NULL THEN
    RAISE EXCEPTION 'No user registered with email %. The user must create an account first.', p_email;
  END IF;

  INSERT INTO public.authorized_admins (user_id, role, notes, updated_at)
  VALUES (v_target_uid, p_role, p_notes, timezone('utc'::text, now()))
  ON CONFLICT (user_id) DO UPDATE 
    SET role = EXCLUDED.role,
        notes = COALESCE(EXCLUDED.notes, public.authorized_admins.notes),
        updated_at = timezone('utc'::text, now());

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_target_uid, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_target_uid,
    'email', p_email,
    'role', p_role,
    'promoted_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.assign_admin_by_email(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_admin_by_email(TEXT, TEXT, TEXT) TO service_role;


-- ------------------------------------------------------------------------------
-- 5. COUPONS TABLE (Server-Side Discount Engine)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  usage_limit INT,
  times_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.coupons FROM PUBLIC, anon;
GRANT SELECT ON public.coupons TO authenticated;

CREATE POLICY "coupons_read_active"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "coupons_admin_all"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed promotional discount coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES
  ('WELCOME10', 'percentage', 10.00, 999.00, 500.00, true),
  ('AURA15', 'percentage', 15.00, 2499.00, 1000.00, true),
  ('RESIN100', 'fixed', 100.00, 1499.00, 100.00, true),
  ('FESTIVE20', 'percentage', 20.00, 4999.00, 2000.00, true)
ON CONFLICT (code) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 6. RLS POLICIES: authorized_admins & user_roles
-- ------------------------------------------------------------------------------
CREATE POLICY "authorized_admins_select_policy"
  ON public.authorized_admins FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "authorized_admins_all_policy"
  ON public.authorized_admins FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_select_policy"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "user_roles_modify_policy"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ------------------------------------------------------------------------------
-- 7. RLS POLICIES: payments TABLE (100% EXCLUSIVE TO AUTHORIZED ADMINS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.payments FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;

CREATE POLICY "payments_select_admin_only"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "payments_insert_admin_only"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "payments_update_admin_only"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "payments_delete_admin_only"
  ON public.payments FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- 8. RLS POLICIES: orders TABLE (Direct Customer Insert BLOCKED)
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Ensure case-insensitive unique constraint on order numbers
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_upper_idx ON public.orders (UPPER(order_number));

REVOKE ALL ON public.orders FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;

-- SELECT: Admin reads all orders; Customer reads ONLY own orders (auth.uid() = user_id)
CREATE POLICY "orders_select_policy"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- INSERT: ONLY Admin can directly insert via table API.
-- Customers and guests MUST checkout through place_order() RPC to prevent forged totals/statuses.
CREATE POLICY "orders_insert_policy"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Admin only
CREATE POLICY "orders_update_policy"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Admin only
CREATE POLICY "orders_delete_policy"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- 9. RLS POLICIES: order_items TABLE (Direct Client Insert BLOCKED)
-- ------------------------------------------------------------------------------
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.order_items FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

-- SELECT: Admin reads all; Customer reads items ONLY for their own parent order
CREATE POLICY "order_items_select_policy"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- INSERT: Admin only (Clients insert atomically via place_order RPC)
CREATE POLICY "order_items_insert_policy"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Admin only
CREATE POLICY "order_items_update_policy"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Admin only
CREATE POLICY "order_items_delete_policy"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- 10. SERVER-AUTHORITATIVE ATOMIC CHECKOUT (place_order)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_order(
  p_order_number TEXT,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_shipping_address JSONB,
  p_payment_method TEXT,
  p_notes TEXT,
  p_items JSONB,
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_clean_order_number TEXT;
  v_guest_name TEXT;
  v_guest_email TEXT;
  v_guest_phone TEXT;
  v_clean_payment_method TEXT;
  v_order_id UUID := gen_random_uuid();
  v_item JSONB;
  v_pid UUID;
  v_pid_text TEXT;
  v_qty INT;
  v_product_rec RECORD;
  v_coupon_rec RECORD;
  v_calc_subtotal NUMERIC(10,2) := 0;
  v_calc_shipping NUMERIC(10,2) := 0;
  v_calc_discount NUMERIC(10,2) := 0;
  v_calc_total NUMERIC(10,2) := 0;
  v_item_line_total NUMERIC(10,2);
  v_validated_items JSONB := '[]'::jsonb;
  v_applied_notes TEXT;
BEGIN
  -- 1. Order Number Validation & Idempotency Guard
  v_clean_order_number := UPPER(TRIM(COALESCE(p_order_number, '')));
  IF v_clean_order_number = '' OR LENGTH(v_clean_order_number) > 50 THEN
    RAISE EXCEPTION 'A valid order number is required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.orders WHERE UPPER(order_number) = v_clean_order_number) THEN
    RAISE EXCEPTION 'Order number "%" has already been submitted. Please retry with a unique order number.', v_clean_order_number;
  END IF;

  -- 2. Caller & Customer Identity Binding
  v_caller_id := auth.uid();
  IF v_caller_id IS NOT NULL THEN
    v_guest_name := COALESCE(NULLIF(TRIM(p_guest_name), ''), (SELECT full_name FROM public.profiles WHERE id = v_caller_id), 'Customer');
    v_guest_email := COALESCE(NULLIF(TRIM(p_guest_email), ''), (SELECT email FROM auth.users WHERE id = v_caller_id));
    v_guest_phone := TRIM(COALESCE(p_guest_phone, (SELECT phone FROM public.profiles WHERE id = v_caller_id), ''));
  ELSE
    -- Guest Checkout Validation
    IF p_guest_email IS NULL OR TRIM(p_guest_email) !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'A valid email address is required for guest checkout';
    END IF;
    IF p_guest_phone IS NULL OR LENGTH(REGEXP_REPLACE(p_guest_phone, '\D', '', 'g')) < 10 THEN
      RAISE EXCEPTION 'A valid 10-digit phone number is required for shipping';
    END IF;
    v_guest_name := TRIM(COALESCE(NULLIF(p_guest_name, ''), 'Guest Customer'));
    v_guest_email := LOWER(TRIM(p_guest_email));
    v_guest_phone := TRIM(p_guest_phone);
  END IF;

  -- 3. Shipping Address Validation
  IF p_shipping_address IS NULL OR jsonb_typeof(p_shipping_address) <> 'object' THEN
    RAISE EXCEPTION 'A valid shipping address object is required';
  END IF;

  -- 4. Payment Method Validation
  v_clean_payment_method := LOWER(TRIM(COALESCE(p_payment_method, 'cod')));
  IF v_clean_payment_method NOT IN ('cod', 'upi', 'card', 'bank_transfer') THEN
    RAISE EXCEPTION 'Invalid payment method "%"', p_payment_method;
  END IF;

  -- 5. Items Validation & Inventory Locking (Row-level Locking)
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'The order must contain at least one valid item';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid_text := v_item->>'product_id';
    IF v_pid_text IS NULL OR v_pid_text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'Malformed or missing product_id in items payload';
    END IF;
    v_pid := v_pid_text::UUID;

    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 100 THEN
      RAISE EXCEPTION 'Item quantity must be an integer between 1 and 100';
    END IF;

    -- Fetch authoritative price and stock from products table with row locking
    SELECT p.id, p.name, p.price, p.stock, p.is_active, pi.image_url
    INTO v_product_rec
    FROM public.products p
    LEFT JOIN LATERAL (
      SELECT image_url FROM public.product_images
      WHERE product_id = p.id AND is_primary = true
      LIMIT 1
    ) pi ON true
    WHERE p.id = v_pid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID "%" was not found in catalog', v_pid;
    END IF;

    IF NOT COALESCE(v_product_rec.is_active, true) THEN
      RAISE EXCEPTION 'Product "%" is discontinued or inactive', v_product_rec.name;
    END IF;

    IF v_product_rec.stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %', v_product_rec.name, v_product_rec.stock, v_qty;
    END IF;

    -- Authoritative line total
    v_item_line_total := v_product_rec.price * v_qty;
    v_calc_subtotal := v_calc_subtotal + v_item_line_total;

    -- Atomically decrement inventory
    UPDATE public.products
    SET stock = stock - v_qty, updated_at = timezone('utc'::text, now())
    WHERE id = v_pid;

    -- Buffer validated item (DO NOT INSERT child item until parent order exists)
    v_validated_items := v_validated_items || jsonb_build_object(
      'product_id', v_pid,
      'product_name', v_product_rec.name,
      'product_image', v_product_rec.image_url,
      'unit_price', v_product_rec.price,
      'quantity', v_qty,
      'total_price', v_item_line_total,
      'variant_details', v_item->'variant_details'
    );
  END LOOP;

  -- 6. Authoritative Shipping Calculation
  -- Store Policy: Free shipping on orders >= ₹1999; otherwise standard ₹149
  IF v_calc_subtotal >= 1999 THEN
    v_calc_shipping := 0;
  ELSE
    v_calc_shipping := 149;
  END IF;

  -- 7. Authoritative Coupon Validation & Discount Calculation
  v_applied_notes := COALESCE(p_notes, '');
  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon_rec
    FROM public.coupons
    WHERE UPPER(code) = UPPER(TRIM(p_coupon_code))
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Coupon code "%" is invalid or expired', p_coupon_code;
    END IF;

    IF v_calc_subtotal < v_coupon_rec.min_order_amount THEN
      RAISE EXCEPTION 'Coupon "%" requires a minimum purchase amount of ₹%', v_coupon_rec.code, v_coupon_rec.min_order_amount;
    END IF;

    IF v_coupon_rec.usage_limit IS NOT NULL AND v_coupon_rec.times_used >= v_coupon_rec.usage_limit THEN
      RAISE EXCEPTION 'Coupon "%" has reached its maximum redemptions', v_coupon_rec.code;
    END IF;

    IF v_coupon_rec.discount_type = 'percentage' THEN
      v_calc_discount := ROUND((v_calc_subtotal * (v_coupon_rec.discount_value / 100.0)), 2);
      IF v_coupon_rec.max_discount_amount IS NOT NULL AND v_calc_discount > v_coupon_rec.max_discount_amount THEN
        v_calc_discount := v_coupon_rec.max_discount_amount;
      END IF;
    ELSIF v_coupon_rec.discount_type = 'fixed' THEN
      v_calc_discount := LEAST(v_coupon_rec.discount_value, v_calc_subtotal);
    END IF;

    -- Increment usage
    UPDATE public.coupons
    SET times_used = times_used + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_coupon_rec.id;

    v_applied_notes := TRIM(v_applied_notes || ' [Coupon: ' || v_coupon_rec.code || ' (-₹' || v_calc_discount || ')]');
  END IF;

  -- 8. Authoritative Final Total
  v_calc_total := v_calc_subtotal + v_calc_shipping - v_calc_discount;
  IF v_calc_total < 0 THEN
    v_calc_total := 0;
  END IF;

  -- 9. CRITICAL FOREIGN KEY ORDERING: INSERT PARENT ORDER RECORD FIRST
  BEGIN
    INSERT INTO public.orders (
      id,
      order_number,
      user_id,
      guest_email,
      guest_name,
      guest_phone,
      shipping_address,
      status,
      subtotal,
      shipping_fee,
      discount_amount,
      total_amount,
      payment_method,
      payment_status,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_order_id,
      v_clean_order_number,
      v_caller_id,
      v_guest_email,
      v_guest_name,
      v_guest_phone,
      p_shipping_address,
      'placed',
      v_calc_subtotal,
      v_calc_shipping,
      v_calc_discount,
      v_calc_total,
      v_clean_payment_method,
      'pending',
      v_applied_notes,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    );
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Order number "%" has already been submitted. Please retry with a unique order number.', v_clean_order_number;
  END;

  -- 10. INSERT CHILD ORDER ITEMS SECOND (Parent order exists, satisfying foreign key)
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_validated_items)
  LOOP
    INSERT INTO public.order_items (
      id,
      order_id,
      product_id,
      product_name,
      product_image,
      unit_price,
      quantity,
      total_price,
      variant_details,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      v_item->>'product_image',
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'quantity')::INT,
      (v_item->>'total_price')::NUMERIC,
      v_item->'variant_details',
      timezone('utc'::text, now())
    );
  END LOOP;

  -- 11. INITIALIZE INTERNAL PAYMENT RECORD THIRD
  INSERT INTO public.payments (
    id,
    order_id,
    payment_method,
    amount,
    currency,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_order_id,
    v_clean_payment_method,
    v_calc_total,
    'INR',
    'pending',
    timezone('utc'::text, now())
  );

  -- 12. Return Sanitized Order Confirmation
  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_clean_order_number,
    'user_id', v_caller_id,
    'status', 'placed',
    'subtotal', v_calc_subtotal,
    'shipping_fee', v_calc_shipping,
    'discount_amount', v_calc_discount,
    'total_amount', v_calc_total,
    'payment_method', v_clean_payment_method,
    'payment_status', 'pending',
    'created_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.place_order(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 11. CONCURRENCY-SAFE RATE-LIMITED ORDER TRACKING (track_order_secure)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_tracking_rate_limits (
  client_identifier TEXT PRIMARY KEY,
  failed_attempts INT NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  blocked_until TIMESTAMPTZ
);

ALTER TABLE public.order_tracking_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_tracking_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_order_secure(
  p_order_number TEXT,
  p_verification TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_client_id TEXT;
  v_ip TEXT;
  v_rate_record RECORD;
  v_clean_order TEXT := UPPER(TRIM(COALESCE(p_order_number, '')));
  v_clean_verif TEXT := LOWER(TRIM(COALESCE(p_verification, '')));
  v_order_rec RECORD;
  v_verified BOOLEAN := FALSE;
  v_result JSONB;
BEGIN
  -- A. Determine Unique Client Identifier (Preventing shared bucket collisions)
  IF auth.uid() IS NOT NULL THEN
    v_client_id := 'uid:' || auth.uid()::text;
  ELSE
    BEGIN
      v_ip := COALESCE(
        current_setting('request.headers', true)::json->>'cf-connecting-ip',
        current_setting('request.headers', true)::json->>'x-real-ip',
        split_part(COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1)
      );
      v_ip := TRIM(v_ip);
    EXCEPTION WHEN OTHERS THEN
      v_ip := NULL;
    END;

    IF v_ip IS NOT NULL AND v_ip <> '' THEN
      v_client_id := 'ip:' || v_ip;
    ELSE
      v_client_id := 'hdr:' || encode(digest(COALESCE(current_setting('request.headers', true), gen_random_uuid()::text), 'sha256'), 'hex');
    END IF;
  END IF;

  -- B. Check Lockout Status (Admins bypassed)
  IF NOT public.is_admin() THEN
    SELECT * INTO v_rate_record
    FROM public.order_tracking_rate_limits
    WHERE client_identifier = v_client_id;

    IF v_rate_record.blocked_until IS NOT NULL AND v_rate_record.blocked_until > timezone('utc'::text, now()) THEN
      RETURN jsonb_build_object(
        'error', 'RATE_LIMIT_EXCEEDED',
        'message', 'Maximum failed tracking attempts exceeded. Access locked for 15 minutes.'
      );
    END IF;
  END IF;

  -- C. Validate Input
  IF v_clean_order = '' THEN
    RETURN NULL;
  END IF;

  -- D. Locate Order Record
  SELECT * INTO v_order_rec
  FROM public.orders
  WHERE UPPER(order_number) = v_clean_order;

  -- E. Verify Access Authority
  IF v_order_rec.id IS NOT NULL THEN
    IF public.is_admin() THEN
      v_verified := TRUE;
    ELSIF auth.uid() IS NOT NULL AND v_order_rec.user_id = auth.uid() THEN
      v_verified := TRUE;
    ELSIF v_clean_verif <> '' AND (
      LOWER(COALESCE(v_order_rec.guest_email, '')) = v_clean_verif
      OR LOWER(COALESCE(v_order_rec.shipping_address->>'email', '')) = v_clean_verif
      OR (LENGTH(REGEXP_REPLACE(v_clean_verif, '\D', '', 'g')) >= 10 AND RIGHT(REGEXP_REPLACE(COALESCE(v_order_rec.guest_phone, ''), '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(v_clean_verif, '\D', '', 'g'), 10))
      OR (LENGTH(REGEXP_REPLACE(v_clean_verif, '\D', '', 'g')) >= 10 AND RIGHT(REGEXP_REPLACE(COALESCE(v_order_rec.shipping_address->>'phone', ''), '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(v_clean_verif, '\D', '', 'g'), 10))
    ) THEN
      v_verified := TRUE;
    END IF;
  END IF;

  -- F. Handle Failed Attempt: Single Atomic Upsert (Eliminates PL/pgSQL FOUND bug & race conditions)
  IF NOT v_verified THEN
    IF NOT public.is_admin() THEN
      INSERT INTO public.order_tracking_rate_limits (
        client_identifier, failed_attempts, first_attempt_at, last_attempt_at, blocked_until
      ) VALUES (
        v_client_id, 1, timezone('utc'::text, now()), timezone('utc'::text, now()), NULL
      )
      ON CONFLICT (client_identifier) DO UPDATE SET
        failed_attempts = CASE
          WHEN public.order_tracking_rate_limits.last_attempt_at < (timezone('utc'::text, now()) - interval '15 minutes') THEN 1
          ELSE public.order_tracking_rate_limits.failed_attempts + 1
        END,
        first_attempt_at = CASE
          WHEN public.order_tracking_rate_limits.last_attempt_at < (timezone('utc'::text, now()) - interval '15 minutes') THEN timezone('utc'::text, now())
          ELSE public.order_tracking_rate_limits.first_attempt_at
        END,
        last_attempt_at = timezone('utc'::text, now()),
        blocked_until = CASE
          WHEN (
            CASE
              WHEN public.order_tracking_rate_limits.last_attempt_at < (timezone('utc'::text, now()) - interval '15 minutes') THEN 1
              ELSE public.order_tracking_rate_limits.failed_attempts + 1
            END
          ) >= 10 THEN timezone('utc'::text, now()) + interval '15 minutes'
          ELSE NULL
        END;
    END IF;

    RETURN NULL;
  END IF;

  -- G. Reset Counter on Successful Verification
  IF NOT public.is_admin() THEN
    UPDATE public.order_tracking_rate_limits
    SET failed_attempts = 0, blocked_until = NULL
    WHERE client_identifier = v_client_id;
  END IF;

  -- H. Return Sanitized Docket (Zero Payment Secrets / Internal Token Exposure)
  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'subtotal', o.subtotal,
    'shipping_fee', o.shipping_fee,
    'discount_amount', o.discount_amount,
    'total_amount', o.total_amount,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'tracking_number', o.tracking_number,
    'carrier', o.carrier,
    'created_at', o.created_at,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'product_image', oi.product_image,
        'unit_price', oi.unit_price,
        'quantity', oi.quantity,
        'total_price', oi.total_price,
        'variant_details', oi.variant_details
      ))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ), '[]'::jsonb)
  ) INTO v_result
  FROM public.orders o
  WHERE o.id = v_order_rec.id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.track_order_secure(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order_secure(TEXT, TEXT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 12. BOOTSTRAP INITIAL AUTHORIZED ADMINISTRATOR
-- ------------------------------------------------------------------------------
INSERT INTO public.authorized_admins (user_id, role, notes)
SELECT id, 'admin', 'Resin Aura Store Administrator'
FROM auth.users
WHERE LOWER(email) IN ('admin@resinaura.com', 'rohan@resinaura.com')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = timezone('utc'::text, now());

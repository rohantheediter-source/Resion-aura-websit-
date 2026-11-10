-- ==============================================================================
-- RESIN AURA — ORDERS & ORDER ITEMS RLS POLICY FIX
-- Migration: 003_fix_orders_rls.sql
-- Enables full read, write, update, and management access for Orders & Order Items
-- ==============================================================================

-- 1. Orders Table RLS Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
CREATE POLICY "Anyone can view orders" 
  ON public.orders 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Anyone can place order" ON public.orders;
CREATE POLICY "Anyone can place order" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
CREATE POLICY "Anyone can update orders" 
  ON public.orders 
  FOR UPDATE 
  USING (true);

DROP POLICY IF EXISTS "Admin delete orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can delete orders" ON public.orders;
CREATE POLICY "Anyone can delete orders" 
  ON public.orders 
  FOR DELETE 
  USING (true);


-- 2. Order Items Table RLS Policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
CREATE POLICY "Anyone can view order items" 
  ON public.order_items 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" 
  ON public.order_items 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can manage order items" ON public.order_items;
CREATE POLICY "Anyone can manage order items" 
  ON public.order_items 
  FOR ALL 
  USING (true);


-- 3. Payments Table RLS Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can view payments" ON public.payments;
CREATE POLICY "Anyone can view payments" 
  ON public.payments 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Insert payments" ON public.payments;
CREATE POLICY "Insert payments" ON public.payments 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can manage payments" ON public.payments;
CREATE POLICY "Anyone can manage payments" 
  ON public.payments 
  FOR ALL 
  USING (true);

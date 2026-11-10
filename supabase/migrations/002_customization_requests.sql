-- ==============================================================================
-- RESIN AURA — CUSTOMIZATION REQUESTS & WHATSAPP ORDERS SCHEMA MIGRATION
-- Migration: 002_customization_requests.sql
-- ==============================================================================

-- 1. Create customization_requests table
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
  final_price NUMERIC(10,2), -- Controlled solely by Admin/Business Owner
  estimated_delivery TEXT,   -- Set by Admin/Business Owner
  admin_notes TEXT,          -- Internal atelier remarks
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

-- 2. Indexes for efficient lookup & administrative filtering
CREATE INDEX IF NOT EXISTS idx_custom_req_status ON public.customization_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_req_type ON public.customization_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_custom_req_phone ON public.customization_requests(customer_phone);
CREATE INDEX IF NOT EXISTS idx_custom_req_created ON public.customization_requests(created_at DESC);

-- 3. Trigger for automatic updated_at timestamp
DROP TRIGGER IF EXISTS set_custom_req_updated_at ON public.customization_requests;
CREATE TRIGGER set_custom_req_updated_at
  BEFORE UPDATE ON public.customization_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;

-- 5. Policies:
-- A. Any visitor or customer can submit a customization request
DROP POLICY IF EXISTS "Anyone can insert customization request" ON public.customization_requests;
CREATE POLICY "Anyone can insert customization request"
  ON public.customization_requests
  FOR INSERT
  WITH CHECK (true);

-- B. Read policy: Admins and users can read requests
DROP POLICY IF EXISTS "Anyone can view customization requests" ON public.customization_requests;
CREATE POLICY "Anyone can view customization requests"
  ON public.customization_requests
  FOR SELECT
  USING (true);

-- C. Update policy: Only Admins can modify status, final_price, and notes
DROP POLICY IF EXISTS "Admins can update customization requests" ON public.customization_requests;
CREATE POLICY "Admins can update customization requests"
  ON public.customization_requests
  FOR UPDATE
  USING (public.is_admin() OR auth.role() = 'service_role');

-- D. Delete policy: Only Admins can delete
DROP POLICY IF EXISTS "Admins can delete customization requests" ON public.customization_requests;
CREATE POLICY "Admins can delete customization requests"
  ON public.customization_requests
  FOR DELETE
  USING (public.is_admin() OR auth.role() = 'service_role');


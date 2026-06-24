-- Migration 006: Store banners + product featured/new flags
-- Adds store_banners table for homepage carousel
-- Adds is_featured and is_new columns to products

-- 1. Create store_banners table
CREATE TABLE IF NOT EXISTS store_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  btn_text VARCHAR(100) DEFAULT 'Comprar ahora',
  bg_color VARCHAR(20) DEFAULT '#2563eb',
  text_color VARCHAR(20) DEFAULT '#ffffff',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_store_banners_tenant ON store_banners(tenant_id);
CREATE INDEX idx_store_banners_active ON store_banners(tenant_id, is_active, sort_order);

-- 2. Add is_featured and is_new to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

CREATE INDEX idx_products_featured ON products(tenant_id, is_featured, is_active);
CREATE INDEX idx_products_new ON products(tenant_id, is_new, is_active);

-- 3. Enable RLS
ALTER TABLE store_banners ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY "Service role full access on store_banners" ON store_banners
  FOR ALL USING (true) WITH CHECK (true);

-- Public read access for active banners
CREATE POLICY "Public read active banners" ON store_banners
  FOR SELECT USING (is_active = true);

-- Add view tracking and sales count to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Product views tracking table (for unique visitors per day)
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  visitor_id VARCHAR(100) NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_views_product_date ON product_views(product_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count);

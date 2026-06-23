CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'boleta',
  sii_code VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total NUMERIC(12,2) NOT NULL,
  customer_name VARCHAR(255),
  customer_rut VARCHAR(20),
  customer_email VARCHAR(255),
  pdf_url TEXT,
  xml_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, sii_code)
);

ALTER TABLE store_configs ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);
ALTER TABLE store_configs ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;

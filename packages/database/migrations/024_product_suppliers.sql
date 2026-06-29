-- Relación directa proveedor ↔ producto
CREATE TABLE product_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku VARCHAR(100),
  unit_cost DECIMAL(12,2),
  lead_time_days INTEGER DEFAULT 0,
  min_order_quantity INTEGER DEFAULT 1,
  is_preferred BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, product_id, supplier_id)
);

CREATE INDEX idx_product_suppliers_tenant ON product_suppliers(tenant_id);
CREATE INDEX idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier ON product_suppliers(supplier_id);

-- ============================================================
-- HUB DE ENVÍOS (CHILE-FIRST LOGISTICS) — SQL PARA SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS shipping_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('starken', 'chilexpress', 'blueexpress', 'flat_rate')),
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  api_key TEXT,
  api_secret TEXT,
  client_id TEXT,
  origin_region VARCHAR(100),
  origin_commune VARCHAR(100),
  origin_address TEXT,
  flat_rate_cost DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);

-- Habilitar RLS
ALTER TABLE shipping_configurations ENABLE ROW LEVEL SECURITY;

-- Política de RLS para que los usuarios accedan solo a las configuraciones de su propio tenant
CREATE POLICY "shipping_configs_tenant_access" ON shipping_configurations
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Columnas adicionales para órdenes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_provider VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

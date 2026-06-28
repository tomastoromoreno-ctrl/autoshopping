-- AutoShopping - SuperAdmin Features Migration
-- ============================================================

-- 1. Crear tabla de Avisos en Pantalla por Cliente
CREATE TABLE IF NOT EXISTS tenant_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habilitar RLS en tenant_notices
ALTER TABLE tenant_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON tenant_notices;
CREATE POLICY tenant_isolation ON tenant_notices
  FOR ALL USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- 3. Agregar columna features JSONB en tenants si no existe
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

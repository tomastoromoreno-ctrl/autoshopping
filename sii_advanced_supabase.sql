-- ============================================================
-- INTEGRACIÓN SII AVANZADA — SQL PARA SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Tabla de timbraje de folios (CAF) por tenant
CREATE TABLE IF NOT EXISTS tenant_cafs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dte_type INTEGER NOT NULL CHECK (dte_type IN (33, 39)), -- 33 = Factura, 39 = Boleta
  folio_start INTEGER NOT NULL,
  folio_end INTEGER NOT NULL,
  folio_current INTEGER NOT NULL,
  xml_content TEXT NOT NULL,                             -- Contenido completo del XML CAF emitido por el SII
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, dte_type, folio_start)
);

-- Índices para búsqueda rápida de folios activos
CREATE INDEX IF NOT EXISTS idx_tenant_cafs_active ON tenant_cafs(tenant_id, dte_type) WHERE is_active = TRUE;

-- Habilitar RLS para la nueva tabla
ALTER TABLE tenant_cafs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_cafs_tenant_access" ON tenant_cafs
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));


-- 2. Columnas adicionales para la configuración de facturación
ALTER TABLE invoicing_configs ADD COLUMN IF NOT EXISTS sii_invoicing_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE invoicing_configs ADD COLUMN IF NOT EXISTS certificate_path TEXT;
ALTER TABLE invoicing_configs ADD COLUMN IF NOT EXISTS certificate_password_encrypted TEXT;

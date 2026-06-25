-- ============================================================
-- MÓDULO DE CONFIANZA — SQL CONSOLIDADO PARA SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- ÁREA 1: SSL y HTTPS Automático
-- ============================================================

CREATE TABLE IF NOT EXISTS ssl_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issuing', 'active', 'expired', 'error')),
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  last_check_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, domain)
);

ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ssl_certs_tenant_access" ON ssl_certificates
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- ============================================================
-- ÁREA 2: Facturación Electrónica Mejorada (SII Chile)
-- ============================================================

CREATE TABLE IF NOT EXISTS invoicing_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  razon_social TEXT,
  rut_empresa TEXT,
  giro TEXT,
  direccion TEXT,
  comuna TEXT,
  ciudad TEXT,
  actividad_economica TEXT,
  sii_environment TEXT DEFAULT 'certification' CHECK (sii_environment IN ('certification', 'production')),
  certificate_uploaded BOOLEAN DEFAULT false,
  folio_start INTEGER DEFAULT 1,
  folio_current INTEGER DEFAULT 1,
  auto_generate_boleta BOOLEAN DEFAULT false,
  auto_generate_factura BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoicing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoicing_configs_tenant_access" ON invoicing_configs
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Columnas adicionales en invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS xml_content TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS folio INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rut_emisor TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razon_social_emisor TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_amount NUMERIC(12,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB;

-- ============================================================
-- ÁREA 3: Roles y Permisos Granulares
-- ============================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, role, permission)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_tenant_access" ON role_permissions
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- ============================================================
-- ÁREA 4: Generador de Términos Legales
-- ============================================================

CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('terms_conditions', 'privacy_policy', 'refund_policy', 'shipping_policy', 'cookies_policy')),
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  generated_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, type, version)
);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_documents_tenant_access" ON legal_documents
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Política pública para leer documentos legales activos (para la tienda)
CREATE POLICY "legal_documents_public_read" ON legal_documents
  FOR SELECT USING (is_active = true);

-- ============================================================
-- ÁREA 5: Backups Automáticos
-- ============================================================

CREATE TABLE IF NOT EXISTS backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'automatic', 'scheduled')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  file_url TEXT,
  file_size_bytes BIGINT,
  includes JSONB DEFAULT '["products","categories","orders","customers","config"]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backups_tenant_access" ON backups
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS backup_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  auto_backup_enabled BOOLEAN DEFAULT false,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  retention_days INTEGER DEFAULT 30,
  include_images BOOLEAN DEFAULT false,
  last_backup_at TIMESTAMPTZ,
  next_backup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE backup_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_configs_tenant_access" ON backup_configs
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

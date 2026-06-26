-- ============================================================
-- CONSOLIDADO: Todo el SQL pendiente para Supabase
-- Ejecutar COMPLETO en https://supabase.com/dashboard/project/tghomchdukigohcmgjwv/sql/new
-- ============================================================

-- ============================================================
-- 1. MÓDULO TÉCNICO (API Keys, Webhooks, i18n, Imágenes)
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  key_prefix VARCHAR(12) NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  environment VARCHAR(10) NOT NULL DEFAULT 'live' CHECK (environment IN ('live', 'sandbox')),
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  query_params JSONB,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_id VARCHAR(36),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_tenant_date ON api_request_logs(tenant_id, created_at DESC);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_tenant_access" ON api_keys
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "api_request_logs_tenant_access" ON api_request_logs
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Webhooks

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description VARCHAR(255),
  secret VARCHAR(64) NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  consecutive_failures INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(60) NOT NULL,
  event_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'retrying', 'abandoned')),
  attempt_count INTEGER DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  last_response_status INTEGER,
  last_response_body TEXT,
  last_response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant ON webhook_endpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending ON webhook_deliveries(next_attempt_at) WHERE status IN ('pending', 'retrying');

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_endpoints_tenant_access" ON webhook_endpoints
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "webhook_deliveries_tenant_access" ON webhook_deliveries
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Multiidioma y Multimoneda

CREATE TABLE IF NOT EXISTS tenant_languages (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, language_code)
);

CREATE TABLE IF NOT EXISTS product_translations (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  slug VARCHAR(255) NOT NULL,
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, language_code)
);

CREATE TABLE IF NOT EXISTS category_translations (
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (category_id, language_code)
);

CREATE TABLE IF NOT EXISTS tenant_currencies (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  currency_code CHAR(3) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  exchange_rate DECIMAL(12, 6) DEFAULT 1.0,
  rate_mode VARCHAR(10) NOT NULL DEFAULT 'auto' CHECK (rate_mode IN ('auto', 'manual')),
  rounding_rule VARCHAR(20) DEFAULT 'nearest',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, currency_code)
);

CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency CHAR(3) NOT NULL,
  target_currency CHAR(3) NOT NULL,
  rate DECIMAL(12, 6) NOT NULL,
  source VARCHAR(30) NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates ON exchange_rate_history(base_currency, target_currency, fetched_at DESC);

ALTER TABLE tenant_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rate_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_languages_tenant_access" ON tenant_languages
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "product_translations_tenant_access" ON product_translations
  FOR ALL USING (product_id IN (SELECT id FROM products WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "category_translations_tenant_access" ON category_translations
  FOR ALL USING (category_id IN (SELECT id FROM categories WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "tenant_currencies_tenant_access" ON tenant_currencies
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "exchange_rate_history_read" ON exchange_rate_history
  FOR SELECT TO authenticated USING (true);

-- Imágenes / CDN

CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  original_filename VARCHAR(255),
  mime_type VARCHAR(50) NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text VARCHAR(255),
  variants JSONB DEFAULT '{}'::jsonb,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'ready', 'error')),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_tenant ON images(tenant_id, created_at DESC);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "images_tenant_access" ON images
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));


-- ============================================================
-- 2. MÓDULO DE CONFIANZA (SSL, Roles, Legales, Backups)
-- ============================================================

-- SSL Certificates

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
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Columnas adicionales en invoices (si no existen)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS xml_content TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS folio INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rut_emisor TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razon_social_emisor TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_amount NUMERIC(12,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB;

-- Roles y permisos

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
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Documentos legales

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
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "legal_documents_public_read" ON legal_documents
  FOR SELECT USING (is_active = true);

-- Backups

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
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

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
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));


-- ============================================================
-- 3. SII AVANZADO (CAF - timbraje de folios)
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant_cafs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dte_type INTEGER NOT NULL CHECK (dte_type IN (33, 39)),
  folio_start INTEGER NOT NULL,
  folio_end INTEGER NOT NULL,
  folio_current INTEGER NOT NULL,
  xml_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, dte_type, folio_start)
);

CREATE INDEX IF NOT EXISTS idx_tenant_cafs_active ON tenant_cafs(tenant_id, dte_type) WHERE is_active = TRUE;

ALTER TABLE tenant_cafs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_cafs_tenant_access" ON tenant_cafs
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));


-- ============================================================
-- 4. PRODUCTOS: Vistas y ventas (migración 011)
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  visitor_id VARCHAR(100) NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_views_product_date ON product_views(product_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count);


-- ============================================================
-- 5. PRODUCTOS: Características opcionales (migración 012)
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS has_buy_now BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS technical_specs JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_shipping_info BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vertical_gallery BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_zoom BOOLEAN NOT NULL DEFAULT TRUE;

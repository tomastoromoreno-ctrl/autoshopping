-- ============================================================
-- MÓDULO TÉCNICO — SQL CONSOLIDADO PARA SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- ÁREA 1: API Pública Headless
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,        -- SHA-256 del key
  key_prefix VARCHAR(12) NOT NULL,             -- ej: "sk_live_" o "sk_sandbox_"
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

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_tenant_date ON api_request_logs(tenant_id, created_at DESC);

-- Habilitar RLS (para control administrativo si es necesario)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_tenant_access" ON api_keys
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "api_request_logs_tenant_access" ON api_request_logs
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));


-- ============================================================
-- ÁREA 2: Webhooks y Automatizaciones (Salida)
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description VARCHAR(255),
  secret VARCHAR(64) NOT NULL,                  -- Para firma HMAC-SHA256
  events TEXT[] NOT NULL DEFAULT '{}',         -- ej: ['order.paid', 'order.cancelled']
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
  event_id UUID NOT NULL,                      -- ID único del evento para idempotencia
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

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant ON webhook_endpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending ON webhook_deliveries(next_attempt_at) WHERE status IN ('pending', 'retrying');

-- Habilitar RLS
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_endpoints_tenant_access" ON webhook_endpoints
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "webhook_deliveries_tenant_access" ON webhook_deliveries
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));


-- ============================================================
-- ÁREA 4: Multiidioma y Multimoneda
-- ============================================================

-- Idiomas activos por tenant
CREATE TABLE IF NOT EXISTS tenant_languages (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,           -- 'es', 'en', 'pt', 'fr'
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, language_code)
);

-- Traducciones de productos
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

-- Traducciones de categorías
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

-- Monedas activas por tenant
CREATE TABLE IF NOT EXISTS tenant_currencies (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  currency_code CHAR(3) NOT NULL,              -- 'CLP', 'USD', 'EUR', etc.
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  exchange_rate DECIMAL(12, 6) DEFAULT 1.0,     -- tasa contra la moneda principal del tenant
  rate_mode VARCHAR(10) NOT NULL DEFAULT 'auto' CHECK (rate_mode IN ('auto', 'manual')),
  rounding_rule VARCHAR(20) DEFAULT 'nearest',  -- 'nearest', 'up', 'down'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, currency_code)
);

-- Tasas de cambio históricas globales
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency CHAR(3) NOT NULL,
  target_currency CHAR(3) NOT NULL,
  rate DECIMAL(12, 6) NOT NULL,
  source VARCHAR(30) NOT NULL,                 -- 'exchangerate-api'
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates ON exchange_rate_history(base_currency, target_currency, fetched_at DESC);

-- Habilitar RLS
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


-- ============================================================
-- ÁREA 5: CDN y Performance (Gestión de imágenes)
-- ============================================================

CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  original_filename VARCHAR(255),
  mime_type VARCHAR(50) NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text VARCHAR(255),
  variants JSONB DEFAULT '{}'::jsonb,           -- { thumbnail: { url, bytes }, small: { url }, ... }
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'ready', 'error')),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_tenant ON images(tenant_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "images_tenant_access" ON images
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

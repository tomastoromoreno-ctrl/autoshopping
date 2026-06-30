-- ============================================================
-- MIGRACIÓN 027: Ley 21.719 - Protección de Datos Personales
-- Nuevos requisitos de la ley que reemplaza la 19.628
-- Vigencia: 1 de diciembre de 2026
-- ============================================================

-- 1. Registro de Actividades de Tratamiento (Art. 14 ter)
CREATE TABLE IF NOT EXISTS processing_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  data_categories TEXT[] NOT NULL DEFAULT '{}',
  retention_period TEXT,
  security_measures TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  dpia_risks TEXT,
  dpia_mitigation TEXT,
  dpia_result TEXT,
  dpia_completed_at TIMESTAMPTZ
);

-- 2. Notificación de Brechas de Datos (Art. 14 sexies)
CREATE TABLE IF NOT EXISTS data_breaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  affected_data_categories TEXT[],
  affected_count INTEGER,
  risk_assessment TEXT,
  notified_apdp BOOLEAN DEFAULT false,
  notified_apdp_at TIMESTAMPTZ,
  notified_affected BOOLEAN DEFAULT false,
  notified_affected_at TIMESTAMPTZ,
  remediation TEXT,
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contratos de Encargados de Tratamiento (Art. 8)
CREATE TABLE IF NOT EXISTS data_processor_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  processor_name TEXT NOT NULL,
  processor_contact TEXT,
  processor_email TEXT,
  processing_description TEXT NOT NULL,
  data_categories TEXT[],
  security_measures TEXT,
  contract_date DATE,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Delegado de Protección de Datos - DPO (Art. 14 quáter)
CREATE TABLE IF NOT EXISTS data_protection_officers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_external BOOLEAN DEFAULT false,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- 5. Nuevos derechos del titular (Art. 2)
-- Bloqueo de datos
ALTER TABLE customers ADD COLUMN IF NOT EXISTS data_blocked BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS data_blocked_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS data_blocked_reason TEXT;
-- Oposición
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opposition_marketing BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opposition_profiling BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opposition_other TEXT;

-- 6. Solicitudes de derechos ARCO-P-B (auditoría)
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  request_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  details TEXT,
  response_data JSONB,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_processing_activities_tenant ON processing_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_breaches_tenant ON data_breaches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_breaches_status ON data_breaches(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_processor_contracts_tenant ON data_processor_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dpo_tenant ON data_protection_officers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dsr_tenant ON data_subject_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dsr_customer ON data_subject_requests(customer_id);

-- RLS deshabilitado (se maneja via service_role)
ALTER TABLE processing_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_breaches DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_processor_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_protection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests DISABLE ROW LEVEL SECURITY;

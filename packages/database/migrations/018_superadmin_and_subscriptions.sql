-- AutoShopping - SuperAdmin & Subscription System Migration
-- ============================================================

-- 1. Actualizar la restricción CHECK de roles de usuario para permitir 'support_agent'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'support_agent', 'store_owner', 'customer'));

-- 2. Crear tabla de Suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan_name VARCHAR(50) NOT NULL DEFAULT 'trial',
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial', 'overdue')),
  next_billing_date TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
  payment_method_on_file VARCHAR(100),
  grace_period_ends_at TIMESTAMPTZ,
  suspension_reason TEXT,
  manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Crear tabla de Historial de Auditoría (Logs de Auditoría)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULLable si es transversal
  action_type VARCHAR(50) NOT NULL,
  reason TEXT,
  notes TEXT,
  ip_address VARCHAR(45),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Crear tabla de Notas Internas de SuperAdmin por Cliente
CREATE TABLE IF NOT EXISTS internal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Crear tabla de Sesiones de Modo Dios
CREATE TABLE IF NOT EXISTS god_mode_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. Trigger para auto-update de updated_at en subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar RLS (Row Level Security) para la tabla de suscripciones
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON subscriptions;
CREATE POLICY tenant_isolation ON subscriptions
  FOR ALL USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- 8. Poblar suscripciones por defecto para tiendas existentes
INSERT INTO subscriptions (tenant_id, plan_name, price, billing_cycle, status, next_billing_date)
SELECT id, 'trial', 0, 'monthly', 'trial', NOW() + INTERVAL '14 days'
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

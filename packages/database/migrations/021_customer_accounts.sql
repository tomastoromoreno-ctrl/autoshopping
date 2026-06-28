-- ============================================================
-- MIGRACIÓN 021: Cuentas de Clientes
-- Permite a los clientes de cada tienda crear cuenta, login,
-- ver su perfil y consultar sus pedidos autenticados.
-- ============================================================

-- Tabla de clientes vinculada a Supabase Auth
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  default_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Vincular pedidos existentes a clientes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Los clientes solo ven sus propios datos
CREATE POLICY "customers_own_data" ON customers
  FOR ALL USING (id = auth.uid());

-- Políticas para pedidos de clientes
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

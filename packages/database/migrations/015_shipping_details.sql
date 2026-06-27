-- ============================================================
-- DETALLES DE DESPACHO PARA ÓRDENES (DOMICILIO / SUCURSAL)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_type VARCHAR(20) DEFAULT 'home' CHECK (shipping_type IN ('home', 'branch'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_branch VARCHAR(255);

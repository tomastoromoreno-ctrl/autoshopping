-- ============================================================
-- AGREGAR MODO "POR PAGAR" (COLLECT) AL HUB DE ENVÍOS
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

ALTER TABLE shipping_configurations ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'dynamic' CHECK (mode IN ('dynamic', 'collect'));

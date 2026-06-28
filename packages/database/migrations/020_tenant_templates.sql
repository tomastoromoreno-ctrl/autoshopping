-- AutoShopping - Premium Templates Migration
-- ============================================================

-- Agregar columna de plantilla seleccionada a la tabla tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS template_id VARCHAR(50) NOT NULL DEFAULT 'classic';

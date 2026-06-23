-- AutoShopping - Personalización de Apariencia de Tiendas
-- Agrega columnas para fuente tipográfica y paleta de colores a la tabla de tenants.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Inter';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bg_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS btn_color VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS btn_text_color VARCHAR(7) DEFAULT '#ffffff';

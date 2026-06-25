-- Migración: Agregar columnas de características opcionales a la tabla de productos
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_buy_now BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS technical_specs JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_shipping_info BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vertical_gallery BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_zoom BOOLEAN NOT NULL DEFAULT TRUE;

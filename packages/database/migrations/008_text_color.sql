-- AutoShopping - Personalización de Color de Texto
-- Agrega una columna para definir el color de fuente principal en las tiendas.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#1e293b';

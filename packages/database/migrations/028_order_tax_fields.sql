-- Add tax and invoicing fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) DEFAULT 'boleta';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_rut VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razon_social VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS giro VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS direccion_tributaria VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS comuna_tributaria VARCHAR(100);

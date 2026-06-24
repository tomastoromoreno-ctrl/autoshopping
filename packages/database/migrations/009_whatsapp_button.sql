-- Add WhatsApp business number to store_configs
ALTER TABLE store_configs ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE store_configs ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT 'Hola, me gustaría hacer una consulta sobre un producto.';

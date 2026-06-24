-- Migration 007: Style presets, social links, header/footer/card styles

-- Add style and social fields to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS header_style VARCHAR(50) DEFAULT 'classic';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS footer_style VARCHAR(50) DEFAULT 'minimal';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS card_style VARCHAR(50) DEFAULT 'standard';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_instagram VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_whatsapp VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_twitter VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS social_tiktok VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS color_preset VARCHAR(50);

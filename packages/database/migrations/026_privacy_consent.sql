CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  customer_id UUID,
  consent_type TEXT NOT NULL, -- 'privacy_policy', 'marketing', 'data_processing'
  granted BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consent_records DISABLE ROW LEVEL SECURITY;

-- Add marketing_consent and privacy_consent fields to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS privacy_consent BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS privacy_consent_date TIMESTAMPTZ;

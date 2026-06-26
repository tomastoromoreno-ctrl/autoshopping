import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://tghomchdukigohcmgjwv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const statements = [
  // Create team_invitations table
  `CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'store_viewer',
    token TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_role CHECK (role IN ('store_admin', 'store_manager', 'store_editor', 'store_viewer')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))
  );`,

  // Index for fast lookup by token
  `CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);`,

  // Index for listing invitations by tenant
  `CREATE INDEX IF NOT EXISTS idx_team_invitations_tenant ON team_invitations(tenant_id, status);`,

  // Index for finding invitations by email
  `CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email, status);`,

  // Unique constraint: no duplicate pending invitations for same email + tenant
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_unique_pending
   ON team_invitations(tenant_id, email)
   WHERE status = 'pending';`,
];

async function migrate() {
  console.log('🚀 Migración 013: Tabla team_invitations\\n');

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\\n/g, ' ').trim();

    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });

      if (error) {
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`⚠️  Ya existe: ${preview}...`);
        } else {
          console.log(`❌ Error [${i}]: ${error.message}`);
          console.log(`   SQL: ${preview}...`);
        }
      } else {
        console.log(`✅ ${preview}...`);
      }
    } catch (e) {
      console.log(`ℹ️  Continuando después de error en sentencia ${i}...`);
    }
  }

  console.log('\\n✅ Migración 013 completada!');
}

migrate().catch(console.error);

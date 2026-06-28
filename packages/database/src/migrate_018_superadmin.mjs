import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://tghomchdukigohcmgjwv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaG9tY2hkdWtpZ29oY21nand2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgxODAyMiwiZXhwIjoyMDk3Mzk0MDIyfQ.N6Bj2yi_dPo7NZDBSsmlF6QdS3-OR3I8nAONZRrOF3Q';

const supabase = createClient(supabaseUrl, supabaseKey);
const sqlPath = join(__dirname, '..', 'migrations', '018_superadmin_and_subscriptions.sql');
const sql = readFileSync(sqlPath, 'utf-8');

async function migrate() {
  console.log('Ejecutando migración 018_superadmin_and_subscriptions...');
  
  // Split statements by semicolon, being careful to ignore function/trigger body semicolons if any
  // Here we can split by statement since there are no plpgsql function definitions with nested semicolons
  // (the trigger update_updated_at_column was defined in 001, we just bind it to our new table).
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\nEjecutando sentencia [${i+1}/${statements.length}]:`);
    console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
    
    const { error } = await supabase.rpc('exec_sql', { query: stmt });
    if (error) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`⚠️  Mensaje: ${error.message} (Ignorado)`);
      } else {
        console.error(`❌ Error en sentencia ${i+1}:`, error.message);
      }
    } else {
      console.log(`✅ Éxito`);
    }
  }
  console.log('\nMigración 018 completada.');
}

migrate().catch(console.error);

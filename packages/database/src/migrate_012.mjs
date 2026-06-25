import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://tghomchdukigohcmgjwv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaG9tY2hkdWtpZ29oY21nand2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgxODAyMiwiZXhwIjoyMDk3Mzk0MDIyfQ.N6Bj2yi_dPo7NZDBSsmlF6QdS3-OR3I8nAONZRrOF3Q';

const supabase = createClient(supabaseUrl, supabaseKey);
const sqlPath = join(__dirname, '..', 'migrations', '012_product_optional_features.sql');
const sql = readFileSync(sqlPath, 'utf-8');

async function migrate() {
  console.log('Ejecutando migración 012...');
  
  // Split statements by semicolon
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`Ejecutando: ${stmt}`);
    const { error } = await supabase.rpc('exec_sql', { query: stmt });
    if (error) {
      console.error(`❌ Error en sentencia ${i}:`, error.message);
    } else {
      console.log(`✅ Éxito`);
    }
  }
  console.log('Migración 012 completada.');
}

migrate().catch(console.error);

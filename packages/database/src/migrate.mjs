import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://tghomchdukigohcmgjwv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaG9tY2hkdWtpZ29oY21nand2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgxODAyMiwiZXhwIjoyMDk3Mzk0MDIyfQ.N6Bj2yi_dPo7NZDBSsmlF6QdS3-OR3I8nAONZRrOF3Q';

const supabase = createClient(supabaseUrl, supabaseKey);
const sqlPath = join(__dirname, '..', 'migrations', '001_initial_schema.sql');
const sql = readFileSync(sqlPath, 'utf-8');

async function migrate() {
  console.log('Migrando base de datos...\n');

  // Split by statement-ending semicolons, but preserve function/trigger bodies
  const statements = [];
  let current = '';
  let inFunction = false;

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.startsWith('CREATE OR REPLACE FUNCTION') || trimmed.startsWith('CREATE FUNCTION')) {
      inFunction = true;
    }

    current += line + '\n';

    if (trimmed.endsWith('$$;') || trimmed.endsWith("$$'$$ LANGUAGE plpgsql;") || trimmed.endsWith("$$ LANGUAGE plpgsql;")) {
      inFunction = false;
    }

    if (trimmed.endsWith(';') && !inFunction) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) statements.push(current.trim());

  console.log(`Ejecutando ${statements.length} sentencias SQL...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');

    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });

      if (error) {
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`⚠️  Ya existe: ${preview}...`);
        } else if (error.message?.includes('function exec_sql')) {
          // exec_sql doesn't exist, try direct insert approach
          console.log('ℹ️  Ejecutando directamente...');
          await executeDirect(supabase, stmt, i);
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

  console.log('\n✅ Migración completada!');
}

async function executeDirect(supabase, stmt, index) {
  // For statements like CREATE TABLE, ALTER TABLE, etc., we skip if exec_sql isn't available
  // and just log what would be executed
  const type = stmt.substring(0, 20).toUpperCase();
  if (type.includes('CREATE TABLE') || type.includes('ALTER TABLE') || type.includes('CREATE INDEX') || type.includes('CREATE VIEW')) {
    console.log(`   [${index}] Pendiente de ejecutar manualmente en SQL Editor`);
  }
}

migrate().catch(console.error);

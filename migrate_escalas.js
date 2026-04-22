// Migration: Add tipo_jornada and modo_jornada columns to escalas table
const SUPABASE_URL = 'https://brxvaqfwomsknbmlzdmc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHZhcWZ3b21za25ibWx6ZG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxOTMzNywiZXhwIjoyMDg5NTk1MzM3fQ.Gqi2YtZO_vrjp6D9bFl9w2bOXDg6Mg04jJhp_wBrx2g';

async function migrate() {
  // Use Supabase REST RPC to run raw SQL
  const sql = `
    ALTER TABLE escalas ADD COLUMN IF NOT EXISTS tipo_jornada text DEFAULT 'Plantonista';
    ALTER TABLE escalas ADD COLUMN IF NOT EXISTS modo_jornada text DEFAULT NULL;
  `;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  // If RPC doesn't work, try the SQL endpoint directly
  if (!res.ok) {
    console.log('RPC approach failed, trying pg-meta...');
    
    // Try adding columns one by one via the pg-meta/query endpoint
    const sqlRes = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (!sqlRes.ok) {
      console.log('pg-meta also failed. Status:', sqlRes.status);
      console.log('Trying individual column adds via Supabase client...');
      
      // Last resort: try to insert a row with the new columns and see if Supabase auto-creates
      // Actually, let's try the management API
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      
      // Test: can we select tipo_jornada?
      const { data, error } = await supabase.from('escalas').select('tipo_jornada').limit(1);
      if (error) {
        console.log('Column tipo_jornada does NOT exist. Error:', error.message);
        console.log('\n=== MANUAL ACTION REQUIRED ===');
        console.log('Please run this SQL in the Supabase SQL Editor:');
        console.log(`
ALTER TABLE escalas ADD COLUMN IF NOT EXISTS tipo_jornada text DEFAULT 'Plantonista';
ALTER TABLE escalas ADD COLUMN IF NOT EXISTS modo_jornada text DEFAULT NULL;
        `);
      } else {
        console.log('Column tipo_jornada already exists!', data);
      }
    } else {
      console.log('Migration applied via pg-meta!');
    }
  } else {
    console.log('Migration applied via RPC!');
  }
}

migrate().catch(console.error);

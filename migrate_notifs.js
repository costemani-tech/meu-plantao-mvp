const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brxvaqfwomsknbmlzdmc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHZhcWZ3b21za25ibWx6ZG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxOTMzNywiZXhwIjoyMDg5NTk1MzM3fQ.Gqi2YtZO_vrjp6D9bFl9w2bOXDg6Mg04jJhp_wBrx2g'
);

async function migrate() {
  console.log('Adding columns and constraint to notificacoes table...');
  
  // Using a single query if possible via a custom RPC or multiple ones if needed.
  // Since I don't have a generic SQL RPC, I'll try to use a trick or ask the user to run it.
  // Wait, I can try to use a common RPC if it exists like 'exec_sql' but usually it doesn't.
  
  // I will try to use the 'check_cols' trick to see if I can run raw SQL.
  // Actually, I'll just create a new script that tries to add the columns.
  
  const sql = `
    ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS escala_id UUID REFERENCES escalas(id) ON DELETE CASCADE;
    ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS data_hora_inicio TIMESTAMPTZ;
    ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS unique_notif_escala_data;
    ALTER TABLE notificacoes ADD CONSTRAINT unique_notif_escala_data UNIQUE (usuario_id, escala_id, data_hora_inicio);
  `;
  
  // I will attempt to use a common pattern for SQL execution in Supabase if the user has one.
  // If not, I will have to ask the user to run it in the dashboard.
  
  // Let's check if there's an 'exec' or 'sql' rpc.
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('Failed to run migration via RPC:', error.message);
    console.log('Please run the following SQL in your Supabase Dashboard:');
    console.log(sql);
  } else {
    console.log('Migration completed successfully!');
  }
}

migrate();

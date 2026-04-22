const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brxvaqfwomsknbmlzdmc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHZhcWZ3b21za25ibWx6ZG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxOTMzNywiZXhwIjoyMDg5NTk1MzM3fQ.Gqi2YtZO_vrjp6D9bFl9w2bOXDg6Mg04jJhp_wBrx2g'
);

async function check() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'notificacoes' });
  if (error) {
    // If RPC doesn't exist, try a simple query to see if it works
    const { data: test, error: testErr } = await supabase.from('notificacoes').select('*').limit(1);
    console.log('Table notificacoes access:', testErr ? testErr.message : 'OK');
    
    // Check constraints via SQL if possible (rpc needed)
    // For now let's just try to insert a dummy notification to see if upsert works
    const dummy = {
      usuario_id: '803a6200-e74c-474c-83b5-74892c55f2d3', // Just a placeholder
      titulo: 'Test',
      mensagem: 'Test',
      lida: false
    };
    
    const { error: upsertErr } = await supabase.from('notificacoes').upsert([dummy], { onConflict: 'usuario_id,escala_id,data_hora_inicio' });
    console.log('Upsert test error:', upsertErr ? upsertErr.message : 'OK');
  } else {
    console.log('Table info:', data);
  }
}

check();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brxvaqfwomsknbmlzdmc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHZhcWZ3b21za25ibWx6ZG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxOTMzNywiZXhwIjoyMDg5NTk1MzM3fQ.Gqi2YtZO_vrjp6D9bFl9w2bOXDg6Mg04jJhp_wBrx2g'
);

async function check() {
  const { data, error } = await supabase.from('notificacoes').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    // If table is empty, try to get column names from information_schema via RPC if available
    // or just try to select one row and see what happens.
    // Let's try to select an arbitrary column to see if it exists.
    const columns = ['id', 'usuario_id', 'titulo', 'mensagem', 'lida', 'created_at', 'data_hora_inicio', 'escala_id'];
    for (const col of columns) {
      const { error: err } = await supabase.from('notificacoes').select(col).limit(1);
      console.log(`Column ${col}: ${err ? 'NOT FOUND (' + err.message + ')' : 'EXISTS'}`);
    }
  }
}

check();

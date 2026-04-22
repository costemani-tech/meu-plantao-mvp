const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brxvaqfwomsknbmlzdmc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHZhcWZ3b21za25ibWx6ZG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxOTMzNywiZXhwIjoyMDg5NTk1MzM3fQ.Gqi2YtZO_vrjp6D9bFl9w2bOXDg6Mg04jJhp_wBrx2g'
);

async function clean() {
  const { data: escalas } = await supabase.from('escalas').select('id, local_id');
  
  const now = new Date().toISOString();
  
  for (const e of escalas) {
    const { count } = await supabase
      .from('plantoes')
      .select('id', { count: 'exact', head: true })
      .eq('escala_id', e.id)
      .gte('data_hora_inicio', now);
      
    if (count === 0) {
      console.log(`Deleting escala ${e.id} because it has 0 future plantões`);
      await supabase.from('plantoes').delete().eq('escala_id', e.id);
      await supabase.from('escalas').delete().eq('id', e.id);
    }
  }
  console.log('Cleanup done!');
}

clean();

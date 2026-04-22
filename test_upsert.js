const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brxvaqfwomsknbmlzdmc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHZhcWZ3b21za25ibWx6ZG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxOTMzNywiZXhwIjoyMDg5NTk1MzM3fQ.Gqi2YtZO_vrjp6D9bFl9w2bOXDg6Mg04jJhp_wBrx2g'
);

async function testAlert() {
  const userId = '8d338146-58ba-4a51-9240-a16d15b7132c';
  const scaleId = '09e73f40-e69b-4734-b3cb-c7ffb763a418';
  
  const { data: plantoes } = await supabase
    .from('plantoes')
    .select('data_hora_inicio')
    .eq('escala_id', scaleId)
    .gte('data_hora_inicio', new Date().toISOString())
    .limit(5);
    
  console.log('Found plantoes:', plantoes?.length || 0);
  
  if (plantoes && plantoes.length > 0) {
    const dbNotifs = plantoes.map(p => ({
      usuario_id: userId,
      escala_id: scaleId,
      data_hora_inicio: p.data_hora_inicio,
      titulo: 'Teste',
      mensagem: 'Teste',
      lida: false
    }));
    
    // Test without onConflict first to see if simple insert works
    const { error: insErr } = await supabase.from('notificacoes').insert(dbNotifs);
    console.log('INSERT result:', insErr ? insErr.message : 'SUCCESS');

    // Then test with onConflict
    const { error } = await supabase.from('notificacoes').upsert(dbNotifs, {
      onConflict: 'usuario_id,escala_id,data_hora_inicio'
    });
    
    if (error) {
      console.error('UPSERT ERROR:', error.message);
    } else {
      console.log('UPSERT SUCCESS');
    }
  }
}

testAlert();

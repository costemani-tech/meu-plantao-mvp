// Fix existing escalas data in Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brxvaqfwomsknbmlzdmc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHZhcWZ3b21za25ibWx6ZG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxOTMzNywiZXhwIjoyMDg5NTk1MzM3fQ.Gqi2YtZO_vrjp6D9bFl9w2bOXDg6Mg04jJhp_wBrx2g'
);

async function fix() {
  // Fix UPA Pacheco (8fd37b98) - user says it's Diarista 9-18
  const { data: d1, error: e1 } = await supabase
    .from('escalas')
    .update({ 
      tipo_jornada: 'Diarista',
      modo_jornada: 'semana',
      regra: '1,2,3,4,5' // Seg-Sex default
    })
    .eq('id', '8fd37b98-8ae6-4e58-a029-fd82f637918e')
    .select();
  
  console.log('UPA Pacheco fix:', e1 ? e1.message : 'OK', d1?.[0]?.tipo_jornada);

  // CNL Mangueira (eb781347) - already correct as Plantonista 12x36
  // Just verify
  const { data: d2 } = await supabase
    .from('escalas')
    .select('id, regra, tipo_jornada, local:locais_trabalho(nome)')
    .eq('id', 'eb781347-5ebf-46ea-ae96-5fe5bb4ee351')
    .single();
  
  console.log('CNL Mangueira:', d2?.regra, d2?.tipo_jornada);

  console.log('\nDone!');
}

fix();

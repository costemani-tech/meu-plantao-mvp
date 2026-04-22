// Script to check existing escalas and their data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brxvaqfwomsknbmlzdmc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHZhcWZ3b21za25ibWx6ZG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxOTMzNywiZXhwIjoyMDg5NTk1MzM3fQ.Gqi2YtZO_vrjp6D9bFl9w2bOXDg6Mg04jJhp_wBrx2g'
);

async function check() {
  // 1. List all escalas with their local names
  const { data: escalas, error } = await supabase
    .from('escalas')
    .select('id, regra, tipo_jornada, modo_jornada, data_inicio, local:locais_trabalho(nome)')
    .order('created_at', { ascending: false });
  
  if (error) { console.error('Error:', error); return; }
  
  console.log('=== ESCALAS EXISTENTES ===');
  escalas.forEach(e => {
    console.log(`ID: ${e.id}`);
    console.log(`  Local: ${e.local?.nome}`);
    console.log(`  Regra: ${e.regra}`);
    console.log(`  Tipo Jornada: ${e.tipo_jornada}`);
    console.log(`  Modo Jornada: ${e.modo_jornada}`);
    console.log(`  Data Início: ${e.data_inicio}`);
    console.log('---');
  });

  // 2. Check plantões futuros for each escala
  const now = new Date().toISOString();
  for (const e of escalas) {
    const { data: plantoes, count } = await supabase
      .from('plantoes')
      .select('data_hora_inicio, data_hora_fim', { count: 'exact' })
      .eq('escala_id', e.id)
      .gte('data_hora_inicio', now)
      .order('data_hora_inicio', { ascending: true })
      .limit(1);
    
    console.log(`Escala ${e.local?.nome}: ${count ?? 0} plantões futuros`);
    if (plantoes?.[0]) {
      console.log(`  Próximo: ${plantoes[0].data_hora_inicio} -> ${plantoes[0].data_hora_fim}`);
    }
  }
}

check();

const fs = require('fs');
let content = fs.readFileSync('src/app/escalas/page.tsx', 'utf-8');

// 1. Update EscalaAtiva type
content = content.replace(
  'id: string;\n  regra: string;\n  data_inicio: string;\n',
  'id: string;\n  regra: string;\n  tipo_jornada?: string;\n  modo_jornada?: string;\n  data_inicio: string;\n'
);

// 2. Update fetchEscalas
content = content.replace(
  ".select('id, regra, data_inicio, local_id, local:locais_trabalho(nome, cor_calendario), plantoes(data_hora_inicio, data_hora_fim)')",
  ".select('id, regra, tipo_jornada, modo_jornada, data_inicio, local_id, local:locais_trabalho(nome, cor_calendario), plantoes(data_hora_inicio, data_hora_fim)')"
);

// 3. Update Card display logic
const cardRegex = /<div style=\{\{ fontWeight: 800, fontSize: 15, color: 'var\(--text-primary\)' \}\}>\{e\.local\?\.nome \?\? 'Local desconhecido'\}<\/div>\s*<div style=\{\{ fontSize: 13, color: 'var\(--text-secondary\)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 \}\}>\s*<span style=\{\{ fontWeight: 600 \}\}>\{e\.regra\}<\/span>\s*<span style=\{\{ opacity: 0\.5 \}\}>\|<\/span>\s*<span>\{horaInicialFormatada\} → \{horaFinalFormatada\}<\/span>\s*<\/div>/g;

const newCard = `<div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{e.local?.nome ?? 'Local desconhecido'}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 600 }}>
                                {e.tipo_jornada === 'Diarista' 
                                  ? (e.modo_jornada === 'Dias da Semana' || e.modo_jornada === 'semana' ? 'Diarista (Dias Fixos)' : \`Diarista (\${e.regra})\`) 
                                  : (e.regra.includes('x') && !e.regra.includes(',') && e.tipo_jornada !== 'Plantonista' ? (parseInt(e.regra.split('x')[0]) < 12 ? \`Diarista (\${e.regra})\` : e.regra) : (e.regra.includes(',') ? 'Diarista (Dias Fixos)' : e.regra))}
                              </span>
                              <span style={{ opacity: 0.5 }}>|</span>
                              <span>{horaInicialFormatada} → {horaFinalFormatada}</span>
                            </div>`;

content = content.replace(cardRegex, newCard);

fs.writeFileSync('src/app/escalas/page.tsx', content, 'utf-8');
console.log('Patch Escalas Diarista applied');

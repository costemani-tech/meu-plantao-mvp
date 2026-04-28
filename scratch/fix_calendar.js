
const fs = require('fs');
const path = 'src/app/calendario/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `const dataNovaFormatada = edicaoCiclo.dataInicio + edicaoCiclo.p.data_hora_inicio.substring(10);`;
const replacement1 = `const dataNovaFormatada = edicaoCiclo.dataInicio + 'T' + edicaoCiclo.horaInicio + ':00';`;

// Regex to find the ending hour block and replace it
const targetRegex = /\{\(edicaoCiclo!\.regra === '5x2' \|\| edicaoCiclo!\.regra === '6x1' \|\| isCustomCicloRule\) && \([\s\S]*?Hora de .*?<\/label>[\s\S]*?value=\{edicaoCiclo!\.horaFim\}[\s\S]*?\)\}/;
const replacementUI = `<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
               <div>
                 <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'block' }}>Hora de Início (Entrada):</label>
                 <input 
                   type="time"
                   value={edicaoCiclo!.horaInicio}
                   onChange={e => setEdicaoCiclo({...edicaoCiclo!, horaInicio: e.target.value})}
                   className="input-field"
                   style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                 />
               </div>
               <div>
                 <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'block' }}>Hora de Término (Saída):</label>
                 <input 
                   type="time"
                   value={edicaoCiclo!.horaFim}
                   onChange={e => setEdicaoCiclo({...edicaoCiclo!, horaFim: e.target.value})}
                   className="input-field"
                   style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                 />
               </div>
             </div>`;

content = content.replace(target1, replacement1);
content = content.replace(targetRegex, replacementUI);

fs.writeFileSync(path, content, 'utf8');
console.log('File updated successfully');


const fs = require('fs');
const path = 'src/app/calendario/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the UI block
const brokenUI = /<\/div>\s+<div>\s+<label style=\{\{ fontSize: 11, fontWeight: 700, color: 'var\(--text-muted\)', textTransform: 'uppercase', letterSpacing: '0\.05em', display: 'block', marginBottom: 4 \}\}>Horas de Descanso<\/label>[\s\S]*?<\/p>\s+<\/div>\s+\)\}/;
const correctUI = `</div>
             </div>

              {edicaoCiclo!.regra === 'Outro' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, padding: 14, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)', animation: 'fadeInDown 0.2s ease' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Horas Trabalhadas</label>
                    <input type="number" min="1" value={cicloHorasTrabalho} onChange={e => { setCicloHorasTrabalho(e.target.value); setEdicaoCiclo({...edicaoCiclo!, regra: \`\${e.target.value}x\${cicloHorasDescanso}\`}); }} placeholder="Ex: 12" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Horas de Descanso</label>
                    <input type="number" min="1" value={cicloHorasDescanso} onChange={e => { setCicloHorasDescanso(e.target.value); setEdicaoCiclo({...edicaoCiclo!, regra: \`\${cicloHorasTrabalho}x\${e.target.value}\`}); }} placeholder="Ex: 60" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Ciclo: {(parseInt(cicloHorasTrabalho,10)||0)+(parseInt(cicloHorasDescanso,10)||0)}h</p>
                </div>
              )}`;

content = content.replace(brokenUI, correctUI);

// Fix the POST logic
content = content.replace(/const regraFinal = isCustomCicloRule \? \`\${cicloHorasTrabalho}x\${cicloHorasDescanso}\` : edicaoCiclo!\.regra;/, 
`const regraFinal = edicaoCiclo!.regra === 'Outro' ? \`\${cicloHorasTrabalho}x\${cicloHorasDescanso}\` : edicaoCiclo!.regra;`);

fs.writeFileSync(path, content, 'utf8');
console.log('File fixed and logic updated');

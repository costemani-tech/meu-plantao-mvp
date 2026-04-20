const fs = require('fs');

function updateCalendario() {
  const path = 'src/app/calendario/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Regex to exactly replace the getCellBackground function using match approach
  const oldFuncRegex = /const getCellBackground = \([\s\S]*?return 'transparent';\s*};/;
  
  const newFunc = `const getCellBackground = (ps: PlantaoComLocal[], dia: number) => {
    if (ps.length === 0) return 'transparent';
    const getCor = (p: PlantaoComLocal) => p.is_extra ? '#8b5cf6' : (p.local?.cor_calendario ?? '#4f8ef7');

    const locaisUnicos = new Set(ps.map(p => p.local_id || p.local?.nome || p.is_extra));

    if (locaisUnicos.size === 1) {
      return getCor(ps[0]);
    }

    if (ps.length >= 2) {
      const cor1 = getCor(ps[0]);
      const pDiferente = ps.find(p => getCor(p) !== cor1);
      const cor2 = pDiferente ? getCor(pDiferente) : cor1;
      return \`linear-gradient(to bottom right, \${cor1} 50%, \${cor2} 50%)\`;
    }
    return 'transparent';
  };`;

  content = content.replace(oldFuncRegex, newFunc);
  fs.writeFileSync(path, content, 'utf8');
}

function updateScaleGenerator() {
  const path = 'src/lib/scale-generator.ts';
  let content = fs.readFileSync(path, 'utf8');

  const oldGenRegex = /export function gerarProximosPlantoes\([\s\S]*?return slots;\s*}/;
  
  const newGen = `export function gerarProximosPlantoes(
  dataInicio: Date,
  regra: Regra,
  tipoJornada: string = 'Plantonista',
  horaFim: string = '18:00',
  quantidade: number = 5
): SlotPlantao[] {
  const slots: SlotPlantao[] = [];
  const cursor = new Date(dataInicio);

  if (tipoJornada === 'Plantonista') {
    let duracaoTrabalho = 12;
    let cicloHoras = 48;
    
    if (regra.includes('x')) {
      const parts = regra.split('x');
      duracaoTrabalho = parseInt(parts[0], 10) || 12;
      const duracaoDescanso = parseInt(parts[1], 10) || 36;
      cicloHoras = duracaoTrabalho + duracaoDescanso;
    }

    for (let i = 0; i < quantidade; i++) {
      const inicio = new Date(cursor);
      const fim = new Date(cursor);
      fim.setHours(fim.getHours() + duracaoTrabalho);
      slots.push({ inicio, fim });
      cursor.setHours(cursor.getHours() + cicloHoras);
    }
  } else {
    // Diarista based on explicit days of the week (comma separated integers)
    // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
    const diasPermitidos = regra.split(',').map(Number);
    const [hFim, mFim] = horaFim.split(':').map(Number);
    
    while (slots.length < quantidade) {
      if (diasPermitidos.includes(cursor.getDay())) {
        const inicio = new Date(cursor);
        const fim = new Date(cursor);
        fim.setHours(hFim, mFim, 0, 0);
        if (fim <= inicio) fim.setDate(fim.getDate() + 1);
        slots.push({ inicio, fim });
      }
      cursor.setDate(cursor.getDate() + 1);
      // Failsafe to not infinity loop
      if (cursor.getTime() - dataInicio.getTime() > 1000 * 60 * 60 * 24 * 365 * 3) break;
    }
  }

  return slots;
}`;

  content = content.replace(oldGenRegex, newGen);
  fs.writeFileSync(path, content, 'utf8');
}

function updateEscalas() {
  const path = 'src/app/escalas/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Fix preview useEffect string
  const previewRegex = /<div style={{ padding: 16, background: 'var\(--bg-primary\)'[\s\S]*?<\/div>[\s\S]*?<\/div>/;

  const newPreview = `<div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
            {preview.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>\uD83D\uDD0D</div>
                <div style={{ fontSize: 13 }}>Preencha os campos ao lado para ver o preview.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  \uD83D\uDDD3\uFE0F Próximas {preview.length} ocorrências — {tipoJornada === 'Plantonista' ? (regra === 'Outro' ? \`\${horasTrabalhoOutro}x\${horasDescansoOutro}\` : regra) : 'Dias Selecionados'}
                </div>
                {preview.map((p, i) => {
                  const hoursDiff = (p.fim.getTime() - p.inicio.getTime()) / (1000 * 60 * 60);
                  const tempoText = tipoJornada === 'Plantonista' ? \`\${hoursDiff}h\` : \`\${horaInicio} - \${horaFim}\`;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i === preview.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: 8, fontWeight: 500 }}>#{i + 1}</span>
                        {p.inicio.toLocaleDateString('pt-BR', { weekday: 'short' })}, <strong>{p.inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</strong> {p.inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: 11, background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                        {tempoText}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>`;

  content = content.replace(previewRegex, newPreview);
  
  // Replace Diarista saving logic inside salvarEscala
  const salvarRegex = /const arrayDePlantoes = \[\];[\s\S]*?if \(!localId\)/;
  
  const newSalvar = `const arrayDePlantoes = [];

      if (tipoJornada === 'Plantonista') {
        while (dataAtual <= dataFinal) {
          const inicioIso = dataAtual.toISOString();
          const fimObj = new Date(dataAtual);
          fimObj.setHours(fimObj.getHours() + trabalhoA);

          if (dataAtual <= dataFinal) {
            arrayDePlantoes.push({
              escala_id: escalaCriada.id,
              usuario_id: user.id,
              local_id: localId,
              data_hora_inicio: inicioIso,
              data_hora_fim: fimObj.toISOString(),
              status: 'Agendado',
              is_extra: false
            });
          }
          dataAtual.setHours(dataAtual.getHours() + cicloA);
        }
      } else {
        const [hFim, mFim] = horaFim.split(':').map(Number);
        const diasSelecionadosStr = Object.entries(diasDiarista).filter(([d, v]) => v).map(([d]) => d.replace('d', '')).join(',');
        const diasPermitidos = diasSelecionadosStr.split(',').map(Number);
        
        while (dataAtual <= dataFinal) {
          if (diasPermitidos.includes(dataAtual.getDay())) {
            const inicioIso = dataAtual.toISOString();
            const fimObj = new Date(dataAtual);
            fimObj.setHours(hFim, mFim, 0, 0);
            if (fimObj <= dataAtual) fimObj.setDate(fimObj.getDate() + 1);

            arrayDePlantoes.push({
              escala_id: escalaCriada.id,
              usuario_id: user.id,
              local_id: localId,
              data_hora_inicio: inicioIso,
              data_hora_fim: fimObj.toISOString(),
              status: 'Agendado',
              is_extra: false
            });
          }
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      }

      if (!localId)`;
      
  content = content.replace(salvarRegex, newSalvar);
  
  // Add state for diasDiarista
  if (!content.includes('const [diasDiarista, setDiasDiarista]')) {
    content = content.replace("const [regraDiarista, setRegraDiarista] = useState('5x2');", "const [regraDiarista, setRegraDiarista] = useState('5x2');\\n  const [diasDiarista, setDiasDiarista] = useState<{ [key: string]: boolean }>({ d0: false, d1: true, d2: true, d3: true, d4: true, d5: true, d6: false });");
  }
  
  // Replace the Diarista UI
  const diaristaUiRegex = /<div className="form-group">[\s\S]*?<label className="form-label">Dias Trabalhados vs Folga \*<\/label>[\s\S]*?<\/select>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?}\)/;
  
  const newDiaristaUi = `<div className="form-group">
            <label className="form-label">Dias da Semana Trabalhados *</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {[
                  { id: 'd1', label: 'Seg' }, { id: 'd2', label: 'Ter' }, { id: 'd3', label: 'Qua' },
                  { id: 'd4', label: 'Qui' }, { id: 'd5', label: 'Sex' }, { id: 'd6', label: 'Sáb' }, { id: 'd0', label: 'Dom' }
                ].map(d => (
                  <button 
                    key={d.id} 
                    className={\`btn \${diasDiarista[d.id] ? 'btn-primary' : ''}\`}
                    style={{ flex: 1, padding: '8px 4px', fontSize: 13, background: !diasDiarista[d.id] ? 'var(--bg-secondary)' : undefined, border: !diasDiarista[d.id] ? '1px solid var(--border-subtle)' : undefined, color: !diasDiarista[d.id] ? 'var(--text-primary)' : undefined }}
                    onClick={() => setDiasDiarista(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
                  >
                    {d.label}
                  </button>
                ))}
            </div>
          </div>
          )}

          <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Data de Término do Ciclo *</label>
              <input type="date" className="form-input" value={dataTerminoSo} onChange={e => setDataTerminoSo(e.target.value)} />
            </div>
            {tipoJornada === 'Diarista' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hora de Término (Saída) *</label>
                <input type="time" className="form-input" value={horaFim} onChange={e => setHoraFim(e.target.value)} />
              </div>
            )}
          </div>`;
          
  content = content.replace(diaristaUiRegex, newDiaristaUi);
  
  // Fix UseEffect for preview
  const useEffectRegex = /setPreview\(gerarProximosPlantoes\(new Date\(dataCompletaISO\), rFinal, 'Diarista', horaFim, 5\)\);/;
  const newUseEffect = `const diasSelecionadosStr = Object.entries(diasDiarista).filter(([d, v]) => v).map(([d]) => d.replace('d', '')).join(',');
          setPreview(gerarProximosPlantoes(new Date(dataCompletaISO), diasSelecionadosStr, 'Diarista', horaFim, 5));`;
  content = content.replace(useEffectRegex, newUseEffect);

  // Fix saving logic "Diarista 5x2" text
  const savingTitleRegex = /regraGravar = \`Diarista \${rDiarista}\`;/;
  const newSavingTitle = `const diasTitle = Object.entries(diasDiarista).filter(([d, v]) => v).map(([d]) => ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][parseInt(d.replace('d',''),10)]).join(', ');
        regraGravar = \`Diarista (\${diasTitle})\`;`;
  content = content.replace(savingTitleRegex, newSavingTitle);
  
  // Fix preview dependencies
  content = content.replace(/tipoJornada, regraDiarista, /g, "tipoJornada, diasDiarista, ");
  
  fs.writeFileSync(path, content, 'utf8');
}


updateCalendario();
updateScaleGenerator();
updateEscalas();

console.log("Patch completed");

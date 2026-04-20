import os
import re

def update_calendario():
    path = "src/app/calendario/page.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_bg = """  const getCellBackground = (ps: PlantaoComLocal[], dia: number) => {
    if (ps.length === 0) return 'transparent';
    const getCor = (p: PlantaoComLocal) => p.is_extra ? '#8b5cf6' : (p.local?.cor_calendario ?? '#4f8ef7');

    if (ps.length === 1) {
      const p = ps[0];
      const dInicio = new Date(p.data_hora_inicio);
      const dFim = new Date(p.data_hora_fim);
      const crossesMidnight = dInicio.getDate() !== dFim.getDate() || dInicio.getMonth() !== dFim.getMonth() || dInicio.getFullYear() !== dFim.getFullYear();
      const cor = getCor(p);

      if (crossesMidnight) {
        if (dInicio.getDate() === dia) return `linear-gradient(to bottom, transparent 50%, ${cor} 50%)`;
        return `linear-gradient(to bottom, ${cor} 50%, transparent 50%)`;
      }
      return cor;
    }

    if (ps.length >= 2) {
      const cor1 = getCor(ps[0]);
      const cor2 = getCor(ps[1]);
      return `linear-gradient(to bottom, ${cor1} 50%, ${cor2} 50%)`;
    }
    return 'transparent';
  };"""

    new_bg = """  const getCellBackground = (ps: PlantaoComLocal[], dia: number) => {
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
      return `linear-gradient(to bottom right, ${cor1} 50%, ${cor2} 50%)`;
    }
    return 'transparent';
  };"""

    content = content.replace(old_bg, new_bg)
    content = content.replace("<h1>Calendário </h1>", "<h1>Calendário</h1>")
    content = content.replace("⟳ Atualizando...", "Atualizando...")
    content = content.replace("Remover Plantão  ", "Remover Plantão")
    content = content.replace("{p.is_extra ? ' ★' : ''}", "{p.is_extra ? ' (Extra)' : ''}")
    content = content.replace("↗", "")
    content = content.replace("❌", "")
    content = content.replace("⏳", "")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def update_escalas():
    path = "src/app/escalas/page.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements for states
    if "const [tipoJornada, setTipoJornada] = useState<'Plantonista' | 'Diarista'>('Plantonista');" not in content:
        content = content.replace(
            "const [regra, setRegra] = useState<Regra>('12x36');",
            "const [regra, setRegra] = useState<Regra>('12x36');\n  const [tipoJornada, setTipoJornada] = useState<'Plantonista' | 'Diarista'>('Plantonista');\n  const [regraDiarista, setRegraDiarista] = useState('5x2');\n  const [diasTrabalhoOutro, setDiasTrabalhoOutro] = useState('');\n  const [diasDescansoOutro, setDiasDescansoOutro] = useState('');\n  const [horaFim, setHoraFim] = useState('18:00');\n  const [dataTerminoSo, setDataTerminoSo] = useState(`${new Date().getFullYear()}-12-31`);\n"
        )
    
    # 1. Update Preview logic mapping inside useEffect
    old_preview_block = """  // Preview das 5 primeiras datas em tempo real (permanece no frontend)
  useEffect(() => {
    if (dataCompletaISO && regraFinal) {
      const hr = parseInt(horasTrabalhoOutro, 10);
      const hd = parseInt(horasDescansoOutro, 10);
      if (regra === 'Outro' && (isNaN(hr) || isNaN(hd) || hr <= 0 || hd < 0)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreview([]);
        return;
      }
      setPreview(gerarProximosPlantoes(new Date(dataCompletaISO), regraFinal, 5));
    } else {
      setPreview([]);
    }
  }, [dataCompletaISO, regraFinal, regra, horasTrabalhoOutro, horasDescansoOutro]);"""

    new_preview_block = """  // Preview das 5 primeiras datas em tempo real
  useEffect(() => {
    if (dataCompletaISO) {
      if (tipoJornada === 'Plantonista') {
          const hr = parseInt(horasTrabalhoOutro, 10);
          const hd = parseInt(horasDescansoOutro, 10);
          if (regra === 'Outro' && (isNaN(hr) || isNaN(hd) || hr <= 0 || hd < 0)) {
            setPreview([]);
            return;
          }
          setPreview(gerarProximosPlantoes(new Date(dataCompletaISO), regraFinal, `Plantonista`, horaFim, 5));
      } else {
          const rFinal = regraDiarista === 'Outro' ? `${diasTrabalhoOutro}x${diasDescansoOutro}` : regraDiarista;
          const [diasTrab, diasDesc] = rFinal.split('x').map(n => parseInt(n, 10));
          if (regraDiarista === 'Outro' && (isNaN(diasTrab) || isNaN(diasDesc) || diasTrab <= 0 || diasDesc < 0)) {
            setPreview([]);
            return;
          }
          setPreview(gerarProximosPlantoes(new Date(dataCompletaISO), rFinal, `Diarista`, horaFim, 5));
      }
    } else {
      setPreview([]);
    }
  }, [dataCompletaISO, regraFinal, regra, horasTrabalhoOutro, horasDescansoOutro, tipoJornada, regraDiarista, diasTrabalhoOutro, diasDescansoOutro, horaFim]);"""

    content = content.replace(old_preview_block, new_preview_block)

    # 2. Update salvarEscala logic
    old_salvar = """      const parts = regraFinal.split('x');
      const trabalho = parseInt(parts[0], 10) || 12;
      const descanso = parseInt(parts[1], 10) || 36;
      const ciclo = trabalho + descanso;

      const anoAtual = new Date().getFullYear();
      const dataFinal = new Date(anoAtual, 11, 31, 23, 59, 59);
      let dataAtual = new Date(`${dataInicioSo}T${horaInicio}:00`);

      const { data: escalaCriada, error: erroEscala } = await supabase
        .from('escalas')
        .insert({
          usuario_id: user.id,
          local_id: localId,
          data_inicio: dataInicioSo,
          regra: regraFinal
        })
        .select()
        .single();

      if (erroEscala) throw erroEscala;

      const arrayDePlantoes = [];

      while (dataAtual <= dataFinal) {
        const inicioIso = dataAtual.toISOString();
        const fimObj = new Date(dataAtual);
        fimObj.setHours(fimObj.getHours() + trabalho);

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

        dataAtual.setHours(dataAtual.getHours() + ciclo);
      }"""

    new_salvar = """      let regraGravar = regraFinal;
      let trabalhoA = 12;
      let descansoA = 36;
      let cicloA = trabalhoA + descansoA;

      let rDiarista = regraDiarista === 'Outro' ? `${diasTrabalhoOutro}x${diasDescansoOutro}` : regraDiarista;
      const [dTrabalho, dDescanso] = rDiarista.split('x').map(n => parseInt(n, 10));
      
      if (tipoJornada === 'Plantonista') {
        const parts = regraFinal.split('x');
        trabalhoA = parseInt(parts[0], 10) || 12;
        descansoA = parseInt(parts[1], 10) || 36;
        cicloA = trabalhoA + descansoA;
      } else {
        regraGravar = `Diarista ${rDiarista}`;
      }

      const dataFinal = new Date(`${dataTerminoSo}T23:59:59`);
      let dataAtual = new Date(`${dataInicioSo}T${horaInicio}:00`);

      const { data: escalaCriada, error: erroEscala } = await supabase
        .from('escalas')
        .insert({
          usuario_id: user.id,
          local_id: localId,
          data_inicio: dataInicioSo,
          regra: regraGravar
        })
        .select()
        .single();

      if (erroEscala) throw erroEscala;

      const arrayDePlantoes = [];

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
        // Diarista
        const [hFim, mFim] = horaFim.split(':').map(Number);
        const cicloDias = (dTrabalho || 5) + (dDescanso || 2);
        let idx = 0;
        
        while (dataAtual <= dataFinal) {
          if (idx < (dTrabalho || 5)) {
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
          idx = (idx + 1) % cicloDias;
        }
      }"""

    content = content.replace(old_salvar, new_salvar)
    
    # UI Mod - Replace Tipo de Jornada HTML and emojis
    content = content.replace("📆 Dia do 1º Plantão *", "Dia do 1º Plantão *")
    content = content.replace("🔔", "")
    content = content.replace("❌", "")
    content = content.replace("Gera plantões automaticamente até <strong>31/12/{anoAtual}</strong>", "Configure a sua jornada, datas e locais de trabalho")

    tipo_jornada_html = """
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Tipo de Jornada</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className={`btn ${tipoJornada === 'Plantonista' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ flex: 1 }} 
                onClick={() => setTipoJornada('Plantonista')}
              >
                Plantonista
              </button>
              <button 
                className={`btn ${tipoJornada === 'Diarista' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ flex: 1 }} 
                onClick={() => setTipoJornada('Diarista')}
              >
                Diarista
              </button>
            </div>
          </div>
"""

    old_regra_gui = """<div className="form-group">
            <label className="form-label">Regra de Escala *</label>
            <select
              className="form-select"
              value={regra}"""

    new_regra_gui = tipo_jornada_html + """
          {tipoJornada === 'Plantonista' ? (
          <div className="form-group">
            <label className="form-label">Regra de Escala *</label>
            <select
              className="form-select"
              value={regra}"""

    content = content.replace(old_regra_gui, new_regra_gui)

    fechamento_plantonista = """</div>
            )}
          </div>

          <div className="form-group" style={{ """
          
    novo_fechamento = """</div>
            )}
          </div>
          ) : (
          <div className="form-group">
            <label className="form-label">Dias Trabalhados vs Folga *</label>
            <select className="form-select" value={regraDiarista} onChange={e => setRegraDiarista(e.target.value)}>
                <option value="5x2">5 Dias Trabalho / 2 Dias Folga (Ex: Seg-Sex)</option>
                <option value="6x1">6 Dias Trabalho / 1 Dia Folga</option>
                <option value="Outro">Outro (Personalizado)</option>
            </select>
            {regraDiarista === 'Outro' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dias Seq. Trabalho</label>
                  <input type="number" min="1" className="form-input" value={diasTrabalhoOutro} onChange={e => setDiasTrabalhoOutro(e.target.value)} placeholder="Ex: 4" style={{ marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dias Seq. Folga</label>
                  <input type="number" min="1" className="form-input" value={diasDescansoOutro} onChange={e => setDiasDescansoOutro(e.target.value)} placeholder="Ex: 3" style={{ marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', width: '100%' }} />
                </div>
              </div>
            )}
          </div>
          )}

          <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
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
          </div>

          <div className="form-group" style={{ """
          
    content = content.replace(fechamento_plantonista, novo_fechamento)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def update_scale_generator():
    path = "src/lib/scale-generator.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        
    old_fun = """export function gerarProximosPlantoes(
  dataInicio: Date,
  regra: Regra,
  quantidade: number = 5
): SlotPlantao[] {
  const { duracaoTrabalho, cicloHoras } = parseRegra(regra);
  const slots: SlotPlantao[] = [];

  const cursor = new Date(dataInicio);

  for (let i = 0; i < quantidade; i++) {
    const inicio = new Date(cursor);
    const fim = new Date(cursor);
    fim.setHours(fim.getHours() + duracaoTrabalho);

    slots.push({ inicio, fim });

    cursor.setHours(cursor.getHours() + cicloHoras);
  }

  return slots;
}"""

    new_fun = """export function gerarProximosPlantoes(
  dataInicio: Date,
  regra: Regra,
  tipoJornada: string = 'Plantonista',
  horaFim: string = '18:00',
  quantidade: number = 5
): SlotPlantao[] {
  const slots: SlotPlantao[] = [];
  const cursor = new Date(dataInicio);

  if (tipoJornada === 'Plantonista') {
    const parts = regra.split('x');
    const duracaoTrabalho = parseInt(parts[0], 10);
    const duracaoDescanso = parseInt(parts[1], 10);
    const cicloHoras = duracaoTrabalho + duracaoDescanso;

    for (let i = 0; i < quantidade; i++) {
      const inicio = new Date(cursor);
      const fim = new Date(cursor);
      fim.setHours(fim.getHours() + duracaoTrabalho);
      slots.push({ inicio, fim });
      cursor.setHours(cursor.getHours() + cicloHoras);
    }
  } else {
    const [dTrabalho, dDescanso] = regra.split('x').map(n => parseInt(n, 10));
    const [hFim, mFim] = horaFim.split(':').map(Number);
    const cicloDias = (dTrabalho || 5) + (dDescanso || 2);
    let idx = 0;
    
    while (slots.length < quantidade) {
      if (idx < (dTrabalho || 5)) {
        const inicio = new Date(cursor);
        const fim = new Date(cursor);
        fim.setHours(hFim, mFim, 0, 0);
        if (fim <= inicio) fim.setDate(fim.getDate() + 1);
        slots.push({ inicio, fim });
      }
      cursor.setDate(cursor.getDate() + 1);
      idx = (idx + 1) % cicloDias;
    }
  }

  return slots;
}"""
    content = content.replace(old_fun, new_fun)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


# Execute
try:
    update_calendario()
    print("Calendario updated")
    update_escalas()
    print("Escalas updated")
    update_scale_generator()
    print("Scale generator updated")
except Exception as e:
    print("ERROR:", e)

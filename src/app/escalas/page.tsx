'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, LocalTrabalho } from '../../lib/supabase';
import { gerarProximosPlantoes, SlotPlantao } from '../../lib/scale-generator';

const CORES_PRESET = [
  '#4f8ef7', '#7c6af7', '#22d3b5', '#f97316',
  '#ef4444', '#22c55e', '#f59e0b', '#ec4899',
];

const REGRAS_PADRAO = [
  { value: '12x36', label: '12h Trabalhadas / 36h Descanso' },
  { value: '24x48', label: '24h Trabalhadas / 48h Descanso' },
  { value: '24x72', label: '24h Trabalhadas / 72h Descanso' },
  { value: 'Outro', label: 'Outro (Personalizado)' },
] as const;
type Regra = string;

interface Toast { msg: string; type: 'success' | 'error' }
interface ResultadoAPI {
  success: boolean;
  escala_id?: string;
  total_plantoes?: number;
  periodo_ate?: string;
  error?: string;
  com_conflito?: boolean;
}
interface ConflitoDados {
  conflito: true;
  total_conflitos: number;
  exemplos: Array<{ inicio: string; fim: string }>;
  message: string;
}
interface EscalaAtiva {
  id: string;
  regra: string;
  data_inicio: string;
  local?: { nome: string; cor_calendario: string };
}

const DESCRICAO_REGRA: Record<string, string> = {
  '12x36': '12h trabalhadas + 36h de folga (ciclo 48h)',
  '24x48': '24h trabalhadas + 48h de folga (ciclo 72h)',
  '24x72': '24h trabalhadas + 72h de folga (ciclo 96h)',
  'Outro': 'Personalize suas horas de trabalho e folga',
};

export default function EscalasPage() {
  const [locais, setLocais] = useState<LocalTrabalho[]>([]);
  const [localId, setLocalId] = useState('');
  const [dataInicioSo, setDataInicioSo] = useState('');
  const [horaInicio, setHoraInicio] = useState('07:00'); // valor padrão comum para plantões
  const [regra, setRegra] = useState<Regra>('12x36');
  const [isCustomRule, setIsCustomRule] = useState(false);
  const [horasTrabalhoOutro, setHorasTrabalhoOutro] = useState('');
  const [horasDescansoOutro, setHorasDescansoOutro] = useState('');

  const [isCreatingLocal, setIsCreatingLocal] = useState(false);
  const [novoLocalNome, setNovoLocalNome] = useState('');
  const [novoLocalIsHomeCare, setNovoLocalIsHomeCare] = useState(false);
  const [novoLocalCor, setNovoLocalCor] = useState(CORES_PRESET[0]);
  const [novoLocalEndereco, setNovoLocalEndereco] = useState('');
  const [savingLocal, setSavingLocal] = useState(false);

  const [preview, setPreview] = useState<SlotPlantao[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoAPI | null>(null);

  // Estados de conflito
  const [pendingConflito, setPendingConflito] = useState<ConflitoDados | null>(null);
  const [pendingPayload, setPendingPayload] = useState<{ data_inicio: string; regra: string; local_id: string } | null>(null);

  // Estados de gestão de escalas
  const [escalasAtivas, setEscalasAtivas] = useState<EscalaAtiva[]>([]);
  const [menuEscalaId, setMenuEscalaId] = useState<string | null>(null);
  const [modalEncerrar, setModalEncerrar] = useState<{ id: string; nome: string } | null>(null);
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [deletando, setDeletando] = useState(false);
  
  const [showProModal, setShowProModal] = useState(false);
  const isPro = true; // Trava Freemium

  const regraFinal = regra === 'Outro' ? `${horasTrabalhoOutro}x${horasDescansoOutro}` : regra;

  // Computa a data ISO completa baseada na separação de data e hora
  const dataCompletaISO = (dataInicioSo && horaInicio) ? `${dataInicioSo}T${horaInicio}:00` : '';

  const fetchLocais = useCallback(async () => {
    const { data } = await supabase.from('locais_trabalho').select('*').eq('ativo', true).order('nome');
    setLocais((data as LocalTrabalho[]) ?? []);
  }, []);

  const fetchEscalas = useCallback(async () => {
    const { data } = await supabase
      .from('escalas')
      .select('id, regra, data_inicio, local:locais_trabalho(nome, cor_calendario)')
      .order('created_at', { ascending: false });
    setEscalasAtivas((data as unknown as EscalaAtiva[]) ?? []);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLocais(); fetchEscalas(); }, [fetchLocais, fetchEscalas]);


  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Preview das 5 primeiras datas em tempo real (permanece no frontend)
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
  }, [dataCompletaISO, regraFinal, regra, horasTrabalhoOutro, horasDescansoOutro]);

  const salvarNovoLocal = async () => {
    if (!novoLocalNome.trim()) { showToast('Informe o nome do local.', 'error'); return; }
    
    if (!isPro) {
      setSavingLocal(true);
      const { count } = await supabase.from('locais_trabalho').select('*', { count: 'exact', head: true });
      if (count !== null && count >= 2) {
        setShowProModal(true);
        setSavingLocal(false);
        return;
      }
    } else {
      setSavingLocal(true);
    }
    
    const { data, error } = await supabase.from('locais_trabalho').insert({
      nome: novoLocalNome.trim(),
      cor_calendario: novoLocalCor,
      endereco: novoLocalIsHomeCare ? null : novoLocalEndereco.trim(),
      is_home_care: novoLocalIsHomeCare
    }).select().single();

    if (error) {
      showToast('Erro ao criar local: ' + error.message, 'error');
    } else if (data) {
      setLocais(prev => [...prev, data as LocalTrabalho].sort((a, b) => a.nome.localeCompare(b.nome)));
      setLocalId(data.id);
      setIsCreatingLocal(false);
      setNovoLocalNome('');
      setNovoLocalIsHomeCare(false);
      setNovoLocalCor(CORES_PRESET[0]);
      setNovoLocalEndereco('');
      showToast('Local criado e selecionado!', 'success');
    }
    setSavingLocal(false);
  };

  const salvarEscala = async (forcar_conflito = false) => {
    if (!localId || !dataInicioSo || !horaInicio) {
      showToast('Preencha o Local, o Dia e a Hora do plantão.', 'error');
      return;
    }

    setSaving(true);
    setUltimoResultado(null);

    const payload = {
      data_inicio: new Date(dataCompletaISO).toISOString(),
      regra: regraFinal,
      local_id: localId,
      ...(forcar_conflito && { forcar_conflito: true }),
    };

    try {
      const response = await fetch('/api/escalas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resultado = await response.json();

      // ── CONFLITO DETECTADO (409) ──
      if (response.status === 409 && resultado.conflito) {
        setPendingConflito(resultado as ConflitoDados);
        setPendingPayload({ data_inicio: payload.data_inicio, regra: payload.regra, local_id: payload.local_id });
        setSaving(false);
        return;
      }

      if (!response.ok || !resultado.success) {
        showToast('❌ Erro: ' + (resultado.error ?? 'Falha ao criar escala.'), 'error');
      } else {
        const sufixo = resultado.com_conflito ? ' (com sobreposição confirmada)' : '';
        showToast(`✅ ${resultado.total_plantoes} plantões gerados até ${resultado.periodo_ate}!${sufixo}`, 'success');
        setUltimoResultado(resultado as ResultadoAPI);
        window.dispatchEvent(new CustomEvent('plantoes-atualizados'));
        setLocalId('');
        setDataInicioSo('');
        setHoraInicio('07:00');
        setRegra('12x36');
        setPreview([]);
        fetchEscalas();
      }
    } catch (err) {
      showToast('❌ Erro de conexão com o servidor.', 'error');
      console.error(err);
    }

    setSaving(false);
  };

  const confirmarConflito = async () => {
    if (!pendingPayload) return;
    setPendingConflito(null);
    await salvarEscala(true);
  };

  const excluirEscala = async (id: string, modo: 'completo' | 'encerrar_em', dataCorte?: string) => {
    setDeletando(true);
    try {
      const response = await fetch(`/api/escalas/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo, ...(dataCorte && { data_encerramento: new Date(dataCorte).toISOString() }) }),
      });
      const resultado = await response.json();
      if (!response.ok) {
        showToast('❌ ' + (resultado.error ?? 'Erro ao excluir escala.'), 'error');
      } else {
        const msg = modo === 'completo'
          ? '🗑️ Escala excluída completamente!'
          : `✂️ Escala encerrada em ${new Date(dataCorte!).toLocaleDateString('pt-BR')}. ${resultado.plantoes_removidos} plantões futuros removidos.`;
        showToast(msg, 'success');
        setModalEncerrar(null);
        setDataEncerramento('');
        fetchEscalas();
        window.dispatchEvent(new CustomEvent('plantoes-atualizados'));
      }
    } catch {
      showToast('❌ Erro de conexão.', 'error');
    }
    setDeletando(false);
    setMenuEscalaId(null);
  };

  const duracaoHoras = (r: string) => parseInt(r.split('x')[0], 10) || 12;
  const anoAtual = new Date().getFullYear();

  return (
    <>
      <div className="page-header">
        <h1>Configurar Escala ⚙️</h1>
        <p>Gera plantões automaticamente até <strong>31/12/{anoAtual}</strong></p>
      </div>

      <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Formulário */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Nova Escala</h2>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Local de Trabalho *</label>
              <button
                type="button"
                onClick={() => setIsCreatingLocal(!isCreatingLocal)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                {isCreatingLocal ? 'Cancelar' : '➕ Criar Novo'}
              </button>
            </div>

            {isCreatingLocal ? (
              <div style={{ padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', marginBottom: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome do novo local"
                  value={novoLocalNome}
                  onChange={e => setNovoLocalNome(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    id="homecareCheckbox"
                    checked={novoLocalIsHomeCare}
                    onChange={e => setNovoLocalIsHomeCare(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent-teal)' }}
                  />
                  <label htmlFor="homecareCheckbox" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    É atendimento <strong>Home Care</strong> 🏠
                  </label>
                </div>

                {!novoLocalIsHomeCare && (
                  <div style={{ marginBottom: 12 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Endereço (Opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                      value={novoLocalEndereco}
                      onChange={e => setNovoLocalEndereco(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Cor no Calendário</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {CORES_PRESET.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNovoLocalCor(c)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: c,
                          border: novoLocalCor === c ? '2px solid white' : '2px solid transparent',
                          boxShadow: novoLocalCor === c ? '0 0 0 1px var(--text-primary)' : 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Escolher Cor"
                      />
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={salvarNovoLocal}
                  disabled={savingLocal}
                  style={{ width: '100%', padding: '6px 12px', fontSize: 13 }}
                >
                  {savingLocal ? '⏳ Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            ) : (
              <>
                <select className="form-select" value={localId} onChange={e => setLocalId(e.target.value)}>
                  <option value="">Selecione um local...</option>
                  {locais.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
                {locais.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Ainda não há locais. Clique em &quot;Criar Novo&quot; acima.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="form-group mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                📆 Dia do 1º Plantão *
              </label>
              <input
                type="date"
                className="form-input"
                style={{ cursor: 'pointer' }}
                value={dataInicioSo}
                onChange={e => setDataInicioSo(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                ⏰ Horário de Início *
              </label>
              <input
                type="time"
                className="form-input"
                style={{ cursor: 'pointer' }}
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Regra de Escala *</label>
            <select
              className="form-select"
              value={regra}
              onChange={e => {
                const v = e.target.value;
                setRegra(v);
                setIsCustomRule(v === 'Outro');
                if (v !== 'Outro') { setHorasTrabalhoOutro(''); setHorasDescansoOutro(''); }
              }}
            >
              {REGRAS_PADRAO.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: 'var(--accent-teal)', marginTop: 6, fontWeight: 500 }}>
              {DESCRICAO_REGRA[regra] ?? 'Personalize suas horas de trabalho e folga'}
            </p>

            {isCustomRule && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginTop: 12,
                  padding: 16,
                  background: 'var(--bg-secondary)',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  animation: 'fadeInDown 0.2s ease',
                }}
              >
                <div>
                  <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Horas Trabalhadas</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={horasTrabalhoOutro}
                    onChange={e => setHorasTrabalhoOutro(e.target.value)}
                    placeholder="Ex: 12"
                    style={{ marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Horas de Descanso</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={horasDescansoOutro}
                    onChange={e => setHorasDescansoOutro(e.target.value)}
                    placeholder="Ex: 60"
                    style={{ marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <p style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Ciclo total: {(parseInt(horasTrabalhoOutro,10)||0) + (parseInt(horasDescansoOutro,10)||0)}h &nbsp;·&nbsp; Formato gerado: <strong style={{ color: 'var(--text-secondary)' }}>{horasTrabalhoOutro||'?'}x{horasDescansoOutro||'?'}</strong>
                </p>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={() => salvarEscala()}
            disabled={saving || (isCustomRule && (!(parseInt(horasTrabalhoOutro,10) > 0) || !(parseInt(horasDescansoOutro,10) > 0)))}
          >
            {saving ? '⏳ Processando no servidor...' : '🚀 Criar Escala e Gerar Plantões'}
          </button>

          {/* Resultado da última geração */}
          {ultimoResultado?.success && (
            <div style={{
              marginTop: 16,
              padding: '14px 16px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
            }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: 6 }}>
                ✅ Escala criada com sucesso!
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <span>📋 <strong>{ultimoResultado.total_plantoes}</strong> plantões gerados</span><br />
                <span>📅 Até <strong>{ultimoResultado.periodo_ate}</strong></span><br />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  O Calendário foi atualizado automaticamente.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          <div className="card" style={{ height: 'fit-content' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 4, fontSize: 16 }}>Preview das Próximas Datas</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              As 5 primeiras datas projetadas — calculadas em tempo real
            </p>

            {preview.length > 0 ? (
              <div className="dates-preview">
                <div className="dates-preview-title">
                  📆 Próximas 5 ocorrências — {regra}
                </div>
                {preview.map((slot, i) => (
                  <div key={i} className="date-preview-item" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 6px', borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="date-preview-num" style={{ fontWeight: 800, color: 'var(--text-muted)' }}>#{i + 1}</div>
                      <div className="date-preview-date" style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        {new Date(slot.inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {new Date(slot.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="date-preview-duration" style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {duracaoHoras(regraFinal)}h
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span>🔁</span>
                  <span>Padrão continua até <strong style={{ color: 'var(--text-secondary)' }}>31/12/{anoAtual}</strong> ao salvar</span>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-icon">🔍</div>
                <p>Preencha os campos ao lado para ver o preview.</p>
              </div>
            )}
          </div>

          {/* Info sobre o backend */}
          <div className="card" style={{
            marginTop: 16,
            background: 'rgba(79,142,247,0.05)',
            border: '1px solid rgba(79,142,247,0.15)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--accent-blue)' }}>⚡ Processamento no servidor</strong><br />
              O cálculo e a inserção são realizados via API Route Handler (backend) usando a Service Role Key,
              garantindo segurança transacional e performance na geração de dezenas a centenas de plantões.
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SEÇÃO: Minhas Escalas Ativas
         ══════════════════════════════════════════ */}
      {escalasAtivas.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📋 Minhas Escalas Ativas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {escalasAtivas.map(e => (
              <div key={e.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: e.local?.cor_calendario ?? '#4f8ef7', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{e.local?.nome ?? 'Local desconhecido'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {e.regra} · a partir de {new Date(e.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setMenuEscalaId(menuEscalaId === e.id ? null : e.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 6 }}
                    title="Opções da escala"
                  >⋮</button>
                  {menuEscalaId === e.id && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 200, overflow: 'hidden' }}>
                      <button
                        onClick={() => { if (confirm('Tem certeza? Isso apagará TODOS os plantões desta escala, incluindo os passados.')) excluirEscala(e.id, 'completo'); }}
                        style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#ef4444', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                      >🗑️ Excluir Escala Completa</button>
                      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
                      <button
                        onClick={() => { setModalEncerrar({ id: e.id, nome: e.local?.nome ?? 'Escala' }); setMenuEscalaId(null); }}
                        style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                      >✂️ Encerrar na Data X</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ MODAL: Conflito de Horário (Amarelo) ══ */}
      {pendingConflito && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', border: '2px solid #f59e0b', boxShadow: '0 20px 40px rgba(245,158,11,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#92400e' }}>Conflito de Horário Detectado</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
              {pendingConflito.message}
            </p>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Exemplos de sobreposição:</div>
              {pendingConflito.exemplos.map((ex, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '3px 0' }}>
                  {new Date(ex.inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} · {new Date(ex.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(ex.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Você já tem um plantão neste horário. Deseja confirmar a duplicidade?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setPendingConflito(null); setPendingPayload(null); }}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: '#f59e0b', borderColor: '#f59e0b' }}
                onClick={confirmarConflito}
                disabled={saving}
              >{saving ? '⏳ Salvando...' : '✅ Confirmar Duplicidade'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Encerrar na Data X ══ */}
      {modalEncerrar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>✂️ Encerrar Escala</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Escolha a data de encerramento para <strong>{modalEncerrar.nome}</strong>.<br />
              Plantões <em>a partir desta data</em> serão removidos. O histórico anterior é preservado.
            </p>
            <div className="form-group">
              <label className="form-label">Data de encerramento</label>
              <input
                type="date"
                className="form-input"
                value={dataEncerramento}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDataEncerramento(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setModalEncerrar(null); setDataEncerramento(''); }}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={!dataEncerramento || deletando}
                onClick={() => excluirEscala(modalEncerrar.id, 'encerrar_em', dataEncerramento)}
              >{deletando ? '⏳ Encerrando...' : 'Confirmar Encerramento'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRO PAYWALL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⭐</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Upgrade para o Pro</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Você atingiu o limite de 2 locais do plano gratuito. Assine o Pro para gerenciar hospitais ilimitados!
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowProModal(false)}>Voltar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none' }} onClick={() => setShowProModal(false)}>Assinar Pro</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}

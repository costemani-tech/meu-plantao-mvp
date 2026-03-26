'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, LocalTrabalho } from '../../lib/supabase';
import { gerarProximosPlantoes, formatarDataHora, SlotPlantao } from '../../lib/scale-generator';

const CORES_PRESET = [
  '#4f8ef7', '#7c6af7', '#22d3b5', '#f97316',
  '#ef4444', '#22c55e', '#f59e0b', '#ec4899',
];

const REGRAS = ['12x36', '24x48', '24x72', 'Outro'] as const;
type Regra = typeof REGRAS[number] | string;

interface Toast { msg: string; type: 'success' | 'error' }
interface ResultadoAPI {
  success: boolean;
  escala_id?: string;
  total_plantoes?: number;
  periodo_ate?: string;
  error?: string;
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
  const [horasTrabalhoOutro, setHorasTrabalhoOutro] = useState('12');
  const [horasDescansoOutro, setHorasDescansoOutro] = useState('60');

  const [isCreatingLocal, setIsCreatingLocal] = useState(false);
  const [novoLocalNome, setNovoLocalNome] = useState('');
  const [novoLocalIsHomeCare, setNovoLocalIsHomeCare] = useState(false);
  const [novoLocalCor, setNovoLocalCor] = useState(CORES_PRESET[0]);
  const [savingLocal, setSavingLocal] = useState(false);

  const [preview, setPreview] = useState<SlotPlantao[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoAPI | null>(null);

  const regraFinal = regra === 'Outro' ? `${horasTrabalhoOutro}x${horasDescansoOutro}` : regra;

  // Computa a data ISO completa baseada na separação de data e hora
  const dataCompletaISO = (dataInicioSo && horaInicio) ? `${dataInicioSo}T${horaInicio}:00` : '';

  const fetchLocais = useCallback(async () => {
    const { data } = await supabase.from('locais_trabalho').select('*').order('nome');
    setLocais((data as LocalTrabalho[]) ?? []);
  }, []);

  useEffect(() => { fetchLocais(); }, [fetchLocais]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Preview das 5 primeiras datas em tempo real (permanece no frontend)
  useEffect(() => {
    if (dataCompletaISO && regraFinal) {
      // Evita NaN no preview se o usuário não digitou horas válidas
      const hr = parseInt(horasTrabalhoOutro, 10);
      const hd = parseInt(horasDescansoOutro, 10);
      if (regra === 'Outro' && (isNaN(hr) || isNaN(hd) || hr <= 0 || hd < 0)) {
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
    setSavingLocal(true);
    const { data, error } = await supabase.from('locais_trabalho').insert({
      nome: novoLocalNome.trim(),
      cor_calendario: novoLocalCor,
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
      showToast('Local criado e selecionado!', 'success');
    }
    setSavingLocal(false);
  };

  const salvarEscala = async () => {
    if (!localId || !dataInicioSo || !horaInicio) {
      showToast('Preencha o Local, o Dia e a Hora do plantão.', 'error');
      return;
    }

    setSaving(true);
    setUltimoResultado(null);

    // ──────────────────────────────────────────────────
    // Chama o Route Handler backend (POST /api/escalas)
    // O cálculo e o insert ocorrem server-side com
    // validação JWT (Cookie SSR) ativada.
    // ──────────────────────────────────────────────────
    try {
      const response = await fetch('/api/escalas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_inicio: new Date(dataCompletaISO).toISOString(),
          regra: regraFinal,
          local_id: localId,
        }),
      });

      const resultado: ResultadoAPI = await response.json();

      if (!response.ok || !resultado.success) {
        showToast('❌ Erro: ' + (resultado.error ?? 'Falha ao criar escala.'), 'error');
      } else {
        showToast(
          `✅ ${resultado.total_plantoes} plantões gerados até ${resultado.periodo_ate}!`,
          'success'
        );
        setUltimoResultado(resultado);

        // Notifica outras páginas (ex: Calendário) para refazer o fetch
        window.dispatchEvent(new CustomEvent('plantoes-atualizados'));

        // Limpa o formulário
        setLocalId('');
        setDataInicioSo('');
        setHoraInicio('07:00');
        setRegra('12x36');
        setPreview([]);
      }
    } catch (err) {
      showToast('❌ Erro de conexão com o servidor. Verifique o .env.local.', 'error');
      console.error(err);
    }

    setSaving(false);
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
                    Ainda não há locais. Clique em "Criar Novo" acima.
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
              onChange={e => setRegra(e.target.value)}
            >
              {REGRAS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: 'var(--accent-teal)', marginTop: 6, fontWeight: 500 }}>
              {DESCRICAO_REGRA[regra]}
            </p>

            {regra === 'Outro' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Trabalho (horas)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={horasTrabalhoOutro}
                    onChange={e => setHorasTrabalhoOutro(e.target.value)}
                    placeholder="Ex: 12"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Descanso (horas)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={horasDescansoOutro}
                    onChange={e => setHorasDescansoOutro(e.target.value)}
                    placeholder="Ex: 60"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={salvarEscala}
            disabled={saving}
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

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}

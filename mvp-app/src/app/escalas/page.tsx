'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, LocalTrabalho } from '../../lib/supabase';
import { gerarPlantoesParaPeriodo, gerarProximosPlantoes, formatarDataHora, SlotPlantao } from '../../lib/scale-generator';

const REGRAS = ['12x36', '24x48', '24x72'] as const;

interface Toast { msg: string; type: 'success' | 'error' }

export default function EscalasPage() {
  const [locais, setLocais] = useState<LocalTrabalho[]>([]);
  const [localId, setLocalId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [regra, setRegra] = useState<typeof REGRAS[number]>('12x36');
  const [preview, setPreview] = useState<SlotPlantao[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const fetchLocais = useCallback(async () => {
    const { data } = await supabase.from('locais_trabalho').select('*').order('nome');
    setLocais((data as LocalTrabalho[]) ?? []);
  }, []);

  useEffect(() => { fetchLocais(); }, [fetchLocais]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Gera o preview das 5 primeiras datas sempre que os campos mudam
  useEffect(() => {
    if (dataInicio && regra) {
      const slots = gerarProximosPlantoes(new Date(dataInicio), regra, 5);
      setPreview(slots);
    } else {
      setPreview([]);
    }
  }, [dataInicio, regra]);

  const salvarEscala = async () => {
    if (!localId || !dataInicio) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    setSaving(true);

    // Busca o usuário (MVP: único usuário, pega o primeiro)
    const { data: usuarios } = await supabase.from('usuarios').select('id').limit(1);
    const usuarioId = usuarios?.[0]?.id;

    if (!usuarioId) {
      showToast('Nenhum usuário cadastrado. Crie um local e usuário primeiro.', 'error');
      setSaving(false);
      return;
    }

    // Cria a escala (template)
    const { data: escala, error: erroEscala } = await supabase
      .from('escalas')
      .insert({ usuario_id: usuarioId, local_id: localId, data_inicio: dataInicio, regra })
      .select()
      .single();

    if (erroEscala || !escala) {
      showToast('Erro ao criar escala: ' + erroEscala?.message, 'error');
      setSaving(false);
      return;
    }

    // Gera os plantões dos próximos 90 dias
    const slots = gerarPlantoesParaPeriodo(new Date(dataInicio), regra, 90);
    const plantoes = slots.map(s => ({
      escala_id: escala.id,
      usuario_id: usuarioId,
      local_id: localId,
      data_hora_inicio: s.inicio.toISOString(),
      data_hora_fim: s.fim.toISOString(),
      status: 'Agendado',
    }));

    const { error: erroPlantoes } = await supabase.from('plantoes').insert(plantoes);

    if (erroPlantoes) {
      showToast('Escala criada, mas erro ao gerar plantões: ' + erroPlantoes.message, 'error');
    } else {
      showToast(`✅ Escala criada! ${plantoes.length} plantões gerados para os próximos 90 dias.`, 'success');
      setLocalId('');
      setDataInicio('');
      setRegra('12x36');
      setPreview([]);
    }

    setSaving(false);
  };

  const duracaoHoras = (regra: string) => {
    if (regra === '12x36') return 12;
    return 24;
  };

  return (
    <>
      <div className="page-header">
        <h1>Configurar Escala ⚙️</h1>
        <p>Crie uma escala recorrente e visualize as datas geradas</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Nova Escala</h2>

          <div className="form-group">
            <label className="form-label">Local de Trabalho *</label>
            <select
              className="form-select"
              value={localId}
              onChange={e => setLocalId(e.target.value)}
            >
              <option value="">Selecione um local...</option>
              {locais.map(l => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
            {locais.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Nenhum local cadastrado. Vá para a página <strong>Locais</strong> primeiro.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Data e Hora de Início *</label>
            <input
              type="datetime-local"
              className="form-input"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Regra de Escala *</label>
            <select className="form-select" value={regra} onChange={e => setRegra(e.target.value as typeof REGRAS[number])}>
              {REGRAS.map(r => (
                <option key={r} value={r}>{r} horas</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={salvarEscala}
            disabled={saving}
          >
            {saving ? '⏳ Salvando...' : '🚀 Criar Escala e Gerar Plantões'}
          </button>
        </div>

        <div>
          <div className="card" style={{ height: 'fit-content' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 4, fontSize: 16 }}>Preview das Próximas Datas</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              As 5 primeiras datas projetadas pela regra selecionada
            </p>

            {preview.length > 0 ? (
              <div className="dates-preview">
                <div className="dates-preview-title">
                  📆 Próximas 5 ocorrências — {regra}
                </div>
                {preview.map((slot, i) => (
                  <div key={i} className="date-preview-item">
                    <div className="date-preview-num">#{i + 1}</div>
                    <div className="date-preview-date">
                      {formatarDataHora(slot.inicio)}
                    </div>
                    <div className="date-preview-duration">{duracaoHoras(regra)}h</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-icon">🔍</div>
                <p>Preencha os campos ao lado para ver o preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

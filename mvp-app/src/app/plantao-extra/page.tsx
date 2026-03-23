'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, LocalTrabalho, Plantao } from '../../lib/supabase';
import { verificarConflitos, Conflito } from '../../lib/conflict-resolver';

interface Toast { msg: string; type: 'success' | 'error' }

export default function PlantaoExtraPage() {
  const [locais, setLocais] = useState<LocalTrabalho[]>([]);
  const [localId, setLocalId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [conflitos, setConflitos] = useState<Conflito[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDados = useCallback(async () => {
    const [{ data: ls }, { data: us }] = await Promise.all([
      supabase.from('locais_trabalho').select('*').order('nome'),
      supabase.from('usuarios').select('id').limit(1),
    ]);
    setLocais((ls as LocalTrabalho[]) ?? []);
    if (us && us.length > 0) setUsuarioId(us[0].id);
  }, []);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const verificarEAdicionar = async () => {
    if (!localId || !dataInicio || !dataFim) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }
    if (!usuarioId) {
      showToast('Nenhum usuário encontrado. Cadastre um usuário primeiro.', 'error');
      return;
    }

    const novoInicio = new Date(dataInicio);
    const novoFim = new Date(dataFim);

    if (novoFim <= novoInicio) {
      showToast('A data de fim deve ser posterior à de início.', 'error');
      return;
    }

    setSaving(true);

    // Busca plantões existentes do usuário que podem conflitar
    const { data: plantoesExistentes } = await supabase
      .from('plantoes')
      .select('*, local:locais_trabalho(*)')
      .eq('usuario_id', usuarioId)
      .neq('status', 'Cancelado')
      .gte('data_hora_fim', novoInicio.toISOString())
      .lte('data_hora_inicio', novoFim.toISOString());

    const conflicts = verificarConflitos(novoInicio, novoFim, (plantoesExistentes as Plantao[]) ?? []);

    setSaving(false);

    if (conflicts.length > 0) {
      setConflitos(conflicts);
      setShowModal(true);
    } else {
      await salvarPlantaoExtra();
    }
  };

  const salvarPlantaoExtra = async (cancelarConflitantes = false) => {
    if (!usuarioId) return;
    setSaving(true);

    // Cancela plantões conflitantes se o usuário escolheu
    if (cancelarConflitantes && conflitos.length > 0) {
      const ids = conflitos.map(c => c.plantao.id);
      await supabase.from('plantoes').update({ status: 'Cancelado' }).in('id', ids);
    }

    const { error } = await supabase.from('plantoes').insert({
      escala_id: null,
      usuario_id: usuarioId,
      local_id: localId,
      data_hora_inicio: new Date(dataInicio).toISOString(),
      data_hora_fim: new Date(dataFim).toISOString(),
      status: 'Agendado',
    });

    if (error) {
      showToast('Erro ao salvar plantão extra: ' + error.message, 'error');
    } else {
      showToast('✅ Plantão extra criado com sucesso!', 'success');
      setLocalId(''); setDataInicio(''); setDataFim('');
    }

    setShowModal(false);
    setConflitos([]);
    setSaving(false);
  };

  return (
    <>
      <div className="page-header">
        <h1>Plantão Extra ➕</h1>
        <p>Adicione um plantão avulso com verificação automática de conflitos</p>
      </div>

      <div style={{ maxWidth: 540 }}>
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Novo Plantão Extra</h2>

          <div className="form-group">
            <label className="form-label">Local de Trabalho *</label>
            <select className="form-select" value={localId} onChange={e => setLocalId(e.target.value)}>
              <option value="">Selecione um local...</option>
              {locais.map(l => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Início do Plantão *</label>
            <input type="datetime-local" className="form-input" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Fim do Plantão *</label>
            <input type="datetime-local" className="form-input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={verificarEAdicionar} disabled={saving}>
            {saving ? '⏳ Verificando...' : '🔍 Verificar e Adicionar'}
          </button>
        </div>

        <div className="card" style={{ marginTop: 20, background: 'rgba(34,211,181,0.06)', border: '1px solid rgba(34,211,181,0.15)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--accent-teal)' }}>🛡️ Como funciona a verificação:</strong><br />
            Antes de adicionar, o sistema verifica se o horário se sobrepõe a qualquer plantão existente. Se houver conflito, você pode <strong>cancelar o plantão existente</strong> ou <strong>ajustar as datas</strong>.
          </div>
        </div>
      </div>

      {/* Modal de conflito */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">
              ⚠️ Conflito de Horário Detectado
            </div>
            <div className="modal-subtitle">
              O novo plantão extra se sobrepõe a {conflitos.length} plantão(ões) existente(s). O que deseja fazer?
            </div>

            {conflitos.map((c, i) => (
              <div key={i} className="conflict-item">
                <div className="conflict-item-text">{c.mensagem}</div>
              </div>
            ))}

            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={() => salvarPlantaoExtra(true)}
                disabled={saving}
              >
                🔄 Cancelar conflitantes e adicionar
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowModal(false); setConflitos([]); }}
              >
                ← Ajustar datas
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
}

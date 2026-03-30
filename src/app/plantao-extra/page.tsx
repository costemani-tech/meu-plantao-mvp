'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, LocalTrabalho } from '../../lib/supabase';

interface Toast { msg: string; type: 'success' | 'error' }

export default function PlantaoExtraPage() {
  const [locais, setLocais] = useState<LocalTrabalho[]>([]);
  const [localId, setLocalId] = useState('');
  
  const [dataPlantao, setDataPlantao] = useState('');
  const [horaInicio, setHoraInicio] = useState('07:00');
  const [horaFim, setHoraFim] = useState('19:00');
  
  const [tipoExtra, setTipoExtra] = useState<'Remunerado' | 'Folga'>('Remunerado');
  const [valorGanho, setValorGanho] = useState('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [conflitoPendente, setConflitoPendente] = useState<{ inicio: string; fim: string } | null>(null);
  const [payloadPendente, setPayloadPendente] = useState<{ inicioIso: string; fimIso: string } | null>(null);

  const isPro = false; // Trava Freemium

  const fetchLocais = useCallback(async () => {
    const { data } = await supabase.from('locais_trabalho').select('*').order('nome');
    setLocais((data as LocalTrabalho[]) ?? []);
  }, []);

  useEffect(() => { fetchLocais(); }, [fetchLocais]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const salvarPlantaoExtra = async (forcarConflito = false) => {
    if (!localId || !dataPlantao || !horaInicio || !horaFim) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }

    setSaving(true);
    
    try {
      const inicioIso = new Date(`${dataPlantao}T${horaInicio}:00`).toISOString();
      let dataFimObj = new Date(`${dataPlantao}T${horaFim}:00`);
      if (horaFim < horaInicio) dataFimObj.setDate(dataFimObj.getDate() + 1);
      const fimIso = dataFimObj.toISOString();

      // ── Verifica Limite Free (Máx 4 Extras/Mês) ──
      if (!isPro) {
        const dataStart = new Date(`${dataPlantao}T00:00:00`);
        const pInicioMes = new Date(dataStart.getFullYear(), dataStart.getMonth(), 1).toISOString();
        const pFimMes = new Date(dataStart.getFullYear(), dataStart.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const { count } = await supabase
          .from('plantoes')
          .select('id', { count: 'exact', head: true })
          .eq('is_extra', true)
          .gte('data_hora_inicio', pInicioMes)
          .lte('data_hora_inicio', pFimMes)
          .neq('status', 'Cancelado');

        if (count && count >= 4) {
          showToast('🔒 O Plano Free permite no máximo 4 Plantões Extras (Avulsos) por mês. Faça o Upgrade!', 'error');
          setSaving(false);
          return;
        }
      }

      // ── Verifica conflito de horário antes de inserir ──
      if (!forcarConflito) {
        const { data: existentes } = await supabase
          .from('plantoes')
          .select('id, data_hora_inicio, data_hora_fim')
          .neq('status', 'Cancelado')
          .lt('data_hora_inicio', fimIso)
          .gt('data_hora_fim', inicioIso);

        if (existentes && existentes.length > 0) {
          setSaving(false);
          setPayloadPendente({ inicioIso, fimIso });
          setConflitoPendente({ inicio: inicioIso, fim: fimIso });
          return;
        }
      }

      const payload = payloadPendente && forcarConflito
        ? { inicioIso: payloadPendente.inicioIso, fimIso: payloadPendente.fimIso }
        : { inicioIso: new Date(`${dataPlantao}T${horaInicio}:00`).toISOString(), fimIso: (() => { let d = new Date(`${dataPlantao}T${horaFim}:00`); if (horaFim < horaInicio) d.setDate(d.getDate()+1); return d.toISOString(); })() };

      const { error } = await supabase.from('plantoes').insert({
        local_id: localId,
        escala_id: null,
        data_hora_inicio: payload.inicioIso,
        data_hora_fim: payload.fimIso,
        is_extra: true,
        status: tipoExtra === 'Folga' ? 'Trocado' : 'Agendado',
        valor_ganho: tipoExtra === 'Remunerado' ? (parseFloat(valorGanho.replace(',', '.')) || 0) : 0
      });

      if (error) throw error;

      // ↓ Notifica o calendário para limpar cache e refazer fetch com is_extra correto
      window.dispatchEvent(new CustomEvent('plantoes-atualizados'));

      showToast('✅ Plantão Extra salvo com sucesso no calendário!', 'success');
      setDataPlantao('');
      setConflitoPendente(null);
      setPayloadPendente(null);

    } catch (err: unknown) {
      showToast('❌ Erro ao salvar: ' + (err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Plantão Extra 💰</h1>
        <p>Cadastre aqui os plantões avulsos, substituições e ganhos extras fora da escala fixa.</p>
      </div>

      <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 500px)', justifyContent: 'start' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ background: 'rgba(34,211,181,0.1)', color: 'var(--accent-teal)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              💸
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Inserir Novo Relato</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Módulo Financeiro</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Local de Trabalho *</label>
            <select className="form-select" value={localId} onChange={e => setLocalId(e.target.value)}>
              <option value="">Onde foi o plantão?</option>
              {locais.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Data do Plantão *</label>
            <input
              type="date"
              className="form-input"
              style={{ cursor: 'pointer' }}
              value={dataPlantao}
              onChange={e => setDataPlantao(e.target.value)}
            />
          </div>

          <div className="form-group mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            <div>
              <label className="form-label" style={{ display: 'flex', gap: 6 }}>
                ▶️ Hora Início *
              </label>
              <input
                type="time"
                className="form-input"
                style={{ cursor: 'pointer' }}
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', gap: 6 }}>
                ⏹️ Hora Fim *
              </label>
              <input
                type="time"
                className="form-input"
                style={{ cursor: 'pointer' }}
                value={horaFim}
                onChange={e => setHoraFim(e.target.value)}
              />
            </div>
          </div>

          {/* Novos Campos de Valor e Tipo */}
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Tipo de Plantão Extra *</label>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer', background: tipoExtra === 'Remunerado' ? 'var(--bg-secondary)' : 'transparent' }}>
                <input type="radio" name="tipoExtra" value="Remunerado" checked={tipoExtra === 'Remunerado'} onChange={() => setTipoExtra('Remunerado')} />
                <span>💰 Remunerado</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer', background: tipoExtra === 'Folga' ? 'var(--bg-secondary)' : 'transparent' }}>
                <input type="radio" name="tipoExtra" value="Folga" checked={tipoExtra === 'Folga'} onChange={() => setTipoExtra('Folga')} />
                <span>🔄 Troca/Folga</span>
              </label>
            </div>
          </div>

          {tipoExtra === 'Remunerado' && (
            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Valor do Plantão (R$)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ex: 1200.00"
                value={valorGanho}
                onChange={e => setValorGanho(e.target.value)}
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '14px', background: 'var(--accent-teal)' }}
            onClick={() => salvarPlantaoExtra()}
            disabled={saving}
          >
            {saving ? '⏳ Inserindo no calendário...' : '💵 Salvar Plantão Avulso'}
          </button>
        </div>
      </div>

      {/* Modal de Conflito para Plantão Extra */}
      {conflitoPendente && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', border: '2px solid #f59e0b', boxShadow: '0 20px 40px rgba(245,158,11,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#92400e' }}>Conflito de Horário</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Você já tem um plantão das <strong>{new Date(conflitoPendente.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong> às <strong>{new Date(conflitoPendente.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong> nesta data.<br/><br/>
              Deseja confirmar a duplicidade mesmo assim?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setConflitoPendente(null); setPayloadPendente(null); }}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: '#f59e0b', borderColor: '#f59e0b' }}
                onClick={() => salvarPlantaoExtra(true)}
                disabled={saving}
              >{saving ? '⏳...' : '✅ Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}

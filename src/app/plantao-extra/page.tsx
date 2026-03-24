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

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const fetchLocais = useCallback(async () => {
    const { data } = await supabase.from('locais_trabalho').select('*').order('nome');
    setLocais((data as LocalTrabalho[]) ?? []);
  }, []);

  useEffect(() => { fetchLocais(); }, [fetchLocais]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const salvarPlantaoExtra = async () => {
    if (!localId || !dataPlantao || !horaInicio || !horaFim) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }

    setSaving(true);
    
    try {
      const inicioIso = new Date(`${dataPlantao}T${horaInicio}:00`).toISOString();
      let dataFimObj = new Date(`${dataPlantao}T${horaFim}:00`);
      
      // Se a hora de fim for menor que a hora de início, assumimos que virou o dia (ex: 19:00 até 07:00)
      if (horaFim < horaInicio) {
        dataFimObj.setDate(dataFimObj.getDate() + 1);
      }
      const fimIso = dataFimObj.toISOString();

      const { error } = await supabase.from('plantoes').insert({
        local_id: localId,
        escala_id: null, // Plantão avulso
        data_hora_inicio: inicioIso,
        data_hora_fim: fimIso,
        is_extra: true,
        status: 'Agendado'
      });

      if (error) throw error;

      showToast('✅ Plantão Extra salvo com sucesso no calendário!', 'success');
      
      // Reseta os inputs mantendo os horários padrão
      setDataPlantao('');
      
    } catch (err: any) {
      showToast('❌ Erro ao salvar: ' + err.message, 'error');
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

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '14px', background: 'var(--accent-teal)' }}
            onClick={salvarPlantaoExtra}
            disabled={saving}
          >
            {saving ? '⏳ Inserindo no calendário...' : '💵 Salvar Plantão Avulso'}
          </button>
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}

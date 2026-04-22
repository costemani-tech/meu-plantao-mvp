'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, LocalTrabalho, isUserPro } from '../../lib/supabase';
import { toast } from 'sonner';

export default function PlantaoExtraPage() {
  const [locais, setLocais] = useState<LocalTrabalho[]>([]);
  const [localId, setLocalId] = useState('');
  
  const [dataPlantao, setDataPlantao] = useState('');
  const [horaInicio, setHoraInicio] = useState('07:00');
  const [horaFim, setHoraFim] = useState('19:00');
  
  const [tipoExtra, setTipoExtra] = useState<'Remunerado' | 'Troca'>('Remunerado');
  const [valorGanho, setValorGanho] = useState('');

  const [saving, setSaving] = useState(false);
  const [conflitoPendente, setConflitoPendente] = useState<{ inicio: string; fim: string } | null>(null);
  const [payloadPendente, setPayloadPendente] = useState<{ inicioIso: string; fimIso: string } | null>(null);

  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [limiteExtrasAtingido, setLimiteExtrasAtingido] = useState(false);

  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsPro(false); return; }
      const userIsPro = isUserPro(user.email);
      setIsPro(userIsPro);

      if (!userIsPro) {
        const dataStart = new Date();
        const pInicioMes = new Date(dataStart.getFullYear(), dataStart.getMonth(), 1).toISOString();
        const pFimMes = new Date(dataStart.getFullYear(), dataStart.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const { count } = await supabase
          .from('plantoes')
          .select('id', { count: 'exact', head: true })
          .eq('usuario_id', user.id)
          .eq('is_extra', true)
          .gte('data_hora_inicio', pInicioMes)
          .lte('data_hora_inicio', pFimMes)
          .neq('status', 'Cancelado');

        if (count && count >= 4) {
          setLimiteExtrasAtingido(true);
        }
      }
    };
    checkPro();
  }, []);

  const fetchLocais = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('locais_trabalho').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome');
    setLocais((data as LocalTrabalho[]) ?? []);
  }, []);

  useEffect(() => { fetchLocais(); }, [fetchLocais]);

  const salvarPlantaoExtra = async (forcarConflito = false) => {
    if (!localId || !dataPlantao || !horaInicio || !horaFim) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    setSaving(true);
    
    try {
      const inicioIso = new Date(`${dataPlantao}T${horaInicio}:00`).toISOString();
      const dataFimObj = new Date(`${dataPlantao}T${horaFim}:00`);
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
          .eq('usuario_id', user.id)
          .eq('is_extra', true)
          .gte('data_hora_inicio', pInicioMes)
          .lte('data_hora_inicio', pFimMes)
          .neq('status', 'Cancelado');

        if (count && count >= 4) {
          toast.error('Limite de 4 plantões extras no mês atingido. Assine o plano Pro para registros ilimitados.');
          setSaving(false);
          return;
        }
      }

      // ── Verifica conflito de horário antes de inserir ──
      if (!forcarConflito) {
        const { data: existentes } = await supabase
          .from('plantoes')
          .select('id, data_hora_inicio, data_hora_fim')
          .eq('usuario_id', user.id)
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
        : { inicioIso: new Date(`${dataPlantao}T${horaInicio}:00`).toISOString(), fimIso: (() => { const d = new Date(`${dataPlantao}T${horaFim}:00`); if (horaFim < horaInicio) d.setDate(d.getDate()+1); return d.toISOString(); })() };

      // ── Enforce Free Tier na persistência (Segurança) ──
      const safeTipoExtra = isPro ? tipoExtra : 'Remunerado';
      const valorLimpo = isPro ? valorGanho.replace(/[^\d,]/g, '').replace(',', '.') : '0';
      const valorNumerico = safeTipoExtra === 'Remunerado' ? (parseFloat(valorLimpo) || 0) : 0;
      
      const { error } = await supabase.from('plantoes').insert({
        usuario_id: user.id,
        local_id: localId,
        escala_id: null,
        data_hora_inicio: payload.inicioIso,
        data_hora_fim: payload.fimIso,
        is_extra: true,
        status: safeTipoExtra === 'Troca' ? 'Trocado' : 'Agendado',
        notas: (isPro && valorNumerico > 0) ? `R$ ${valorNumerico.toFixed(2)} [${safeTipoExtra}]` : (isPro ? safeTipoExtra : 'Plantão Extra (Free)'),
      });

      if (error) throw error;

      // ↓ Notifica o calendário para limpar cache e refazer fetch com is_extra correto
      window.dispatchEvent(new CustomEvent('plantoes-atualizados'));

      toast.success('✅ Plantão registrado com sucesso!');
      setDataPlantao('');
      setConflitoPendente(null);
      setPayloadPendente(null);

    } catch (err: unknown) {
      toast.error('❌ Erro ao salvar: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isPro === null) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <>
      <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 500px)', justifyContent: 'start' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ background: 'rgba(34,211,181,0.1)', color: 'var(--accent-teal)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              🚑
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Cadastrar Plantão Extra</h2>
              <span style={{ fontSize: 13, color: isPro ? 'var(--text-secondary)' : '#d97706', fontWeight: 600 }}>
                {isPro ? 'Adicione plantões extras e acompanhe seus ganhos' : 'Plano Free: Limite de 4 plantões extras por mês.'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Local de Trabalho</label>
            <select className="form-select" value={localId} onChange={e => setLocalId(e.target.value)}>
              <option value="">Onde foi o plantão?</option>
              {locais.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Data do Plantão</label>
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
                 Hora Início
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
                 Hora Fim
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

          {/* Campos de Valor e Tipo */}
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Tipo de Plantão Extra</label>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: isPro ? 'pointer' : 'not-allowed', background: tipoExtra === 'Remunerado' ? 'var(--bg-secondary)' : 'transparent', opacity: isPro ? 1 : 0.6 }}>
                <input type="radio" name="tipoExtra" value="Remunerado" checked={tipoExtra === 'Remunerado'} onChange={() => setTipoExtra('Remunerado')} disabled={!isPro} />
                <span>Remunerado</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: isPro ? 'pointer' : 'not-allowed', background: tipoExtra === 'Troca' ? 'var(--bg-secondary)' : 'transparent', opacity: isPro ? 1 : 0.6 }}>
                <input type="radio" name="tipoExtra" value="Troca" checked={tipoExtra === 'Troca'} onChange={() => setTipoExtra('Troca')} disabled={!isPro} />
                <span>Troca</span>
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Valor do Plantão (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              placeholder={isPro ? "Ex: R$ 1.200,00" : "🔒 Bloqueado (Pro)"}
              value={isPro ? valorGanho : ""}
              onChange={e => {
                let v = e.target.value.replace(/\D/g, '');
                if (!v) { setValorGanho(''); return; }
                
                const value = parseInt(v) / 100;
                const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
                setValorGanho(formatter.format(value));
              }}
              disabled={!isPro || tipoExtra === 'Troca'}
              style={{ opacity: (!isPro || tipoExtra === 'Troca') ? 0.6 : 1, cursor: (!isPro || tipoExtra === 'Troca') ? 'not-allowed' : 'text' }}
            />
          </div>

          {!isPro && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#d97706', background: 'rgba(245,158,11,0.1)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>💰 Desbloqueie ganhos com o Plano Pro.</span>
              <a 
                href="https://wa.me/5521991847945?text=Ol%C3%A1%21%20Quero%20assinar%20o%20Plano%20PRO%20para%20liberar%20o%20controle%20financeiro." 
                target="_blank" 
                rel="noreferrer"
                style={{ fontWeight: 800, color: '#b45309', textDecoration: 'none' }}
              >
                Assinar Agora
              </a>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '14px', background: 'var(--accent-blue)', opacity: (!isPro && limiteExtrasAtingido) ? 0.6 : 1 }}
            onClick={() => {
              if (!isPro && limiteExtrasAtingido) {
                toast.error('Limite de 4 plantões extras no mês atingido. Assine o plano Pro para registros ilimitados.');
              } else {
                salvarPlantaoExtra();
              }
            }}
            disabled={saving}
          >
            {saving ? ' Salvando...' : ' Salvar Plantão'}
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
              >{saving ? '...' : ' Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Plantao, LocalTrabalho } from '../../lib/supabase';
import { ArrowRightLeft } from 'lucide-react';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function CalendarioPage() {
  const [plantoes, setPlantoes] = useState<PlantaoComLocal[]>([]);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(false);

  const fetchPlantoes = useCallback(async () => {
    setLoading(true);
    const inicioMes = new Date(ano, mes, 1).toISOString();
    const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from('plantoes')
      .select('*, local:locais_trabalho(*)')
      .gte('data_hora_inicio', inicioMes)
      .lte('data_hora_inicio', fimMes)
      .neq('status', 'Cancelado')
      .order('data_hora_inicio', { ascending: true });
    setPlantoes((data as PlantaoComLocal[]) ?? []);
    setLoading(false);
  }, [ano, mes]);

  const handleOferecer = async (plantao_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente enviar este plantão para o Mural de Repasses? Ele ficará disponível para outros colegas da rede assumirem.')) return;
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await supabase.from('repasses').insert({ plantao_id, ofertante_id: user.id });
    if (!error) {
      alert('Plantão enviado ao Mural de Repasses com sucesso!');
      await supabase.from('plantoes').update({ status: 'Repassando' }).eq('id', plantao_id);
      fetchPlantoes();
    } else {
      alert('Erro ao tentar oferecer (Pode já estar no mural ativo).');
      fetchPlantoes();
    }
  };

  // Fetch ao montar e quando o mês/ano muda
  useEffect(() => { fetchPlantoes(); }, [fetchPlantoes]);

  // Escuta o evento customizado disparado pela página de Escalas após criação bem-sucedida
  useEffect(() => {
    const handlePlantaoAtualizado = () => {
      fetchPlantoes();
    };
    window.addEventListener('plantoes-atualizados', handlePlantaoAtualizado);
    return () => {
      window.removeEventListener('plantoes-atualizados', handlePlantaoAtualizado);
    };
  }, [fetchPlantoes]);

  const plantoesNoDia = (dia: number): PlantaoComLocal[] =>
    plantoes.filter(p => {
      const d = new Date(p.data_hora_inicio);
      return d.getDate() === dia && d.getMonth() === mes && d.getFullYear() === ano;
    });

  const primeiroDiaMes = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasAnterior = new Date(ano, mes, 0).getDate();
  const hoje = new Date();
  const isHoje = (dia: number) =>
    dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAno(a => a - 1); } else setMes(m => m - 1);
  };
  const proximoMes = () => {
    if (mes === 11) { setMes(0); setAno(a => a + 1); } else setMes(m => m + 1);
  };

  const cells: Array<{ dia: number; mesAtual: boolean }> = [];
  for (let i = primeiroDiaMes - 1; i >= 0; i--) cells.push({ dia: diasAnterior - i, mesAtual: false });
  for (let d = 1; d <= diasNoMes; d++) cells.push({ dia: d, mesAtual: true });
  while (cells.length % 7 !== 0) cells.push({ dia: cells.length - diasNoMes - primeiroDiaMes + 2, mesAtual: false });

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Calendário 📅</h1>
          <p>
            Visualize seus plantões — {loading && <span style={{ color: 'var(--accent-blue)', fontSize: 13 }}>⟳ Atualizando...</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={mesAnterior}>←</button>
          <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: 'center' }}>
            {MESES[mes]} {ano}
          </span>
          <button className="btn btn-secondary" onClick={proximoMes}>→</button>
        </div>
      </div>

      <div className="card">
        <div className="cal-header">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
        </div>
        <div className="calendar-grid" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {cells.map((cell, idx) => {
            const ps = cell.mesAtual ? plantoesNoDia(cell.dia) : [];
            return (
              <div
                key={idx}
                className={`cal-day ${cell.mesAtual ? '' : 'other-month'} ${cell.mesAtual && isHoje(cell.dia) ? 'today' : ''}`}
              >
                <div className="cal-day-num">{cell.dia}</div>
                {ps.length > 0 && (
                  <div className="cal-indicators">
                    {ps.slice(0, 3).map(p => (
                      <div
                        key={p.id}
                        className="cal-dot"
                        style={{ backgroundColor: p.local?.cor_calendario ?? '#4f8ef7' }}
                        title={p.local?.nome}
                      />
                    ))}
                    {ps.length > 3 && (
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>+{ps.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de plantões do mês */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
          Plantões de {MESES[mes]} ({plantoes.length})
        </h2>
        {plantoes.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p>Nenhum plantão neste mês. Crie uma escala para gerar plantões automaticamente.</p>
            </div>
          </div>
        ) : (
          <div className="shift-list">
            {plantoes.map(p => (
              <div key={p.id} className="shift-item">
                <div className="shift-color-bar" style={{ backgroundColor: p.local?.cor_calendario ?? '#4f8ef7' }} />
                <div className="shift-info">
                  <div className="shift-local">{p.local?.nome ?? 'Local não informado'}</div>
                  <div className="shift-time">
                    {new Date(p.data_hora_inicio).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {' → '}
                    {new Date(p.data_hora_fim).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {p.status === 'Agendado' && (
                  <button 
                    onClick={(e) => handleOferecer(p.id, e)} 
                    className="btn btn-secondary" 
                    style={{ fontSize: 12, padding: '6px 12px', marginRight: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowRightLeft size={14} /> Oferecer
                  </button>
                )}

                <div className={`shift-status ${p.status.toLowerCase().replace(' ', '-')}`}>{p.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

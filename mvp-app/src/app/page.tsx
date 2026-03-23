'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Plantao, LocalTrabalho } from '../lib/supabase';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
}

function calcularCountdown(dataHoraInicio: string): string {
  const agora = new Date();
  const inicio = new Date(dataHoraInicio);
  const diff = inicio.getTime() - agora.getTime();

  if (diff < 0) return 'Em andamento';
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (dias > 0) return `Em ${dias}d ${horas}h`;
  if (horas > 0) return `Em ${horas}h`;
  return 'Em breve';
}

function calcularHorasMes(plantoes: PlantaoComLocal[]): number {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

  return plantoes
    .filter(p => {
      const d = new Date(p.data_hora_inicio);
      return d >= inicioMes && d <= fimMes && p.status === 'Agendado';
    })
    .reduce((total, p) => {
      const inicio = new Date(p.data_hora_inicio);
      const fim = new Date(p.data_hora_fim);
      return total + (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    }, 0);
}

export default function DashboardPage() {
  const [plantoes, setPlantoes] = useState<PlantaoComLocal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('plantoes')
      .select('*, local:locais_trabalho(*)')
      .eq('status', 'Agendado')
      .gte('data_hora_fim', new Date().toISOString())
      .order('data_hora_inicio', { ascending: true })
      .limit(20);

    setPlantoes((data as PlantaoComLocal[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const proximoPlantao = plantoes[0];
  const horasMes = calcularHorasMes(plantoes);
  const totalMes = plantoes.filter(p => {
    const d = new Date(p.data_hora_inicio);
    const agora = new Date();
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
  }).length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
    });

  return (
    <>
      <div className="page-header">
        <h1>Mission Control 🚀</h1>
        <p>Visão geral dos seus plantões</p>
      </div>

      {loading ? (
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 84, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">📅</div>
              <div className="stat-content">
                <div className="stat-label">Plantões no Mês</div>
                <div className="stat-value">{totalMes}</div>
                <div className="stat-sub">Este mês</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon teal">⏱️</div>
              <div className="stat-content">
                <div className="stat-label">Horas Agendadas</div>
                <div className="stat-value">{Math.round(horasMes)}h</div>
                <div className="stat-sub">Este mês</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon violet">📋</div>
              <div className="stat-content">
                <div className="stat-label">Próximos</div>
                <div className="stat-value">{plantoes.length}</div>
                <div className="stat-sub">Agendados</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">🏥</div>
              <div className="stat-content">
                <div className="stat-label">Status</div>
                <div className="stat-value" style={{ fontSize: '18px', color: 'var(--accent-green)' }}>✓ OK</div>
                <div className="stat-sub">Sem conflitos</div>
              </div>
            </div>
          </div>

          {proximoPlantao ? (
            <div className="next-shift-card">
              <div className="next-shift-label">🔔 Próximo Plantão</div>
              <div className="next-shift-date">
                {new Date(proximoPlantao.data_hora_inicio).toLocaleString('pt-BR', {
                  weekday: 'long', day: '2-digit', month: 'long'
                })}
              </div>
              <div className="next-shift-details">
                {proximoPlantao.local && (
                  <div className="shift-detail-badge">
                    <span style={{ color: proximoPlantao.local.cor_calendario }}>●</span>
                    {proximoPlantao.local.nome}
                  </div>
                )}
                <div className="shift-detail-badge">
                  🕐 {new Date(proximoPlantao.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} —{' '}
                  {new Date(proximoPlantao.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="countdown-badge">
                ⚡ {calcularCountdown(proximoPlantao.data_hora_inicio)}
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: 28 }}>
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>Nenhum plantão agendado. Crie uma escala para começar!</p>
              </div>
            </div>
          )}

          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Próximos Plantões</h2>
            {plantoes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🗓️</div>
                <p>Nenhum plantão encontrado.</p>
              </div>
            ) : (
              <div className="shift-list">
                {plantoes.slice(0, 8).map(p => (
                  <div key={p.id} className="shift-item">
                    <div
                      className="shift-color-bar"
                      style={{ backgroundColor: p.local?.cor_calendario ?? '#4f8ef7' }}
                    />
                    <div className="shift-info">
                      <div className="shift-local">{p.local?.nome ?? 'Local não informado'}</div>
                      <div className="shift-time">{formatDate(p.data_hora_inicio)}</div>
                    </div>
                    <div className={`shift-status ${p.status.toLowerCase()}`}>{p.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

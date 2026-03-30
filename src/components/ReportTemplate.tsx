'use client';

import React from 'react';
import { Plantao, LocalTrabalho } from '../lib/supabase';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
}

interface ReportTemplateProps {
  plantoes: PlantaoComLocal[];
  mesNome: string;
  ano: number;
}

export const ReportTemplate = React.forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ plantoes, mesNome, ano }, ref) => {
    // ---- LÓGICA DE DADOS ----
    
    // 1. Horas por Local (Pizza Chart)
    const horasPorLocal: Record<string, { nome: string; cor: string; horas: number }> = {};
    let totalHoras = 0;
    
    // 2. Financeiro
    let totalRemunerado = 0;
    
    // 3. Folgas
    let saldoFolgas = 0;

    plantoes.forEach(p => {
      // Diferença em horas
      const diffMs = new Date(p.data_hora_fim).getTime() - new Date(p.data_hora_inicio).getTime();
      const horas = diffMs / (1000 * 60 * 60);
      totalHoras += horas;

      // Agrupando por hospital para o gráfico
      const localId = p.local?.id || 'unknown';
      if (!horasPorLocal[localId]) {
        horasPorLocal[localId] = {
          nome: p.local?.nome || 'Desconhecido',
          cor: p.local?.cor_calendario || '#ccc',
          horas: 0
        };
      }
      horasPorLocal[localId].horas += horas;

      // Calculando Financeiro & Folgas (Plantões Extras)
      if (p.is_extra) {
        if (p.status === 'Trocado') {
          saldoFolgas += 1;
        } else {
          totalRemunerado += (p.valor_ganho || 0);
        }
      }
    });

    const locaisArray = Object.values(horasPorLocal).sort((a,b) => b.horas - a.horas);

    // Constrói a string do gradiente cônico (Pie Chart) CSS
    let lastPercent = 0;
    const gradientStops = locaisArray.map(l => {
      const percentage = (l.horas / totalHoras) * 100;
      const stop = `${l.cor} ${lastPercent}% ${lastPercent + percentage}%`;
      lastPercent += percentage;
      return stop;
    }).join(', ');

    return (
      <div
        ref={ref}
        style={{
          width: '800px', // Largura fixa estilo A4 em px
          background: '#ffffff',
          padding: '40px',
          fontFamily: 'Inter, sans-serif',
          color: '#1e293b',
          // Tirar da tela principal
          position: 'absolute',
          left: '-9999px',
          top: 0,
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#3b82f6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '32px' }}>⚡</span> Meu Plantão
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Relatório Profissional Pro</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: '#0f172a' }}>
              {mesNome} {ano}
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* DASHBOARD Kpis */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Carga Mensal Total</span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginTop: '8px' }}>{totalHoras.toFixed(0)} <span style={{ fontSize: '16px', color: '#94a3b8' }}>Horas</span></div>
          </div>
          <div style={{ flex: 1, background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Extras Acumulados</span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#15803d', marginTop: '8px' }}>R$ {totalRemunerado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ flex: 1, background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Créditos de Folga</span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#1d4ed8', marginTop: '8px' }}>{saldoFolgas} <span style={{ fontSize: '16px', color: '#93c5fd' }}>Plantões</span></div>
          </div>
        </div>

        {/* DONUT CHART (CSS PURO) & LEGENDA E CONTEUDO */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '40px', background: '#f8fafc', padding: '30px', borderRadius: '16px' }}>
          {totalHoras > 0 ? (
             <div style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: `conic-gradient(${gradientStops})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
            }}>
              {/* Buraco do Donut pra ficar vazado */}
              <div style={{ width: '130px', height: '130px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{totalHoras.toFixed(0)}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '1px' }}>HORAS</span>
              </div>
            </div>
          ) : (
            <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: '#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center'}}>Sem Dados</div>
          )}
         
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>Distribuição de Horas por Local</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {locaisArray.map(l => (
                <div key={l.nome} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: l.cor }}></div>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{l.nome}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>
                    {l.horas.toFixed(0)}h <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '13px', marginLeft:'6px' }}>({((l.horas / totalHoras) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABELA DE PLANTÕES */}
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom:'8px' }}>Extrato Detalhado Mensal</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#64748b' }}>
              <th style={{ padding: '12px 8px' }}>Data</th>
              <th style={{ padding: '12px 8px' }}>Local</th>
              <th style={{ padding: '12px 8px' }}>Horário</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Marcador</th>
            </tr>
          </thead>
          <tbody>
            {plantoes.map((p, idx) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                  {new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </td>
                <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.local?.cor_calendario || '#ccc' }}></div>
                  <span style={{ fontWeight: 600 }}>{p.local?.nome || 'Desconhecido'}</span>
                </td>
                <td style={{ padding: '12px 8px', color: '#475569' }}>
                  {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} 
                  {' às '} 
                  {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  {p.is_extra ? (
                    p.status === 'Trocado' ? (
                      <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>FOLGA</span>
                    ) : (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>+ R$ {p.valor_ganho || 0}</span>
                    )
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Fixo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {plantoes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Nenhum plantão registrado neste mês.</div>
        )}

      </div>
    );
  }
);
ReportTemplate.displayName = 'ReportTemplate';

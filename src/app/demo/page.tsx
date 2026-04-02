'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── DADOS SIMULADOS ───────────────────────────────────────────────
const LOCAIS_MOCK = [
  { id: '1', nome: 'Hospital das Clínicas', cor: '#4f8ef7', endereco: 'Av. Dr. Enéas Carvalho de Aguiar, 255', is_home_care: false },
  { id: '2', nome: 'UPA Norte', cor: '#22d3b5', endereco: 'Rua das Flores, 123', is_home_care: false },
  { id: '3', nome: 'Paciente JP (Home Care)', cor: '#f97316', endereco: null, is_home_care: true },
];

const hoje = new Date();

function addHoras(d: Date, h: number): Date {
  const n = new Date(d);
  n.setHours(n.getHours() + h);
  return n;
}

function gerarMock() {
  const plantoes = [];
  let cursor = new Date(hoje);
  cursor.setHours(7, 0, 0, 0);
  for (let i = 0; i < 6; i++) {
    plantoes.push({ id: `a${i}`, local: LOCAIS_MOCK[0], inicio: new Date(cursor), fim: addHoras(cursor, 12), status: 'Agendado' });
    cursor = addHoras(cursor, 48);
  }
  let c2 = new Date(hoje);
  c2.setDate(c2.getDate() + 2);
  c2.setHours(19, 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    plantoes.push({ id: `b${i}`, local: LOCAIS_MOCK[1], inicio: new Date(c2), fim: addHoras(c2, 24), status: 'Agendado' });
    c2 = addHoras(c2, 72);
  }
  let c3 = new Date(hoje);
  c3.setDate(c3.getDate() + 1);
  c3.setHours(8, 0, 0, 0);
  for (let i = 0; i < 2; i++) {
    plantoes.push({ id: `c${i}`, local: LOCAIS_MOCK[2], inicio: new Date(c3), fim: addHoras(c3, 12), status: 'Agendado' });
    c3 = addHoras(c3, 48);
  }
  return plantoes.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

const PLANTOES_MOCK = gerarMock();
const FUTURO = PLANTOES_MOCK.filter(p => p.inicio >= hoje);

// Agrupar próximos plantões por local para o Dashboard (só 1 por local)
const agruparMaisProximos = () => {
  const vistos = new Set();
  const filtrados = [];
  for (const p of FUTURO) {
    if (!vistos.has(p.local.id)) {
      vistos.add(p.local.id);
      filtrados.push(p);
    }
  }
  return filtrados;
};
const PLANTOES_PROXIMOS_POR_LOCAL = agruparMaisProximos();

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function formatDT(d: Date) {
  return d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

type Tab = 'dashboard' | 'calendario' | 'escalas' | 'locais' | 'extra';
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '🏠', label: 'Mission Control' },
  { id: 'calendario', icon: '📅', label: 'Calendário' },
  { id: 'escalas', icon: '⚙️', label: 'Escalas' },
  { id: 'extra', icon: '➕', label: 'Plantão Extra' },
  { id: 'locais', icon: '👥', label: 'Locais' },
];

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual] = useState(hoje.getFullYear());
  const [regraDemo, setRegraDemo] = useState('12x36');
  const [demoSaved, setDemoSaved] = useState(false);

  const plantoesDoMes = PLANTOES_MOCK.filter(p => p.inicio.getMonth() === mesAtual && p.inicio.getFullYear() === anoAtual);

  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const diasAnt = new Date(anoAtual, mesAtual, 0).getDate();
  const cells: { dia: number; mesAtual: boolean }[] = [];
  for (let i = primeiroDia - 1; i >= 0; i--) cells.push({ dia: diasAnt - i, mesAtual: false });
  for (let d = 1; d <= diasNoMes; d++) cells.push({ dia: d, mesAtual: true });
  while (cells.length % 7 !== 0) cells.push({ dia: 0, mesAtual: false });

  const plantoesNoDia = (dia: number) => plantoesDoMes.filter(p => p.inicio.getDate() === dia);
  const isHoje = (dia: number) => dia === hoje.getDate() && mesAtual === hoje.getMonth();


  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(90deg, #7c6af7, #4f8ef7)', padding: '10px 24px', fontSize: 13, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        🎯 MODO DEMO — Dados simulados para visualização. O app real conecta ao Supabase.
        <Link href="/" style={{ marginLeft: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '3px 10px', color: 'white', fontSize: 12 }}>← Voltar ao App Real</Link>
      </div>

      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-logo"><div className="sidebar-logo-icon">🏥</div><div className="sidebar-logo-text">Meu <span>Plantão</span></div></div>
          <nav className="nav-section">
            <div className="nav-label">Menu</div>
            {TABS.map(t => (
              <button key={t.id} className={`nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); setDemoSaved(false); }}>
                <span className="nav-icon">{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">

          {/* ── DASHBOARD (Menos é Mais) ── */}
          {tab === 'dashboard' && (
            <>
              <div className="page-header">
                <h1>Mission Control 🚀</h1>
                <p>Visão geral dos seus plantões</p>
              </div>

              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-icon blue">📅</div>
                  <div className="stat-content">
                    <div className="stat-label">Plantões no Mês</div>
                    <div className="stat-value">{plantoesDoMes.length}</div>
                    <div className="stat-sub">Agendados e Concluídos</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">🏥</div>
                  <div className="stat-content">
                    <div className="stat-label">Locais Ativos</div>
                    <div className="stat-value">{LOCAIS_MOCK.length}</div>
                    <div className="stat-sub">Hospitais / Home Care</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 32 }}>
                <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Próximos Plantões por Local</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  O plantão mais próximo agendado em cada local de trabalho. Para a agenda completa, consulte o Calendário.
                </p>
                <div className="shift-list">
                  {PLANTOES_PROXIMOS_POR_LOCAL.map(p => (
                    <div key={p.id} className="shift-item" style={{ alignItems: 'center' }}>
                      <div className="shift-color-bar" style={{ backgroundColor: p.local.cor }} />
                      <div className="shift-info" style={{ flex: 1 }}>
                        <div className="shift-local" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.local.nome}
                          {p.local.is_home_care && <span style={{ fontSize: 10, background: 'rgba(34,211,181,0.1)', color: 'var(--accent-teal)', padding: '2px 6px', borderRadius: 4 }}>🏠 Home Care</span>}
                        </div>
                        <div className="shift-time" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {formatDT(p.inicio)} — {p.fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {p.local.endereco && !p.local.is_home_care && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.local.endereco)}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12, marginRight: 12, backgroundColor: 'rgba(79, 142, 247, 0.1)', color: 'var(--accent-blue)', border: 'none' }}
                        >
                          📍 Mapa
                        </a>
                      )}
                      <div className="shift-status agendado">Agendado</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── CALENDÁRIO ── */}
          {tab === 'calendario' && (
            <>
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h1>Calendário 📅</h1><p>Visão mensal dos seus plantões</p></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setMesAtual(m => m > 0 ? m - 1 : 11)}>←</button>
                  <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: 'center' }}>{MESES[mesAtual]} {anoAtual}</span>
                  <button className="btn btn-secondary" onClick={() => setMesAtual(m => m < 11 ? m + 1 : 0)}>→</button>
                </div>
              </div>
              <div className="card">
                <div className="cal-header">
                  {DIAS_SEMANA.map(d => <div key={d} className="cal-day-header">{d}</div>)}
                </div>
                <div className="calendar-grid">
                  {cells.map((cell, idx) => {
                    const ps = cell.mesAtual && cell.dia > 0 ? plantoesNoDia(cell.dia) : [];
                    return (
                      <div key={idx} className={`cal-day ${!cell.mesAtual || cell.dia === 0 ? 'other-month' : ''} ${cell.mesAtual && isHoje(cell.dia) ? 'today' : ''}`}>
                        <div className="cal-day-num">{cell.dia > 0 ? cell.dia : ''}</div>
                        {ps.length > 0 && <div className="cal-indicators">{ps.slice(0, 3).map(p => <div key={p.id} className="cal-dot" style={{ backgroundColor: p.local.cor }} title={p.local.nome} />)}{ps.length > 3 && <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>+{ps.length - 3}</span>}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── ESCALAS ── */}
          {tab === 'escalas' && (
            <>
              <div className="page-header">
                <h1>Configurar Escala ⚙️</h1>
                <p>Gera plantões automaticamente</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="card">
                  <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Nova Escala</h2>
                  <div className="form-group"><label className="form-label">Regra de Escala *</label><select className="form-select" value={regraDemo} onChange={e => { setRegraDemo(e.target.value); setDemoSaved(false); }}><option value="12x36">12x36</option><option value="24x48">24x48</option><option value="24x72">24x72</option></select></div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => setDemoSaved(true)}>🚀 Criar Escala</button>
                  {demoSaved && <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--accent-green)', fontWeight: 700 }}>✅ Escala criada!</div>}
                </div>
              </div>
            </>
          )}

          {/* ── PLANTÂO EXTRA ── */}
          {tab === 'extra' && (
            <>
              <div className="page-header">
                <h1>Plantão Extra ➕</h1>
                <p>Adicione um plantão avulso</p>
              </div>
              <div style={{ maxWidth: 540 }}>
                <div className="card">
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => alert('🛡️ DEMO: Sistema verificou conflitos — nenhum conflito encontrado! Plantão extra salvo.')}>
                    🔍 Verificar e Adicionar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── LOCAIS ── */}
          {tab === 'locais' && (
            <>
              <div className="page-header">
                <h1>Locais de Trabalho 🏥</h1>
                <p>Gerencie os hospitais, clínicas e atendimentos Home Care</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
                <div className="card" style={{ height: 'fit-content' }}>
                  <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Novo Local (Demo)</h2>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => alert('DEMO: Local salvo no Supabase!')}>➕ Adicionar Local</button>
                </div>
                <div className="card">
                  <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Locais Cadastrados ({LOCAIS_MOCK.length})</h2>
                  <div className="shift-list">
                    {LOCAIS_MOCK.map(l => (
                      <div key={l.id} className="shift-item" style={{ alignItems: 'center' }}>
                        <div className="shift-color-bar" style={{ backgroundColor: l.cor }} />
                        <div className="shift-info" style={{ flex: 1 }}>
                          <div className="shift-local" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {l.nome}
                            {l.is_home_care && <span style={{ fontSize: 11, background: 'rgba(34,211,181,0.1)', color: 'var(--accent-teal)', padding: '2px 6px', borderRadius: 4 }}>🏠 Home Care</span>}
                          </div>
                          {l.endereco && !l.is_home_care && (
                            <div className="shift-time" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              📍 <span style={{ opacity: 0.8 }}>{l.endereco}</span>
                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.endereco)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', marginLeft: 4, fontWeight: 500 }}>Ver no Mapa ↗</a>
                            </div>
                          )}
                        </div>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: l.cor, flexShrink: 0, marginRight: 12 }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Building2, Activity, Calendar, Clock } from 'lucide-react';
import { supabase, Plantao, LocalTrabalho } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
}

export default function DashboardPage() {
  const [plantoesMaisProximosPorLocal, setPlantoes] = useState<PlantaoComLocal[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [locaisAtivos, setLocaisAtivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showProModal, setShowProModal] = useState('');
  const [isPro, setIsPro] = useState(true);
  const [localEmEdicao, setLocalEmEdicao] = useState<LocalTrabalho | null>(null);
  const [savingLocal, setSavingLocal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);
  const [relatorioMes, setRelatorioMes] = useState(new Date().getMonth() + 1);
  const [relatorioAno, setRelatorioAno] = useState(new Date().getFullYear());
  const [isCalculating, setIsCalculating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();
      if (data != null) setIsPro(data.is_pro);
    };
    checkPro();
  }, []);

  const fetchPlantoes = useCallback(async () => {
    // 1. OFFLINE FIRST: Carrega o cache armazenado no disco local
    const cachedData = localStorage.getItem('plantoes_cache');
    if (cachedData) {
      setPlantoes(JSON.parse(cachedData));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Middleware lidará na raiz, mas para evitar erros silenciamos aqui

      const hoje = new Date().toISOString();
      
      const plantoesQuery = supabase
        .from('plantoes')
        .select(`
          *,
          local:locais_trabalho(*)
        `)
        .gte('data_hora_inicio', hoje)
        .order('data_hora_inicio', { ascending: true })
        .limit(20);

      const { data: plantoesData } = await plantoesQuery;

      if (plantoesData) {
        // Agrupar por local (apenas o mais próximo de cada)
        const porLocal = new Map<string, PlantaoComLocal>();
        plantoesData.forEach(p => {
          if (p.local?.id && !porLocal.has(p.local.id)) {
            porLocal.set(p.local.id, p);
          }
        });
        
        const freshData = Array.from(porLocal.values());
        
        // 2. OFFLINE FIRST: Salva dado fresco no disco
        setPlantoes(freshData);
        localStorage.setItem('plantoes_cache', JSON.stringify(freshData));
      }
      
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      const { count: countMes } = await supabase
        .from('plantoes')
        .select('*', { count: 'exact', head: true })
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes)
        .neq('status', 'Cancelado');
        
      setTotalMes(countMes || 0);
  
      // 3. Locais Ativos
      const { count: countLocais } = await supabase
        .from('locais_trabalho')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
        
      setLocaisAtivos(countLocais || 0);
    } catch (err) {
      console.warn("Retornando dados do Cache (Modo Offline / Sem Conexão).", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlantoes();
  }, [fetchPlantoes]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const gerarRelatorioFinanceiro = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch(`/api/relatorios/financeiro?mes=${relatorioMes}&ano=${relatorioAno}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        showToast(json.message ?? 'Não foi possível gerar o relatório.', 'error');
        return;
      }
      console.log('[Relatório Financeiro] Dados completos:', json);
      const totalFormatado = json.total_geral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      alert(`✅ Total de Extras em ${relatorioMes}/${relatorioAno}: ${totalFormatado}\n\nDetalhes no console (F12).`);
      setShowRelatorioModal(false);
    } catch {
      showToast('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  const salvarEdicao = async () => {
    if (!localEmEdicao) return;
    if (!localEmEdicao.nome.trim()) { showToast('Informe o nome do local.', 'error'); return; }

    setSavingLocal(true);
    const { error } = await supabase.from('locais_trabalho').update({
      nome: localEmEdicao.nome.trim(),
      endereco: localEmEdicao.is_home_care ? null : (localEmEdicao.endereco?.trim() || null)
    }).eq('id', localEmEdicao.id);

    if (error) {
      showToast('Erro ao atualizar: ' + error.message, 'error');
    } else {
      showToast('✅ Local atualizado com sucesso!', 'success');
      setLocalEmEdicao(null);
      await fetchPlantoes();
    }
    setSavingLocal(false);
  };

  const excluirLocal = async (id: string, nomeLocal: string) => {
    const { count } = await supabase.from('plantoes').select('*', { count: 'exact', head: true })
      .eq('local_id', id).gt('data_hora_inicio', new Date().toISOString());
    const numPlantoesFuturos = count || 0;

    if (!confirm(`Atenção: Ao arquivar '${nomeLocal}', todos os ${numPlantoesFuturos} plantões FUTUROS agendados nele serão cancelados. Os antigos continuarão no relatório. Deseja arquivá-lo?`)) return;
    
    setSavingLocal(true);
    const hojeISO = new Date().toISOString();
    
    // Plantões futuros apagados
    await supabase.from('plantoes').delete().eq('local_id', id).gt('data_hora_inicio', hojeISO);
    
    // Soft Delete
    const { error } = await supabase.from('locais_trabalho').update({ ativo: false }).eq('id', id);
    
    if (error) { 
      showToast('Erro ao excluir: ' + error.message, 'error');
    } else { 
      showToast('Local e todos os plantões removidos', 'success'); 
      setLocalEmEdicao(null);
      await fetchPlantoes(); 
    }
    setSavingLocal(false);
  };



  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity size={32} color="var(--accent-blue)" /> 
            Mission Control
          </h1>
          <p>Visão estratégica das suas escalas — {loading && <span style={{ color: 'var(--accent-blue)', fontSize: 13 }}>⟳ Atualizando...</span>}</p>
        </div>
      </div>

      {loading ? (
        <div className="stats-grid mobile-stack" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: 84, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="stat-card" onClick={() => router.push('/calendario')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon blue"><CalendarDays size={28} /></div>
              <div className="stat-content">
                <div className="stat-label">Plantões no Mês</div>
                <div className="stat-value">{totalMes}</div>
                <div className="stat-sub">Agendados/Realizados</div>
              </div>
            </div>
            <div className="stat-card" onClick={() => router.push('/locais')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon orange"><Building2 size={28} /></div>
              <div className="stat-content">
                <div className="stat-label">Locais Ativos</div>
                <div className="stat-value">{locaisAtivos}</div>
                <div className="stat-sub">Hospitais / Home Care</div>
              </div>
            </div>
          </div>

          {/* CENTRAL PRO */}
          <div className="card" style={{ marginTop: 24, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#f59e0b' }}>⭐</span> Central Pro
              </h2>
              <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: 12, fontWeight: 700 }}>
                RECURSOS PREMIUM
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'center', gap: 8, padding: 16, fontWeight: 700 }}
                onClick={() => setShowRelatorioModal(true)}
              >
                📊 Relatórios de Plantões Pro
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, padding: 16 }} onClick={() => router.push('/calendario')}>
                Compartilhar Escala Pro
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
              Próximos Plantões por Local
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              O plantão mais próximo agendado em cada local de trabalho. Para a agenda completa, consulte o Calendário.
            </p>
            {plantoesMaisProximosPorLocal.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🗓️</div>
                <p>Nenhum plantão agendado.</p>
              </div>
            ) : (
              <div className="shift-list">
                {plantoesMaisProximosPorLocal.map(p => (
                  <div key={p.id} className="shift-item" style={{ alignItems: 'center', cursor: 'pointer' }} onClick={() => p.local && setLocalEmEdicao(p.local)}>
                    <div
                      className="shift-color-bar"
                      style={{ backgroundColor: p.local?.cor_calendario ?? '#4f8ef7' }}
                    />
                    <div className="shift-info" style={{ flex: 1, padding: '4px 0' }}>
                      <div className="shift-local" style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.local?.nome ?? 'Local não informado'}
                        {p.local?.is_home_care && (
                          <span style={{ fontSize: 10, background: 'rgba(34,211,181,0.1)', color: 'var(--accent-teal)', padding: '2px 6px', borderRadius: 4 }}>🏠 Home Care</span>
                        )}
                      </div>
                      <div className="shift-time" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        <Calendar size={13} /> 
                        <span style={{ textTransform: 'capitalize' }}>
                          {new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')}
                        </span>
                        <Clock size={13} style={{ marginLeft: 6 }} /> 
                        {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <a 
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Plantão - ${p.local?.nome || 'Médico'}`)}&dates=${new Date(p.data_hora_inicio).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(p.data_hora_fim).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent('Plantão gerado via Meu Plantão App')}&location=${encodeURIComponent(p.local?.endereco || p.local?.nome || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 12, marginRight: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-orange, #f59e0b)', border: 'none' }}
                      onClick={e => e.stopPropagation()}
                    >
                      📆 Salvar na Agenda
                    </a>

                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL RELATÓRIO FINANCEIRO */}
      {showRelatorioModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => !isCalculating && setShowRelatorioModal(false)}
        >
          <div className="card" style={{ maxWidth: 420, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>📊</div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Gerar Relatório de Plantões</h2>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Somatório financeiro de extras por local</span>
                </div>
              </div>
              <button onClick={() => setShowRelatorioModal(false)} disabled={isCalculating} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
            </div>

            {/* Seletores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Mês</label>
                <select
                  className="form-select"
                  value={relatorioMes}
                  onChange={e => setRelatorioMes(Number(e.target.value))}
                  disabled={isCalculating}
                >
                  {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Ano</label>
                <select
                  className="form-select"
                  value={relatorioAno}
                  onChange={e => setRelatorioAno(Number(e.target.value))}
                  disabled={isCalculating}
                >
                  {[2024, 2025, 2026, 2027].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setShowRelatorioModal(false)}
                disabled={isCalculating}
              >
                Cancelar
              </button>
              <button
                onClick={gerarRelatorioFinanceiro}
                disabled={isCalculating}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  background: isCalculating ? 'rgba(124,58,237,0.15)' : 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                  color: isCalculating ? 'var(--accent-violet)' : '#fff',
                  border: '1px solid rgba(124,58,237,0.4)',
                  borderRadius: 10,
                  cursor: isCalculating ? 'not-allowed' : 'pointer',
                  boxShadow: isCalculating ? 'none' : '0 4px 14px rgba(124,58,237,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {isCalculating ? (
                  <>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(124,58,237,0.4)', borderTopColor: 'var(--accent-violet)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Calculando...
                  </>
                ) : '📄 Gerar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRO PAYWALL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⭐</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Upgrade para o Pro</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              O recurso de <strong>{showProModal}</strong> é exclusivo para assinantes do Meu Plantão Pro.<br/>
              Desbloqueie todo o poder da sua carreira médica agora!
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowProModal('')}>Voltar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none' }} onClick={() => setShowProModal('')}>Assinar Pro</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* MODAL EDICAO DE LOCAL */}
      {localEmEdicao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setLocalEmEdicao(null)}>
          <div className="card" style={{ maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>Editar Local</h2>
            
            <div className="form-group">
              <label className="form-label">Nome do Local</label>
              <input
                type="text"
                className="form-input"
                value={localEmEdicao.nome}
                onChange={e => setLocalEmEdicao({ ...localEmEdicao, nome: e.target.value })}
              />
            </div>

            {!localEmEdicao.is_home_care && (
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Endereço</label>
                <input
                  type="text"
                  className="form-input"
                  value={localEmEdicao.endereco || ''}
                  onChange={e => setLocalEmEdicao({ ...localEmEdicao, endereco: e.target.value })}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setLocalEmEdicao(null)} disabled={savingLocal}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-teal)' }} onClick={salvarEdicao} disabled={savingLocal}>{savingLocal ? '⏳ Salvando...' : 'Salvar'}</button>
            </div>
            
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 12, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} 
              onClick={() => excluirLocal(localEmEdicao.id, localEmEdicao.nome)}
              disabled={savingLocal}
            >
              Excluir (Arquivar) Local e Cancelar Futuros
            </button>
          </div>
        </div>
      )}
    </>
  );
}

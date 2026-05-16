'use client';
import { Plus, Trash2, Home, MapPin, Edit3, Star, HandMetal, Lock, Rocket, Timer, Hospital, Sparkles, Loader2 } from 'lucide-react';

import { useEffect, useState, useCallback } from 'react';
import { supabase, LocalTrabalho, isUserPro, isSubscriptionActive } from '../../lib/supabase';
import PremiumLockCard from '../../components/PremiumLockCard';
import { handleDirectCheckout } from '../../lib/checkout';

const CORES_PRESET = [
  '#4f8ef7', '#7c6af7', '#22d3b5', '#f97316',
  '#ef4444', '#22c55e', '#f59e0b', '#ec4899',
];

interface Toast { msg: string; type: 'success' | 'error' }

export default function LocaisPage() {
  const [locais, setLocais] = useState<LocalTrabalho[]>([]);
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(CORES_PRESET[0]);
  const [endereco, setEndereco] = useState('');
  const [isHomeCare, setIsHomeCare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [localEmEdicao, setLocalEmEdicao] = useState<LocalTrabalho | null>(null);

  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [limiteLocaisAtingido, setLimiteLocaisAtingido] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsPro(false); return; }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setIsPro(isUserPro(user.email) || isSubscriptionActive(profile));
    };
    checkUser();
  }, []);
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLocais = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from('locais_trabalho').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome');
    const locaisBuscados = (data as LocalTrabalho[]) ?? [];
    setLocais(locaisBuscados);
    setLimiteLocaisAtingido(locaisBuscados.length >= 2);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLocais(); }, [fetchLocais]);

  const adicionarLocal = async () => {
    if (!nome.trim()) { showToast('Informe o nome do local.', 'error'); return; }

    if (isPro === null) { showToast('Aguarde, verificando seu plano...', 'error'); return; }
    if (!isPro && limiteLocaisAtingido) {
      setShowProModal(true);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setSaving(true);
    const { error } = await supabase.from('locais_trabalho').insert({ 
      usuario_id: user.id,
      nome: nome.trim(), 
      cor_calendario: cor,
      endereco: isHomeCare ? null : endereco.trim(),
      is_home_care: isHomeCare
    });
    
    if (error) {
      showToast('Erro ao salvar: ' + error.message, 'error');
    } else {
      showToast('✅ Local adicionado com sucesso!', 'success');
      setNome('');
      setEndereco('');
      setIsHomeCare(false);
      setCor(CORES_PRESET[0]);
      await fetchLocais();
    }
    setSaving(false);
  };

  const excluirLocal = async (id: string, nomeLocal: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Não conta os que ficarão intocados no passado, conta apenas os avisos que serão apagados (futuros)
    const { count } = await supabase.from('plantoes').select('*', { count: 'exact', head: true })
      .eq('usuario_id', user.id).eq('local_id', id).gt('data_hora_inicio', new Date().toISOString());
    const numPlantoesFuturos = count || 0;

    if (!confirm(`Atenção: Ao arquivar '${nomeLocal}', todos os ${numPlantoesFuturos} plantões FUTUROS agendados nele serão cancelados. Os plantões antigos do relatório continuarão existindo. Deseja arquivá-lo?`)) return;
    
    const hojeISO = new Date().toISOString();
    
    // Deleta os plantões vinculados apenas do FUTURO (preserva histórico)
    await supabase.from('plantoes').delete().eq('usuario_id', user.id).eq('local_id', id).gt('data_hora_inicio', hojeISO);
    
    // Realiza o Soft Delete (Arquivamento) do Local
    const { error } = await supabase.from('locais_trabalho').update({ ativo: false }).eq('usuario_id', user.id).eq('id', id);
    
    if (error) { 
      showToast('Erro ao excluir: ' + error.message, 'error');
    } else { 
      showToast('Local e todos os plantões removidos', 'success'); 
      await fetchLocais(); 
      setLocalEmEdicao(null);
    }
  };

  const salvarEdicao = async () => {
    if (!localEmEdicao) return;
    if (!localEmEdicao.nome.trim()) { showToast('Informe o nome do local.', 'error'); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from('locais_trabalho').update({
      nome: localEmEdicao.nome.trim(),
      endereco: localEmEdicao.is_home_care ? null : (localEmEdicao.endereco?.trim() || null)
    }).eq('usuario_id', user.id).eq('id', localEmEdicao.id);

    if (error) {
      showToast('Erro ao atualizar: ' + error.message, 'error');
    } else {
      showToast('✅ Local atualizado com sucesso!', 'success');
      setLocalEmEdicao(null);
      await fetchLocais();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: 40, width: '250px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: 16, width: '350px', marginBottom: '24px' }} />
        <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
           <div className="skeleton" style={{ height: 400 }} />
           <div className="skeleton" style={{ height: 400 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Locais de Trabalho <span style={{ marginLeft: 8 }}><Plus size={24} /></span></h1>
        <p>Gerencie os hospitais, clínicas e atendimentos Home Care</p>
      </div>

      {locais.length === 0 && !forceShowForm ? (
        <div className="card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center', 
          padding: '80px 24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 24, color: '#2563EB' }}>
            <HandMetal size={64} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            Bem-vindo ao Meu Plantão!
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.6, marginBottom: 32 }}>
            Cadastre os hospitais, clínicas ou pacientes de home care para organizar os seus plantões.
          </p>
          <button 
            className="btn btn-primary" 
            style={{ padding: '14px 40px', fontSize: 16, borderRadius: 12 }}
            onClick={() => setForceShowForm(true)}
          >
            <Plus size={18} /> Adicionar Local
          </button>
        </div>
      ) : (
        <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
          {/* ... resto do conteúdo existente ... */}
          <div className="card" style={{ height: 'fit-content', position: 'relative', overflow: 'hidden' }}>
            {/* bloco de add local original */}
            {(!isPro && limiteLocaisAtingido) ? (
              <PremiumLockCard 
                title="Limite de locais atingido" 
                description="Você já está utilizando os 2 locais disponíveis no plano gratuito." 
              />
            ) : (
              <>
                <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Novo Local</h2>

                <div className="form-group">
                  <label className="form-label">Nome do Local</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Hospital das Clínicas"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && adicionarLocal()}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 }}>
                  <input 
                    type="checkbox" 
                    id="homecareCheckbox" 
                    checked={isHomeCare} 
                    onChange={e => setIsHomeCare(e.target.checked)} 
                    style={{ width: 16, height: 16, accentColor: 'var(--accent-teal)' }}
                  />
                  <label htmlFor="homecareCheckbox" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Este local é de atendimento <strong>Home Care</strong>
                  </label>
                </div>

                {!isHomeCare && (
                  <div className="form-group">
                    <label className="form-label">Endereço (Opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                      value={endereco}
                      onChange={e => setEndereco(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && adicionarLocal()}
                    />
                  </div>
                )}

                {isHomeCare && (
                  <div style={{ marginBottom: 16, padding: 12, background: 'rgba(34,211,181,0.06)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-muted)' }}>
                    Para sua segurança, endereços de pacientes Home Care são opcionais e não são exigidos no cadastro base.
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Cor no Calendário</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {CORES_PRESET.map(c => (
                      <button
                        key={c}
                        onClick={() => setCor(c)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: c,
                          border: cor === c ? '3px solid white' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'transform 0.15s',
                          transform: cor === c ? 'scale(1.2)' : 'scale(1)',
                        }}
                        title={c}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cor personalizada:</span>
                    <input type="color" value={cor} onChange={e => setCor(e.target.value)} style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }} 
                  onClick={adicionarLocal} 
                  disabled={saving}
                >
                  {saving ? (
                    <><Timer size={18} className="mr-2 animate-spin" /> Salvando...</>
                  ) : (
                    <><Plus size={18} className="mr-2" /> Adicionar Local</>
                  )}
                </button>
              </>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
              Locais Cadastrados ({locais.length})
            </h2>
              {locais.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ color: '#94A3B8', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                    <Hospital size={48} />
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: 14 }}>Nenhum local cadastrado ainda.</p>
                </div>
            ) : (
              <div className="shift-list">
                {locais.map(l => (
                  <div key={l.id} className="card-premium hover-card" style={{ display: "flex", alignItems: "center", padding: '12px 16px', borderRadius: "14px", marginBottom: 8, gap: '12px', position: 'relative', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} onClick={() => setLocalEmEdicao(l)}>
                    {/* Glow lateral baseado na cor do local */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                      background: l.cor_calendario || 'var(--accent-blue)',
                      boxShadow: `0 0 12px ${l.cor_calendario || 'var(--accent-blue)'}`
                    }} />

                    {/* Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingLeft: '8px', minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="truncate" style={{ maxWidth: '200px' }}>{l.nome}</span>
                        {l.is_home_care && <span style={{ fontSize: 11, background: 'rgba(34,211,181,0.1)', color: 'var(--accent-teal)', padding: '2px 8px', borderRadius: 12, fontWeight: 700, flexShrink: 0 }}><span style={{ display: "flex", alignItems: "center", gap: 4 }}><Home size={12} /> Home Care</span></span>}
                      </div>
                      
                      {l.endereco && !l.is_home_care && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <MapPin size={14} /> 
                          <span style={{ opacity: 0.8, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '200px' }}>{l.endereco}</span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', color: 'var(--text-muted)' }}
                        onClick={(e) => { e.stopPropagation(); excluirLocal(l.id, l.nome); }}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {localEmEdicao && (
        <div className="premium-modal-overlay" onClick={() => setLocalEmEdicao(null)}>
          <div className="premium-modal-card" onClick={e => e.stopPropagation()}>
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
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setLocalEmEdicao(null)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-teal)' }} onClick={salvarEdicao} disabled={saving}>{saving ? '⏳ Salvando...' : 'Salvar'}</button>
            </div>
            
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 12, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} 
              onClick={() => excluirLocal(localEmEdicao.id, localEmEdicao.nome)}
              disabled={saving}
            >
              Excluir Local e Plantões Associados
            </button>
          </div>
        </div>
      )}

      {showProModal && (
        <div className="premium-modal-overlay" onClick={() => !checkoutLoading && setShowProModal(false)}>
          <div className="premium-modal-card" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', background: '#081224', border: '1px solid rgba(80,120,255,0.15)' }}>
            <div style={{ position: 'relative', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at top, rgba(59,130,246,0.15), transparent 40%)', pointerEvents: 'none' }} />
              
              <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3B82F6', fontSize: '11px', fontWeight: 800, padding: '6px 12px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', zIndex: 1 }}>
                <Lock size={14} /> LIMITE ATINGIDO
              </div>
              
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#fff', zIndex: 1 }}>Desbloqueie Locais Ilimitados</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.5, zIndex: 1 }}>
                Você atingiu o limite de 2 locais do plano gratuito. Faça o upgrade para o PRO e tenha o controle total da sua agenda.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', zIndex: 1 }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', background: '#3B82F6', border: 'none', padding: '14px', borderRadius: '100px', fontWeight: 800, opacity: checkoutLoading ? 0.7 : 1 }} 
                  onClick={async () => {
                    setCheckoutLoading(true);
                    try {
                      const url = await handleDirectCheckout();
                      window.location.href = url;
                    } catch(err: any) {
                      setCheckoutLoading(false);
                      showToast(err.message, 'error');
                    }
                  }}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? <><Loader2 size={18} className="animate-spin mr-2" /> Processando...</> : 'Desbloquear Plano PRO'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)' }} 
                  onClick={() => setShowProModal(false)}
                  disabled={checkoutLoading}
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

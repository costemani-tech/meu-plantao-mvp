'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, LocalTrabalho } from '../../lib/supabase';

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

  const isPro = false; // Trava Freemium (Temporário local state)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLocais = useCallback(async () => {
    const { data } = await supabase.from('locais_trabalho').select('*').order('nome');
    setLocais((data as LocalTrabalho[]) ?? []);
  }, []);

  useEffect(() => { fetchLocais(); }, [fetchLocais]);

  const adicionarLocal = async () => {
    if (!nome.trim()) { showToast('Informe o nome do local.', 'error'); return; }

    if (!isPro) {
      setSaving(true);
      const { count } = await supabase.from('locais_trabalho').select('*', { count: 'exact', head: true });
      if (count !== null && count >= 2) {
        setShowProModal(true);
        setSaving(false);
        return;
      }
    } else {
      setSaving(true);
    }
    const { error } = await supabase.from('locais_trabalho').insert({ 
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

  const excluirLocal = async (id: string) => {
    if (!confirm('Tem certeza? Isso removerá o local e todos os plantões associados.')) return;
    const { error } = await supabase.from('locais_trabalho').delete().eq('id', id);
    if (error) showToast('Erro ao excluir: ' + error.message, 'error');
    else { showToast('Local removido.', 'success'); await fetchLocais(); }
  };

  return (
    <>
      <div className="page-header">
        <h1>Locais de Trabalho 🏥</h1>
        <p>Gerencie os hospitais, clínicas e atendimentos Home Care</p>
      </div>

      <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Novo Local</h2>

          <div className="form-group">
            <label className="form-label">Nome do Local *</label>
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
              Este local é de atendimento <strong>Home Care</strong> 🏠
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

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={adicionarLocal} disabled={saving}>
            {saving ? '⏳ Salvando...' : '➕ Adicionar Local'}
          </button>
        </div>

        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
            Locais Cadastrados ({locais.length})
          </h2>
          {locais.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <p>Nenhum local cadastrado ainda.</p>
            </div>
          ) : (
            <div className="shift-list">
              {locais.map(l => (
                <div key={l.id} className="shift-item" style={{ alignItems: 'center' }}>
                  <div className="shift-color-bar" style={{ backgroundColor: l.cor_calendario }} />
                  <div className="shift-info" style={{ flex: 1 }}>
                    <div className="shift-local" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {l.nome}
                      {l.is_home_care && <span style={{ fontSize: 11, background: 'rgba(34,211,181,0.1)', color: 'var(--accent-teal)', padding: '2px 6px', borderRadius: 4 }}>🏠 Home Care</span>}
                    </div>
                    {l.endereco && !l.is_home_care && (
                      <div className="shift-time" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        📍 <span style={{ opacity: 0.8 }}>{l.endereco}</span>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.endereco)}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: 'var(--accent-blue)', textDecoration: 'none', marginLeft: 4, fontWeight: 500 }}
                        >
                          Ver no Mapa ↗
                        </a>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: l.cor_calendario, flexShrink: 0, marginRight: 12
                    }}
                  />
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => excluirLocal(l.id)}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* MODAL PRO PAYWALL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⭐</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Upgrade para o Pro</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Você atingiu o limite de 2 locais do plano gratuito. Assine o Pro para gerenciar hospitais ilimitados!
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowProModal(false)}>Voltar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none' }} onClick={() => setShowProModal(false)}>Assinar Pro</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

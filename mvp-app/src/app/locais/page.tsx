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
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

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
    setSaving(true);
    const { error } = await supabase.from('locais_trabalho').insert({ nome: nome.trim(), cor_calendario: cor });
    if (error) {
      showToast('Erro ao salvar: ' + error.message, 'error');
    } else {
      showToast('✅ Local adicionado com sucesso!', 'success');
      setNome('');
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
        <p>Gerencie os hospitais e clínicas onde você faz plantão</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
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
                <div key={l.id} className="shift-item">
                  <div className="shift-color-bar" style={{ backgroundColor: l.cor_calendario }} />
                  <div className="shift-info">
                    <div className="shift-local">{l.nome}</div>
                    <div className="shift-time">
                      Cadastrado em {new Date(l.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: l.cor_calendario, flexShrink: 0
                    }}
                  />
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => excluirLocal(l.id)}
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
    </>
  );
}

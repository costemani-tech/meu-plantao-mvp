'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { BellRing, CheckCircle2, Trash2 } from 'lucide-react';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export default function NotificacoesPage() {
  const [notis, setNotis] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificacoes = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });
      
    if (data) setNotis(data as Notificacao[]);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchNotificacoes(); }, [fetchNotificacoes]);

  const marcarComoLida = async (id: string) => {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);
    if (!error) {
      setNotis(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    }
  };

  const deletarNotificacao = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id);
    if (!error) {
      setNotis(prev => prev.filter(n => n.id !== id));
    }
  };
  
  const marcarTodasLidas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', user.id).eq('lida', false);
    fetchNotificacoes();
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BellRing size={32} color="var(--accent-blue)" /> 
            Central de Avisos
          </h1>
          <p>Fique por dentro de todas as solicitações e alertas da sua equipe.</p>
        </div>
        {notis.some(n => !n.lida) && (
          <button className="btn btn-secondary" onClick={marcarTodasLidas} style={{ fontSize: 13, padding: '8px 16px' }}>
            Marcar todas como Lidas
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Sincronizando servidores...
          </div>
        ) : notis.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon" style={{ opacity: 0.5 }}><BellRing size={48} color="var(--text-muted)" /></div>
            <p>Sua caixa de notificações está cristalina! Nenhum alerta pendente.</p>
          </div>
        ) : (
          notis.map(n => (
            <div 
              key={n.id} 
              className="card" 
              style={{ 
                padding: '20px 24px', 
                borderLeft: n.lida ? '4px solid transparent' : '4px solid var(--accent-blue)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                cursor: n.lida ? 'default' : 'pointer',
                opacity: n.lida ? 0.7 : 1,
                transition: 'all 0.2s',
                marginBottom: 0
              }}
              onClick={() => !n.lida && marcarComoLida(n.id)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{n.titulo}</h3>
                  {!n.lida && <span style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>NOVO</span>}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                  {n.mensagem}
                </p>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(n.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {n.lida ? (
                  <CheckCircle2 size={20} color="var(--accent-green)" />
                ) : (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)' }} />
                )}
                <button 
                  onClick={(e) => deletarNotificacao(n.id, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                  title="Excluir notificação"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowRightLeft, MapPin, Calendar, Clock, Handshake, CheckCircle2 } from 'lucide-react';

export default function RepassesPage() {
  const [repasses, setRepasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meuId, setMeuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const fetchRepasses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMeuId(user.id);
    
    // Usa uma função nativa de alto privilégio do banco para ler dados de outros médicos
    const { data, error } = await supabase.rpc('listar_repasses_abertos');
    
    if (data) {
      setRepasses(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRepasses();
  }, []);

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAceitar = async (repasse_id: string, isMeu: boolean) => {
    if (isMeu) {
      showToast('Você não pode aceitar o seu próprio plantão.', 'error');
      return;
    }
    
    setLoading(true);
    // Chama a função atômica (Security Definer) que fará a troca de posse!
    const { error } = await supabase.rpc('aceitar_repasse', { p_repasse_id: repasse_id });
    
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('🎉 Plantão assumido com sucesso! Já está na sua agenda.', 'success');
      fetchRepasses(); // Recarrega o mural
    }
    setLoading(false);
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ArrowRightLeft size={32} color="var(--accent-violet)" /> 
          Mural de Repasses
        </h1>
        <p>Plantões disponíveis oferecidos por colegas da sua rede.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <span style={{ fontSize: 24, display: 'block', marginBottom: 12 }}>🔄</span>
          Atualizando oportunidades...
        </div>
      ) : repasses.length === 0 ? (
        <div className="card empty-state" style={{ textAlign: 'center', padding: 40 }}>
          <div className="empty-icon" style={{ opacity: 0.5 }}><Handshake size={48} color="var(--text-muted)" /></div>
          <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginTop: 16 }}>Nenhum plantão disponível no momento</h3>
          <p style={{ color: 'var(--text-secondary)' }}>A rede está silenciosa. Plantões oferecidos aparecerão aqui instantaneamente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {repasses.map(r => {
            const isMeu = r.ofertante_id === meuId;
            return (
              <div key={r.repasse_id} className="card" style={{ padding: 24, borderLeft: isMeu ? '4px solid var(--text-muted)' : '4px solid var(--accent-violet)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      OFERTADO POR
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.ofertante_email.split('@')[0]}</span>
                    {isMeu && <span style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>MEU PLANTÃO</span>}
                  </div>
                  
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={18} color="var(--accent-red)" />
                    {r.local_nome}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={16} />
                      {new Date(r.data_hora_inicio).toLocaleDateString('pt-BR')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={16} />
                      {new Date(r.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(r.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                <div>
                  <button 
                    onClick={() => handleAceitar(r.repasse_id, isMeu)}
                    disabled={isMeu}
                    className="btn" 
                    style={{ 
                      background: isMeu ? 'var(--bg-primary)' : 'var(--accent-violet)', 
                      color: isMeu ? 'var(--text-muted)' : 'white', 
                      border: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 
                    }}
                  >
                    <CheckCircle2 size={18} />
                    {isMeu ? 'Aguardando Aceite...' : 'Assumir Plantão'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

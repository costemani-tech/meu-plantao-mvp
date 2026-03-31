'use client';

import { Calendar, Building2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AgendaPublicaMock() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Cabeçalho da Agenda Pùblica */}
      <div style={{ width: '100%', maxWidth: 500, textAlign: 'center', marginBottom: 32, marginTop: 40 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #4f8ef7, #1d4ed8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(79,142,247,0.3)' }}>
          👨‍⚕️
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Agenda de Vinicius
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Médico(a) · Visualização Pública
        </p>
      </div>

      {/* Lista Fake de Plantões */}
      <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginLeft: 4 }}>Próximos Plantões</h2>
        
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
             <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} />
               </div>
               <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>Amanhã</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>07:00 às 19:00</p>
               </div>
             </div>
             <span style={{ fontSize: 11, background: 'rgba(79,142,247,0.1)', color: '#4f8ef7', padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>Confirmado</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}>
             <Building2 size={16} color="var(--text-muted)" /> Hospital Santa Cruz
          </div>
        </div>

        <div className="card" style={{ padding: 20, opacity: 0.8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
             <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} />
               </div>
               <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>Sábado, 12 Nov</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>19:00 às 07:00</p>
               </div>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}>
             <Building2 size={16} color="var(--text-muted)" /> Clínicas Integradas
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div style={{ marginTop: 60, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Gerado por Meu Plantão App</p>
        <button className="btn btn-secondary" onClick={() => router.push('/')} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 20 }}>
           Criar meu próprio calendário <ExternalLink size={14} style={{ marginLeft: 6 }} />
        </button>
      </div>

    </div>
  );
}

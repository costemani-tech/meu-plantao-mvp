'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check, Info } from 'lucide-react';

interface LocalTrabalho {
  id: string;
  nome: string;
  cor_calendario?: string;
  is_home_care?: boolean;
}

interface ShiftEditScreenProps {
  shift: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const REGRAS = [
  { id: '12x36', label: '12x36' },
  { id: '24x72', label: '24x72' },
  { id: '5x2', label: '5x2' },
  { id: '6x1', label: '6x1' },
  { id: 'custom', label: 'Personalizada' }
];

const CORES = [
  '#3b82f6', // azul
  '#8b5cf6', // roxo
  '#ef4444', // vermelho
  '#10b981', // verde
  '#f59e0b', // laranja
  '#f43f5e', // rosa
];

export function ShiftEditScreen({ shift, onSave, onCancel }: ShiftEditScreenProps) {
  const [nomeLocal, setNomeLocal] = useState(shift.local?.nome || 'Local Indefinido');
  const [cor, setCor] = useState(shift.local?.cor_calendario || '#3b82f6');
  const [regra, setRegra] = useState(shift.escala?.regra || '12x36');
  const [dataInicio, setDataInicio] = useState(shift.data_hora_inicio.substring(0, 10));
  const [horaInicio, setHoraInicio] = useState(new Date(shift.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [horaFim, setHoraFim] = useState(new Date(shift.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  
  const [previewDates, setPreviewDates] = useState<any[]>([]);

  // Lógica de cálculo do Preview
  useEffect(() => {
    const calculatePreview = () => {
      const dates = [];
      let current = new Date(`${dataInicio}T${horaInicio}:00`);
      
      for (let i = 0; i < 4; i++) {
        dates.push({
          diaSemana: current.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
          dia: current.getDate(),
          mes: current.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
          hora: horaInicio
        });

        // Simulação básica de regras
        if (regra === '12x36') current.setDate(current.getDate() + 2);
        else if (regra === '24x72') current.setDate(current.getDate() + 4);
        else if (regra === '5x2') {
           current.setDate(current.getDate() + 1);
           if (current.getDay() === 6) current.setDate(current.getDate() + 2);
           else if (current.getDay() === 0) current.setDate(current.getDate() + 1);
        }
        else current.setDate(current.getDate() + 1);
      }
      setPreviewDates(dates);
    };
    calculatePreview();
  }, [dataInicio, regra, horaInicio]);

  const h = parseInt(horaInicio.split(':')[0]);
  const turnoLabel = (h >= 18 || h < 6) ? 'Noturno' : 'Diurno';

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020617', zIndex: 100000, display: 'flex', flexDirection: 'column', color: '#fff', animation: 'slideUp 0.3s ease' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Editar Plantão</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Gerencie sua escala e preferências</p>
        </div>
        <button onClick={onCancel} style={{ background: 'rgba(30, 41, 59, 0.5)', border: 'none', color: '#fff', padding: 10, borderRadius: '50%', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 120px' }}>
        {/* Card de Contexto */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.3)', 
          border: '1px solid #1e293b', 
          borderRadius: 24, 
          padding: 20, 
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, left: -20, fontSize: 80, fontWeight: 900, color: 'rgba(59, 130, 246, 0.05)', pointerEvents: 'none' }}>HOSPITAL</div>
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{nomeLocal}</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Unidade Principal • Rio de Janeiro</div>
          </div>
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            padding: '8px 16px', 
            borderRadius: 20, 
            fontSize: 12, 
            fontWeight: 800, 
            color: '#60a5fa',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            {regra} • {turnoLabel}
          </div>
        </div>

        {/* Cores */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>Cor do Tema</label>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {CORES.map(c => (
              <button 
                key={c}
                onClick={() => setCor(c)}
                style={{ 
                  width: 44, height: 44, borderRadius: '50%', background: c, border: cor === c ? '4px solid #fff' : 'none', 
                  cursor: 'pointer', transition: 'transform 0.2s', transform: cor === c ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: cor === c ? `0 0 20px ${c}66` : 'none'
                }} 
              />
            ))}
          </div>
        </div>

        {/* Regra Chips */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>Regra da Escala</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {REGRAS.map(r => (
              <button 
                key={r.id}
                onClick={() => setRegra(r.id)}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: 20, 
                  background: regra === r.id ? 'linear-gradient(135deg, #3b82f6 0%, #2563EB 100%)' : 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid #1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: regra === r.id ? '0 10px 20px rgba(37, 99, 235, 0.3)' : 'none'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horários */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>Horário</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>ENTRADA</div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="time" 
                  value={horaInicio} 
                  onChange={e => setHoraInicio(e.target.value)}
                  style={{ width: '100%', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', borderRadius: 16, padding: '16px', color: '#fff', fontSize: 18, fontWeight: 800, outline: 'none' }} 
                />
                <Clock size={20} color="#475569" style={{ position: 'absolute', right: 16, top: 18 }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>SAÍDA</div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="time" 
                  value={horaFim} 
                  onChange={e => setHoraFim(e.target.value)}
                  style={{ width: '100%', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', borderRadius: 16, padding: '16px', color: '#fff', fontSize: 18, fontWeight: 800, outline: 'none' }} 
                />
                <Clock size={20} color="#475569" style={{ position: 'absolute', right: 16, top: 18 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Próximos Plantões */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>Próximos Plantões</label>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
            {previewDates.map((d, i) => (
              <div key={i} style={{ 
                minWidth: 100, 
                background: 'rgba(30, 41, 59, 0.3)', 
                border: '1px solid #1e293b', 
                borderRadius: 20, 
                padding: '16px 12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#60a5fa', marginBottom: 12 }}>{d.diaSemana}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{d.dia}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>{d.mes}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{d.hora}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '24px', 
        background: 'rgba(2, 6, 23, 0.8)', 
        backdropFilter: 'blur(12px)', 
        borderTop: '1px solid #1e293b',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
          <Info size={14} color="#64748b" />
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Essa regra será aplicada automaticamente nas próximas escalas.</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button 
            onClick={onCancel}
            style={{ flex: 1, padding: '18px', borderRadius: 16, background: 'transparent', border: '1px solid #1e293b', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave({ regra, horaInicio, horaFim, cor, dataInicio })}
            style={{ 
              flex: 1, 
              padding: '18px', 
              borderRadius: 16, 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563EB 100%)', 
              border: 'none', 
              color: '#fff', 
              fontWeight: 800, 
              cursor: 'pointer',
              boxShadow: '0 15px 30px rgba(37, 99, 235, 0.4)'
            }}
          >
            Salvar Alterações
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

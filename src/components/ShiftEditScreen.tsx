'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check, Info } from 'lucide-react';
import { formatDaysArray } from '../lib/date-utils';

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

        if (regra === '12x36') current.setDate(current.getDate() + 2);
        else if (regra === '24x72') current.setDate(current.getDate() + 4);
        else if (regra === '5x2' || regra === '1,2,3,4,5') {
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
      <div style={{ padding: '20px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>Editar Plantão</h1>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Gerencie sua escala e preferências</p>
        </div>
        <button onClick={onCancel} style={{ background: 'rgba(30, 41, 59, 0.5)', border: 'none', color: '#fff', padding: 8, borderRadius: '50%', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 160px' }}>
        {/* Card de Contexto */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.3)', 
          border: '1px solid #1e293b', 
          borderRadius: 20, 
          padding: 16, 
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -10, left: -10, fontSize: 60, fontWeight: 900, color: 'rgba(59, 130, 246, 0.05)', pointerEvents: 'none' }}>HOSPITAL</div>
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{nomeLocal}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{formatDaysArray(regra)} • {turnoLabel}</div>
          </div>
        </div>

        {/* Cores */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Cor do Tema</label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {CORES.map(c => (
              <button 
                key={c}
                onClick={() => setCor(c)}
                style={{ 
                  width: 38, height: 38, borderRadius: '50%', background: c, border: cor === c ? '3px solid #fff' : 'none', 
                  cursor: 'pointer', transition: 'transform 0.2s', transform: cor === c ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: cor === c ? `0 0 15px ${c}66` : 'none'
                }} 
              />
            ))}
          </div>
        </div>

        {/* Regra Chips */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Regra da Escala</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {REGRAS.map(r => (
              <button 
                key={r.id}
                onClick={() => setRegra(r.id)}
                style={{ 
                  padding: '10px 18px', 
                  borderRadius: 16, 
                  background: regra === r.id ? 'linear-gradient(135deg, #3b82f6 0%, #2563EB 100%)' : 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid #1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: regra === r.id ? '0 8px 15px rgba(37, 99, 235, 0.3)' : 'none'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horários */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Horário</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>ENTRADA</div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="time" 
                  value={horaInicio} 
                  onChange={e => setHoraInicio(e.target.value)}
                  style={{ width: '100%', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', borderRadius: 14, padding: '12px', color: '#fff', fontSize: 16, fontWeight: 800, outline: 'none' }} 
                />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>SAÍDA</div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="time" 
                  value={horaFim} 
                  onChange={e => setHoraFim(e.target.value)}
                  style={{ width: '100%', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', borderRadius: 14, padding: '12px', color: '#fff', fontSize: 16, fontWeight: 800, outline: 'none' }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Próximos Plantões */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Próximos Plantões</label>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
            {previewDates.map((d, i) => (
              <div key={i} style={{ 
                minWidth: 85, 
                background: 'rgba(30, 41, 59, 0.3)', 
                border: '1px solid #1e293b', 
                borderRadius: 16, 
                padding: '12px 8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#60a5fa', marginBottom: 8 }}>{d.diaSemana}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{d.dia}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>{d.mes}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>{d.hora}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '20px 24px', 
        background: 'rgba(2, 6, 23, 0.9)', 
        backdropFilter: 'blur(12px)', 
        borderTop: '1px solid #1e293b',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
          <Info size={12} color="#64748b" />
          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>A regra será aplicada nos próximos plantões.</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={onCancel}
            style={{ flex: 1, padding: '16px', borderRadius: 14, background: 'transparent', border: '1px solid #1e293b', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave({ regra, horaInicio, horaFim, cor, dataInicio })}
            style={{ 
              flex: 1, 
              padding: '16px', 
              borderRadius: 14, 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563EB 100%)', 
              border: 'none', 
              color: '#fff', 
              fontWeight: 800, 
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)'
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

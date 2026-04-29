'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check, Info, Building, ChevronRight } from 'lucide-react';
import { formatDaysArray } from '../lib/date-utils';

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

const DAYS_OF_WEEK = [
  { id: 1, label: 'SEG' },
  { id: 2, label: 'TER' },
  { id: 3, label: 'QUA' },
  { id: 4, label: 'QUI' },
  { id: 5, label: 'SEX' },
  { id: 6, label: 'SAB' },
  { id: 0, label: 'DOM' }
];

export function ShiftEditScreen({ shift, onSave, onCancel }: ShiftEditScreenProps) {
  const [cor, setCor] = useState(shift.local?.cor_calendario || '#3b82f6');
  const [regra, setRegra] = useState(shift.escala?.regra || '12x36');
  const [dataInicio, setDataInicio] = useState(shift.data_hora_inicio.substring(0, 10));
  const [horaInicio, setHoraInicio] = useState(new Date(shift.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [horaFim, setHoraFim] = useState(new Date(shift.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  
  const isCustomRule = regra === 'custom' || regra.includes(',') || (regra.includes('x') && !['12x36', '24x72'].includes(regra));
  const initialTipo = (regra.includes('x') && !['12x36', '24x72'].includes(regra)) ? 'horas' : 'dias';
  
  const [tipoPersonalizacao, setTipoPersonalizacao] = useState<'dias' | 'horas'>(initialTipo);
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>(regra.includes(',') ? regra.split(',').map(Number) : [1, 2, 3, 4, 5]);
  const [horasTrabalho, setHorasTrabalho] = useState(regra.includes('x') ? regra.split('x')[0] : '12');
  const [horasDescanso, setHorasDescanso] = useState(regra.includes('x') ? regra.split('x')[1] : '36');

  const [previewDates, setPreviewDates] = useState<any[]>([]);

  useEffect(() => {
    if (regra === 'custom' || isCustomRule) {
      if (regra !== 'custom') setRegra('custom');
    }
  }, [regra, isCustomRule]);

  useEffect(() => {
    const calculatePreview = () => {
      const dates = [];
      let current = new Date(`${dataInicio}T${horaInicio}:00`);
      const regraEfetiva = regra === 'custom' 
        ? (tipoPersonalizacao === 'dias' ? diasSelecionados.join(',') : `${horasTrabalho}x${horasDescanso}`) 
        : regra;

      if (!regraEfetiva) return;

      for (let i = 0; i < 5; i++) {
        if (regraEfetiva.includes('x')) {
          const [ht, hd] = regraEfetiva.split('x').map(Number);
          dates.push({
            diaSemana: current.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
            dia: current.getDate(),
            mes: current.getMonth() + 1,
            horaInicio,
            horaFim
          });
          current.setHours(current.getHours() + ht + hd);
        } else {
          const dias = regraEfetiva.split(',').map(Number);
          while (!dias.includes(current.getDay())) {
            current.setDate(current.getDate() + 1);
          }
          dates.push({
            diaSemana: current.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
            dia: current.getDate(),
            mes: current.getMonth() + 1,
            horaInicio,
            horaFim
          });
          current.setDate(current.getDate() + 1);
        }
      }
      setPreviewDates(dates);
    };
    calculatePreview();
  }, [dataInicio, regra, horaInicio, horaFim, tipoPersonalizacao, diasSelecionados, horasTrabalho, horasDescanso]);

  const h = parseInt(horaInicio.split(':')[0]);
  const turnoLabel = (h >= 18 || h < 6) ? 'Noturno' : 'Diurno';

  const toggleDia = (id: number) => {
    setDiasSelecionados(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id].sort((a, b) => a - b)
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020617', zIndex: 100000, display: 'flex', flexDirection: 'column', color: '#fff', animation: 'slideUp 0.3s ease', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Editar Plantão</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Gerencie sua escala e preferências</p>
        </div>
        <button onClick={onCancel} style={{ background: 'rgba(30, 41, 59, 0.4)', border: 'none', color: '#fff', padding: 10, borderRadius: '50%', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 180px' }}>
        {/* Hospital Context Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: 20, padding: '16px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#3b82f6', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={24} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>{shift.local?.nome || 'Upa Pacheco'}</div>
            <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
               <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
               {turnoLabel} • {formatDaysArray(regra === 'custom' ? (tipoPersonalizacao === 'dias' ? diasSelecionados.join(',') : `${horasTrabalho}x${horasDescanso}`) : regra)}
            </div>
          </div>
          <ChevronRight size={20} color="#334155" />
        </div>

        {/* Color Palette */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>Cor do Tema</label>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {CORES.map(c => (
              <button 
                key={c}
                onClick={() => setCor(c)}
                style={{ 
                  width: 44, height: 44, borderRadius: '50%', background: c, position: 'relative',
                  border: 'none', cursor: 'pointer', transition: 'transform 0.2s', transform: cor === c ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: cor === c ? `0 0 20px ${c}66` : 'none'
                }} 
              >
                {cor === c && <Check size={20} color="#fff" style={{ position: 'absolute', top: 12, left: 12 }} />}
              </button>
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
                  padding: '14px 24px', borderRadius: 16, border: '1px solid #1e293b', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  background: regra === r.id ? '#3b82f6' : 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  boxShadow: regra === r.id ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* A Partir De */}
        <div style={{ marginBottom: 32 }}>
           <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>A Partir De</label>
           <div style={{ position: 'relative', marginBottom: 8 }}>
              <input 
                type="date" 
                value={dataInicio} 
                onChange={e => setDataInicio(e.target.value)}
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: 16, padding: '16px 16px 16px 48px', color: '#fff', fontSize: 16, fontWeight: 800, outline: 'none' }} 
              />
              <Calendar size={20} color="#475569" style={{ position: 'absolute', left: 16, top: 18 }} />
           </div>
           <p style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>A partir desta data a regra será aplicada.</p>
        </div>

        {/* Custom Section */}
        {regra === 'custom' && (
          <div style={{ animation: 'fadeIn 0.3s ease', marginBottom: 32 }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>Tipo de Personalização</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
               <button 
                 onClick={() => setTipoPersonalizacao('dias')}
                 style={{ 
                   padding: '20px', borderRadius: 24, background: 'rgba(15, 23, 42, 0.6)', textAlign: 'left', cursor: 'pointer',
                   border: tipoPersonalizacao === 'dias' ? '2px solid #3b82f6' : '1px solid #1e293b', position: 'relative'
                 }}
               >
                 {tipoPersonalizacao === 'dias' && <Check size={16} color="#fff" style={{ position: 'absolute', top: 12, right: 12, background: '#3b82f6', borderRadius: '50%', padding: 2 }} />}
                 <Calendar size={24} color={tipoPersonalizacao === 'dias' ? '#3b82f6' : '#475569'} style={{ marginBottom: 16 }} />
                 <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 4 }}>Por dias da semana</div>
                 <div style={{ fontSize: 11, color: '#64748b' }}>Defina quais dias você trabalha na semana.</div>
               </button>
               <button 
                 onClick={() => setTipoPersonalizacao('horas')}
                 style={{ 
                   padding: '20px', borderRadius: 24, background: 'rgba(15, 23, 42, 0.6)', textAlign: 'left', cursor: 'pointer',
                   border: tipoPersonalizacao === 'horas' ? '2px solid #3b82f6' : '1px solid #1e293b', position: 'relative'
                 }}
               >
                 {tipoPersonalizacao === 'horas' && <Check size={16} color="#fff" style={{ position: 'absolute', top: 12, right: 12, background: '#3b82f6', borderRadius: '50%', padding: 2 }} />}
                 <Clock size={24} color={tipoPersonalizacao === 'horas' ? '#3b82f6' : '#475569'} style={{ marginBottom: 16 }} />
                 <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 4 }}>Por horas</div>
                 <div style={{ fontSize: 11, color: '#64748b' }}>Defina quantas horas trabalha e descansa.</div>
               </button>
            </div>

            {tipoPersonalizacao === 'dias' ? (
              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>Dias Trabalhados</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {DAYS_OF_WEEK.map(d => (
                    <button 
                      key={d.id}
                      onClick={() => toggleDia(d.id)}
                      style={{ 
                        padding: '14px 0', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer', position: 'relative',
                        background: diasSelecionados.includes(d.id) ? '#3b82f6' : 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid #1e293b', color: '#fff'
                      }}
                    >
                      {d.label}
                      {diasSelecionados.includes(d.id) && <Check size={10} color="#fff" style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: 1 }} />}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Horas Trabalhadas</label>
                  <input type="number" value={horasTrabalho} onChange={e => setHorasTrabalho(e.target.value)} style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: 16, padding: '16px', color: '#fff', fontSize: 18, fontWeight: 800 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Horas de Descanso</label>
                  <input type="number" value={horasDescanso} onChange={e => setHorasDescanso(e.target.value)} style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: 16, padding: '16px', color: '#fff', fontSize: 18, fontWeight: 800 }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Working Hours */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Horário de Trabalho</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="time" 
                  value={horaInicio} 
                  onChange={e => setHoraInicio(e.target.value)}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: 16, padding: '16px 16px 16px 44px', color: '#fff', fontSize: 16, fontWeight: 800, outline: 'none' }} 
                />
                <Clock size={18} color="#475569" style={{ position: 'absolute', left: 16, top: 19 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Saída</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="time" 
                  value={horaFim} 
                  onChange={e => setHoraFim(e.target.value)}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: 16, padding: '16px 16px 16px 44px', color: '#fff', fontSize: 16, fontWeight: 800, outline: 'none' }} 
                />
                <Clock size={18} color="#475569" style={{ position: 'absolute', left: 16, top: 19 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>Próximos Plantões</label>
            <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ver mais</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {previewDates.map((d, i) => (
              <div key={i} style={{ 
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: 16, padding: '12px 6px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#475569', marginBottom: 6 }}>{d.diaSemana}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{d.dia}/{d.mes < 10 ? `0${d.mes}` : d.mes}</div>
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                   <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} />
                   {d.horaInicio}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div style={{ 
        padding: '24px', background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(16px)', borderTop: '1px solid #1e293b',
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
          <Info size={14} color="#475569" />
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>A regra será aplicada nos próximos plantões.</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <button 
            onClick={onCancel}
            style={{ flex: 1, padding: '18px', borderRadius: 16, background: '#0f172a', border: '1px solid #1e293b', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              const regraFinal = regra === 'custom' 
                ? (tipoPersonalizacao === 'dias' ? diasSelecionados.join(',') : `${horasTrabalho}x${horasDescanso}`) 
                : regra;
              onSave({ regra: regraFinal, horaInicio, horaFim, cor, dataInicio });
            }}
            style={{ 
              flex: 1.5, padding: '18px', borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6 0%, #2563EB 100%)', 
              border: 'none', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)'
            }}
          >
            Salvar Alterações
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          right: 16px;
          cursor: pointer;
          width: 24px;
          height: 24px;
        }
      `}</style>
    </div>
  );
}

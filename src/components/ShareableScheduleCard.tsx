import React, { forwardRef } from 'react';
import { formatRelativeShiftDate, formatBRTTime } from '../lib/date-utils';
import { Activity } from 'lucide-react';

export interface ShiftInfo {
  id: string;
  data_hora_inicio: string;
  local: {
    nome: string;
    cor_calendario?: string;
  } | Record<string, unknown>;
  data_hora_fim?: string;
  valor?: number;
}

export interface ShareableScheduleCardProps {
  userName: string;
  monthYear: string;
  shifts: ShiftInfo[];
  totalGanhos: number;
  isPro?: boolean;
}

export const ShareableScheduleCard = forwardRef<HTMLDivElement, ShareableScheduleCardProps>(({ userName, monthYear, shifts, totalGanhos, isPro = false }, ref) => {

  // Group shifts by local/hospital
  const groupedShifts = shifts.reduce((acc, shift) => {
    const localObj = Array.isArray(shift.local) ? shift.local[0] : shift.local;
    const localName = localObj?.nome || 'Local de Trabalho';
    const localColor = localObj?.cor_calendario || '#3b82f6';

    if (!acc[localName]) {
      acc[localName] = { color: localColor, shifts: [] };
    }
    acc[localName].shifts.push(shift);
    return acc;
  }, {} as Record<string, { color: string, shifts: ShiftInfo[] }>);

  const localNames = Object.keys(groupedShifts).sort();

  return (
    <div
      ref={ref}
      style={{
        width: '400px',
        background: '#f8fafc', // bg-slate-50
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Novo Cabeçalho SaaS Clean */}
      <div style={{
        background: '#ffffff',
        padding: '24px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ 
          background: '#eff6ff', 
          width: '40px', 
          height: '40px', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#2563eb'
        }}>
          <Activity size={24} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Meu Plantão
          </h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
            Sua agenda organizada e plantões sob controle
          </p>
        </div>
      </div>

      {/* Identification */}
      <div style={{
        padding: '16px 24px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
          {userName}
        </div>
        <div style={{ fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
          {!isPro ? `${monthYear} • ${shifts.length} Plantões` : monthYear}
        </div>
      </div>

      {/* Shifts List */}
      <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
        {localNames.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px' }}>
            Nenhum plantão agendado.
          </div>
        )}

        {localNames.map(localName => {
          const group = groupedShifts[localName];
          return (
            <div key={localName} style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderLeft: `4px solid ${group.color}`,
              padding: '14px',
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {localName}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {group.shifts.map((shift, idx) => {
                  const hour = new Date(shift.data_hora_inicio).getHours();
                  const isNight = hour >= 19 || hour < 5;
                  const dateStr = formatRelativeShiftDate(shift.data_hora_inicio).split(' • ')[0];
                  const start = formatBRTTime(shift.data_hora_inicio);
                  const end = formatBRTTime(shift.data_hora_fim || new Date(new Date(shift.data_hora_inicio).getTime() + 12 * 60 * 60 * 1000).toISOString());
                  
                  return (
                    <div key={idx} style={{
                      fontSize: '11px',
                      color: '#334155',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ color: group.color, fontWeight: 800 }}>•</span>
                      <span style={{ fontWeight: 700 }}>{dateStr}</span>
                      <span style={{ opacity: 0.8 }}>•</span>
                      <span>{start} às {end}</span>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 700, 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        background: isNight ? '#f5f3ff' : '#fff7ed',
                        color: isNight ? '#7c3aed' : '#d97706',
                        marginLeft: 'auto'
                      }}>
                        {isNight ? 'Noturno' : 'Diurno'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo de Ganhos Extras */}
      {totalGanhos > 0 && (
        <div style={{ padding: '0 20px 12px 20px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '14px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
              Total a receber em extras
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
              {totalGanhos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding - Minimalista SaaS */}
      <div style={{
        padding: '16px',
        textAlign: 'center',
        fontSize: '11px',
        color: '#94a3b8',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        position: 'relative',
        zIndex: 1
      }}>
        Gerado por <span style={{ color: '#2563eb', fontWeight: 700 }}>meuplantao.com.br</span>
      </div>
    </div>
  );
});

ShareableScheduleCard.displayName = 'ShareableScheduleCard';

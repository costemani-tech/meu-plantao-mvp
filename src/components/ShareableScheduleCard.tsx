import React, { forwardRef } from 'react';
import { formatRelativeShiftDate, formatBRTTime } from '../lib/date-utils';

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
}

export const ShareableScheduleCard = forwardRef<HTMLDivElement, ShareableScheduleCardProps>(({ userName, monthYear, shifts, totalGanhos }, ref) => {

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
        background: '#f8fafc', // Very light gray/blue background for the main card
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with blue gradient */}
      <div style={{
        background: 'linear-gradient(to right, #1d4ed8, #3b82f6)',
        padding: '24px',
        color: '#ffffff',
        textAlign: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Meu Plantão</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>
          Sua agenda organizada e seus plantões sob controle
        </p>
      </div>

      {/* Identification */}
      <div style={{
        padding: '16px 24px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
          Dr(a). {userName}
        </div>
        <div style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>
          {monthYear}
        </div>
      </div>

      {/* Shifts List */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${group.color}`,
              padding: '16px',
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                {localName}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.shifts.map((shift, idx) => {
                  const hour = new Date(shift.data_hora_inicio).getHours();
                  const isNight = hour >= 19 || hour < 5;
                  const dateStr = formatRelativeShiftDate(shift.data_hora_inicio).split(' • ')[0];
                  const start = formatBRTTime(shift.data_hora_inicio);
                  const end = formatBRTTime(shift.data_hora_fim || new Date(new Date(shift.data_hora_inicio).getTime() + 12 * 60 * 60 * 1000).toISOString());
                  
                  return (
                    <div key={idx} style={{
                      fontSize: '12px',
                      color: '#475569',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      <span style={{ color: group.color, fontWeight: 800 }}>•</span>
                      <span style={{ fontWeight: 700 }}>{dateStr}</span>
                      <span style={{ opacity: 0.8 }}>•</span>
                      <span>{start} às {end}</span>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        padding: '2px 6px', 
                        borderRadius: '6px', 
                        background: isNight ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: isNight ? '#8b5cf6' : '#d97706',
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
        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              Total a receber em extras
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>
              {totalGanhos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding Viral */}
      <div style={{
        padding: '20px 16px',
        textAlign: 'center',
        background: '#eff6ff', // Blue-50
        borderTop: '1px solid #dbeafe',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', marginBottom: '4px' }}>
          🚀 Escala gerada gratuitamente pelo app Meu Plantão.
        </div>
        <div style={{ fontSize: '11px', color: '#3b82f6' }}>
          Organize a sua também em <strong>meuplantao.com.br</strong>
        </div>
      </div>
    </div>
  );
});

ShareableScheduleCard.displayName = 'ShareableScheduleCard';

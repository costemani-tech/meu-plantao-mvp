import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata o horário no fuso de Brasília (America/Sao_Paulo)
 * Essencial para o Server Side Rendering (Vercel) mostrar a hora certa.
 */
export function formatBRTTime(dateStr: string | Date): string {
  let date: Date;
  if (typeof dateStr === 'string') {
    // Força o parse como UTC se não houver fuso definido na string (comum em strings do Supabase)
    const isoStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
    date = parseISO(isoStr);
  } else {
    date = dateStr;
  }
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  }).format(date);
}

/**
 * Formata datas no padrão: "Hoje • HH:mm", "Amanhã • HH:mm", ou "dd/MM • HH:mm"
 * Sempre respeitando o fuso horário de Brasília.
 */
export function formatRelativeShiftDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  const timeStr = formatBRTTime(date);
  
  // Para comparação de hoje/amanhã no fuso BRT
  const brtNow = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo' }).format(new Date()));
  const brtDate = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo' }).format(date));
  
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();

  if (isSameDay(brtDate, brtNow)) {
    return `Hoje • ${timeStr}`;
  }
  
  const tomorrow = new Date(brtNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(brtDate, tomorrow)) {
    return `Amanhã • ${timeStr}`;
  }
  
  return `${format(date, 'dd/MM', { locale: ptBR })} • ${timeStr}`;
}

/**
 * Converte um array de dias (0-6) em texto legível (ex: "Seg a Sex")
 */
export function formatDaysArray(days: number[] | string): string {
  if (!days) return '';
  if (typeof days === 'string') {
    if (days.includes('x')) return days; // Caso de ciclo corrido
    days = days.split(',').map(Number);
  }
  
  const sortedDays = [...days].sort((a, b) => a - b);
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const str = sortedDays.join(',');
  if (str === '1,2,3,4,5') return 'Seg a Sex';
  if (str === '1,2,3,4,5,6') return 'Seg a Sáb';
  if (str === '0,1,2,3,4,5,6') return 'Todos os dias';
  if (str === '0,6') return 'Finais de Semana';
  
  let isSequence = true;
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] !== sortedDays[i-1] + 1) {
      isSequence = false;
      break;
    }
  }
  
  if (isSequence && sortedDays.length > 2) {
    return `${dayNames[sortedDays[0]]} a ${dayNames[sortedDays[sortedDays.length - 1]]}`;
  }
  
  return sortedDays.map(d => dayNames[d]).join(', ');
}

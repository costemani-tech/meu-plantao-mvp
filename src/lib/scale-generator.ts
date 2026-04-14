import { Regra } from './supabase';

export interface IntervaloTurno {
  duracaoTrabalho: number; // horas
  duracaoDescanso: number; // horas
}




export interface SlotPlantao {
  inicio: Date;
  fim: Date;
}

/**
 * Helper para extrair horas trabalhadas e totais de um formato como "12x36"
 */
function parseRegra(regra: Regra): { duracaoTrabalho: number; cicloHoras: number } {
  const parts = regra.split('x');
  const duracaoTrabalho = parseInt(parts[0], 10);
  const duracaoDescanso = parseInt(parts[1], 10);
  return { duracaoTrabalho, cicloHoras: duracaoTrabalho + duracaoDescanso };
}

/**
 * Gera os próximos `quantidade` slots de plantão a partir de uma data de início,
 * seguindo a regra de escala definida.
 */
export function gerarProximosPlantoes(
  dataInicio: Date,
  regra: Regra,
  tipoJornada: string = 'Plantonista',
  horaFim: string = '18:00',
  quantidade: number = 5
): SlotPlantao[] {
  const slots: SlotPlantao[] = [];
  const cursor = new Date(dataInicio);

  if (tipoJornada === 'Plantonista') {
    const parts = regra.split('x');
    const duracaoTrabalho = parseInt(parts[0], 10);
    const duracaoDescanso = parseInt(parts[1], 10);
    const cicloHoras = duracaoTrabalho + duracaoDescanso;

    for (let i = 0; i < quantidade; i++) {
      const inicio = new Date(cursor);
      const fim = new Date(cursor);
      fim.setHours(fim.getHours() + duracaoTrabalho);
      slots.push({ inicio, fim });
      cursor.setHours(cursor.getHours() + cicloHoras);
    }
  } else {
    const [dTrabalho, dDescanso] = regra.split('x').map(n => parseInt(n, 10));
    const [hFim, mFim] = horaFim.split(':').map(Number);
    const cicloDias = (dTrabalho || 5) + (dDescanso || 2);
    let idx = 0;
    
    while (slots.length < quantidade) {
      if (idx < (dTrabalho || 5)) {
        const inicio = new Date(cursor);
        const fim = new Date(cursor);
        fim.setHours(hFim, mFim, 0, 0);
        if (fim <= inicio) fim.setDate(fim.getDate() + 1);
        slots.push({ inicio, fim });
      }
      cursor.setDate(cursor.getDate() + 1);
      idx = (idx + 1) % cicloDias;
    }
  }

  return slots;
}

/**
 * Gera plantões para os próximos `dias` corridos a partir de uma data de início.
 */
export function gerarPlantoesParaPeriodo(
  dataInicio: Date,
  regra: Regra,
  dias: number = 90
): SlotPlantao[] {
  const dataFim = new Date(dataInicio);
  dataFim.setDate(dataFim.getDate() + dias);

  const { duracaoTrabalho, cicloHoras } = parseRegra(regra);
  const slots: SlotPlantao[] = [];

  const cursor = new Date(dataInicio);

  while (cursor < dataFim) {
    const inicio = new Date(cursor);
    const fim = new Date(cursor);
    fim.setHours(fim.getHours() + duracaoTrabalho);

    slots.push({ inicio, fim });

    cursor.setHours(cursor.getHours() + cicloHoras);
  }

  return slots;
}

export function formatarDataHora(date: Date): string {
  return date.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

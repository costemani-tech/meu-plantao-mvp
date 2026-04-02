import { Regra } from './supabase';

export interface IntervaloTurno {
  duracaoTrabalho: number; // horas
  duracaoDescanso: number; // horas
}

const regras: Record<Regra, IntervaloTurno> = {
  '12x36': { duracaoTrabalho: 12, duracaoDescanso: 36 },
  '24x48': { duracaoTrabalho: 24, duracaoDescanso: 48 },
  '24x72': { duracaoTrabalho: 24, duracaoDescanso: 72 },
};

export interface SlotPlantao {
  inicio: Date;
  fim: Date;
}

/**
 * Gera os próximos `quantidade` slots de plantão a partir de uma data de início,
 * seguindo a regra de escala definida.
 */
export function gerarProximosPlantoes(
  dataInicio: Date,
  regra: Regra,
  quantidade: number = 5
): SlotPlantao[] {
  const { duracaoTrabalho, duracaoDescanso } = regras[regra];
  const cicloHoras = duracaoTrabalho + duracaoDescanso;
  const slots: SlotPlantao[] = [];

  const cursor = new Date(dataInicio);

  for (let i = 0; i < quantidade; i++) {
    const inicio = new Date(cursor);
    const fim = new Date(cursor);
    fim.setHours(fim.getHours() + duracaoTrabalho);

    slots.push({ inicio, fim });

    cursor.setHours(cursor.getHours() + cicloHoras);
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

  const { duracaoTrabalho, duracaoDescanso } = regras[regra];
  const cicloHoras = duracaoTrabalho + duracaoDescanso;
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

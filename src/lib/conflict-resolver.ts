import { Plantao } from './supabase';

export interface Conflito {
  plantao: Plantao;
  mensagem: string;
}

/**
 * Verifica se dois intervalos de tempo se sobrepõem.
 */
export function intervalosSeOverpoem(
  inicio1: Date,
  fim1: Date,
  inicio2: Date,
  fim2: Date
): boolean {
  return inicio1 < fim2 && fim1 > inicio2;
}

/**
 * Verifica conflitos de um novo plantão contra uma lista de plantões existentes.
 * Retorna a lista de conflitos encontrados.
 */
export function verificarConflitos(
  novoInicio: Date,
  novoFim: Date,
  plantaoExistente: Plantao[]
): Conflito[] {
  const conflitos: Conflito[] = [];

  for (const plantao of plantaoExistente) {
    if (plantao.status === 'Cancelado' || plantao.status === 'Trocado') {
      continue; // Plantões cancelados/trocados não geram conflito
    }

    const existenteInicio = new Date(plantao.data_hora_inicio);
    const existenteFim = new Date(plantao.data_hora_fim);

    if (intervalosSeOverpoem(novoInicio, novoFim, existenteInicio, existenteFim)) {
      const inicioStr = existenteInicio.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const fimStr = existenteFim.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      conflitos.push({
        plantao,
        mensagem: `Conflito com plantão de ${inicioStr} até ${fimStr} (Status: ${plantao.status})`,
      });
    }
  }

  return conflitos;
}

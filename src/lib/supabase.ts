import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

// O createBrowserClient cuida de manter a sessão sincronizada entre cliente e servidor usando Cookies
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export type Regra = '12x36' | '24x48' | '24x72' | 'Outro' | string;

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  funcao: string;
  created_at: string;
}

export interface LocalTrabalho {
  id: string;
  usuario_id: string;
  nome: string;
  cor_calendario: string;
  endereco?: string;
  is_home_care?: boolean;
  ativo?: boolean;
  created_at: string;
}

export interface Escala {
  id: string;
  usuario_id: string;
  local_id: string;
  data_inicio: string;
  regra: Regra;
  created_at: string;
  local?: LocalTrabalho;
}

export interface Plantao {
  id: string;
  escala_id: string | null;
  usuario_id: string;
  local_id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  is_extra?: boolean;
  valor_ganho?: number;
  status: 'Agendado' | 'Cancelado' | 'Trocado';
  created_at: string;
  local?: LocalTrabalho;
}

export function isUserPro(email?: string | null): boolean {
  // PRO status should be verified from the database profile, not hardcoded in the frontend.
  // This is a stub, actual verification must occur via supabase profile query.
  console.warn("isUserPro() should not rely on frontend logic alone. Rely on profile fetching instead.");
  return false;
}

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// O createBrowserClient cuida automaticamente de transformar o LocalStorage em Cookies!
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

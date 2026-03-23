import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Regra = '12x36' | '24x48' | '24x72';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  funcao: string;
  created_at: string;
}

export interface LocalTrabalho {
  id: string;
  nome: string;
  cor_calendario: string;
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
  status: 'Agendado' | 'Cancelado' | 'Trocado';
  created_at: string;
  local?: LocalTrabalho;
}

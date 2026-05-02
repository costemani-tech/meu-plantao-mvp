-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: Usuarios
create table public.usuarios (
  id uuid default uuid_generate_v4() primary key,
  nome varchar not null,
  email varchar not null unique,
  funcao varchar default 'Médico',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Locais_Trabalho
create table public.locais_trabalho (
  id uuid default uuid_generate_v4() primary key,
  nome varchar not null,
  cor_calendario varchar default '#000000',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Escalas (Templates/Regras de repetição)
create table public.escalas (
  id uuid default uuid_generate_v4() primary key,
  usuario_id uuid references public.usuarios(id) on delete cascade not null,
  local_id uuid references public.locais_trabalho(id) on delete cascade not null,
  data_inicio date not null,
  regra varchar not null, -- Ex: '12x36', '24x48', '24x72'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Plantoes (Instâncias individuais geradas pela escala ou extras)
create table public.plantoes (
  id uuid default uuid_generate_v4() primary key,
  escala_id uuid references public.escalas(id) on delete cascade,    -- null se for plantão extra
  usuario_id uuid references public.usuarios(id) on delete cascade not null,
  local_id uuid references public.locais_trabalho(id) on delete cascade not null,
  data_hora_inicio timestamp with time zone not null,
  data_hora_fim timestamp with time zone not null,
  status varchar default 'Agendado', -- 'Agendado', 'Cancelado', 'Trocado'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Trocas_Plantao
create table public.trocas_plantao (
  id uuid default uuid_generate_v4() primary key,
  plantao_original_id uuid references public.plantoes(id) on delete cascade not null,
  novo_usuario_id uuid references public.usuarios(id) on delete cascade not null,
  status varchar default 'Pendente', -- 'Pendente', 'Aprovado', 'Rejeitado'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies (Simplified for MVP, assuming single tenant or open access for now)
alter table public.usuarios enable row level security;
alter table public.locais_trabalho enable row level security;
alter table public.escalas enable row level security;
alter table public.plantoes enable row level security;
alter table public.trocas_plantao enable row level security;

-- Políticas de segurança: Apenas o dono (usuário autenticado) pode ver/editar seus próprios dados
create policy "Usuários podem gerenciar seus próprios dados" on public.usuarios for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Usuários podem gerenciar seus próprios locais" on public.locais_trabalho for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "Usuários podem gerenciar suas próprias escalas" on public.escalas for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "Usuários podem gerenciar seus próprios plantões" on public.plantoes for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "Usuários podem gerenciar suas trocas de plantões" on public.trocas_plantao for all using (
  auth.uid() = novo_usuario_id or
  auth.uid() in (select usuario_id from public.plantoes where id = plantao_original_id)
) with check (
  auth.uid() = novo_usuario_id or
  auth.uid() in (select usuario_id from public.plantoes where id = plantao_original_id)
);

-- Table: profiles (Usuários e Assinaturas)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome varchar,
  email varchar unique,
  is_pro boolean default false,
  plan_type varchar default 'FREE',
  pro_expires_at timestamp with time zone,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  auto_renew boolean default false,
  mercadopago_id varchar,
  launch_offer boolean default false,
  status varchar default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: notificacoes
create table if not exists public.notificacoes (
  id uuid default uuid_generate_v4() primary key,
  usuario_id uuid references auth.users(id) on delete cascade not null,
  escala_id uuid references public.escalas(id) on delete cascade,
  data_hora_inicio timestamp with time zone not null,
  publicar_em timestamp with time zone not null,
  titulo varchar not null,
  mensagem text,
  lida boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(usuario_id, escala_id, data_hora_inicio)
);

-- RLS policies for profiles and notificacoes
alter table public.profiles enable row level security;
alter table public.notificacoes enable row level security;

create policy "Usuários podem ver e editar seu próprio perfil" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Usuários podem gerenciar suas próprias notificações" on public.notificacoes for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

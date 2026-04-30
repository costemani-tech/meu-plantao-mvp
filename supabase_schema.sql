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
  usuario_id uuid references public.usuarios(id) on delete cascade not null,
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

-- Row Level Security (RLS) Policies (Secured per user)
alter table public.usuarios enable row level security;
alter table public.locais_trabalho enable row level security;
alter table public.escalas enable row level security;
alter table public.plantoes enable row level security;
alter table public.trocas_plantao enable row level security;

create policy "Users can only access their own profile" on public.usuarios for all using (id = auth.uid()) with check (id = auth.uid());
create policy "Users can only access their own work locations" on public.locais_trabalho for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "Users can only access their own schedules" on public.escalas for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "Users can only access their own shifts" on public.plantoes for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- For shift exchanges, user can access if they are the original owner or the new assigned user
create policy "Users can access their shift exchanges" on public.trocas_plantao for all
  using (
    plantao_original_id in (select id from public.plantoes where usuario_id = auth.uid())
    or novo_usuario_id = auth.uid()
  )
  with check (
    plantao_original_id in (select id from public.plantoes where usuario_id = auth.uid())
    or novo_usuario_id = auth.uid()
  );

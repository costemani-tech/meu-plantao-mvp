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
-- Row Level Security (RLS) Policies
alter table public.usuarios enable row level security;
alter table public.locais_trabalho enable row level security;
alter table public.escalas enable row level security;
alter table public.plantoes enable row level security;
alter table public.trocas_plantao enable row level security;

-- Policies for usuarios
create policy "Users can view all profiles" on public.usuarios for select using (auth.role() = 'authenticated');
create policy "Users can insert their own profile" on public.usuarios for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.usuarios for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can delete their own profile" on public.usuarios for delete using (auth.uid() = id);

-- Policies for locais_trabalho (Assuming everyone can see them for MVP, but only authenticated can create, update, delete)
create policy "Anyone can view locais_trabalho" on public.locais_trabalho for select using (true);
create policy "Authenticated users can create locais_trabalho" on public.locais_trabalho for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update locais_trabalho" on public.locais_trabalho for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete locais_trabalho" on public.locais_trabalho for delete using (auth.role() = 'authenticated');

-- Policies for escalas
create policy "Users can view their own escalas" on public.escalas for select using (auth.uid() = usuario_id);
create policy "Users can insert their own escalas" on public.escalas for insert with check (auth.uid() = usuario_id);
create policy "Users can update their own escalas" on public.escalas for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "Users can delete their own escalas" on public.escalas for delete using (auth.uid() = usuario_id);

-- Policies for plantoes
create policy "Users can view their own plantoes" on public.plantoes for select using (auth.uid() = usuario_id);
create policy "Users can insert their own plantoes" on public.plantoes for insert with check (auth.uid() = usuario_id);
create policy "Users can update their own plantoes" on public.plantoes for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "Users can delete their own plantoes" on public.plantoes for delete using (auth.uid() = usuario_id);

-- Policies for trocas_plantao
create policy "Users can view trocas related to them" on public.trocas_plantao for select using (auth.uid() IN (novo_usuario_id, (SELECT usuario_id FROM public.plantoes WHERE id = plantao_original_id)));
create policy "Users can create trocas" on public.trocas_plantao for insert with check (auth.uid() = novo_usuario_id);
create policy "Users can update trocas related to them" on public.trocas_plantao for update using (auth.uid() IN (novo_usuario_id, (SELECT usuario_id FROM public.plantoes WHERE id = plantao_original_id)));
create policy "Users can delete trocas related to them" on public.trocas_plantao for delete using (auth.uid() IN (novo_usuario_id, (SELECT usuario_id FROM public.plantoes WHERE id = plantao_original_id)));

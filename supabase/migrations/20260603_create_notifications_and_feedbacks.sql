-- ============================================================
-- MIGRAÇÃO: Criar tabelas de Notificações e Feedbacks com RLS
-- Execute este script no Supabase > SQL Editor se necessário
-- ============================================================

-- 1. Criar Tabela de Notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  escala_id UUID REFERENCES public.escalas(id) ON DELETE CASCADE,
  data_hora_inicio TIMESTAMP WITH TIME ZONE,
  publicar_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  titulo VARCHAR NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS nas Notificações
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Notificações
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON public.notificacoes;
CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON public.notificacoes FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notificações" ON public.notificacoes;
CREATE POLICY "Usuários podem atualizar suas próprias notificações"
  ON public.notificacoes FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias notificações" ON public.notificacoes;
CREATE POLICY "Usuários podem deletar suas próprias notificações"
  ON public.notificacoes FOR DELETE USING (usuario_id = auth.uid());


-- 2. Criar Tabela de Feedbacks
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR NOT NULL,
  categoria VARCHAR DEFAULT 'Geral' NOT NULL,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS nos Feedbacks
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Feedbacks
DROP POLICY IF EXISTS "Usuários podem criar seus próprios feedbacks" ON public.feedbacks;
CREATE POLICY "Usuários podem criar seus próprios feedbacks"
  ON public.feedbacks FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem ver seus próprios feedbacks" ON public.feedbacks;
CREATE POLICY "Usuários podem ver seus próprios feedbacks"
  ON public.feedbacks FOR SELECT USING (usuario_id = auth.uid());

-- Migration: Adiciona coluna pro_expires_at na tabela profiles
-- Para rastrear a expiração do plano PRO (Oferta de Lançamento = 6 meses)
-- Execute este script no Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pro_expires_at timestamp with time zone;

-- Comentário: Quando null, significa que o usuário ainda não tem um prazo definido
-- (ex: usuários PRO legados que foram ativados manualmente).
-- O campo is_pro continua como a fonte de verdade para acesso; 
-- pro_expires_at é usado apenas para auditoria e futuras lógicas de expiração automática.

-- Migration: Ajuste de colunas conforme nova especificação técnica
-- Execute no Supabase SQL Editor

-- Remove coluna anterior se existir (limpeza)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_status;

-- Adiciona/Garante as colunas solicitadas
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_type   TEXT    DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS status      TEXT    DEFAULT 'active', -- 'active' | 'canceled' | 'expired'
  ADD COLUMN IF NOT EXISTS start_date  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_renew  BOOLEAN DEFAULT FALSE;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.plan_type IS 'FREE | PRO';
COMMENT ON COLUMN public.profiles.status IS 'Status da assinatura: active, canceled, expired';
COMMENT ON COLUMN public.profiles.auto_renew IS 'Indica se há renovação automática (False para Oferta de Lançamento)';

-- Migração de dados legados (is_pro -> plan_type)
UPDATE public.profiles
SET 
  plan_type = 'PRO',
  status = 'active',
  end_date = pro_expires_at,
  auto_renew = FALSE
WHERE is_pro = TRUE AND plan_type = 'FREE';

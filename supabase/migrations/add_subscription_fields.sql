-- Migration: Adiciona colunas de gerenciamento de assinatura na tabela profiles
-- Execute no Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_type          TEXT        DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT       DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS start_date         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_renew         BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mercadopago_id     TEXT,
  ADD COLUMN IF NOT EXISTS launch_offer       BOOLEAN     DEFAULT FALSE;

-- Migra dados existentes: usuários que já têm is_pro = true e pro_expires_at preenchido
UPDATE public.profiles
SET
  plan_type           = 'PRO',
  subscription_status = 'active',
  end_date            = pro_expires_at,
  start_date          = created_at,
  auto_renew          = FALSE,
  launch_offer        = TRUE
WHERE is_pro = TRUE
  AND pro_expires_at IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.profiles.plan_type IS 'FREE | PRO';
COMMENT ON COLUMN public.profiles.subscription_status IS 'free | active | canceled | expired';
COMMENT ON COLUMN public.profiles.end_date IS 'Data até a qual o acesso PRO está garantido';
COMMENT ON COLUMN public.profiles.auto_renew IS 'TRUE apenas para planos recorrentes (não se aplica à Oferta de Lançamento)';
COMMENT ON COLUMN public.profiles.launch_offer IS 'TRUE para assinantes da Oferta de Lançamento (R$ 9,90 / 6 meses)';
COMMENT ON COLUMN public.profiles.mercadopago_id IS 'ID do pagamento/assinatura no Mercado Pago';

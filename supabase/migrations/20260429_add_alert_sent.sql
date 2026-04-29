-- Migration: Add alert_sent column to plantoes table
-- Run this in Supabase SQL Editor (supabase.com > your project > SQL Editor)

ALTER TABLE public.plantoes
  ADD COLUMN IF NOT EXISTS alert_sent boolean DEFAULT false;

-- Index to speed up the cron query (only unalerted future shifts)
CREATE INDEX IF NOT EXISTS idx_plantoes_alert_sent_inicio
  ON public.plantoes (data_hora_inicio, alert_sent)
  WHERE alert_sent IS DISTINCT FROM true AND status != 'Cancelado';

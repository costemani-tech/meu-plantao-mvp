-- Migração para adicionar a configuração de antecedência de alerta por escala
ALTER TABLE public.escalas 
ADD COLUMN IF NOT EXISTS alerta_antecedencia_horas INTEGER DEFAULT 2;

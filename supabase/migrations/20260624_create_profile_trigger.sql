-- Migration: Criação de Trigger para criação automática de Perfil
-- Execute este script no Supabase > SQL Editor para que novos usuários cadastrados tenham seu perfil criado automaticamente.

-- 1. Criar a função que lida com o novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    is_pro, 
    plan_type, 
    status, 
    created_at, 
    auto_renew
  )
  VALUES (
    new.id,
    new.email,
    false,
    'FREE',
    'active',
    COALESCE(new.created_at, now()),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar o gatilho (trigger) na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

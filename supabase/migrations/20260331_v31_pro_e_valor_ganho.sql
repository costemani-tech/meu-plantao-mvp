-- ============================================================
-- MIGRAÇÃO: Meu Plantão v3.1
-- Execute este script no Supabase > SQL Editor
-- ============================================================

-- 1. Adicionar colunas necessárias (valor financeiro e notas) aos plantões
ALTER TABLE plantoes 
  ADD COLUMN IF NOT EXISTS valor_ganho NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notas TEXT;

-- 2. Preencher retroativamente o valor a partir do campo notas (caso exista)
UPDATE plantoes
SET valor_ganho = CAST(
    SUBSTRING(notas FROM 'R\$ ([0-9]+,[0-9]+|[0-9]+\.[0-9]+)') 
    AS NUMERIC
  )
WHERE notas LIKE 'R$ %'
  AND valor_ganho IS NULL OR valor_ganho = 0;

-- 3. Criar tabela de perfis (caso não exista ainda)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pro BOOLEAN NOT NULL DEFAULT FALSE,
  email TEXT,
  nome TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Ativar Row Level Security na tabela de perfis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Política: cada usuário só vê seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- 6. Sincronizar usuarios existentes com a tabela profiles
-- (insere quem ainda não tem registro)
INSERT INTO profiles (id, email, is_pro)
SELECT 
  u.id,
  u.email,
  TRUE   -- <-- TODOS OS CADASTRADOS FICAM PRO!
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Marcar TODOS os perfis existentes como Pro
UPDATE profiles SET is_pro = TRUE;

-- 8. ✅ Verificação final
SELECT 
  p.email,
  p.is_pro,
  p.created_at
FROM profiles p
ORDER BY p.created_at;

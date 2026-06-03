-- ============================================================
-- MIGRAÇÃO: Enviar Notificação de Termos e LGPD a todos os usuários
-- Execute este script no Painel do Supabase > SQL Editor
-- ============================================================

INSERT INTO public.notificacoes (usuario_id, titulo, mensagem, publicar_em)
SELECT id, 
       'Termos de Uso e Privacidade' AS titulo, 
       'Atualizamos nossos Termos de Uso e Política de Privacidade de acordo com a LGPD. Também adicionamos a opção de exclusão definitiva de conta na aba Meu Plano.' AS mensagem,
       now() AS publicar_em
FROM public.usuarios;

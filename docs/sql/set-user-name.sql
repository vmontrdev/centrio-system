-- Execute no SQL Editor do Supabase depois de substituir o nome e o e-mail.
-- Atualiza apenas o nome de exibição da conta indicada e preserva os demais metadados.
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('full_name', 'SEU NOME')
where email = 'SEU_EMAIL'
returning email, raw_user_meta_data ->> 'full_name' as full_name;

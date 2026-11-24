-- Simple Chess: run AFTER the account "Crb" was created on Simple Chess.
-- Makes Crb the permanent owner (root): owner, developer and admin roles that can never be removed.
update public.admin_config set root_id = (select id from public.profiles where username = 'Crb') where id = 1 and root_id is null;
do $$ begin
  if (select root_id from public.admin_config where id = 1) is null then raise exception 'No account "Crb" yet: create it on Simple Chess first, then run this file again.'; end if;
end $$;
update public.profiles set roles = (select array_agg(distinct x) from unnest(roles || array['owner', 'developer', 'admin']) x) where username = 'Crb';
-- then set the admin password with one separate statement (never put it in a file):
--   update public.admin_config set password_hash = extensions.crypt('YOUR-ADMIN-PASSWORD', extensions.gen_salt('bf', 10)) where id = 1;

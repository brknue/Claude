-- Simple Chess add-on: Crb's highest privileges can never be taken away.
-- Run once in Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.
-- Needs add-admin.sql first.
--
-- Crb's account becomes the permanent "root" account (stored by its account id, so renaming does not matter):
--  * it always has the owner, developer and admin roles: any change that removes them is undone automatically,
--    whoever makes it (admins, other owners, the account itself, or a direct database update);
--  * it can never be banned, and it can never be deleted;
--  * only root can change the admin password and only root can give or take the owner role,
--    so nobody else can lock root out of the admin panel;
--  * nobody but root can reset root's password, rename root or change root's roles.

alter table public.admin_config add column if not exists root_id uuid;
update public.admin_config set root_id = (select id from public.profiles where username = 'Crb')
where id = 1 and root_id is null;
do $$ begin
  if (select root_id from public.admin_config where id = 1) is null then raise exception 'No account "Crb" found: create it on the site first, then run this file again.'; end if;
end $$;

create or replace function public.is_root(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p is not null and p = (select root_id from public.admin_config where id = 1);
$$;

-- every update of the root profile keeps the top roles and clears any ban
create or replace function public.protect_root_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_root(old.id) then
    new.roles := (select array_agg(distinct x order by x) from unnest(coalesce(new.roles, '{}') || array['owner', 'developer', 'admin']) x);
    new.banned_until := null;
    new.ban_reason := null;
  end if;
  return new;
end $$;
drop trigger if exists protect_root_update on public.profiles;
create trigger protect_root_update before update on public.profiles for each row execute function public.protect_root_update();

-- the root profile (and so the root account, which cascades to it) can never be deleted
create or replace function public.protect_root_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_root(old.id) then raise exception 'this account is protected and cannot be deleted'; end if;
  return old;
end $$;
drop trigger if exists protect_root_delete on public.profiles;
create trigger protect_root_delete before delete on public.profiles for each row execute function public.protect_root_delete();

-- the admin config row (admin password, root) can only change through root's own actions
create or replace function public.protect_root_config() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.root_id is not null and new.root_id is distinct from old.root_id then raise exception 'the root account cannot be changed'; end if;
  return new;
end $$;
drop trigger if exists protect_root_config on public.admin_config;
create trigger protect_root_config before update on public.admin_config for each row execute function public.protect_root_config();

-- make sure root has the roles right now
update public.profiles set roles = roles where id = (select root_id from public.admin_config where id = 1);

-- only root may change the admin password
create or replace function public.admin_change_password(p_new text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check();
begin
  if not public.is_root(uid) then raise exception 'only Crb can change the admin password'; end if;
  if length(coalesce(p_new, '')) < 8 then raise exception 'password must be at least 8 characters'; end if;
  update public.admin_config set password_hash = extensions.crypt(p_new, extensions.gen_salt('bf', 10)) where id = 1;
  delete from public.admin_sessions where user_id <> uid;
  perform public.admin_log_add('changed admin password', null, null);
end $$;

-- roles: nobody but root touches root; only root gives or takes owner; owners give or take admin
create or replace function public.admin_set_roles(p_id uuid, p_roles text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check(); old text[]; r text;
begin
  select roles into old from public.profiles where id = p_id;
  if public.is_root(p_id) and p_id <> uid then raise exception 'only Crb can change this account'; end if;
  if public.is_owner(p_id) and p_id <> uid and not public.is_root(uid) then raise exception 'only the owner can do that'; end if;
  foreach r in array coalesce(p_roles, '{}') loop if not public.known_role(r) then raise exception 'unknown role %', r; end if; end loop;
  if ('owner' = any(p_roles)) <> ('owner' = any(old)) and not public.is_root(uid) then raise exception 'only Crb can give or take the owner role'; end if;
  if ('admin' = any(p_roles)) <> ('admin' = any(old)) and not public.is_owner(uid) then raise exception 'only the owner can change admin access'; end if;
  update public.profiles set roles = (select coalesce(array_agg(distinct x), '{}') from unnest(p_roles) x) where id = p_id;
  if not ('admin' = any(p_roles) or 'owner' = any(p_roles)) and not public.is_root(p_id) then delete from public.admin_sessions where user_id = p_id; end if;
  perform public.admin_log_add('set roles', (select username::text from public.profiles where id = p_id), jsonb_build_object('from', old, 'to', p_roles));
end $$;

create or replace function public.admin_set_password(p_id uuid, p_new text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check();
begin
  if length(coalesce(p_new, '')) < 8 or length(p_new) > 72 then raise exception 'password must be 8 to 72 characters'; end if;
  if public.is_root(p_id) and p_id <> uid then raise exception 'only Crb can change this account'; end if;
  if public.is_owner(p_id) and p_id <> uid and not public.is_root(uid) then raise exception 'only the owner can do that'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now() where id = p_id;
  perform public.admin_log_add('reset password', (select username::text from public.profiles where id = p_id), null);
end $$;

create or replace function public.admin_rename(p_id uuid, p_username text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check(); old text;
begin
  if public.is_root(p_id) and p_id <> uid then raise exception 'only Crb can change this account'; end if;
  if public.is_owner(p_id) and p_id <> uid and not public.is_root(uid) then raise exception 'only the owner can do that'; end if;
  if p_username !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'bad username'; end if;
  select username::text into old from public.profiles where id = p_id;
  update public.profiles set username = p_username where id = p_id;
  perform public.admin_log_add('rename', old, jsonb_build_object('to', p_username));
end $$;

create or replace function public.admin_reset_ratings(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check();
begin
  if public.is_root(p_id) and p_id <> uid then raise exception 'only Crb can change this account'; end if;
  delete from public.ratings where user_id = p_id;
  perform public.admin_log_add('reset ratings', (select username::text from public.profiles where id = p_id), null);
end $$;

create or replace function public.admin_set_rating(p_id uuid, p_mode text, p_rating int) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check(); old int;
begin
  if public.is_root(p_id) and p_id <> uid then raise exception 'only Crb can change this account'; end if;
  if p_mode !~ '^[a-z0-9]{2,20}$' then raise exception 'bad mode'; end if;
  if p_rating < 100 or p_rating > 4000 then raise exception 'rating must be 100 to 4000'; end if;
  select rating into old from public.ratings where user_id = p_id and mode = p_mode;
  insert into public.ratings (user_id, mode, rating, peak) values (p_id, p_mode, p_rating, p_rating)
    on conflict (user_id, mode) do update set rating = p_rating, peak = greatest(public.ratings.peak, p_rating);
  perform public.admin_log_add('set rating', (select username::text from public.profiles where id = p_id), jsonb_build_object('mode', p_mode, 'from', old, 'to', p_rating));
end $$;

create or replace function public.admin_clear_messages(p_id uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check(); n int;
begin
  if public.is_root(p_id) and p_id <> uid then raise exception 'only Crb can change this account'; end if;
  delete from public.messages where from_id = p_id;
  get diagnostics n = row_count;
  perform public.admin_log_add('delete messages', (select username::text from public.profiles where id = p_id), jsonb_build_object('count', n));
  return n;
end $$;

-- admin status tells the panel who is root
create or replace function public.admin_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('admin', public.is_admin_role(auth.uid()), 'owner', public.is_owner(auth.uid()), 'root', public.is_root(auth.uid()),
    'unlocked', exists (select 1 from public.admin_sessions where user_id = auth.uid() and expires_at > now()));
$$;

revoke execute on function public.is_root(uuid), public.protect_root_update(), public.protect_root_delete(), public.protect_root_config() from public, anon, authenticated;
revoke execute on function public.admin_change_password(text), public.admin_set_roles(uuid, text[]), public.admin_set_password(uuid, text), public.admin_rename(uuid, text),
  public.admin_reset_ratings(uuid), public.admin_set_rating(uuid, text, int), public.admin_clear_messages(uuid), public.admin_status() from public, anon;
grant execute on function public.admin_change_password(text), public.admin_set_roles(uuid, text[]), public.admin_set_password(uuid, text), public.admin_rename(uuid, text),
  public.admin_reset_ratings(uuid), public.admin_set_rating(uuid, text, int), public.admin_clear_messages(uuid), public.admin_status() to authenticated;

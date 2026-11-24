-- Simple Chess add-on: chess titles (GM, IM, WGM …) and extra brilliant moves, set in the admin panel.
-- Run once in Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.
-- Needs add-brilliants.sql, add-admin.sql and add-admin-protect.sql first.

alter table public.profiles add column if not exists title text;
alter table public.profiles add column if not exists brilliant_bonus int not null default 0;
do $$ begin
  alter table public.profiles add constraint profiles_title_check check (title is null or title in
    ('GM', 'IM', 'FM', 'CM', 'NM', 'WGM', 'WIM', 'WFM', 'WCM', 'WNM', 'LM', 'IA', 'FA', 'FT', 'FST', 'BOT'));
exception when duplicate_object then null; end $$;

-- brilliant moves now include the ones an admin added
create or replace function public.brilliant_stats(p_username text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'total', greatest(0, coalesce(sum(case when g.white_id = p.id then coalesce(g.white_brilliant, 0) else coalesce(g.black_brilliant, 0) end), 0) + p.brilliant_bonus),
    'games', count(*) filter (where (g.white_id = p.id and g.white_brilliant > 0) or (g.black_id = p.id and g.black_brilliant > 0)),
    'reviewed', count(*) filter (where g.reviewed_at is not null))
  from public.profiles p
  left join public.games g on (g.white_id = p.id or g.black_id = p.id) and g.status in ('finished', 'disputed')
  where auth.uid() is not null and p.username = p_username::extensions.citext
  group by p.id, p.brilliant_bonus;
$$;

-- badges and titles for a list of names (public; any spelling)
create or replace function public.names_info(p_names text[]) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(lower(p.username::text), jsonb_build_object('r', p.roles, 't', p.title)), '{}'::jsonb)
  from public.profiles p
  where lower(p.username::text) in (select lower(x) from unnest(p_names) x) and (cardinality(p.roles) > 0 or p.title is not null);
$$;

create or replace function public.admin_user_extra(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_check();
  return (select jsonb_build_object('title', title, 'brilliant_bonus', brilliant_bonus) from public.profiles where id = p_id);
end $$;

create or replace function public.admin_set_title(p_id uuid, p_title text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check(); old text;
begin
  if public.is_root(p_id) and p_id <> uid then raise exception 'only Crb can change this account'; end if;
  select title into old from public.profiles where id = p_id;
  update public.profiles set title = nullif(p_title, '') where id = p_id;
  perform public.admin_log_add('set title', (select username::text from public.profiles where id = p_id), jsonb_build_object('from', old, 'to', nullif(p_title, '')));
end $$;

-- add (or with a negative number remove) brilliant moves on a profile
create or replace function public.admin_add_brilliants(p_id uuid, p_count int) returns int
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check(); b int;
begin
  if public.is_root(p_id) and p_id <> uid then raise exception 'only Crb can change this account'; end if;
  if abs(coalesce(p_count, 0)) > 100000 then raise exception 'too many'; end if;
  update public.profiles set brilliant_bonus = brilliant_bonus + coalesce(p_count, 0) where id = p_id returning brilliant_bonus into b;
  perform public.admin_log_add('add brilliant moves', (select username::text from public.profiles where id = p_id), jsonb_build_object('added', p_count, 'bonus_now', b));
  return b;
end $$;

revoke execute on function public.names_info(text[]), public.admin_user_extra(uuid), public.admin_set_title(uuid, text), public.admin_add_brilliants(uuid, int), public.brilliant_stats(text) from public, anon, authenticated;
grant execute on function public.names_info(text[]) to anon, authenticated;
grant execute on function public.admin_user_extra(uuid), public.admin_set_title(uuid, text), public.admin_add_brilliants(uuid, int), public.brilliant_stats(text) to authenticated;

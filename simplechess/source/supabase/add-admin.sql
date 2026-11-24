-- Simple Chess add-on: admin panel, roles with badges, bans, announcements, audit log.
-- Run once in Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.
-- Needs schema.sql (and the other add-ons) first. The account "Crb" must exist: it becomes the owner.
--
-- Security:
--  * Admin tools need BOTH an account with the admin (or owner) role AND the admin password.
--  * The admin password is never in this file or in the website: only a bcrypt hash is stored, set with
--    one separate statement in the SQL editor (see the end of this file).
--  * Unlocking gives a 30-minute admin session, checked by the server on every admin action.
--  * 5 wrong passwords lock the admin login for 15 minutes. Every admin action is written to the audit log.

alter table public.profiles add column if not exists roles text[] not null default '{}';
alter table public.profiles add column if not exists banned_until timestamptz;
alter table public.profiles add column if not exists ban_reason text;

create table if not exists public.admin_config (
  id int primary key default 1 check (id = 1),
  password_hash text,
  announcement text check (length(announcement) <= 500),
  announcement_level text not null default 'info' check (announcement_level in ('info', 'warning', 'success')),
  announcement_at timestamptz
);
insert into public.admin_config (id) values (1) on conflict do nothing;

create table if not exists public.admin_sessions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  expires_at timestamptz not null
);
create table if not exists public.admin_attempts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  at timestamptz not null default now()
);
create table if not exists public.admin_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  admin_name text,
  action text not null,
  target text,
  detail jsonb,
  at timestamptz not null default now()
);
alter table public.admin_config enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_attempts enable row level security;
alter table public.admin_log enable row level security;

-- the roles a badge can show; 'owner' and 'admin' are also permissions
create or replace function public.known_role(r text) returns boolean
language sql immutable set search_path = '' as $$
  select r in ('owner', 'developer', 'admin', 'moderator', 'tester', 'helper', 'vip', 'streamer', 'translator', 'contributor', 'champion', 'coach', 'supporter', 'verified');
$$;

-- banned players cannot use any account feature (every function starts with me())
create or replace function public.me() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare b timestamptz; reason text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select banned_until, ban_reason into b, reason from public.profiles where id = auth.uid();
  if b is not null and b > now() then raise exception 'banned until % (%)', to_char(b, 'YYYY-MM-DD HH24:MI'), coalesce(reason, '-'); end if;
  return auth.uid();
end $$;

create or replace function public.is_admin_role(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = p and ('admin' = any(roles) or 'owner' = any(roles)));
$$;
create or replace function public.is_owner(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = p and 'owner' = any(roles));
$$;

-- every admin action: admin role + unlocked session
create or replace function public.admin_check() returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not public.is_admin_role(uid) then raise exception 'not an admin'; end if;
  if not exists (select 1 from public.admin_sessions where user_id = uid and expires_at > now()) then raise exception 'admin locked'; end if;
  update public.admin_sessions set expires_at = greatest(expires_at, now() + interval '15 minutes') where user_id = uid;
  return uid;
end $$;

create or replace function public.admin_log_add(p_action text, p_target text, p_detail jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.admin_log (admin_id, admin_name, action, target, detail)
  values (auth.uid(), (select username::text from public.profiles where id = auth.uid()), p_action, p_target, p_detail);
$$;

-- ---------------------------------------------------------------- unlock
create or replace function public.admin_unlock(p_password text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); h text;
begin
  if uid is null or not public.is_admin_role(uid) then raise exception 'not an admin'; end if;
  if (select count(*) from public.admin_attempts where user_id = uid and at > now() - interval '15 minutes') >= 5 then raise exception 'too many attempts, try again in 15 minutes'; end if;
  select password_hash into h from public.admin_config where id = 1;
  if h is null then raise exception 'admin password not set'; end if;
  if extensions.crypt(coalesce(p_password, ''), h) <> h then
    insert into public.admin_attempts (user_id) values (uid);
    perform public.admin_log_add('unlock failed', null, null);
    return jsonb_build_object('ok', false);
  end if;
  delete from public.admin_attempts where user_id = uid;
  insert into public.admin_sessions (user_id, expires_at) values (uid, now() + interval '30 minutes')
    on conflict (user_id) do update set expires_at = excluded.expires_at;
  perform public.admin_log_add('unlocked', null, null);
  return jsonb_build_object('ok', true, 'owner', public.is_owner(uid));
end $$;

create or replace function public.admin_lock() returns void
language sql security definer set search_path = '' as $$
  delete from public.admin_sessions where user_id = auth.uid();
$$;

create or replace function public.admin_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('admin', public.is_admin_role(auth.uid()), 'owner', public.is_owner(auth.uid()),
    'unlocked', exists (select 1 from public.admin_sessions where user_id = auth.uid() and expires_at > now()));
$$;

-- owner only: change the admin password (needs an unlocked session too)
create or replace function public.admin_change_password(p_new text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check();
begin
  if not public.is_owner(uid) then raise exception 'owner only'; end if;
  if length(coalesce(p_new, '')) < 8 then raise exception 'password must be at least 8 characters'; end if;
  update public.admin_config set password_hash = extensions.crypt(p_new, extensions.gen_salt('bf', 10)) where id = 1;
  delete from public.admin_sessions where user_id <> uid;
  perform public.admin_log_add('changed admin password', null, null);
end $$;

-- ---------------------------------------------------------------- dashboard
create or replace function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_check();
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'new_24h', (select count(*) from public.profiles where created_at > now() - interval '24 hours'),
    'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'online', (select count(*) from public.profiles where last_seen > now() - interval '2 minutes'),
    'active_24h', (select count(*) from public.profiles where last_seen > now() - interval '24 hours'),
    'banned', (select count(*) from public.profiles where banned_until > now()),
    'games_24h', (select count(*) from public.games where created_at > now() - interval '24 hours'),
    'games_total', (select count(*) from public.games),
    'live_games', (select count(*) from public.games where status = 'live' and kind in ('friend', 'online') and updated_at > now() - interval '3 minutes'),
    'daily_games', (select count(*) from public.games where kind = 'daily' and status = 'live'),
    'messages_24h', (select count(*) from public.messages where created_at > now() - interval '24 hours'),
    'puzzle_today', (select count(*) from public.puzzle_days where kind = 'daily' and period = (now() at time zone 'utc')::date),
    'friendships', (select count(*) from public.friendships where status = 'accepted'),
    'signups_by_day', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d), '[]'::jsonb) from (
      select (created_at at time zone 'utc')::date d, count(*) n from public.profiles where created_at > now() - interval '14 days' group by 1) x));
end $$;

-- ---------------------------------------------------------------- users
create or replace function public.admin_users(p_query text, p_filter text, p_limit int) returns setof jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_check();
  return query select jsonb_build_object('id', p.id, 'username', p.username, 'created_at', p.created_at, 'last_seen', p.last_seen, 'roles', p.roles,
      'banned_until', p.banned_until, 'ban_reason', p.ban_reason,
      'games', (select count(*) from public.games g where g.white_id = p.id or g.black_id = p.id),
      'best', (select max(rating) from public.ratings r where r.user_id = p.id and r.mode <> 'puzzle'))
    from public.profiles p
    where (coalesce(p_query, '') = '' or p.username ilike '%' || replace(replace(p_query, '%', ''), '_', '\_') || '%')
      and (coalesce(p_filter, 'all') = 'all'
        or (p_filter = 'staff' and cardinality(p.roles) > 0)
        or (p_filter = 'banned' and p.banned_until > now())
        or (p_filter = 'online' and p.last_seen > now() - interval '2 minutes')
        or (p_filter = 'new' and p.created_at > now() - interval '7 days'))
    order by case when p_filter = 'online' then p.last_seen else p.created_at end desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200);
end $$;

create or replace function public.admin_user(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_check();
  return (select jsonb_build_object('id', p.id, 'username', p.username, 'created_at', p.created_at, 'last_seen', p.last_seen, 'roles', p.roles,
      'banned_until', p.banned_until, 'ban_reason', p.ban_reason, 'rating_visibility', p.rating_visibility, 'policy_version', p.policy_version,
      'ratings', public.ratings_json(p.id),
      'friends', (select count(*) from public.friendships f where (f.requester = p.id or f.addressee = p.id) and f.status = 'accepted'),
      'games', (select count(*) from public.games g where g.white_id = p.id or g.black_id = p.id),
      'messages_sent', (select count(*) from public.messages m where m.from_id = p.id),
      'daily_solved', (select count(*) from public.puzzle_days d where d.user_id = p.id and d.solved),
      'recent_games', (select coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) from (
        select jsonb_build_object('id', g.id, 'kind', g.kind, 'variant', g.variant, 'white', g.white_name, 'black', g.black_name, 'result', g.result, 'status', g.status, 'rated', g.rated, 'created_at', g.created_at) x
        from public.games g where g.white_id = p.id or g.black_id = p.id order by g.created_at desc limit 15) y))
    from public.profiles p where p.id = p_id);
end $$;

create or replace function public.admin_set_password(p_id uuid, p_new text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check();
begin
  if length(coalesce(p_new, '')) < 8 or length(p_new) > 72 then raise exception 'password must be 8 to 72 characters'; end if;
  if public.is_owner(p_id) and p_id <> uid then raise exception 'only the owner can do that'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now() where id = p_id;
  perform public.admin_log_add('reset password', (select username::text from public.profiles where id = p_id), null);
end $$;

-- set a rating (give / take Elo). p_mode e.g. blitz, rapid, daily, puzzle, chess960 …
create or replace function public.admin_set_rating(p_id uuid, p_mode text, p_rating int) returns void
language plpgsql security definer set search_path = '' as $$
declare old int;
begin
  perform public.admin_check();
  if p_mode !~ '^[a-z0-9]{2,20}$' then raise exception 'bad mode'; end if;
  if p_rating < 100 or p_rating > 4000 then raise exception 'rating must be 100 to 4000'; end if;
  select rating into old from public.ratings where user_id = p_id and mode = p_mode;
  insert into public.ratings (user_id, mode, rating, peak) values (p_id, p_mode, p_rating, p_rating)
    on conflict (user_id, mode) do update set rating = p_rating, peak = greatest(public.ratings.peak, p_rating);
  perform public.admin_log_add('set rating', (select username::text from public.profiles where id = p_id), jsonb_build_object('mode', p_mode, 'from', old, 'to', p_rating));
end $$;

create or replace function public.admin_set_roles(p_id uuid, p_roles text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check(); old text[]; r text;
begin
  select roles into old from public.profiles where id = p_id;
  if public.is_owner(p_id) and p_id <> uid then raise exception 'only the owner can do that'; end if;
  foreach r in array coalesce(p_roles, '{}') loop if not public.known_role(r) then raise exception 'unknown role %', r; end if; end loop;
  -- only the owner may give or take admin / owner, and the owner role cannot be removed from yourself
  if not public.is_owner(uid) and (('admin' = any(p_roles)) <> ('admin' = any(old)) or ('owner' = any(p_roles)) <> ('owner' = any(old))) then raise exception 'only the owner can change admin access'; end if;
  if p_id = uid and 'owner' = any(old) and not ('owner' = any(p_roles)) then raise exception 'you cannot remove your own owner role'; end if;
  update public.profiles set roles = (select coalesce(array_agg(distinct x), '{}') from unnest(p_roles) x) where id = p_id;
  if not ('admin' = any(p_roles) or 'owner' = any(p_roles)) then delete from public.admin_sessions where user_id = p_id; end if;
  perform public.admin_log_add('set roles', (select username::text from public.profiles where id = p_id), jsonb_build_object('from', old, 'to', p_roles));
end $$;

create or replace function public.admin_ban(p_id uuid, p_hours int, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check();
begin
  if p_id = uid then raise exception 'you cannot ban yourself'; end if;
  if public.is_owner(p_id) then raise exception 'the owner cannot be banned'; end if;
  if public.is_admin_role(p_id) and not public.is_owner(uid) then raise exception 'only the owner can ban an admin'; end if;
  update public.profiles set banned_until = case when coalesce(p_hours, 0) <= 0 then null else now() + make_interval(hours => p_hours) end,
    ban_reason = case when coalesce(p_hours, 0) <= 0 then null else left(p_reason, 200) end where id = p_id;
  perform public.admin_log_add(case when coalesce(p_hours, 0) <= 0 then 'unban' else 'ban' end, (select username::text from public.profiles where id = p_id), jsonb_build_object('hours', p_hours, 'reason', p_reason));
end $$;

create or replace function public.admin_rename(p_id uuid, p_username text) returns void
language plpgsql security definer set search_path = '' as $$
declare old text;
begin
  if public.is_owner(p_id) and p_id <> public.admin_check() then raise exception 'only the owner can do that'; end if;
  perform public.admin_check();
  if p_username !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'bad username'; end if;
  select username::text into old from public.profiles where id = p_id;
  update public.profiles set username = p_username where id = p_id;
  perform public.admin_log_add('rename', old, jsonb_build_object('to', p_username));
end $$;

create or replace function public.admin_delete_user(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.admin_check(); name text;
begin
  if p_id = uid then raise exception 'use your own profile to delete yourself'; end if;
  if public.is_owner(p_id) then raise exception 'the owner cannot be deleted'; end if;
  if public.is_admin_role(p_id) and not public.is_owner(uid) then raise exception 'only the owner can delete an admin'; end if;
  select username::text into name from public.profiles where id = p_id;
  update public.games set white_name = 'Deleted player' where white_id = p_id;
  update public.games set black_name = 'Deleted player' where black_id = p_id;
  delete from public.games where (white_id = p_id and (black_id is null or black_id = p_id)) or (black_id = p_id and white_id is null);
  delete from auth.users where id = p_id;
  perform public.admin_log_add('delete user', name, null);
end $$;

create or replace function public.admin_clear_messages(p_id uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform public.admin_check();
  delete from public.messages where from_id = p_id;
  get diagnostics n = row_count;
  perform public.admin_log_add('delete messages', (select username::text from public.profiles where id = p_id), jsonb_build_object('count', n));
  return n;
end $$;

create or replace function public.admin_reset_ratings(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_check();
  delete from public.ratings where user_id = p_id;
  perform public.admin_log_add('reset ratings', (select username::text from public.profiles where id = p_id), null);
end $$;

-- ---------------------------------------------------------------- games
create or replace function public.admin_games(p_filter text, p_limit int) returns setof jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_check();
  return query select jsonb_build_object('id', g.id, 'kind', g.kind, 'variant', g.variant, 'white', g.white_name, 'black', g.black_name, 'status', g.status,
      'result', g.result, 'rated', g.rated, 'moves', coalesce(array_length(string_to_array(nullif(g.moves, ''), ' '), 1), 0), 'created_at', g.created_at, 'updated_at', g.updated_at)
    from public.games g
    where coalesce(p_filter, 'recent') = 'recent'
      or (p_filter = 'live' and g.status = 'live' and g.kind <> 'daily')
      or (p_filter = 'daily' and g.kind = 'daily' and g.status in ('live', 'pending'))
      or (p_filter = 'disputed' and g.status = 'disputed')
      or (p_filter = 'rated' and g.rated)
    order by g.updated_at desc limit least(greatest(coalesce(p_limit, 50), 1), 200);
end $$;

-- end a game: result '1-0' | '0-1' | '1/2-1/2' (rated games update ratings), or null to abort
create or replace function public.admin_end_game(p_id uuid, p_result text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_check();
  if p_result is null then update public.games set status = 'aborted', reason = 'aborted by an admin', ended_at = now(), updated_at = now() where id = p_id and status in ('live', 'pending', 'disputed');
  else
    update public.games set status = 'live' where id = p_id and status = 'disputed';
    perform public.apply_result(p_id, p_result, 'decided by an admin');
  end if;
  perform public.admin_log_add('end game', p_id::text, jsonb_build_object('result', p_result));
end $$;

-- ---------------------------------------------------------------- announcements (shown to everyone)
create or replace function public.admin_announce(p_text text, p_level text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_check();
  update public.admin_config set announcement = nullif(btrim(left(coalesce(p_text, ''), 500)), ''),
    announcement_level = case when p_level in ('info', 'warning', 'success') then p_level else 'info' end, announcement_at = now() where id = 1;
  perform public.admin_log_add('announcement', null, jsonb_build_object('text', p_text, 'level', p_level));
end $$;

create or replace function public.get_announcement() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when announcement is null then null else jsonb_build_object('text', announcement, 'level', announcement_level, 'at', announcement_at) end
  from public.admin_config where id = 1;
$$;

create or replace function public.admin_log_list(p_limit int) returns setof jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_check();
  return query select to_jsonb(l) - 'admin_id' from public.admin_log l order by l.id desc limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;

-- ---------------------------------------------------------------- badges (public)
create or replace function public.roles_of(p_names text[]) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(lower(p.username::text), p.roles), '{}'::jsonb)
  from public.profiles p where p.username = any(p_names::extensions.citext[]) and cardinality(p.roles) > 0;
$$;

-- my_profile also returns my roles (keeps rating_visibility from add-rating-privacy.sql)
create or replace function public.my_profile() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'username', p.username, 'created_at', p.created_at, 'ratings', public.ratings_json(p.id),
    'rating_visibility', p.rating_visibility, 'roles', p.roles, 'banned_until', case when p.banned_until > now() then p.banned_until end, 'ban_reason', case when p.banned_until > now() then p.ban_reason end)
  from public.profiles p where p.id = auth.uid();
$$;

-- ---------------------------------------------------------------- the owner
update public.profiles set roles = (select array_agg(distinct x) from unnest(roles || array['owner', 'developer', 'admin']) x) where username = 'Crb';
do $$ begin
  if not exists (select 1 from public.profiles where username = 'Crb') then raise notice 'No account "Crb" yet: create it on the site, then run this file again.'; end if;
end $$;

-- ---------------------------------------------------------------- permissions
revoke all on public.admin_config, public.admin_sessions, public.admin_attempts, public.admin_log from anon, authenticated;
revoke execute on function public.known_role(text), public.is_admin_role(uuid), public.is_owner(uuid), public.admin_check(), public.admin_log_add(text, text, jsonb),
  public.admin_unlock(text), public.admin_lock(), public.admin_status(), public.admin_change_password(text), public.admin_stats(), public.admin_users(text, text, int),
  public.admin_user(uuid), public.admin_set_password(uuid, text), public.admin_set_rating(uuid, text, int), public.admin_set_roles(uuid, text[]), public.admin_ban(uuid, int, text),
  public.admin_rename(uuid, text), public.admin_delete_user(uuid), public.admin_clear_messages(uuid), public.admin_reset_ratings(uuid), public.admin_games(text, int),
  public.admin_end_game(uuid, text), public.admin_announce(text, text), public.get_announcement(), public.admin_log_list(int), public.roles_of(text[]), public.my_profile(), public.me()
  from public, anon, authenticated;
grant execute on function public.admin_unlock(text), public.admin_lock(), public.admin_status(), public.admin_change_password(text), public.admin_stats(), public.admin_users(text, text, int),
  public.admin_user(uuid), public.admin_set_password(uuid, text), public.admin_set_rating(uuid, text, int), public.admin_set_roles(uuid, text[]), public.admin_ban(uuid, int, text),
  public.admin_rename(uuid, text), public.admin_delete_user(uuid), public.admin_clear_messages(uuid), public.admin_reset_ratings(uuid), public.admin_games(text, int),
  public.admin_end_game(uuid, text), public.admin_announce(text, text), public.admin_log_list(int), public.my_profile(), public.me() to authenticated;
grant execute on function public.get_announcement(), public.roles_of(text[]) to anon, authenticated;

-- ---------------------------------------------------------------- set the admin password (run separately, never commit it):
--   update public.admin_config set password_hash = extensions.crypt('YOUR-ADMIN-PASSWORD', extensions.gen_salt('bf', 10)) where id = 1;

-- Simple Chess: the whole database in one file, for a NEW Supabase project of its own.
-- Supabase -> SQL Editor -> New query -> paste this whole file -> Run. Safe to run again.
-- Then create the account "Crb" on Simple Chess and run finish-admin.sql.

-- ==================================================================== schema.sql
-- Simple Chess accounts: run this whole file once in Supabase → SQL Editor → New query → Run.
-- Safe to run again (it drops and recreates only Simple Chess's own functions; tables are kept).
--
-- Design:
--  * No e-mail addresses are collected. Each account gets a random sign-in address
--    (<random>@rookstorm.invalid) that never receives mail; players sign in with username + password.
--  * Forgotten passwords are reset with a recovery code shown once at sign-up (stored only as a bcrypt hash).
--  * Every table has row-level security with no direct write access: the app talks to the database
--    only through the functions below, which check who is calling (auth.uid()).
--  * Ratings are computed here on the server, never by the browser.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------- tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  recovery_hash text not null,
  recovery_fails int not null default 0,
  recovery_locked_until timestamptz,
  consent_at timestamptz not null default now(),
  policy_version text not null default '1',
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table if not exists public.ratings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode ~ '^[a-z0-9]{2,20}$'),
  rating int not null default 1500,
  peak int not null default 1500,
  games int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  draws int not null default 0,
  primary key (user_id, mode)
);

create table if not exists public.friendships (
  requester uuid not null references public.profiles(id) on delete cascade,
  addressee uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  white_id uuid references public.profiles(id) on delete set null,
  black_id uuid references public.profiles(id) on delete set null,
  white_name text not null check (length(white_name) <= 40),
  black_name text not null check (length(black_name) <= 40),
  kind text not null check (kind in ('bot', 'local', 'friend', 'online')),
  variant text not null check (variant ~ '^[a-z0-9]{2,20}$'),
  time_base real not null default 0,
  time_inc int not null default 0,
  rated boolean not null default false,
  mode text,
  start_fen text not null check (length(start_fen) <= 120),
  moves text not null default '' check (length(moves) <= 12000),
  clocks jsonb,
  status text not null default 'live' check (status in ('pending', 'live', 'finished', 'aborted', 'disputed')),
  result text check (result in ('1-0', '0-1', '1/2-1/2')),
  reason text check (length(reason) <= 80),
  white_claim text, black_claim text, claim_reason text,
  white_rating int, black_rating int, white_diff int, black_diff int,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists games_white on public.games (white_id, created_at desc);
create index if not exists games_black on public.games (black_id, created_at desc);
create index if not exists games_live on public.games (status, updated_at);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  variant text not null check (variant ~ '^[a-z0-9]{2,20}$'),
  time_base real not null default 0,
  time_inc int not null default 0,
  color text not null check (color in ('white', 'black', 'random')),
  rated boolean not null default false,
  code text not null check (code ~ '^[a-z0-9]{4,16}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists challenges_to on public.challenges (to_id, status, created_at desc);

alter table public.profiles enable row level security;
alter table public.ratings enable row level security;
alter table public.friendships enable row level security;
alter table public.games enable row level security;
alter table public.challenges enable row level security;

-- ---------------------------------------------------------------- helpers
create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.friendships f where f.status = 'accepted'
    and ((f.requester = a and f.addressee = b) or (f.requester = b and f.addressee = a)));
$$;

create or replace function public.can_view_game(g public.games) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    g.white_id = auth.uid() or g.black_id = auth.uid()
    or (g.white_id is not null and public.are_friends(auth.uid(), g.white_id))
    or (g.black_id is not null and public.are_friends(auth.uid(), g.black_id)));
$$;

-- Read access needed for live updates (Supabase Realtime respects these policies).
drop policy if exists games_read on public.games;
create policy games_read on public.games for select to authenticated using (public.can_view_game(games));
drop policy if exists challenges_read on public.challenges;
create policy challenges_read on public.challenges for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());

create or replace function public.rating_mode(p_variant text, p_base real, p_inc int) returns text
language sql immutable set search_path = '' as $$
  select case
    when p_variant <> 'standard' then p_variant
    when p_base <= 0 then null
    when p_base * 60 + 40 * p_inc < 180 then 'bullet'
    when p_base * 60 + 40 * p_inc < 480 then 'blitz'
    when p_base * 60 + 40 * p_inc < 1500 then 'rapid'
    else 'classical' end;
$$;

create or replace function public.me() returns uuid
language plpgsql stable set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  return auth.uid();
end $$;

create or replace function public.ratings_json(p_user uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(r.mode, jsonb_build_object('r', r.rating, 'g', r.games, 'w', r.wins, 'l', r.losses, 'd', r.draws, 'p', r.peak)), '{}'::jsonb)
  from public.ratings r where r.user_id = p_user;
$$;

-- ---------------------------------------------------------------- account
create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_username ~ '^[A-Za-z0-9_]{3,20}$' and not exists (select 1 from public.profiles where username = p_username::extensions.citext);
$$;

-- Sign-in address for a username (random, not personal data).
create or replace function public.login_email(p_username text) returns text
language sql stable security definer set search_path = '' as $$
  select u.email from public.profiles p join auth.users u on u.id = p.id where p.username = p_username::extensions.citext;
$$;

create or replace function public.create_profile(p_username text, p_recovery text, p_policy text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.me();
  if p_username !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'bad username'; end if;
  if length(p_recovery) < 16 then raise exception 'bad recovery code'; end if;
  insert into public.profiles (id, username, recovery_hash, policy_version)
  values (auth.uid(), p_username, extensions.crypt(p_recovery, extensions.gen_salt('bf', 8)), left(p_policy, 10));
end $$;

create or replace function public.set_recovery(p_recovery text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.me();
  if length(p_recovery) < 16 then raise exception 'bad recovery code'; end if;
  update public.profiles set recovery_hash = extensions.crypt(p_recovery, extensions.gen_salt('bf', 8)), recovery_fails = 0 where id = auth.uid();
end $$;

-- Reset a forgotten password with the recovery code. Locks for 15 minutes after 5 wrong codes.
create or replace function public.reset_password(p_username text, p_recovery text, p_new text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  if length(p_new) < 8 or length(p_new) > 72 then raise exception 'password must be 8 to 72 characters'; end if;
  select * into p from public.profiles where username = p_username::extensions.citext;
  if not found then perform pg_sleep(0.3); return false; end if;
  if p.recovery_locked_until is not null and p.recovery_locked_until > now() then raise exception 'too many attempts, try again in 15 minutes'; end if;
  if extensions.crypt(p_recovery, p.recovery_hash) <> p.recovery_hash then
    update public.profiles set
      recovery_locked_until = case when recovery_fails + 1 >= 5 then now() + interval '15 minutes' else null end,
      recovery_fails = case when recovery_fails + 1 >= 5 then 0 else recovery_fails + 1 end
      where id = p.id;
    return false;
  end if;
  update auth.users set encrypted_password = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now() where id = p.id;
  update public.profiles set recovery_fails = 0, recovery_locked_until = null where id = p.id;
  return true;
end $$;

create or replace function public.rename(p_username text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.me();
  if p_username !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'bad username'; end if;
  update public.profiles set username = p_username where id = auth.uid();
end $$;

create or replace function public.touch() returns void
language sql security definer set search_path = '' as $$
  update public.profiles set last_seen = now() where id = auth.uid();
$$;

create or replace function public.my_profile() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'username', p.username, 'created_at', p.created_at, 'ratings', public.ratings_json(p.id))
  from public.profiles p where p.id = auth.uid();
$$;

-- Public card for any player; ratings, last seen and game count only for yourself and friends.
create or replace function public.get_profile(p_username text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare p public.profiles; rel text := 'none'; full_access boolean;
begin
  perform public.me();
  select * into p from public.profiles where username = p_username::extensions.citext;
  if not found then return null; end if;
  if p.id = auth.uid() then rel := 'self';
  elsif public.are_friends(auth.uid(), p.id) then rel := 'friend';
  elsif exists (select 1 from public.friendships where requester = auth.uid() and addressee = p.id) then rel := 'outgoing';
  elsif exists (select 1 from public.friendships where requester = p.id and addressee = auth.uid()) then rel := 'incoming';
  end if;
  full_access := rel in ('self', 'friend');
  return jsonb_build_object('id', p.id, 'username', p.username, 'created_at', p.created_at, 'relation', rel,
    'ratings', case when full_access then public.ratings_json(p.id) end,
    'last_seen', case when full_access then p.last_seen end,
    'games', case when full_access then (select count(*) from public.games g where (g.white_id = p.id or g.black_id = p.id) and g.status in ('finished', 'disputed')) end,
    'live', case when full_access then (select g.id from public.games g where (g.white_id = p.id or g.black_id = p.id) and g.status = 'live' and g.updated_at > now() - interval '3 minutes' order by g.updated_at desc limit 1) end);
end $$;

create or replace function public.search_users(p_query text) returns table (username text)
language sql stable security definer set search_path = '' as $$
  select p.username::text from public.profiles p
  where auth.uid() is not null and length(p_query) >= 2 and p.username ilike replace(replace(p_query, '%', ''), '_', '\_') || '%' and p.id <> auth.uid()
  order by length(p.username), p.username limit 10;
$$;

-- GDPR: everything stored about you, as JSON.
create or replace function public.export_my_data() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'profile', (select jsonb_build_object('username', username, 'created_at', created_at, 'last_seen', last_seen, 'consent_at', consent_at, 'policy_version', policy_version) from public.profiles where id = auth.uid()),
    'ratings', public.ratings_json(auth.uid()),
    'friends', (select coalesce(jsonb_agg(jsonb_build_object('with', p.username, 'status', f.status, 'since', f.created_at, 'requested_by_me', f.requester = auth.uid())), '[]'::jsonb)
                from public.friendships f join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
                where f.requester = auth.uid() or f.addressee = auth.uid()),
    'games', (select coalesce(jsonb_agg(to_jsonb(g) - 'white_claim' - 'black_claim' - 'claim_reason' order by g.created_at), '[]'::jsonb)
              from public.games g where g.white_id = auth.uid() or g.black_id = auth.uid()),
    'challenges', (select coalesce(jsonb_agg(to_jsonb(c) - 'code'), '[]'::jsonb) from public.challenges c where c.from_id = auth.uid() or c.to_id = auth.uid()));
$$;

-- GDPR: delete the account and everything linked to it. Opponents keep their copy of shared games, with your name removed.
create or replace function public.delete_account() returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me();
begin
  update public.games set white_name = 'Deleted player' where white_id = uid;
  update public.games set black_name = 'Deleted player' where black_id = uid;
  delete from public.games where (white_id = uid and (black_id is null or black_id = uid)) or (black_id = uid and white_id is null);
  delete from auth.users where id = uid;
end $$;

-- ---------------------------------------------------------------- friends
create or replace function public.friend_request(p_username text) returns text
language plpgsql security definer set search_path = '' as $$
declare other uuid; uid uuid := public.me();
begin
  select id into other from public.profiles where username = p_username::extensions.citext;
  if other is null then raise exception 'player not found'; end if;
  if other = uid then raise exception 'that is you'; end if;
  if public.are_friends(uid, other) then return 'friends'; end if;
  -- they already asked me: accept
  if exists (select 1 from public.friendships where requester = other and addressee = uid) then
    update public.friendships set status = 'accepted' where requester = other and addressee = uid;
    return 'accepted';
  end if;
  if (select count(*) from public.friendships where requester = uid and status = 'pending') >= 50 then raise exception 'too many open requests'; end if;
  insert into public.friendships (requester, addressee) values (uid, other) on conflict do nothing;
  return 'sent';
end $$;

create or replace function public.friend_respond(p_other uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.me();
  if p_accept then update public.friendships set status = 'accepted' where requester = p_other and addressee = auth.uid();
  else delete from public.friendships where requester = p_other and addressee = auth.uid(); end if;
end $$;

create or replace function public.friend_remove(p_other uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.friendships where (requester = auth.uid() and addressee = p_other) or (requester = p_other and addressee = auth.uid());
$$;

create or replace function public.list_friends() returns table (id uuid, username text, relation text, last_seen timestamptz, live uuid, ratings jsonb)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username::text,
    case when f.status = 'accepted' then 'friend' when f.requester = auth.uid() then 'outgoing' else 'incoming' end,
    case when f.status = 'accepted' then p.last_seen end,
    case when f.status = 'accepted' then (select g.id from public.games g where (g.white_id = p.id or g.black_id = p.id) and g.status = 'live' and g.updated_at > now() - interval '3 minutes' order by g.updated_at desc limit 1) end,
    case when f.status = 'accepted' then public.ratings_json(p.id) end
  from public.friendships f join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() is not null and (f.requester = auth.uid() or f.addressee = auth.uid())
  order by f.status, p.last_seen desc;
$$;

-- ---------------------------------------------------------------- games
create or replace function public.start_game(p_kind text, p_variant text, p_base real, p_inc int, p_my_color text,
  p_me_name text, p_opp_name text, p_opp uuid, p_rated boolean, p_start_fen text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me(); gid uuid; mode text; rated boolean;
begin
  if p_my_color not in ('white', 'black') then raise exception 'bad color'; end if;
  if (select count(*) from public.games where created_by = uid and created_at > now() - interval '1 minute') >= 20 then raise exception 'slow down'; end if;
  mode := public.rating_mode(p_variant, p_base, p_inc);
  rated := coalesce(p_rated, false) and p_opp is not null and p_opp <> uid and p_kind in ('friend', 'online') and mode is not null;
  if p_kind = 'friend' and rated and not public.are_friends(uid, p_opp) then rated := false; end if;
  insert into public.games (white_id, black_id, white_name, black_name, kind, variant, time_base, time_inc, rated, mode, start_fen, status, created_by)
  values (
    case when p_my_color = 'white' then uid else p_opp end,
    case when p_my_color = 'black' then uid else p_opp end,
    left(case when p_my_color = 'white' then p_me_name else p_opp_name end, 40),
    left(case when p_my_color = 'black' then p_me_name else p_opp_name end, 40),
    p_kind, p_variant, greatest(0, p_base), greatest(0, p_inc), rated, case when rated then mode end, p_start_fen,
    case when p_opp is not null and p_opp <> uid then 'pending' else 'live' end, uid)
  returning id into gid;
  return gid;
end $$;

-- The invited player confirms they are in this game (only then can it be rated).
create or replace function public.confirm_game(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare g public.games;
begin
  perform public.me();
  update public.games set status = 'live', updated_at = now()
    where id = p_id and status = 'pending' and created_by <> auth.uid() and (white_id = auth.uid() or black_id = auth.uid())
    returning * into g;
  if not found then return null; end if;
  return jsonb_build_object('id', g.id, 'rated', g.rated, 'mode', g.mode);
end $$;

create or replace function public.push_moves(p_id uuid, p_moves text, p_clocks jsonb) returns void
language sql security definer set search_path = '' as $$
  update public.games set moves = left(p_moves, 12000), clocks = p_clocks, updated_at = now()
  where id = p_id and status in ('live', 'pending') and (white_id = auth.uid() or black_id = auth.uid() or created_by = auth.uid());
$$;

create or replace function public.apply_result(p_id uuid, p_result text, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare g public.games; rw int; rb int; gw int; gb int; ew float; sw float; kw int; kb int; dw int; db int;
begin
  select * into g from public.games where id = p_id for update;
  if g.status in ('finished', 'aborted', 'disputed') then return; end if;
  if g.rated and g.white_id is not null and g.black_id is not null and g.status = 'live' and array_length(string_to_array(nullif(g.moves, ''), ' '), 1) >= 2 then
    insert into public.ratings (user_id, mode) values (g.white_id, g.mode), (g.black_id, g.mode) on conflict do nothing;
    select rating, games into rw, gw from public.ratings where user_id = g.white_id and mode = g.mode for update;
    select rating, games into rb, gb from public.ratings where user_id = g.black_id and mode = g.mode for update;
    ew := 1 / (1 + power(10, (rb - rw) / 400.0));
    sw := case p_result when '1-0' then 1 when '0-1' then 0 else 0.5 end;
    kw := case when gw < 30 then 40 else 20 end; kb := case when gb < 30 then 40 else 20 end;
    dw := round(kw * (sw - ew)); db := round(kb * ((1 - sw) - (1 - ew)));
    update public.ratings set rating = greatest(100, rating + dw), peak = greatest(peak, rating + dw), games = games + 1,
      wins = wins + (sw = 1)::int, losses = losses + (sw = 0)::int, draws = draws + (sw = 0.5)::int where user_id = g.white_id and mode = g.mode;
    update public.ratings set rating = greatest(100, rating + db), peak = greatest(peak, rating + db), games = games + 1,
      wins = wins + (sw = 0)::int, losses = losses + (sw = 1)::int, draws = draws + (sw = 0.5)::int where user_id = g.black_id and mode = g.mode;
    update public.games set status = 'finished', result = p_result, reason = left(p_reason, 80), ended_at = now(), updated_at = now(),
      white_rating = rw, black_rating = rb, white_diff = dw, black_diff = db where id = p_id;
  elsif array_length(string_to_array(nullif(g.moves, ''), ' '), 1) is null then
    update public.games set status = 'aborted', result = p_result, reason = left(p_reason, 80), ended_at = now(), updated_at = now() where id = p_id;
  else
    update public.games set status = 'finished', rated = false, result = p_result, reason = left(p_reason, 80), ended_at = now(), updated_at = now() where id = p_id;
  end if;
end $$;

-- Settle games where only one player reported a result more than 10 minutes ago (the other left).
create or replace function public.settle_stale() returns void
language plpgsql security definer set search_path = '' as $$
declare g record;
begin
  for g in select id, coalesce(white_claim, black_claim) as claim, claim_reason from public.games
    where status = 'live' and (white_claim is null) <> (black_claim is null) and updated_at < now() - interval '10 minutes' limit 50 loop
    perform public.apply_result(g.id, g.claim, g.claim_reason);
  end loop;
  -- games nobody touched for a day are closed without a result
  update public.games set status = 'aborted', ended_at = now() where status in ('live', 'pending') and updated_at < now() - interval '1 day';
end $$;

create or replace function public.finish_game(p_id uuid, p_result text, p_reason text, p_moves text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare g public.games; uid uuid := public.me(); two boolean;
begin
  if p_result not in ('1-0', '0-1', '1/2-1/2') then raise exception 'bad result'; end if;
  select * into g from public.games where id = p_id for update;
  if not found or not (g.white_id = uid or g.black_id = uid or g.created_by = uid) then raise exception 'not your game'; end if;
  if g.status not in ('live', 'pending') then return jsonb_build_object('status', g.status, 'result', g.result, 'white_diff', g.white_diff, 'black_diff', g.black_diff); end if;
  if p_moves is not null and length(p_moves) >= length(g.moves) then update public.games set moves = left(p_moves, 12000) where id = p_id; end if;
  two := g.white_id is not null and g.black_id is not null and g.white_id <> g.black_id and g.status = 'live';
  if not two then
    perform public.apply_result(p_id, p_result, p_reason);
  else
    if g.white_id = uid then update public.games set white_claim = p_result, claim_reason = coalesce(claim_reason, left(p_reason, 80)), updated_at = now() where id = p_id;
    else update public.games set black_claim = p_result, claim_reason = coalesce(claim_reason, left(p_reason, 80)), updated_at = now() where id = p_id; end if;
    select * into g from public.games where id = p_id;
    if g.white_claim is not null and g.black_claim is not null then
      if g.white_claim = g.black_claim then perform public.apply_result(p_id, g.white_claim, g.claim_reason);
      else update public.games set status = 'disputed', ended_at = now(), updated_at = now() where id = p_id; end if;
    end if;
  end if;
  perform public.settle_stale();
  select * into g from public.games where id = p_id;
  return jsonb_build_object('status', g.status, 'result', g.result, 'white_diff', g.white_diff, 'black_diff', g.black_diff, 'white_rating', g.white_rating, 'black_rating', g.black_rating);
end $$;

create or replace function public.game_list(p_username text, p_before timestamptz, p_limit int) returns setof jsonb
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid;
begin
  perform public.me();
  select id into uid from public.profiles where username = p_username::extensions.citext;
  if uid is null or not (uid = auth.uid() or public.are_friends(auth.uid(), uid)) then return; end if;
  return query select to_jsonb(g) - 'white_claim' - 'black_claim' - 'claim_reason' - 'created_by'
    from public.games g where (g.white_id = uid or g.black_id = uid) and g.status <> 'pending'
      and (p_before is null or g.created_at < p_before)
    order by g.created_at desc limit least(greatest(p_limit, 1), 50);
end $$;

create or replace function public.get_game(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(g) - 'white_claim' - 'black_claim' - 'claim_reason' - 'created_by' from public.games g where g.id = p_id and public.can_view_game(g);
$$;

-- ---------------------------------------------------------------- puzzles
create or replace function public.puzzle_result(p_puzzle_rating int, p_win boolean) returns int
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me(); r int; n int; k int; e float; d int;
begin
  insert into public.ratings (user_id, mode) values (uid, 'puzzle') on conflict do nothing;
  select rating, games into r, n from public.ratings where user_id = uid and mode = 'puzzle' for update;
  k := case when n < 20 then 48 when n < 60 then 32 else 20 end;
  e := 1 / (1 + power(10, (least(greatest(p_puzzle_rating, 300), 3300) - r) / 400.0));
  d := round(k * ((case when p_win then 1 else 0 end) - e));
  update public.ratings set rating = greatest(100, rating + d), peak = greatest(peak, rating + d), games = games + 1,
    wins = wins + p_win::int, losses = losses + (not p_win)::int where user_id = uid and mode = 'puzzle';
  return d;
end $$;

-- ---------------------------------------------------------------- challenges
create or replace function public.challenge_send(p_to uuid, p_variant text, p_base real, p_inc int, p_color text, p_rated boolean, p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me(); cid uuid;
begin
  if not public.are_friends(uid, p_to) then raise exception 'you can only challenge friends'; end if;
  if (select count(*) from public.challenges where from_id = uid and status = 'pending' and created_at > now() - interval '10 minutes') >= 5 then raise exception 'too many open challenges'; end if;
  insert into public.challenges (from_id, to_id, variant, time_base, time_inc, color, rated, code)
  values (uid, p_to, p_variant, greatest(0, p_base), greatest(0, p_inc), p_color, coalesce(p_rated, false), p_code) returning id into cid;
  return cid;
end $$;

create or replace function public.challenge_respond(p_id uuid, p_accept boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare c public.challenges;
begin
  perform public.me();
  update public.challenges set status = case when p_accept then 'accepted' else 'declined' end
    where id = p_id and to_id = auth.uid() and status = 'pending' and created_at > now() - interval '10 minutes' returning * into c;
  if not found then return null; end if;
  return case when p_accept then c.code end;
end $$;

create or replace function public.challenge_cancel(p_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.challenges set status = 'cancelled' where id = p_id and from_id = auth.uid() and status = 'pending';
$$;

create or replace function public.my_challenges() returns table (id uuid, from_name text, to_name text, incoming boolean, variant text, time_base real, time_inc int, color text, rated boolean, status text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, pf.username::text, pt.username::text, c.to_id = auth.uid(), c.variant, c.time_base, c.time_inc, c.color, c.rated, c.status, c.created_at
  from public.challenges c join public.profiles pf on pf.id = c.from_id join public.profiles pt on pt.id = c.to_id
  where (c.to_id = auth.uid() or c.from_id = auth.uid()) and c.status = 'pending' and c.created_at > now() - interval '10 minutes'
  order by c.created_at desc limit 20;
$$;

-- ---------------------------------------------------------------- permissions
revoke all on all tables in schema public from anon, authenticated;
grant select on public.games, public.challenges to authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.username_available(text), public.login_email(text), public.reset_password(text, text, text) to anon, authenticated;
grant execute on function
  public.are_friends(uuid, uuid), public.can_view_game(public.games), public.create_profile(text, text, text), public.set_recovery(text),
  public.rename(text), public.touch(), public.my_profile(), public.get_profile(text), public.search_users(text), public.export_my_data(),
  public.delete_account(), public.friend_request(text), public.friend_respond(uuid, boolean), public.friend_remove(uuid), public.list_friends(),
  public.start_game(text, text, real, int, text, text, text, uuid, boolean, text), public.confirm_game(uuid), public.push_moves(uuid, text, jsonb),
  public.finish_game(uuid, text, text, text), public.game_list(text, timestamptz, int), public.get_game(uuid), public.puzzle_result(int, boolean),
  public.challenge_send(uuid, text, real, int, text, boolean, text), public.challenge_respond(uuid, boolean), public.challenge_cancel(uuid), public.my_challenges()
  to authenticated;

-- live updates for spectators and challenge notifications
do $$ begin
  begin alter publication supabase_realtime add table public.games; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.challenges; exception when duplicate_object then null; end;
end $$;

-- ==================================================================== add-brilliants.sql
-- Simple Chess add-on: brilliant moves on profiles.
-- Run once in Supabase → SQL Editor → New query → Run (after schema.sql). Safe to run again.

alter table public.games add column if not exists white_brilliant int;
alter table public.games add column if not exists black_brilliant int;
alter table public.games add column if not exists brilliant_plies text;   -- e.g. "13,40": plies (1-based) of the brilliant moves
alter table public.games add column if not exists reviewed_at timestamptz;

-- A player of a finished game saves the result of the automatic game review.
create or replace function public.save_review(p_id uuid, p_white int, p_black int, p_plies text) returns void
language plpgsql security definer set search_path = '' as $$
declare g public.games; n int;
begin
  perform public.me();
  select * into g from public.games where id = p_id;
  if not found or not (g.white_id = auth.uid() or g.black_id = auth.uid()) then return; end if;
  if g.status not in ('finished', 'disputed', 'aborted') then return; end if;
  n := coalesce(array_length(string_to_array(nullif(g.moves, ''), ' '), 1), 0);
  update public.games set
    white_brilliant = least(greatest(coalesce(p_white, 0), 0), (n + 1) / 2),
    black_brilliant = least(greatest(coalesce(p_black, 0), 0), n / 2),
    brilliant_plies = left(regexp_replace(coalesce(p_plies, ''), '[^0-9,]', '', 'g'), 400),
    reviewed_at = now()
  where id = p_id;
end $$;

-- Brilliant-move totals of any player (visible to everyone signed in).
create or replace function public.brilliant_stats(p_username text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'total', coalesce(sum(case when g.white_id = p.id then coalesce(g.white_brilliant, 0) else coalesce(g.black_brilliant, 0) end), 0),
    'games', count(*) filter (where (g.white_id = p.id and g.white_brilliant > 0) or (g.black_id = p.id and g.black_brilliant > 0)),
    'reviewed', count(*) filter (where g.reviewed_at is not null))
  from public.profiles p
  left join public.games g on (g.white_id = p.id or g.black_id = p.id) and g.status in ('finished', 'disputed')
  where auth.uid() is not null and p.username = p_username::extensions.citext
  group by p.id;
$$;

-- Games of a player that still need the automatic review (only your own).
create or replace function public.unreviewed_games(p_limit int) returns setof jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', g.id, 'variant', g.variant, 'start_fen', g.start_fen, 'moves', g.moves)
  from public.games g
  where auth.uid() is not null and (g.white_id = auth.uid() or g.black_id = auth.uid())
    and g.status in ('finished', 'disputed') and g.reviewed_at is null and g.variant in ('standard', 'chess960')
    and g.moves <> '' and g.created_at > now() - interval '60 days'
  order by g.created_at desc limit least(greatest(p_limit, 1), 10);
$$;

revoke execute on function public.save_review(uuid, int, int, text), public.brilliant_stats(text), public.unreviewed_games(int) from public, anon;
grant execute on function public.save_review(uuid, int, int, text), public.brilliant_stats(text), public.unreviewed_games(int) to authenticated;

-- ==================================================================== add-social.sql
-- Simple Chess add-on: chat with friends, sending games, daily (correspondence) games with their own rating,
-- and notification checks for the Android app.
-- Run once in Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.
-- Needs schema.sql first.

-- ---------------------------------------------------------------- chat
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '' check (length(body) <= 1000),
  game jsonb check (game is null or length(game::text) <= 14000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (from_id <> to_id),
  check (length(body) > 0 or game is not null)
);
create index if not exists messages_pair on public.messages (least(from_id, to_id), greatest(from_id, to_id), id desc);
create index if not exists messages_unread on public.messages (to_id, read_at) where read_at is null;
alter table public.messages enable row level security;
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());

-- Send a text and/or a game to a friend. game = {variant, start_fen, moves, white, black, result, id?, date?}
create or replace function public.send_message(p_to uuid, p_body text, p_game jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me(); mid bigint; b text := btrim(coalesce(p_body, ''));
begin
  if not public.are_friends(uid, p_to) then raise exception 'you can only message friends'; end if;
  if length(b) = 0 and p_game is null then raise exception 'empty message'; end if;
  if (select count(*) from public.messages where from_id = uid and created_at > now() - interval '1 minute') >= 30 then raise exception 'slow down'; end if;
  insert into public.messages (from_id, to_id, body, game)
  values (uid, p_to, left(b, 1000), case when p_game is null then null else jsonb_build_object(
    'id', p_game->>'id', 'variant', left(p_game->>'variant', 20), 'start_fen', left(p_game->>'start_fen', 120),
    'moves', left(p_game->>'moves', 12000), 'white', left(p_game->>'white', 40), 'black', left(p_game->>'black', 40),
    'result', left(p_game->>'result', 8), 'date', left(p_game->>'date', 30)) end)
  returning id into mid;
  return mid;
end $$;

-- One conversation, newest first (pages of up to 50).
create or replace function public.chat_history(p_other uuid, p_before bigint, p_limit int) returns table (id bigint, mine boolean, body text, game jsonb, created_at timestamptz, read_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.id, m.from_id = auth.uid(), m.body, m.game, m.created_at, m.read_at from public.messages m
  where auth.uid() is not null and ((m.from_id = auth.uid() and m.to_id = p_other) or (m.from_id = p_other and m.to_id = auth.uid()))
    and (p_before is null or m.id < p_before)
  order by m.id desc limit least(greatest(coalesce(p_limit, 50), 1), 50);
$$;

create or replace function public.chat_read(p_other uuid) returns void
language sql security definer set search_path = '' as $$
  update public.messages set read_at = now() where to_id = auth.uid() and from_id = p_other and read_at is null;
$$;

-- Friends with the last message and unread count, most recent conversation first.
create or replace function public.chat_list() returns table (id uuid, username text, last_seen timestamptz, last_body text, last_game boolean, last_mine boolean, last_at timestamptz, unread int)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username::text, p.last_seen, lm.body, lm.game is not null, lm.from_id = auth.uid(), lm.created_at,
    (select count(*)::int from public.messages u where u.to_id = auth.uid() and u.from_id = p.id and u.read_at is null)
  from public.friendships f
  join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  left join lateral (select m.body, m.game, m.from_id, m.created_at from public.messages m
    where (m.from_id = auth.uid() and m.to_id = p.id) or (m.from_id = p.id and m.to_id = auth.uid()) order by m.id desc limit 1) lm on true
  where auth.uid() is not null and f.status = 'accepted' and (f.requester = auth.uid() or f.addressee = auth.uid())
  order by lm.created_at desc nulls last, p.username;
$$;

create or replace function public.unread_count() returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.messages where to_id = auth.uid() and read_at is null;
$$;

-- ---------------------------------------------------------------- daily games
-- Daily games live in the games table (kind 'daily'): a few days per move, rated in their own 'daily' rating.
alter table public.games add column if not exists days int;
alter table public.games add column if not exists deadline timestamptz;
alter table public.games add column if not exists draw_offer uuid;
alter table public.games add column if not exists last_mover uuid;
do $$ declare c text; begin
  for c in select conname from pg_constraint where conrelid = 'public.games'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%kind%' loop
    execute format('alter table public.games drop constraint %I', c);
  end loop;
  alter table public.games add constraint games_kind_check check (kind in ('bot', 'local', 'friend', 'online', 'daily'));
end $$;
create index if not exists games_daily on public.games (kind, status) where kind = 'daily';

-- whose turn it is in a daily game (null when not live)
create or replace function public.daily_turn(g public.games) returns uuid
language sql immutable set search_path = '' as $$
  select case when g.status <> 'live' then null
    when ((coalesce(array_length(string_to_array(nullif(g.moves, ''), ' '), 1), 0) % 2 = 0) = (split_part(g.start_fen, ' ', 2) <> 'b')) then g.white_id
    else g.black_id end;
$$;

-- Lost on time: the player to move ran past the deadline. Runs whenever someone looks at their daily games.
create or replace function public.daily_expire() returns void
language plpgsql security definer set search_path = '' as $$
declare g public.games; n int;
begin
  for g in select * from public.games where kind = 'daily' and status = 'live' and deadline < now() limit 50 loop
    n := coalesce(array_length(string_to_array(nullif(g.moves, ''), ' '), 1), 0);
    if n < 2 then
      update public.games set status = 'aborted', reason = 'time out', ended_at = now(), updated_at = now() where id = g.id;
    else
      perform public.apply_result(g.id, case when public.daily_turn(g) = g.white_id then '0-1' else '1-0' end, 'time out');
    end if;
  end loop;
  -- invitations nobody answered within 7 days
  update public.games set status = 'aborted', reason = 'not accepted', ended_at = now(), updated_at = now()
  where kind = 'daily' and status = 'pending' and created_at < now() - interval '7 days';
end $$;

create or replace function public.daily_create(p_to uuid, p_variant text, p_days int, p_color text, p_rated boolean, p_start_fen text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me(); gid uuid; col text := p_color; my text; opp text;
begin
  if not public.are_friends(uid, p_to) then raise exception 'you can only challenge friends'; end if;
  if p_days not in (1, 2, 3, 5, 7, 14) then raise exception 'bad days'; end if;
  if (select count(*) from public.games where kind = 'daily' and status in ('pending', 'live') and (white_id = uid or black_id = uid)) >= 50 then raise exception 'too many open daily games'; end if;
  if (select count(*) from public.games where kind = 'daily' and created_by = uid and created_at > now() - interval '1 minute') >= 10 then raise exception 'slow down'; end if;
  if col = 'random' then col := case when random() < 0.5 then 'white' else 'black' end; end if;
  if col not in ('white', 'black') then raise exception 'bad color'; end if;
  select username::text into my from public.profiles where id = uid;
  select username::text into opp from public.profiles where id = p_to;
  insert into public.games (white_id, black_id, white_name, black_name, kind, variant, time_base, time_inc, rated, mode, start_fen, status, created_by, days, last_mover)
  values (case when col = 'white' then uid else p_to end, case when col = 'black' then uid else p_to end,
    case when col = 'white' then my else opp end, case when col = 'black' then my else opp end,
    'daily', p_variant, 0, 0, coalesce(p_rated, false) and p_variant = 'standard', case when coalesce(p_rated, false) and p_variant = 'standard' then 'daily' end,
    left(p_start_fen, 120), 'pending', uid, p_days, uid)
  returning id into gid;
  return gid;
end $$;

-- accept or decline an invitation (the inviter can cancel with p_accept = false)
create or replace function public.daily_respond(p_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me();
begin
  if p_accept then
    update public.games set status = 'live', deadline = now() + make_interval(days => days), updated_at = now(), last_mover = uid
    where id = p_id and kind = 'daily' and status = 'pending' and created_by <> uid and (white_id = uid or black_id = uid);
  else
    update public.games set status = 'aborted', reason = case when created_by = uid then 'cancelled' else 'declined' end, ended_at = now(), updated_at = now(), last_mover = uid
    where id = p_id and kind = 'daily' and status = 'pending' and (white_id = uid or black_id = uid);
  end if;
end $$;

-- Play one move. p_ply = number of moves before this one (stops double-sends). p_result ends the game
-- (checkmate, stalemate …) when this move finished it.
create or replace function public.daily_move(p_id uuid, p_ply int, p_uci text, p_result text, p_reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me(); g public.games; n int;
begin
  perform public.daily_expire();
  select * into g from public.games where id = p_id and kind = 'daily' for update;
  if not found or not (g.white_id = uid or g.black_id = uid) then raise exception 'not your game'; end if;
  if g.status <> 'live' then raise exception 'game over'; end if;
  if public.daily_turn(g) <> uid then raise exception 'not your turn'; end if;
  n := coalesce(array_length(string_to_array(nullif(g.moves, ''), ' '), 1), 0);
  if p_ply <> n then raise exception 'out of sync'; end if;
  if p_uci !~ '^([a-h][1-8][a-h][1-8][qrbnk]?|[PNBRQ]@[a-h][1-8])$' then raise exception 'bad move'; end if;
  update public.games set moves = case when n = 0 then p_uci else moves || ' ' || p_uci end, draw_offer = null,
    deadline = now() + make_interval(days => days), updated_at = now(), last_mover = uid where id = p_id;
  if p_result in ('1-0', '0-1', '1/2-1/2') then perform public.apply_result(p_id, p_result, left(coalesce(p_reason, ''), 80)); end if;
  select * into g from public.games where id = p_id;
  return to_jsonb(g) - 'white_claim' - 'black_claim' - 'claim_reason' - 'created_by';
end $$;

-- resign | offer (a draw) | accept | decline (a draw offer) | timeout (claim a win when the opponent's time ran out)
create or replace function public.daily_action(p_id uuid, p_action text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me(); g public.games; white boolean;
begin
  perform public.daily_expire();
  select * into g from public.games where id = p_id and kind = 'daily' for update;
  if not found or not (g.white_id = uid or g.black_id = uid) then raise exception 'not your game'; end if;
  if g.status <> 'live' then return; end if;
  white := g.white_id = uid;
  if p_action = 'resign' then
    update public.games set last_mover = uid where id = p_id;
    perform public.apply_result(p_id, case when white then '0-1' else '1-0' end, 'resignation');
  elsif p_action = 'offer' then
    update public.games set draw_offer = uid, last_mover = uid, updated_at = now() where id = p_id;
  elsif p_action = 'accept' and g.draw_offer is not null and g.draw_offer <> uid then
    update public.games set last_mover = uid where id = p_id;
    perform public.apply_result(p_id, '1/2-1/2', 'agreement');
  elsif p_action = 'decline' and g.draw_offer is not null and g.draw_offer <> uid then
    update public.games set draw_offer = null, last_mover = uid, updated_at = now() where id = p_id;
  end if;
end $$;

-- My daily games: live and invitations, plus those that ended in the last 3 days.
create or replace function public.daily_list() returns setof jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.me();
  perform public.daily_expire();
  return query select to_jsonb(g) - 'white_claim' - 'black_claim' - 'claim_reason'
      || jsonb_build_object('my_turn', coalesce(public.daily_turn(g) = auth.uid(), false), 'incoming', g.status = 'pending' and g.created_by <> auth.uid())
    from public.games g
    where g.kind = 'daily' and (g.white_id = auth.uid() or g.black_id = auth.uid())
      and (g.status in ('pending', 'live') or g.ended_at > now() - interval '3 days')
    order by (g.status = 'pending' and g.created_by <> auth.uid()) desc, coalesce(public.daily_turn(g) = auth.uid(), false) desc, g.status = 'live' desc, g.deadline nulls last, g.updated_at desc
    limit 100;
end $$;

create or replace function public.daily_get(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare g public.games;
begin
  perform public.me();
  perform public.daily_expire();
  select * into g from public.games where id = p_id and kind = 'daily' and public.can_view_game(games);
  if not found then return null; end if;
  return to_jsonb(g) - 'white_claim' - 'black_claim' - 'claim_reason' || jsonb_build_object('my_turn', coalesce(public.daily_turn(g) = auth.uid(), false));
end $$;

-- Daily games must never be closed by the "untouched for a day" clean-up of live games.
create or replace function public.settle_stale() returns void
language plpgsql security definer set search_path = '' as $$
declare g record;
begin
  for g in select id, coalesce(white_claim, black_claim) as claim, claim_reason from public.games
    where kind <> 'daily' and status = 'live' and (white_claim is null) <> (black_claim is null) and updated_at < now() - interval '10 minutes' limit 50 loop
    perform public.apply_result(g.id, g.claim, g.claim_reason);
  end loop;
  update public.games set status = 'aborted', ended_at = now() where kind <> 'daily' and status in ('live', 'pending') and updated_at < now() - interval '1 day';
end $$;

-- ---------------------------------------------------------------- notifications
-- Badge counts and what happened since a moment (for the website and the Android app while it is open).
create or replace function public.alerts_for(p_uid uuid, p_since timestamptz) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'unread', (select count(*) from public.messages where to_id = p_uid and read_at is null),
    'my_turn', (select count(*) from public.games g where g.kind = 'daily' and g.status = 'live' and public.daily_turn(g) = p_uid),
    'invites', (select count(*) from public.games g where g.kind = 'daily' and g.status = 'pending' and g.created_by <> p_uid and (g.white_id = p_uid or g.black_id = p_uid)),
    'items', coalesce((select jsonb_agg(x order by x->>'at') from (
      select jsonb_build_object('key', 'm' || m.id, 'type', 'message', 'from', p.username, 'text', case when m.body <> '' then left(m.body, 140) else '' end,
        'game', m.game is not null, 'at', m.created_at) as x
      from public.messages m join public.profiles p on p.id = m.from_id
      where m.to_id = p_uid and m.read_at is null and m.created_at > p_since
      union all
      select jsonb_build_object('key', 'c' || c.id, 'type', 'challenge', 'from', p.username, 'variant', c.variant, 'base', c.time_base, 'inc', c.time_inc, 'at', c.created_at)
      from public.challenges c join public.profiles p on p.id = c.from_id
      where c.to_id = p_uid and c.status = 'pending' and c.created_at > greatest(p_since, now() - interval '10 minutes')
      union all
      select jsonb_build_object('key', 'd' || g.id || '-' || coalesce(array_length(string_to_array(nullif(g.moves, ''), ' '), 1), 0) || g.status || coalesce(g.draw_offer::text, ''),
        'type', case when g.status = 'pending' then 'daily_invite' when g.status = 'live' and g.draw_offer is not null and g.draw_offer <> p_uid then 'daily_draw'
          when g.status = 'live' then 'daily_move' else 'daily_end' end,
        'game', g.id, 'from', case when g.white_id = p_uid then g.black_name else g.white_name end, 'result', g.result,
        'n', coalesce(array_length(string_to_array(nullif(g.moves, ''), ' '), 1), 0),
        'won', case when g.result is null or g.result = '1/2-1/2' then null else (g.result = '1-0') = (g.white_id = p_uid) end, 'at', g.updated_at)
      from public.games g
      where g.kind = 'daily' and (g.white_id = p_uid or g.black_id = p_uid) and g.updated_at > p_since and g.last_mover is distinct from p_uid
        and (g.status = 'pending' or (g.status = 'live' and (public.daily_turn(g) = p_uid or (g.draw_offer is not null and g.draw_offer <> p_uid))) or g.status in ('finished', 'aborted'))
    ) s), '[]'::jsonb));
$$;

create or replace function public.my_alerts(p_since timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.me();
  perform public.daily_expire();
  return public.alerts_for(auth.uid(), coalesce(p_since, now() - interval '1 day'));
end $$;

-- Android app: a random per-device key lets the app check for news every ~15 minutes while it is closed,
-- without keeping your sign-in session. Only a hash of the key is stored; signing out deletes it.
create table if not exists public.notify_keys (
  key_hash text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_used timestamptz
);
alter table public.notify_keys enable row level security;

create or replace function public.notify_key_new() returns text
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me(); k text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  delete from public.notify_keys where user_id = uid and coalesce(last_used, created_at) < now() - interval '60 days';
  if (select count(*) from public.notify_keys where user_id = uid) >= 10 then
    delete from public.notify_keys where key_hash = (select key_hash from public.notify_keys where user_id = uid order by coalesce(last_used, created_at) limit 1);
  end if;
  insert into public.notify_keys (key_hash, user_id) values (encode(extensions.digest(k, 'sha256'), 'hex'), uid);
  return k;
end $$;

create or replace function public.notify_key_drop(p_key text) returns void
language sql security definer set search_path = '' as $$
  delete from public.notify_keys where key_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex');
$$;

create or replace function public.notify_poll(p_key text, p_since timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  update public.notify_keys set last_used = now() where key_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex') returning user_id into uid;
  if uid is null then return null; end if;
  perform public.daily_expire();
  return public.alerts_for(uid, greatest(coalesce(p_since, now() - interval '1 day'), now() - interval '2 days'));
end $$;

-- ---------------------------------------------------------------- GDPR export now includes messages
create or replace function public.export_my_data() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'profile', (select jsonb_build_object('username', username, 'created_at', created_at, 'last_seen', last_seen, 'consent_at', consent_at, 'policy_version', policy_version) from public.profiles where id = auth.uid()),
    'ratings', public.ratings_json(auth.uid()),
    'friends', (select coalesce(jsonb_agg(jsonb_build_object('with', p.username, 'status', f.status, 'since', f.created_at, 'requested_by_me', f.requester = auth.uid())), '[]'::jsonb)
                from public.friendships f join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
                where f.requester = auth.uid() or f.addressee = auth.uid()),
    'games', (select coalesce(jsonb_agg(to_jsonb(g) - 'white_claim' - 'black_claim' - 'claim_reason' order by g.created_at), '[]'::jsonb)
              from public.games g where g.white_id = auth.uid() or g.black_id = auth.uid()),
    'challenges', (select coalesce(jsonb_agg(to_jsonb(c) - 'code'), '[]'::jsonb) from public.challenges c where c.from_id = auth.uid() or c.to_id = auth.uid()),
    'messages', (select coalesce(jsonb_agg(jsonb_build_object('from', pf.username, 'to', pt.username, 'text', m.body, 'game', m.game, 'sent', m.created_at, 'read', m.read_at) order by m.id), '[]'::jsonb)
                 from public.messages m join public.profiles pf on pf.id = m.from_id join public.profiles pt on pt.id = m.to_id
                 where m.from_id = auth.uid() or m.to_id = auth.uid()),
    'notification_devices', (select count(*) from public.notify_keys where user_id = auth.uid()));
$$;

-- ---------------------------------------------------------------- permissions
revoke all on public.messages, public.notify_keys from anon, authenticated;
grant select on public.messages to authenticated;
revoke execute on function public.send_message(uuid, text, jsonb), public.chat_history(uuid, bigint, int), public.chat_read(uuid), public.chat_list(),
  public.unread_count(), public.daily_turn(public.games), public.daily_expire(), public.daily_create(uuid, text, int, text, boolean, text),
  public.daily_respond(uuid, boolean), public.daily_move(uuid, int, text, text, text), public.daily_action(uuid, text), public.daily_list(), public.daily_get(uuid),
  public.settle_stale(), public.alerts_for(uuid, timestamptz), public.my_alerts(timestamptz), public.notify_key_new(), public.notify_key_drop(text),
  public.notify_poll(text, timestamptz), public.export_my_data() from public, anon, authenticated;
grant execute on function public.send_message(uuid, text, jsonb), public.chat_history(uuid, bigint, int), public.chat_read(uuid), public.chat_list(),
  public.unread_count(), public.daily_create(uuid, text, int, text, boolean, text), public.daily_respond(uuid, boolean),
  public.daily_move(uuid, int, text, text, text), public.daily_action(uuid, text), public.daily_list(), public.daily_get(uuid),
  public.my_alerts(timestamptz), public.notify_key_new(), public.export_my_data() to authenticated;
grant execute on function public.notify_key_drop(text), public.notify_poll(text, timestamptz) to anon, authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
end $$;

-- ==================================================================== add-rating-privacy.sql
-- Simple Chess add-on: ratings are visible to everyone by default; each player can limit them to friends or to nobody.
-- Run once in Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.
-- Needs schema.sql first.

alter table public.profiles add column if not exists rating_visibility text not null default 'everyone';
do $$ begin
  alter table public.profiles add constraint profiles_rating_visibility_check check (rating_visibility in ('everyone', 'friends', 'nobody'));
exception when duplicate_object then null; end $$;

-- may the signed-in player see this player's ratings?
create or replace function public.can_see_ratings(p_owner uuid, p_vis text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (p_owner = auth.uid() or p_vis = 'everyone' or (p_vis = 'friends' and public.are_friends(auth.uid(), p_owner)));
$$;

create or replace function public.set_rating_visibility(p_vis text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.me();
  if p_vis not in ('everyone', 'friends', 'nobody') then raise exception 'bad visibility'; end if;
  update public.profiles set rating_visibility = p_vis where id = auth.uid();
end $$;

create or replace function public.my_profile() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'username', p.username, 'created_at', p.created_at, 'ratings', public.ratings_json(p.id), 'rating_visibility', p.rating_visibility)
  from public.profiles p where p.id = auth.uid();
$$;

-- Public card for any player. Ratings follow the player's choice; last seen and games stay friends-only.
create or replace function public.get_profile(p_username text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare p public.profiles; rel text := 'none'; full_access boolean;
begin
  perform public.me();
  select * into p from public.profiles where username = p_username::extensions.citext;
  if not found then return null; end if;
  if p.id = auth.uid() then rel := 'self';
  elsif public.are_friends(auth.uid(), p.id) then rel := 'friend';
  elsif exists (select 1 from public.friendships where requester = auth.uid() and addressee = p.id) then rel := 'outgoing';
  elsif exists (select 1 from public.friendships where requester = p.id and addressee = auth.uid()) then rel := 'incoming';
  end if;
  full_access := rel in ('self', 'friend');
  return jsonb_build_object('id', p.id, 'username', p.username, 'created_at', p.created_at, 'relation', rel,
    'ratings', case when public.can_see_ratings(p.id, p.rating_visibility) then public.ratings_json(p.id) end,
    'rating_visibility', case when rel = 'self' then p.rating_visibility end,
    'last_seen', case when full_access then p.last_seen end,
    'games', case when full_access then (select count(*) from public.games g where (g.white_id = p.id or g.black_id = p.id) and g.status in ('finished', 'disputed')) end,
    'live', case when full_access then (select g.id from public.games g where (g.white_id = p.id or g.black_id = p.id) and g.status = 'live' and g.kind <> 'daily' and g.updated_at > now() - interval '3 minutes' order by g.updated_at desc limit 1) end);
end $$;

create or replace function public.list_friends() returns table (id uuid, username text, relation text, last_seen timestamptz, live uuid, ratings jsonb)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username::text,
    case when f.status = 'accepted' then 'friend' when f.requester = auth.uid() then 'outgoing' else 'incoming' end,
    case when f.status = 'accepted' then p.last_seen end,
    case when f.status = 'accepted' then (select g.id from public.games g where (g.white_id = p.id or g.black_id = p.id) and g.status = 'live' and g.kind <> 'daily' and g.updated_at > now() - interval '3 minutes' order by g.updated_at desc limit 1) end,
    case when public.can_see_ratings(p.id, p.rating_visibility) then public.ratings_json(p.id) end
  from public.friendships f join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() is not null and (f.requester = auth.uid() or f.addressee = auth.uid())
  order by f.status, p.last_seen desc;
$$;

revoke execute on function public.can_see_ratings(uuid, text), public.set_rating_visibility(text), public.my_profile(), public.get_profile(text), public.list_friends() from public, anon, authenticated;
grant execute on function public.set_rating_visibility(text), public.my_profile(), public.get_profile(text), public.list_friends() to authenticated;

-- ==================================================================== add-daily-puzzles.sql
-- Simple Chess add-on: daily and weekly puzzle results (shown on profiles).
-- Run once in Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.
-- Needs schema.sql first.
--
-- Only the puzzle of the current day (UTC) or the current week (Monday–Sunday, UTC) counts, and only the first
-- result per puzzle: a wrong first move counts as failed. Past puzzles from the calendar are practice and are
-- never stored here.

create table if not exists public.puzzle_days (
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('daily', 'weekly')),
  period date not null,
  puzzle_id text not null check (length(puzzle_id) <= 12),
  solved boolean not null,
  ms int check (ms >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, period)
);
create index if not exists puzzle_days_period on public.puzzle_days (kind, period);
alter table public.puzzle_days enable row level security;

create or replace function public.current_puzzle_period(p_kind text) returns date
language sql stable set search_path = '' as $$
  select case when p_kind = 'weekly' then date_trunc('week', now() at time zone 'utc')::date else (now() at time zone 'utc')::date end;
$$;

-- Save today's / this week's result. The first result wins. Returns the stored result.
create or replace function public.record_puzzle_day(p_kind text, p_period date, p_puzzle text, p_solved boolean, p_ms int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.me(); r boolean;
begin
  if p_kind not in ('daily', 'weekly') then raise exception 'bad kind'; end if;
  if p_period <> public.current_puzzle_period(p_kind) then raise exception 'puzzle is over'; end if;
  insert into public.puzzle_days (user_id, kind, period, puzzle_id, solved, ms)
  values (uid, p_kind, p_period, left(p_puzzle, 12), coalesce(p_solved, false), case when p_ms between 0 and 604800000 then p_ms end)
  on conflict (user_id, kind, period) do nothing;
  select solved into r from public.puzzle_days where user_id = uid and kind = p_kind and period = p_period;
  return r;
end $$;

-- Daily and weekly results of a player (visible to everyone signed in).
create or replace function public.puzzle_days_of(p_username text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid;
begin
  perform public.me();
  select id into uid from public.profiles where username = p_username::extensions.citext;
  if uid is null then return null; end if;
  return jsonb_build_object(
    'daily_solved', (select count(*) from public.puzzle_days where user_id = uid and kind = 'daily' and solved),
    'daily_played', (select count(*) from public.puzzle_days where user_id = uid and kind = 'daily'),
    'weekly_solved', (select count(*) from public.puzzle_days where user_id = uid and kind = 'weekly' and solved),
    'weekly_played', (select count(*) from public.puzzle_days where user_id = uid and kind = 'weekly'),
    'recent', coalesce((select jsonb_agg(jsonb_build_object('kind', kind, 'period', period, 'solved', solved, 'ms', ms) order by period desc)
      from (select * from public.puzzle_days where user_id = uid order by period desc limit 200) x), '[]'::jsonb));
end $$;

-- How many players solved / tried a daily or weekly puzzle.
create or replace function public.puzzle_day_stats(p_kind text, p_period date) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('played', count(*), 'solved', count(*) filter (where solved))
  from public.puzzle_days where kind = p_kind and period = p_period;
$$;

-- GDPR export: add puzzle results (keeps messages from add-social.sql when present)
create or replace function public.export_puzzle_days() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('kind', kind, 'period', period, 'puzzle', puzzle_id, 'solved', solved, 'ms', ms) order by period), '[]'::jsonb)
  from public.puzzle_days where user_id = auth.uid();
$$;

revoke all on public.puzzle_days from anon, authenticated;
revoke execute on function public.current_puzzle_period(text), public.record_puzzle_day(text, date, text, boolean, int), public.puzzle_days_of(text),
  public.puzzle_day_stats(text, date), public.export_puzzle_days() from public, anon, authenticated;
grant execute on function public.record_puzzle_day(text, date, text, boolean, int), public.puzzle_days_of(text), public.puzzle_day_stats(text, date),
  public.export_puzzle_days() to authenticated;

-- ==================================================================== add-admin.sql
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

-- ==================================================================== add-admin-protect.sql
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

-- ==================================================================== add-titles.sql
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

-- ==================================================================== add-inactive-abort.sql
-- Simple Chess add-on: daily games where nobody moved for a week are aborted (no winner, ratings unchanged).
-- Run once in Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.
-- Needs add-social.sql first.
--
-- Games with a short time limit (1–5 days per move) still end on time first: the player who ran out of time loses.
-- Games with 7 or 14 days per move would otherwise sit for up to two weeks: they are aborted after one week without a move.

alter table public.games add column if not exists last_move_at timestamptz;

create or replace function public.daily_expire() returns void
language plpgsql security definer set search_path = '' as $$
declare g public.games; n int;
begin
  -- 1. a week without a move: aborted, nobody wins (only when the time limit would not have ended it earlier)
  update public.games set status = 'aborted', reason = 'no moves for a week', ended_at = now(), updated_at = now()
  where kind = 'daily' and status = 'live'
    and coalesce(last_move_at, updated_at) < now() - interval '7 days'
    and (deadline is null or deadline >= coalesce(last_move_at, updated_at) + interval '7 days');
  -- 2. out of time: the player to move loses (no result if fewer than 2 moves were played)
  for g in select * from public.games where kind = 'daily' and status = 'live' and deadline < now() limit 50 loop
    n := coalesce(array_length(string_to_array(nullif(g.moves, ''), ' '), 1), 0);
    if n < 2 then
      update public.games set status = 'aborted', reason = 'time out', ended_at = now(), updated_at = now() where id = g.id;
    else
      perform public.apply_result(g.id, case when public.daily_turn(g) = g.white_id then '0-1' else '1-0' end, 'time out');
    end if;
  end loop;
  -- 3. invitations nobody answered within 7 days
  update public.games set status = 'aborted', reason = 'not accepted', ended_at = now(), updated_at = now()
  where kind = 'daily' and status = 'pending' and created_at < now() - interval '7 days';
end $$;

-- remember when the last move was made (draw offers do not count as a move)
create or replace function public.track_last_move() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.kind = 'daily' and coalesce(new.moves, '') is distinct from coalesce(old.moves, '') then new.last_move_at := now(); end if;
  if new.kind = 'daily' and old.status = 'pending' and new.status = 'live' then new.last_move_at := now(); end if;
  return new;
end $$;
drop trigger if exists track_last_move on public.games;
create trigger track_last_move before update on public.games for each row execute function public.track_last_move();

-- existing games: start from their last change, then clean up right away
update public.games set last_move_at = updated_at where kind = 'daily' and last_move_at is null;
select public.daily_expire();

revoke execute on function public.daily_expire(), public.track_last_move() from public, anon, authenticated;

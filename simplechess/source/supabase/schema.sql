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

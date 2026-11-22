-- Rookstorm add-on: chat with friends, sending games, daily (correspondence) games with their own rating,
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

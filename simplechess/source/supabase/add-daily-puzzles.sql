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

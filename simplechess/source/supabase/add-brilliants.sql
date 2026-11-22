-- Rookstorm add-on: brilliant moves on profiles.
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

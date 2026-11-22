-- Rookstorm add-on: daily games where nobody moved for a week are aborted (no winner, ratings unchanged).
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
